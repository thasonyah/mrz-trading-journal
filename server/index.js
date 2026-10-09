import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { all, boolValue, get, insert, rowToTrade, run, transaction, upsertNoteSql, upsertOptionSql } from './db.js';
import './migrate.js';

const app = express();
const port = Number(process.env.PORT || 5174);
const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '..', 'dist');
const tokenTtlHours = 24;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function tokenFor(user) {
  return jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, jwtSecret, { expiresIn: '7d' });
}

function userForClient(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: Boolean(user.email_verified),
    portfolioLimit: user.portfolio_limit
  };
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

async function ensureAccount(userId, accountId) {
  const account = await get('SELECT * FROM accounts WHERE id=? AND user_id=?', [accountId, userId]);
  if (!account) {
    const err = new Error('Account not found');
    err.status = 404;
    throw err;
  }
  return account;
}

function canAdmin(req) {
  return req.user?.role === 'admin';
}

function scopeUserId(req) {
  const requested = Number(req.query.userId || req.params.userId || req.user.id);
  if (requested !== Number(req.user.id) && !canAdmin(req)) {
    const err = new Error('Admin only');
    err.status = 403;
    throw err;
  }
  return requested || req.user.id;
}

async function getUser(userId) {
  return get('SELECT * FROM users WHERE id=?', [userId]);
}

function publicBaseUrl(req) {
  return process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createAuthToken(userId, type) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + tokenTtlHours * 60 * 60 * 1000).toISOString();
  await run('DELETE FROM auth_tokens WHERE user_id=? AND type=? AND used_at IS NULL', [userId, type]);
  await run('INSERT INTO auth_tokens (user_id, type, token_hash, expires_at) VALUES (?, ?, ?, ?)', [userId, type, hashToken(token), expires]);
  return token;
}

async function sendMail({ to, subject, text }) {
  if (!process.env.SMTP_HOST) {
    console.log(`Email not sent because SMTP is not configured.\nTo: ${to}\nSubject: ${subject}\n${text}`);
    return { sent: false };
  }
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text
  });
  return { sent: true };
}

function emailStatus() {
  return {
    configured: Boolean(process.env.SMTP_HOST),
    host: process.env.SMTP_HOST || null,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    userConfigured: Boolean(process.env.SMTP_USER),
    from: process.env.MAIL_FROM || process.env.SMTP_USER || null
  };
}

async function issueEmailVerification(req, user) {
  const token = await createAuthToken(user.id, 'verify_email');
  const link = `${publicBaseUrl(req)}/verify-email?token=${token}`;
  const result = await sendMail({
    to: user.email,
    subject: 'Verify your Mr.Z Trading Journal account',
    text: `Open this link to verify your email:\n\n${link}\n\nThis link expires in ${tokenTtlHours} hours.`
  });
  return { link, sent: result.sent };
}

async function issuePasswordReset(req, user) {
  const token = await createAuthToken(user.id, 'reset_password');
  const link = `${publicBaseUrl(req)}/reset-password?token=${token}`;
  const result = await sendMail({
    to: user.email,
    subject: 'Reset your Mr.Z Trading Journal password',
    text: `Open this link to reset your password:\n\n${link}\n\nThis link expires in ${tokenTtlHours} hours.`
  });
  return { link, sent: result.sent };
}

const defaultOptions = [
  ['session', 'Session', ['AS', 'LO', 'NY', 'LC']],
  ['mode', 'Mode', ['BOSe', 'CHe', 'Flip']],
  ['htfBias', 'HTF Bias', ['Bullish', 'Bearish', 'Neutral']],
  ['htfPoi', 'HTF POI', ['OB', 'FVG', 'Supply', 'Demand', 'Liquidity', 'Premium', 'Discount']],
  ['mtfStructure', 'MTF Structure', ['BOS', 'CHoCH', 'Sweep', 'Internal BOS', 'Range']],
  ['ltfEntry', 'LTF Entry', ['OB', 'FVG', 'OB + FVG', 'Breaker', 'Mitigation']],
  ['keyZone', 'Key Zone', ['Premium', 'Discount', 'Equilibrium', 'Asia High/Low', 'London Open', 'NY AM']],
  ['ruleViolation', 'Rule Violation', ['None', 'Early Entry', 'Late Entry', 'No Confirmation', 'Oversized Lot', 'Revenge Trade', 'Chased Price']],
  ['emotion', 'Emotion', ['Calm', 'Confident', 'Anxious', 'Frustrated', 'Greedy', 'Impatient', 'Regretful']]
];

const defaultAssets = [
  ['MNQ1', 0.25, 0.5],
  ['NQ1', 0.25, 5],
  ['MGC1', 0.1, 1],
  ['GC1', 0.1, 10],
  ['XAUUSD', 0.01, 1],
  ['MES1', 0.25, 1.25],
  ['ES1', 0.25, 12.5],
  ['MYM1', 1, 0.5],
  ['MCL1', 0.01, 1]
];

async function ensureUserDefaults(userId) {
  for (const [key, label, options] of defaultOptions) {
    await run(upsertOptionSql(), [userId, key, label, JSON.stringify(options)]);
    const row = await get('SELECT options_json "optionsJson" FROM option_sets WHERE user_id=? AND field_key=?', [userId, key]);
    const current = JSON.parse(row?.optionsJson || '[]');
    const merged = [...current, ...options.filter((value) => !current.includes(value))];
    if (merged.length !== current.length) await run('UPDATE option_sets SET options_json=? WHERE user_id=? AND field_key=?', [JSON.stringify(merged), userId, key]);
  }
  const count = Number((await get('SELECT COUNT(*) count FROM asset_presets WHERE user_id=?', [userId])).count);
  if (!count) {
    for (const [index, [symbol, tickSize, dollarPerPoint]] of defaultAssets.entries()) {
      await run('INSERT INTO asset_presets (user_id, symbol, tick_size, dollar_per_point, sort_order) VALUES (?, ?, ?, ?, ?)', [userId, symbol, tickSize, dollarPerPoint, index + 1]);
    }
  }
}

async function createDefaultAccount(userId, dbx = { run, insert }) {
  const backtest = await dbx.insert('INSERT INTO accounts (user_id, name, type, sort_order) VALUES (?, ?, ?, ?)', [userId, 'Backtest', 'backtest', 1]);
  await dbx.run('INSERT INTO accounts (user_id, name, type, sort_order) VALUES (?, ?, ?, ?)', [userId, 'Forward Test', 'forward', 2]);
  return backtest;
}

app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!/^[a-z0-9_.-]{3,24}$/.test(username)) return res.status(400).json({ error: 'Username must be 3-24 chars: a-z, 0-9, _, ., -' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Valid email is required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const user = await transaction(async (dbx) => {
      const userId = await dbx.insert('INSERT INTO users (username, email, password_hash, role, email_verified) VALUES (?, ?, ?, ?, ?)', [username, email, hash, 'trader', boolValue(false)]);
      await createDefaultAccount(userId, dbx);
      return dbx.get('SELECT * FROM users WHERE id=?', [userId]);
    });
    await ensureUserDefaults(user.id);
    const verification = await issueEmailVerification(req, user);
    res.json({
      ok: true,
      user: userForClient(user),
      message: verification.sent ? 'Check your email to verify your account.' : 'SMTP is not configured. Use the verification link to activate this account.',
      verificationLink: verification.sent ? undefined : verification.link
    });
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) return res.status(409).json({ error: 'Username or email already exists' });
    res.status(500).json({ error: 'Could not create account' });
  }
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = await get('SELECT * FROM users WHERE username=? OR email=?', [username, username]);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid username or password' });
  if (user.status !== 'active') return res.status(403).json({ error: 'This account is suspended. Please contact admin.' });
  if (!user.email_verified) return res.status(403).json({ error: 'Please verify your email before logging in.' });
  await ensureUserDefaults(user.id);
  res.json({ token: tokenFor(user), user: userForClient(user) });
}));

app.post('/api/auth/resend-verification', asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = await get('SELECT * FROM users WHERE email=?', [email]);
  if (!user) return res.json({ ok: true, message: 'If the email exists, a verification link has been sent.' });
  if (user.email_verified) return res.json({ ok: true, message: 'Email is already verified.' });
  const verification = await issueEmailVerification(req, user);
  res.json({
    ok: true,
    message: verification.sent ? 'Verification email sent.' : 'SMTP is not configured. Use the verification link to activate this account.',
    verificationLink: verification.sent ? undefined : verification.link
  });
}));

app.post('/api/auth/verify-email', asyncHandler(async (req, res) => {
  const token = String(req.body.token || req.query.token || '');
  const row = await get(`
    SELECT t.*, u.id "userId" FROM auth_tokens t
    JOIN users u ON u.id=t.user_id
    WHERE t.token_hash=? AND t.type='verify_email' AND t.used_at IS NULL
  `, [hashToken(token)]);
  if (!row || new Date(row.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'Verification link is invalid or expired' });
  await run('UPDATE users SET email_verified=? WHERE id=?', [boolValue(true), row.userId]);
  await run('UPDATE auth_tokens SET used_at=CURRENT_TIMESTAMP WHERE id=?', [row.id]);
  const user = await get('SELECT * FROM users WHERE id=?', [row.userId]);
  await ensureUserDefaults(user.id);
  res.json({ ok: true, token: tokenFor(user), user: userForClient(user) });
}));

app.post('/api/auth/forgot-password', asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = await get('SELECT * FROM users WHERE email=?', [email]);
  if (!user) return res.json({ ok: true, message: 'If the email exists, a reset link has been sent.' });
  const reset = await issuePasswordReset(req, user);
  res.json({
    ok: true,
    message: reset.sent ? 'Password reset email sent.' : 'SMTP is not configured. Use the reset link to set a new password.',
    resetLink: reset.sent ? undefined : reset.link
  });
}));

app.post('/api/auth/reset-password', asyncHandler(async (req, res) => {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const row = await get(`
    SELECT t.*, u.id "userId" FROM auth_tokens t
    JOIN users u ON u.id=t.user_id
    WHERE t.token_hash=? AND t.type='reset_password' AND t.used_at IS NULL
  `, [hashToken(token)]);
  if (!row || new Date(row.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'Reset link is invalid or expired' });
  await run('UPDATE users SET password_hash=? WHERE id=?', [bcrypt.hashSync(password, 10), row.userId]);
  await run('UPDATE auth_tokens SET used_at=CURRENT_TIMESTAMP WHERE id=?', [row.id]);
  res.json({ ok: true });
}));

app.get('/api/me', auth, asyncHandler(async (req, res) => {
  const user = await getUser(req.user.id);
  res.json({ user: userForClient(user) });
}));

app.put('/api/me/password', auth, asyncHandler(async (req, res) => {
  const currentPassword = String(req.body.currentPassword || '');
  const newPassword = String(req.body.newPassword || '');
  if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  const user = getUser(req.user.id);
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  await run('UPDATE users SET password_hash=? WHERE id=?', [bcrypt.hashSync(newPassword, 10), req.user.id]);
  await run('UPDATE auth_tokens SET used_at=CURRENT_TIMESTAMP WHERE user_id=? AND type=? AND used_at IS NULL', [req.user.id, 'reset_password']);
  res.json({ ok: true, message: 'Password changed' });
}));

app.get('/api/accounts', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  const user = await getUser(userId);
  const rows = await all('SELECT id, user_id "userId", name, type, currency, starting_balance "startingBalance", is_active "isActive", sort_order "sortOrder" FROM accounts WHERE user_id=? ORDER BY sort_order, id', [userId]);
  res.json({ accounts: rows, portfolioLimit: user?.portfolio_limit || 5 });
}));

app.post('/api/accounts', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  const user = await getUser(userId);
  const count = Number((await get('SELECT COUNT(*) count FROM accounts WHERE user_id=?', [userId])).count);
  if (count >= (user?.portfolio_limit || 5)) return res.status(400).json({ error: `Portfolio limit reached (${user?.portfolio_limit || 5})` });
  const id = await insert('INSERT INTO accounts (user_id, name, type, starting_balance, sort_order) VALUES (?, ?, ?, ?, ?)', [
    userId,
    String(req.body.name || 'New Account').trim(),
    req.body.type || 'live',
    Number(req.body.startingBalance || 50000),
    count + 1
  ]);
  res.json({ id });
}));

app.put('/api/accounts/:id', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await ensureAccount(userId, req.params.id);
  await run('UPDATE accounts SET name=?, type=?, starting_balance=? WHERE id=? AND user_id=?', [
    String(req.body.name || 'Account').trim(),
    req.body.type || 'live',
    Number(req.body.startingBalance || 0),
    req.params.id,
    userId
  ]);
  res.json({ ok: true });
}));

app.delete('/api/accounts/:id', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  const count = Number((await get('SELECT COUNT(*) count FROM accounts WHERE user_id=?', [userId])).count);
  if (count <= 1) return res.status(400).json({ error: 'Keep at least one account' });
  await ensureAccount(userId, req.params.id);
  await run('DELETE FROM accounts WHERE id=? AND user_id=?', [req.params.id, userId]);
  res.json({ ok: true });
}));

app.post('/api/accounts/:id/reset', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await ensureAccount(userId, req.params.id);
  await run('DELETE FROM trades WHERE account_id=? AND user_id=?', [req.params.id, userId]);
  await run('DELETE FROM journal_notes WHERE account_id=? AND user_id=?', [req.params.id, userId]);
  res.json({ ok: true });
}));

app.get('/api/options', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await ensureUserDefaults(userId);
  const rows = await all('SELECT field_key "fieldKey", label, options_json "optionsJson" FROM option_sets WHERE user_id=?', [userId]);
  res.json({ options: rows.map((r) => ({ fieldKey: r.fieldKey, label: r.label, options: JSON.parse(r.optionsJson) })) });
}));

app.put('/api/options/:fieldKey', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  const label = String(req.body.label || req.params.fieldKey);
  const options = Array.isArray(req.body.options) ? req.body.options.map(String).filter(Boolean) : [];
  await run(upsertOptionSql(), [userId, req.params.fieldKey, label, JSON.stringify(options)]);
  res.json({ ok: true });
}));

app.get('/api/assets', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await ensureUserDefaults(userId);
  const assets = await all('SELECT id, symbol, tick_size "tickSize", dollar_per_point "dollarPerPoint", sort_order "sortOrder" FROM asset_presets WHERE user_id=? ORDER BY sort_order, symbol', [userId]);
  res.json({ assets });
}));

app.post('/api/assets', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  const count = Number((await get('SELECT COUNT(*) count FROM asset_presets WHERE user_id=?', [userId])).count);
  const symbol = String(req.body.symbol || '').trim().toUpperCase();
  if (!symbol) return res.status(400).json({ error: 'Asset symbol is required' });
  const id = await insert('INSERT INTO asset_presets (user_id, symbol, tick_size, dollar_per_point, sort_order) VALUES (?, ?, ?, ?, ?)', [
    userId,
    symbol,
    Number(req.body.tickSize || 1),
    Number(req.body.dollarPerPoint || 1),
    count + 1
  ]);
  res.json({ asset: await get('SELECT id, symbol, tick_size "tickSize", dollar_per_point "dollarPerPoint", sort_order "sortOrder" FROM asset_presets WHERE id=?', [id]) });
}));

app.put('/api/assets/:id', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  const symbol = String(req.body.symbol || '').trim().toUpperCase();
  if (!symbol) return res.status(400).json({ error: 'Asset symbol is required' });
  await run('UPDATE asset_presets SET symbol=?, tick_size=?, dollar_per_point=? WHERE id=? AND user_id=?', [
    symbol,
    Number(req.body.tickSize || 1),
    Number(req.body.dollarPerPoint || 1),
    req.params.id,
    userId
  ]);
  res.json({ ok: true });
}));

app.delete('/api/assets/:id', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await run('DELETE FROM asset_presets WHERE id=? AND user_id=?', [req.params.id, userId]);
  res.json({ ok: true });
}));

app.get('/api/accounts/:accountId/trades', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await ensureAccount(userId, req.params.accountId);
  const rows = await all('SELECT * FROM trades WHERE user_id=? AND account_id=? ORDER BY trade_date DESC, entry_time DESC, id DESC', [userId, req.params.accountId]);
  res.json({ trades: rows.map(rowToTrade) });
}));

const tradeColumns = [
  'trade_date','asset','direction','session','entry_time','exit_time','duration_time','order_wait_minutes','mode','entry_price','stop_loss','take_profit',
  'tp_ticks','sl_ticks','tick_size','dollar_per_point','planned_r','actual_r','max_r','mfe_r','mae_r','risk_amount','lot_size','pnl','sl_amount',
  'tp_amount','tp_percent','balance_after','con_loss','sum_con_loss_amount','dd_loss_pct','sum_dd_loss_pct','result','picture_url','tip_url',
  'htf_bias','htf_poi','poi_type','poi_has_fvg','fvg_position',
  'liquidity_sweep','bos','choch','mtf_structure','ltf_entry','key_zone','setup_grade','setup_score','rule_violation','emotion_before','emotion_after',
  'discipline_score','chart_htf','chart_mtf','chart_ltf','notes'
];

function normalizeTrade(body) {
  const b = body || {};
  return {
    trade_date: b.date,
    asset: b.asset,
    direction: b.direction,
    session: b.session,
    entry_time: b.entryTime || null,
    exit_time: b.exitTime || null,
    duration_time: b.durationTime || null,
    order_wait_minutes: b.orderWaitMinutes ?? null,
    mode: b.mode || null,
    entry_price: b.entryPrice ?? null,
    stop_loss: b.stopLoss ?? null,
    take_profit: b.takeProfit ?? null,
    tp_ticks: b.tpTicks ?? null,
    sl_ticks: b.slTicks ?? null,
    tick_size: b.tickSize || 0.25,
    dollar_per_point: b.dollarPerPoint || 1,
    planned_r: b.plannedR ?? null,
    actual_r: b.actualR ?? null,
    max_r: b.maxR ?? null,
    mfe_r: b.mfeR ?? null,
    mae_r: b.maeR ?? null,
    risk_amount: b.riskAmount || 0,
    lot_size: b.lotSize || 0,
    pnl: b.pnl || 0,
    sl_amount: b.slAmount ?? null,
    tp_amount: b.tpAmount ?? null,
    tp_percent: b.tpPercent ?? null,
    balance_after: b.balanceAfter ?? null,
    con_loss: b.conLoss ?? null,
    sum_con_loss_amount: b.sumConLossAmount ?? null,
    dd_loss_pct: b.ddLossPct ?? null,
    sum_dd_loss_pct: b.sumDdLossPct ?? null,
    result: b.result,
    picture_url: b.pictureUrl || null,
    tip_url: b.tipUrl || null,
    htf_bias: b.htfBias || null,
    htf_poi: b.htfPoi || null,
    poi_type: b.poiType || null,
    poi_has_fvg: boolValue(b.poiHasFvg),
    fvg_position: b.fvgPosition || null,
    liquidity_sweep: boolValue(b.liquiditySweep),
    bos: boolValue(b.bos),
    choch: boolValue(b.choch),
    mtf_structure: b.mtfStructure || null,
    ltf_entry: b.ltfEntry || null,
    key_zone: b.keyZone || null,
    setup_grade: b.setupGrade || null,
    setup_score: b.setupScore || 0,
    rule_violation: b.ruleViolation || null,
    emotion_before: b.emotionBefore || null,
    emotion_after: b.emotionAfter || null,
    discipline_score: b.disciplineScore ?? null,
    chart_htf: b.chartHtf || null,
    chart_mtf: b.chartMtf || null,
    chart_ltf: b.chartLtf || null,
    notes: b.notes || null
  };
}

function validateTrade(t) {
  const missing = ['trade_date', 'asset', 'direction', 'session', 'result'].filter((k) => !t[k]);
  if (missing.length) return `Missing required fields: ${missing.join(', ')}`;
  if (!['long', 'short'].includes(t.direction)) return 'Direction must be long or short';
  if (!['win', 'loss', 'breakeven', 'miss', 'reversed'].includes(t.result)) return 'Invalid result';
  return null;
}

app.post('/api/accounts/:accountId/trades', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await ensureAccount(userId, req.params.accountId);
  const t = normalizeTrade(req.body);
  const error = validateTrade(t);
  if (error) return res.status(400).json({ error });
  const cols = ['user_id', 'account_id', ...tradeColumns];
  const values = [userId, req.params.accountId, ...tradeColumns.map((c) => t[c])];
  const placeholders = cols.map(() => '?').join(',');
  const id = await insert(`INSERT INTO trades (${cols.join(',')}) VALUES (${placeholders})`, values);
  res.json({ trade: rowToTrade(await get('SELECT * FROM trades WHERE id=?', [id])) });
}));

app.put('/api/accounts/:accountId/trades/:id', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await ensureAccount(userId, req.params.accountId);
  const t = normalizeTrade(req.body);
  const error = validateTrade(t);
  if (error) return res.status(400).json({ error });
  const setSql = tradeColumns.map((c) => `${c}=?`).join(',');
  await run(`UPDATE trades SET ${setSql}, updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND account_id=?`, [...tradeColumns.map((c) => t[c]), req.params.id, userId, req.params.accountId]);
  res.json({ trade: rowToTrade(await get('SELECT * FROM trades WHERE id=? AND user_id=?', [req.params.id, userId])) });
}));

app.delete('/api/accounts/:accountId/trades/:id', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await ensureAccount(userId, req.params.accountId);
  await run('DELETE FROM trades WHERE id=? AND user_id=? AND account_id=?', [req.params.id, userId, req.params.accountId]);
  res.json({ ok: true });
}));

app.get('/api/accounts/:accountId/note', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await ensureAccount(userId, req.params.accountId);
  const note = await get('SELECT content, updated_at "updatedAt" FROM journal_notes WHERE user_id=? AND account_id=? AND title=?', [userId, req.params.accountId, 'Account Playbook']);
  res.json({ note: note || { content: '', updatedAt: null } });
}));

app.put('/api/accounts/:accountId/note', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await ensureAccount(userId, req.params.accountId);
  await run(upsertNoteSql(), [userId, req.params.accountId, String(req.body.content || '')]);
  res.json({ ok: true });
}));

app.get('/api/admin/team', auth, asyncHandler(async (req, res) => {
  if (!['coach', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Coach/admin only' });
  const users = await all(`
    SELECT u.id, u.username, u.email, u.email_verified "emailVerified", u.status, u.portfolio_limit "portfolioLimit", u.role,
      (SELECT COUNT(*) FROM accounts a WHERE a.user_id=u.id) portfolios,
      (SELECT COUNT(*) FROM trades t WHERE t.user_id=u.id) "totalTrades",
      (SELECT COALESCE(SUM(t.pnl),0) FROM trades t WHERE t.user_id=u.id) "netPnl"
    FROM users u
    GROUP BY u.id
    ORDER BY u.username
  `);
  res.json({ users });
}));

app.put('/api/admin/users/:id', auth, asyncHandler(async (req, res) => {
  if (!canAdmin(req)) return res.status(403).json({ error: 'Admin only' });
  const role = ['trader', 'coach', 'admin'].includes(req.body.role) ? req.body.role : 'trader';
  const status = ['active', 'suspended'].includes(req.body.status) ? req.body.status : 'active';
  const limit = Math.min(5, Math.max(1, Number(req.body.portfolioLimit || 5)));
  await run('UPDATE users SET role=?, status=?, portfolio_limit=?, email_verified=? WHERE id=?', [
    role,
    status,
    limit,
    boolValue(req.body.emailVerified),
    req.params.id
  ]);
  res.json({ user: userForClient(await getUser(req.params.id)) });
}));

app.get('/api/admin/email/status', auth, asyncHandler(async (req, res) => {
  if (!canAdmin(req)) return res.status(403).json({ error: 'Admin only' });
  res.json({ email: emailStatus() });
}));

app.post('/api/admin/email/test', auth, asyncHandler(async (req, res) => {
  if (!canAdmin(req)) return res.status(403).json({ error: 'Admin only' });
  const user = await getUser(req.user.id);
  const to = String(req.body.to || user.email || '').trim();
  if (!to) return res.status(400).json({ error: 'Admin email is required for test delivery' });
  const status = emailStatus();
  if (!status.configured) return res.status(400).json({ error: 'SMTP is not configured on Render yet', email: status });
  await sendMail({
    to,
    subject: 'Mr.Z Trading Journal email test',
    text: `Email delivery is working for Mr.Z Trading Journal.\n\nSent at: ${new Date().toISOString()}`
  });
  res.json({ ok: true, sentTo: to, email: status });
}));

app.use(express.static(distPath));
app.get(/^\/(?!api).*/, asyncHandler(async (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
}));

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(port, () => {
  console.log(`API listening on http://127.0.0.1:${port}`);
});

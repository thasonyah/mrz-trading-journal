import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { all, boolValue, get, insert, isPostgres, rowToTrade, run, transaction, upsertNoteSql, upsertOptionSql } from './db.js';
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
    portfolioLimit: user.portfolio_limit,
    profile: {
      nickname: user.profile_nickname || '',
      phone: user.profile_phone || '',
      email: user.profile_email || '',
      facebook: user.profile_facebook || '',
      line: user.profile_line || '',
      contactType: user.profile_contact_type || 'email',
      image: user.profile_image || ''
    }
  };
}

function cleanProfileText(value, max = 80) {
  return String(value || '').trim().slice(0, max);
}

function normalizeContactType(value) {
  return ['phone', 'email', 'facebook', 'line'].includes(value) ? value : 'email';
}

function validateProfileImage(value) {
  const image = String(value || '').trim();
  if (!image) return '';
  if (!/^data:image\/(png|jpeg|webp);base64,/i.test(image)) {
    const err = new Error('Profile image must be PNG, JPG, or WebP');
    err.status = 400;
    throw err;
  }
  if (image.length > 900000) {
    const err = new Error('Profile image is too large');
    err.status = 400;
    throw err;
  }
  return image;
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

const blankAccountTemplate = {
  name: 'New Account',
  type: 'live',
  provider: 'Custom',
  planName: '',
  marketType: 'Futures',
  startingBalance: 50000,
  profitTarget: '',
  dailyLossLimit: '',
  maxDrawdown: '',
  trailingDrawdown: '',
  maxContracts: '',
  minTradingDays: '',
  consistencyRule: '',
  payoutRule: '',
  commissionType: 'none',
  commissionAmount: '',
  commissionScope: 'roundTrip',
  commissionNotes: ''
};

const defaultPortfolioTemplates = [
  { templateKey: 'custom', label: 'Custom / Manual', values: blankAccountTemplate },
  {
    templateKey: 'apex-50k',
    label: 'Apex 50K Futures',
    values: {
      ...blankAccountTemplate,
      name: 'Apex 50K', provider: 'Apex', planName: '50K Evaluation', marketType: 'Futures', startingBalance: 50000,
      profitTarget: 3000, maxDrawdown: 2500, trailingDrawdown: 2500, maxContracts: 10, minTradingDays: 7,
      consistencyRule: 'Edit to match the current Apex rule for this plan.',
      payoutRule: 'Edit to match the current payout rule before trading live.',
      commissionType: 'perContract', commissionAmount: 2.8, commissionScope: 'roundTrip',
      commissionNotes: 'Estimated round-trip futures commission per contract. Adjust to your broker statement.'
    }
  },
  {
    templateKey: 'topstep-50k',
    label: 'TopStep 50K Futures',
    values: {
      ...blankAccountTemplate,
      name: 'TopStep 50K', provider: 'TopStep', planName: '50K Trading Combine', marketType: 'Futures', startingBalance: 50000,
      profitTarget: 3000, dailyLossLimit: 1000, maxDrawdown: 2000, maxContracts: 5, minTradingDays: 2,
      consistencyRule: 'Edit to match current TopStep rules.',
      payoutRule: 'Edit to match current TopStep payout rules.',
      commissionType: 'perContract', commissionAmount: 2.8, commissionScope: 'roundTrip',
      commissionNotes: 'Estimated round-trip futures commission per contract.'
    }
  },
  {
    templateKey: 'ftmo-100k',
    label: 'FTMO 100K Forex/CFD',
    values: {
      ...blankAccountTemplate,
      name: 'FTMO 100K', provider: 'FTMO', planName: '100K Challenge', marketType: 'Forex / CFD', startingBalance: 100000,
      profitTarget: 10000, dailyLossLimit: 5000, maxDrawdown: 10000, minTradingDays: 4,
      consistencyRule: 'Edit to match the instrument and account type.',
      payoutRule: 'Edit to match current FTMO payout rules.',
      commissionType: 'fixed', commissionAmount: 0, commissionScope: 'roundTrip',
      commissionNotes: 'Set fixed commission manually if your symbol has a fee.'
    }
  },
  {
    templateKey: 'mff-100k',
    label: 'MFF / Prop 100K',
    values: {
      ...blankAccountTemplate,
      name: 'Prop 100K', provider: 'MFF / Prop Firm', planName: '100K Evaluation', marketType: 'Forex / CFD', startingBalance: 100000,
      profitTarget: 8000, dailyLossLimit: 5000, maxDrawdown: 12000, minTradingDays: 5,
      consistencyRule: 'Use as a starter template; verify all rules with the active plan.',
      payoutRule: 'Edit payout split, minimum days, and withdrawal cycle.',
      commissionType: 'fixed', commissionAmount: 0, commissionScope: 'roundTrip',
      commissionNotes: 'Manual starter preset for prop-firm style accounts.'
    }
  }
];

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

function downloadName(prefix, ext) {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.${ext}`;
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  return [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))
  ].join('\n');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const source = String(text || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some((value) => String(value).trim())) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => String(value).trim())) rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => String(header || '').trim());
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

function importObjectsFromText(text, format = 'auto') {
  return importPackageFromText(text, format).trades;
}

function importPackageFromText(text, format = 'auto') {
  const raw = String(text || '').trim();
  if (!raw) return { trades: [], dailyReviews: {} };
  const isJson = format === 'json' || (format === 'auto' && ['[', '{'].includes(raw[0]));
  if (isJson) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { trades: parsed, dailyReviews: {} };
    return {
      trades: Array.isArray(parsed.trades) ? parsed.trades : Array.isArray(parsed.data) ? parsed.data : [],
      dailyReviews: parsed.dailyReviews && typeof parsed.dailyReviews === 'object' && !Array.isArray(parsed.dailyReviews) ? parsed.dailyReviews : {}
    };
  }
  return { trades: parseCsv(raw), dailyReviews: {} };
}

function normalizeDailyReviews(input = {}) {
  return Object.fromEntries(Object.entries(input)
    .map(([date, review]) => {
      const key = String(date || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !review || typeof review !== 'object') return null;
      const clean = {
        summary: String(review.summary || ''),
        repeat: String(review.repeat || ''),
        reduce: String(review.reduce || ''),
        nextPlan: String(review.nextPlan || '')
      };
      const hasContent = Object.values(clean).some((value) => value.trim());
      return hasContent ? [key, clean] : null;
    })
    .filter(Boolean));
}

function pickValue(row, names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== '') return row[name];
  }
  return undefined;
}

function normalizeImportedTrade(row) {
  return {
    date: pickValue(row, ['date', 'trade_date', 'Trade Date', 'Date', 'closeDate', 'Close Date']),
    asset: pickValue(row, ['asset', 'symbol', 'Symbol', 'Asset']) || 'NQ1',
    direction: String(pickValue(row, ['direction', 'side', 'Side', 'Direction']) || 'long').toLowerCase() === 'short' ? 'short' : 'long',
    session: pickValue(row, ['session', 'Session']) || 'AS',
    entryTime: pickValue(row, ['entryTime', 'entry_time', 'Entry Time']),
    exitTime: pickValue(row, ['exitTime', 'exit_time', 'Exit Time']),
    durationTime: pickValue(row, ['durationTime', 'duration_time', 'Duration']),
    orderWaitMinutes: pickValue(row, ['orderWaitMinutes', 'order_wait_minutes']),
    mode: pickValue(row, ['mode', 'Mode']),
    entryPrice: pickValue(row, ['entryPrice', 'entry_price', 'Entry']),
    stopLoss: pickValue(row, ['stopLoss', 'stop_loss', 'Stop Loss']),
    takeProfit: pickValue(row, ['takeProfit', 'take_profit', 'Take Profit']),
    tpTicks: pickValue(row, ['tpTicks', 'tp_ticks', 'TP Tick']),
    slTicks: pickValue(row, ['slTicks', 'sl_ticks', 'SL Tick']),
    tickSize: pickValue(row, ['tickSize', 'tick_size']) || 0.25,
    dollarPerPoint: pickValue(row, ['dollarPerPoint', 'dollar_per_point']) || 1,
    plannedR: pickValue(row, ['plannedR', 'planned_r', 'RR']),
    actualR: pickValue(row, ['actualR', 'actual_r']),
    maxR: pickValue(row, ['maxR', 'max_r', 'Max RR']),
    maxTick: pickValue(row, ['maxTick', 'max_tick', 'MAX TICK']),
    mfeR: pickValue(row, ['mfeR', 'mfe_r']),
    maeR: pickValue(row, ['maeR', 'mae_r']),
    riskAmount: pickValue(row, ['riskAmount', 'risk_amount', 'Risk']),
    lotSize: pickValue(row, ['lotSize', 'lot_size', 'Lot']),
    grossPnl: pickValue(row, ['grossPnl', 'gross_pnl', 'Gross P&L']),
    commissionAmount: pickValue(row, ['commissionAmount', 'commission_amount', 'Commission']) || 0,
    netPnl: pickValue(row, ['netPnl', 'net_pnl', 'Net P&L']),
    pnl: pickValue(row, ['pnl', 'P&L', 'Net P&L', 'netPnl', 'net_pnl']) || 0,
    slAmount: pickValue(row, ['slAmount', 'sl_amount', 'SL']),
    tpAmount: pickValue(row, ['tpAmount', 'tp_amount', 'TP']),
    tpPercent: pickValue(row, ['tpPercent', 'tp_percent']),
    balanceAfter: pickValue(row, ['balanceAfter', 'balance_after', 'Balance']),
    conLoss: pickValue(row, ['conLoss', 'con_loss']),
    sumConLossAmount: pickValue(row, ['sumConLossAmount', 'sum_con_loss_amount']),
    ddLossPct: pickValue(row, ['ddLossPct', 'dd_loss_pct']),
    sumDdLossPct: pickValue(row, ['sumDdLossPct', 'sum_dd_loss_pct']),
    result: String(pickValue(row, ['result', 'Result']) || 'miss').toLowerCase(),
    pictureUrl: pickValue(row, ['pictureUrl', 'picture_url']),
    tipUrl: pickValue(row, ['tipUrl', 'tip_url']),
    htfBias: pickValue(row, ['htfBias', 'htf_bias']),
    htfPoi: pickValue(row, ['htfPoi', 'htf_poi']),
    poiType: pickValue(row, ['poiType', 'poi_type']),
    poiHasFvg: pickValue(row, ['poiHasFvg', 'poi_has_fvg']),
    fvgPosition: pickValue(row, ['fvgPosition', 'fvg_position']),
    receivePoint: (() => {
      const value = pickValue(row, ['receivePoint', 'receive_point']);
      if (Array.isArray(value)) return value;
      try {
        const parsed = JSON.parse(value || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })(),
    liquiditySweep: pickValue(row, ['liquiditySweep', 'liquidity_sweep']),
    bos: pickValue(row, ['bos', 'BOS']),
    choch: pickValue(row, ['choch', 'CHoCH']),
    mtfStructure: pickValue(row, ['mtfStructure', 'mtf_structure']),
    ltfEntry: pickValue(row, ['ltfEntry', 'ltf_entry', 'LTF Entry']),
    keyZone: pickValue(row, ['keyZone', 'key_zone']),
    setupGrade: pickValue(row, ['setupGrade', 'setup_grade', 'Grade']),
    setupScore: pickValue(row, ['setupScore', 'setup_score']),
    ruleViolation: pickValue(row, ['ruleViolation', 'rule_violation']),
    emotionBefore: pickValue(row, ['emotionBefore', 'emotion_before']),
    emotionAfter: pickValue(row, ['emotionAfter', 'emotion_after']),
    disciplineScore: pickValue(row, ['disciplineScore', 'discipline_score']),
    chartHtf: pickValue(row, ['chartHtf', 'chart_htf']),
    chartMtf: pickValue(row, ['chartMtf', 'chart_mtf']),
    chartLtf: pickValue(row, ['chartLtf', 'chart_ltf']),
    notes: pickValue(row, ['notes', 'Notes'])
  };
}

function tradeSignature(trade) {
  return [
    trade.trade_date || trade.date || '',
    trade.entry_time || trade.entryTime || '',
    trade.asset || '',
    trade.direction || '',
    trade.result || '',
    Number(trade.pnl ?? trade.net_pnl ?? trade.netPnl ?? 0).toFixed(2)
  ].join('|').toLowerCase();
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
  ['mode', 'Mode', ['CANDLE + CODE', 'BOSe', 'CHe', 'Flip']],
  ['htfBias', 'HTF Bias', ['Bullish', 'Bearish', 'Neutral']],
  ['htfPoi', 'HTF POI', ['OB', 'FVG', 'Supply', 'Demand', 'Liquidity', 'Premium', 'Discount']],
  ['mtfStructure', 'MTF Structure', ['BOS', 'CHoCH', 'Sweep', 'Internal BOS', 'Range']],
  ['ltfEntry', 'LTF Entry', ['OB', 'FVG', 'OB + FVG', 'Breaker', 'Mitigation']],
  ['keyZone', 'Key Zone', ['None', 'Premium', 'Discount', 'Equilibrium', 'Asia High/Low', 'London Open', 'NY AM']],
  ['ruleViolation', 'Rule Violation', ['None', 'Early Entry', 'Late Entry', 'No Confirmation', 'Oversized Lot', 'Revenge Trade', 'Chased Price']],
  ['emotion', 'Emotion', ['Calm', 'Confident', 'Anxious', 'Frustrated', 'Greedy', 'Impatient', 'Regretful']]
];

const defaultAssets = [
  ['NQ1', 0.25, 20, 4.68],
  ['MNQ1', 0.25, 2, 1.9],
  ['MGC1', 0.1, 1, 0],
  ['GC1', 0.1, 10, 0],
  ['XAUUSD', 0.01, 1, 0],
  ['MES1', 0.25, 1.25, 0],
  ['ES1', 0.25, 12.5, 0],
  ['MYM1', 1, 0.5, 0],
  ['MCL1', 0.01, 1, 0]
];

async function ensureUserDefaults(userId) {
  for (const [key, label, options] of defaultOptions) {
    const row = await get('SELECT id FROM option_sets WHERE user_id=? AND field_key=?', [userId, key]);
    if (!row) await run(upsertOptionSql(), [userId, key, label, JSON.stringify(options)]);
  }
  const count = Number((await get('SELECT COUNT(*) count FROM asset_presets WHERE user_id=?', [userId])).count);
  if (!count) {
    for (const [index, [symbol, tickSize, dollarPerPoint, commissionAmount]] of defaultAssets.entries()) {
      await run('INSERT INTO asset_presets (user_id, symbol, tick_size, dollar_per_point, commission_amount, sort_order) VALUES (?, ?, ?, ?, ?, ?)', [userId, symbol, tickSize, dollarPerPoint, commissionAmount, index + 1]);
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
      const userCount = Number((await dbx.get('SELECT COUNT(*) count FROM users')).count);
      const role = userCount === 0 ? 'admin' : 'trader';
      const userId = await dbx.insert('INSERT INTO users (username, email, password_hash, role, email_verified) VALUES (?, ?, ?, ?, ?)', [username, email, hash, role, boolValue(false)]);
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

app.put('/api/me/profile', auth, asyncHandler(async (req, res) => {
  const profile = req.body.profile || {};
  const values = {
    nickname: cleanProfileText(profile.nickname, 40),
    phone: cleanProfileText(profile.phone, 30),
    email: cleanProfileText(profile.email, 100),
    facebook: cleanProfileText(profile.facebook, 100),
    line: cleanProfileText(profile.line, 80),
    contactType: normalizeContactType(profile.contactType),
    image: validateProfileImage(profile.image)
  };
  await run(`
    UPDATE users
    SET profile_nickname=?, profile_phone=?, profile_email=?, profile_facebook=?, profile_line=?, profile_contact_type=?, profile_image=?
    WHERE id=?
  `, [values.nickname, values.phone, values.email, values.facebook, values.line, values.contactType, values.image, req.user.id]);
  res.json({ user: userForClient(await getUser(req.user.id)) });
}));

app.put('/api/me/password', auth, asyncHandler(async (req, res) => {
  const currentPassword = String(req.body.currentPassword || '');
  const newPassword = String(req.body.newPassword || '');
  if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  const user = await getUser(req.user.id);
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
  const rows = await all(`
    SELECT id, user_id "userId", name, type, currency, starting_balance "startingBalance", is_active "isActive", sort_order "sortOrder",
      provider, plan_name "planName", market_type "marketType", profit_target "profitTarget", daily_loss_limit "dailyLossLimit",
      max_drawdown "maxDrawdown", trailing_drawdown "trailingDrawdown", max_contracts "maxContracts", min_trading_days "minTradingDays",
      consistency_rule "consistencyRule", payout_rule "payoutRule", commission_type "commissionType", commission_amount "commissionAmount",
      commission_scope "commissionScope", commission_notes "commissionNotes"
    FROM accounts WHERE user_id=? ORDER BY sort_order, id
  `, [userId]);
  res.json({ accounts: rows, portfolioLimit: user?.portfolio_limit || 5 });
}));

function normalizeAccount(body = {}) {
  return {
    name: String(body.name || 'New Account').trim(),
    type: body.type || 'live',
    startingBalance: Number(body.startingBalance || 50000),
    provider: body.provider || null,
    planName: body.planName || null,
    marketType: body.marketType || null,
    profitTarget: body.profitTarget === '' || body.profitTarget == null ? null : Number(body.profitTarget),
    dailyLossLimit: body.dailyLossLimit === '' || body.dailyLossLimit == null ? null : Number(body.dailyLossLimit),
    maxDrawdown: body.maxDrawdown === '' || body.maxDrawdown == null ? null : Number(body.maxDrawdown),
    trailingDrawdown: body.trailingDrawdown === '' || body.trailingDrawdown == null ? null : Number(body.trailingDrawdown),
    maxContracts: body.maxContracts === '' || body.maxContracts == null ? null : Number(body.maxContracts),
    minTradingDays: body.minTradingDays === '' || body.minTradingDays == null ? null : Number(body.minTradingDays),
    consistencyRule: body.consistencyRule || null,
    payoutRule: body.payoutRule || null,
    commissionType: body.commissionType || 'none',
    commissionAmount: body.commissionAmount === '' || body.commissionAmount == null ? 0 : Number(body.commissionAmount),
    commissionScope: body.commissionScope || 'roundTrip',
    commissionNotes: body.commissionNotes || null
  };
}

async function ensurePortfolioTemplates() {
  const count = Number((await get('SELECT COUNT(*) count FROM portfolio_templates')).count);
  if (count) return;
  for (const [index, template] of defaultPortfolioTemplates.entries()) {
    await run(
      'INSERT INTO portfolio_templates (template_key, label, values_json, sort_order, is_active) VALUES (?, ?, ?, ?, ?)',
      [template.templateKey, template.label, JSON.stringify(template.values), index + 1, boolValue(true)]
    );
  }
}

function templateForClient(row) {
  return {
    id: row.id,
    templateKey: row.template_key,
    label: row.label,
    values: JSON.parse(row.values_json || '{}'),
    sortOrder: row.sort_order,
    isActive: Boolean(row.is_active)
  };
}

function normalizeTemplate(body = {}) {
  const values = { ...blankAccountTemplate, ...(body.values || {}) };
  return {
    templateKey: String(body.templateKey || values.provider || values.name || 'custom').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `template-${Date.now()}`,
    label: String(body.label || values.name || 'New template').trim(),
    values,
    sortOrder: Number(body.sortOrder || 99),
    isActive: body.isActive !== false
  };
}

app.get('/api/portfolio-templates', auth, asyncHandler(async (req, res) => {
  await ensurePortfolioTemplates();
  const rows = await all('SELECT * FROM portfolio_templates WHERE is_active=? ORDER BY sort_order, label', [boolValue(true)]);
  res.json({ templates: rows.map(templateForClient) });
}));

app.get('/api/admin/portfolio-templates', auth, asyncHandler(async (req, res) => {
  if (!canAdmin(req)) return res.status(403).json({ error: 'Admin only' });
  await ensurePortfolioTemplates();
  const rows = await all('SELECT * FROM portfolio_templates ORDER BY sort_order, label');
  res.json({ templates: rows.map(templateForClient) });
}));

app.post('/api/admin/portfolio-templates', auth, asyncHandler(async (req, res) => {
  if (!canAdmin(req)) return res.status(403).json({ error: 'Admin only' });
  const template = normalizeTemplate(req.body);
  const id = await insert('INSERT INTO portfolio_templates (template_key, label, values_json, sort_order, is_active) VALUES (?, ?, ?, ?, ?)', [
    template.templateKey,
    template.label,
    JSON.stringify(template.values),
    template.sortOrder,
    boolValue(template.isActive)
  ]);
  res.json({ template: templateForClient(await get('SELECT * FROM portfolio_templates WHERE id=?', [id])) });
}));

app.put('/api/admin/portfolio-templates/:id', auth, asyncHandler(async (req, res) => {
  if (!canAdmin(req)) return res.status(403).json({ error: 'Admin only' });
  const template = normalizeTemplate(req.body);
  await run('UPDATE portfolio_templates SET template_key=?, label=?, values_json=?, sort_order=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [
    template.templateKey,
    template.label,
    JSON.stringify(template.values),
    template.sortOrder,
    boolValue(template.isActive),
    req.params.id
  ]);
  res.json({ template: templateForClient(await get('SELECT * FROM portfolio_templates WHERE id=?', [req.params.id])) });
}));

app.delete('/api/admin/portfolio-templates/:id', auth, asyncHandler(async (req, res) => {
  if (!canAdmin(req)) return res.status(403).json({ error: 'Admin only' });
  await run('DELETE FROM portfolio_templates WHERE id=?', [req.params.id]);
  res.json({ ok: true });
}));

app.post('/api/accounts', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  const user = await getUser(userId);
  const count = Number((await get('SELECT COUNT(*) count FROM accounts WHERE user_id=?', [userId])).count);
  if (count >= (user?.portfolio_limit || 5)) return res.status(400).json({ error: `Portfolio limit reached (${user?.portfolio_limit || 5})` });
  const account = normalizeAccount(req.body);
  const id = await insert(`
    INSERT INTO accounts (
      user_id, name, type, starting_balance, sort_order, provider, plan_name, market_type, profit_target, daily_loss_limit,
      max_drawdown, trailing_drawdown, max_contracts, min_trading_days, consistency_rule, payout_rule, commission_type,
      commission_amount, commission_scope, commission_notes
    ) VALUES (${Array.from({ length: 20 }, () => '?').join(',')})
  `, [
    userId,
    account.name,
    account.type,
    account.startingBalance,
    count + 1,
    account.provider,
    account.planName,
    account.marketType,
    account.profitTarget,
    account.dailyLossLimit,
    account.maxDrawdown,
    account.trailingDrawdown,
    account.maxContracts,
    account.minTradingDays,
    account.consistencyRule,
    account.payoutRule,
    account.commissionType,
    account.commissionAmount,
    account.commissionScope,
    account.commissionNotes
  ]);
  res.json({ id });
}));

app.put('/api/accounts/:id', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await ensureAccount(userId, req.params.id);
  const account = normalizeAccount(req.body);
  await run(`
    UPDATE accounts SET name=?, type=?, starting_balance=?, provider=?, plan_name=?, market_type=?, profit_target=?, daily_loss_limit=?,
      max_drawdown=?, trailing_drawdown=?, max_contracts=?, min_trading_days=?, consistency_rule=?, payout_rule=?, commission_type=?,
      commission_amount=?, commission_scope=?, commission_notes=?
    WHERE id=? AND user_id=?
  `, [
    account.name,
    account.type,
    account.startingBalance,
    account.provider,
    account.planName,
    account.marketType,
    account.profitTarget,
    account.dailyLossLimit,
    account.maxDrawdown,
    account.trailingDrawdown,
    account.maxContracts,
    account.minTradingDays,
    account.consistencyRule,
    account.payoutRule,
    account.commissionType,
    account.commissionAmount,
    account.commissionScope,
    account.commissionNotes,
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

function tradingViewDateTime(payload) {
  const raw = payload.date || payload.trade_date || payload.closeDate || payload.time || payload.timestamp;
  if (!raw) return { date: '', time: null };
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return { date: parsed.toISOString().slice(0, 10), time: parsed.toISOString().slice(11, 16) };
  }
  const text = String(raw);
  return { date: text.slice(0, 10), time: text.length >= 16 ? text.slice(11, 16) : null };
}

function normalizeTradingViewPayload(payload) {
  const body = payload && typeof payload === 'object' ? payload : {};
  const dateTime = tradingViewDateTime(body);
  const direction = String(body.direction || body.side || body.action || '').toLowerCase();
  const result = String(body.result || body.status || '').toLowerCase().replace(/\s+/g, '');
  const resultMap = { win: 'win', profit: 'win', loss: 'loss', lose: 'loss', breakeven: 'breakeven', be: 'breakeven', miss: 'miss', reversed: 'reversed' };
  const normalizedResult = resultMap[result];
  return {
    eventKey: String(body.event_id || body.eventId || body.order_id || body.orderId || body.id || '').trim(),
    eventType: String(body.event_type || body.eventType || body.type || (normalizedResult ? 'trade' : 'signal')).toLowerCase(),
    trade: {
      date: dateTime.date,
      asset: body.asset || body.symbol || body.ticker,
      direction: direction.includes('short') || direction === 'sell' ? 'short' : direction.includes('long') || direction === 'buy' ? 'long' : '',
      session: body.session || 'AS',
      entryTime: body.entry_time || body.entryTime || body.entry_time_utc || null,
      exitTime: body.exit_time || body.exitTime || dateTime.time,
      entryPrice: body.entry_price ?? body.entryPrice ?? body.entry,
      stopLoss: body.stop_loss ?? body.stopLoss ?? body.sl,
      takeProfit: body.take_profit ?? body.takeProfit ?? body.tp,
      result: normalizedResult || '',
      pnl: body.pnl ?? body.net_pnl ?? body.netPnl ?? body.profit,
      grossPnl: body.gross_pnl ?? body.grossPnl ?? body.pnl ?? body.profit,
      commissionAmount: body.commission ?? body.commission_amount ?? body.commissionAmount ?? 0,
      plannedR: body.planned_r ?? body.plannedR ?? body.rr,
      actualR: body.actual_r ?? body.actualR,
      maxR: body.max_rr ?? body.maxR,
      maxTick: body.max_tick ?? body.maxTick,
      lotSize: body.qty ?? body.quantity ?? body.lotSize ?? body.lot,
      notes: body.comment || body.notes || 'Imported from TradingView webhook',
      mode: body.mode,
      htfBias: body.htf_bias ?? body.htfBias,
      htfPoi: body.htf_poi ?? body.htfPoi,
      mtfStructure: body.mtf_structure ?? body.mtfStructure,
      ltfEntry: body.ltf_entry ?? body.ltfEntry,
      setupGrade: body.setup_grade ?? body.setupGrade
    }
  };
}

function integrationForClient(row, req, rawToken = '') {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    isActive: Boolean(row.is_active),
    lastReceivedAt: row.last_received_at,
    receivedCount: Number(row.received_count || 0),
    createdAt: row.created_at,
    webhookUrl: `${publicBaseUrl(req)}/api/webhooks/tradingview/${rawToken || ':token'}`,
    token: rawToken || undefined
  };
}

app.get('/api/integrations/tradingview', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  const rows = await all(`SELECT id, account_id, name, is_active, last_received_at, received_count, created_at FROM tradingview_integrations WHERE user_id=? ORDER BY id DESC`, [userId]);
  res.json({ integrations: rows.map((row) => integrationForClient(row, req)) });
}));

app.get('/api/integrations/tradingview/events', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  const requestedLimit = Number(req.query.limit || 20);
  const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 20, 1), 100);
  const rows = await all(`
    SELECT * FROM (
      SELECT e.id, e.integration_id, e.event_key, e.trade_id, e.received_at,
             i.name integration_name, i.account_id, a.name account_name,
             t.asset, t.direction, t.result, t.net_pnl, 'trade' event_type, 'imported' status
      FROM tradingview_webhook_events e
      JOIN tradingview_integrations i ON i.id=e.integration_id
      JOIN accounts a ON a.id=i.account_id
      LEFT JOIN trades t ON t.id=e.trade_id
      WHERE i.user_id=?
      UNION ALL
      SELECT s.id, s.integration_id, s.event_key, s.trade_id, s.received_at,
             i.name integration_name, i.account_id, a.name account_name,
             s.asset, s.direction, NULL result, NULL net_pnl, 'signal' event_type, s.status
      FROM tradingview_signals s
      JOIN tradingview_integrations i ON i.id=s.integration_id
      JOIN accounts a ON a.id=i.account_id
      WHERE i.user_id=?
    ) recent
    ORDER BY recent.received_at DESC, recent.id DESC
    LIMIT ${limit}
  `, [userId, userId]);
  res.json({ events: rows.map((row) => ({
    id: row.id,
    integrationId: row.integration_id,
    integrationName: row.integration_name,
    accountId: row.account_id,
    accountName: row.account_name,
    eventKey: row.event_key,
    tradeId: row.trade_id,
    receivedAt: row.received_at,
    asset: row.asset,
    direction: row.direction,
    result: row.result,
    netPnl: row.net_pnl,
    eventType: row.event_type,
    status: row.status
  })) });
}));

app.post('/api/integrations/tradingview', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await ensureAccount(userId, req.body.accountId);
  const rawToken = crypto.randomBytes(32).toString('hex');
  const name = String(req.body.name || 'TradingView').trim().slice(0, 80) || 'TradingView';
  const id = await insert('INSERT INTO tradingview_integrations (user_id, account_id, name, token_hash) VALUES (?, ?, ?, ?)', [userId, req.body.accountId, name, hashToken(rawToken)]);
  const row = await get('SELECT id, account_id, name, is_active, last_received_at, received_count, created_at FROM tradingview_integrations WHERE id=?', [id]);
  res.json({ integration: integrationForClient(row, req, rawToken), warning: 'Copy this token now. It is not stored in readable form.' });
}));

app.post('/api/integrations/tradingview/:id/rotate', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  const rawToken = crypto.randomBytes(32).toString('hex');
  const result = await run('UPDATE tradingview_integrations SET token_hash=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?', [hashToken(rawToken), req.params.id, userId]);
  if (!result.changes) return res.status(404).json({ error: 'TradingView integration not found' });
  const row = await get('SELECT id, account_id, name, is_active, last_received_at, received_count, created_at FROM tradingview_integrations WHERE id=?', [req.params.id]);
  res.json({ integration: integrationForClient(row, req, rawToken), warning: 'The previous webhook URL is now disabled.' });
}));

app.patch('/api/integrations/tradingview/:id', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  const name = String(req.body.name || 'TradingView').trim().slice(0, 80) || 'TradingView';
  const result = await run('UPDATE tradingview_integrations SET name=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?', [name, boolValue(req.body.isActive !== false), req.params.id, userId]);
  if (!result.changes) return res.status(404).json({ error: 'TradingView integration not found' });
  const row = await get('SELECT id, account_id, name, is_active, last_received_at, received_count, created_at FROM tradingview_integrations WHERE id=?', [req.params.id]);
  res.json({ integration: integrationForClient(row, req) });
}));

app.delete('/api/integrations/tradingview/:id', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await run('DELETE FROM tradingview_integrations WHERE id=? AND user_id=?', [req.params.id, userId]);
  res.json({ ok: true });
}));

app.post('/api/webhooks/tradingview/:token', asyncHandler(async (req, res) => {
  const token = String(req.params.token || '');
  const integration = await get('SELECT * FROM tradingview_integrations WHERE token_hash=? AND is_active=?', [hashToken(token), boolValue(true)]);
  if (!integration) return res.status(404).json({ error: 'Webhook not found or disabled' });
  const normalized = normalizeTradingViewPayload(req.body);
  const eventKey = normalized.eventKey || hashToken(JSON.stringify(req.body));
  const existing = await get('SELECT id, trade_id FROM tradingview_webhook_events WHERE integration_id=? AND event_key=?', [integration.id, eventKey]);
  if (existing) return res.json({ ok: true, duplicate: true, tradeId: existing.trade_id || null });
  const existingSignal = await get('SELECT id, trade_id, status FROM tradingview_signals WHERE integration_id=? AND event_key=?', [integration.id, eventKey]);
  const isSignal = ['signal', 'setup', 'entry', 'alert'].includes(normalized.eventType) || !normalized.trade.result;
  if (isSignal) {
    if (existingSignal) return res.json({ ok: true, duplicate: true, signalId: existingSignal.id, status: existingSignal.status });
    const signal = normalizeTrade(normalized.trade);
    if (!signal.trade_date || !signal.asset || !signal.direction) return res.status(422).json({ error: 'TradingView signal rejected: date, asset, and direction are required' });
    const signalId = await insert('INSERT INTO tradingview_signals (integration_id, event_key, signal_date, signal_time, asset, direction, session, signal_type, payload_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [integration.id, eventKey, signal.trade_date, signal.entry_time || signal.exit_time, signal.asset, signal.direction, signal.session, normalized.eventType, JSON.stringify(req.body)]);
    await run('UPDATE tradingview_integrations SET last_received_at=CURRENT_TIMESTAMP, received_count=received_count+1, updated_at=CURRENT_TIMESTAMP WHERE id=?', [integration.id]);
    return res.status(201).json({ ok: true, signal: true, signalId });
  }
  const error = validateTrade(normalizeTrade(normalized.trade));
  if (error) return res.status(422).json({ error: `TradingView payload rejected: ${error}`, expected: 'date, asset, direction, result, and a unique event_id' });
  const trade = normalizeTrade(normalized.trade);
  const tradeId = await insert(`INSERT INTO trades (user_id, account_id, ${tradeColumns.join(',')}) VALUES (${Array.from({ length: tradeColumns.length + 2 }, () => '?').join(',')})`, [integration.user_id, integration.account_id, ...tradeColumns.map((column) => trade[column])]);
  await insert('INSERT INTO tradingview_webhook_events (integration_id, event_key, payload_json, trade_id) VALUES (?, ?, ?, ?)', [integration.id, eventKey, JSON.stringify(req.body), tradeId]);
  if (existingSignal?.status === 'pending') await run('UPDATE tradingview_signals SET status=?, trade_id=? WHERE id=?', ['matched', tradeId, existingSignal.id]);
  await run('UPDATE tradingview_integrations SET last_received_at=CURRENT_TIMESTAMP, received_count=received_count+1, updated_at=CURRENT_TIMESTAMP WHERE id=?', [integration.id]);
  res.status(201).json({ ok: true, imported: true, tradeId });
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
  const assets = await all('SELECT id, symbol, tick_size "tickSize", dollar_per_point "dollarPerPoint", commission_amount "commissionAmount", sort_order "sortOrder" FROM asset_presets WHERE user_id=? ORDER BY sort_order, symbol', [userId]);
  res.json({ assets });
}));

app.post('/api/assets', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  const count = Number((await get('SELECT COUNT(*) count FROM asset_presets WHERE user_id=?', [userId])).count);
  const symbol = String(req.body.symbol || '').trim().toUpperCase();
  if (!symbol) return res.status(400).json({ error: 'Asset symbol is required' });
  const id = await insert('INSERT INTO asset_presets (user_id, symbol, tick_size, dollar_per_point, commission_amount, sort_order) VALUES (?, ?, ?, ?, ?, ?)', [
    userId,
    symbol,
    Number(req.body.tickSize || 1),
    Number(req.body.dollarPerPoint || 1),
    Math.max(0, Number(req.body.commissionAmount || 0)),
    count + 1
  ]);
  res.json({ asset: await get('SELECT id, symbol, tick_size "tickSize", dollar_per_point "dollarPerPoint", commission_amount "commissionAmount", sort_order "sortOrder" FROM asset_presets WHERE id=?', [id]) });
}));

app.put('/api/assets/:id', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  const symbol = String(req.body.symbol || '').trim().toUpperCase();
  if (!symbol) return res.status(400).json({ error: 'Asset symbol is required' });
  await run('UPDATE asset_presets SET symbol=?, tick_size=?, dollar_per_point=?, commission_amount=? WHERE id=? AND user_id=?', [
    symbol,
    Number(req.body.tickSize || 1),
    Number(req.body.dollarPerPoint || 1),
    Math.max(0, Number(req.body.commissionAmount || 0)),
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
  'tp_ticks','sl_ticks','tick_size','dollar_per_point','planned_r','actual_r','max_r','max_tick','mfe_r','mae_r','risk_amount','lot_size','gross_pnl','commission_amount','net_pnl','pnl','sl_amount',
  'tp_amount','tp_percent','balance_after','con_loss','sum_con_loss_amount','dd_loss_pct','sum_dd_loss_pct','result','picture_url','tip_url',
  'htf_bias','htf_poi','poi_type','poi_has_fvg','fvg_position',
  'receive_point','liquidity_sweep','bos','choch','mtf_structure','ltf_entry','key_zone','setup_grade','setup_score','rule_violation','emotion_before','emotion_after',
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
    max_tick: b.maxTick ?? null,
    mfe_r: b.mfeR ?? null,
    mae_r: b.maeR ?? null,
    risk_amount: b.riskAmount || 0,
    lot_size: b.lotSize || 0,
    gross_pnl: b.grossPnl ?? b.pnl ?? 0,
    commission_amount: b.commissionAmount ?? 0,
    net_pnl: b.netPnl ?? b.pnl ?? 0,
    pnl: b.pnl ?? b.netPnl ?? 0,
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
    receive_point: JSON.stringify(Array.isArray(b.receivePoint) ? b.receivePoint : []),
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

async function importPreview(userId, accountId, body) {
  await ensureAccount(userId, accountId);
  const pack = importPackageFromText(body.text, body.format || 'auto');
  const objects = pack.trades;
  const dailyReviews = normalizeDailyReviews(pack.dailyReviews);
  const existingRows = await all('SELECT * FROM trades WHERE user_id=? AND account_id=?', [userId, accountId]);
  const existing = new Set(existingRows.map(tradeSignature));
  const preview = objects.map((row, index) => {
    const trade = normalizeImportedTrade(row);
    const normalized = normalizeTrade(trade);
    const error = validateTrade(normalized);
    const duplicate = existing.has(tradeSignature(normalized));
    return {
      index,
      trade,
      status: error ? 'error' : duplicate ? 'duplicate' : 'ready',
      error: error || null
    };
  });
  return {
    total: preview.length,
    ready: preview.filter((row) => row.status === 'ready').length,
    duplicate: preview.filter((row) => row.status === 'duplicate').length,
    error: preview.filter((row) => row.status === 'error').length,
    reviews: Object.keys(dailyReviews).length,
    preview: preview.slice(0, 25)
  };
}

app.post('/api/accounts/:accountId/trades/import/preview', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  res.json(await importPreview(userId, req.params.accountId, req.body || {}));
}));

app.post('/api/accounts/:accountId/trades/import', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await ensureAccount(userId, req.params.accountId);
  const pack = importPackageFromText(req.body.text, req.body.format || 'auto');
  const objects = pack.trades;
  const dailyReviews = normalizeDailyReviews(pack.dailyReviews);
  const existingRows = await all('SELECT * FROM trades WHERE user_id=? AND account_id=?', [userId, req.params.accountId]);
  const existing = new Set(existingRows.map(tradeSignature));
  let inserted = 0;
  let skipped = 0;
  let failed = 0;
  let reviewsImported = 0;
  await transaction(async (tx) => {
    for (const row of objects) {
      const t = normalizeTrade(normalizeImportedTrade(row));
      const error = validateTrade(t);
      const signature = tradeSignature(t);
      if (error) {
        failed += 1;
      } else if (existing.has(signature)) {
        skipped += 1;
      } else {
        const cols = ['user_id', 'account_id', ...tradeColumns];
        const values = [userId, req.params.accountId, ...tradeColumns.map((c) => t[c])];
        const placeholders = cols.map(() => '?').join(',');
        await tx.insert(`INSERT INTO trades (${cols.join(',')}) VALUES (${placeholders})`, values);
        existing.add(signature);
        inserted += 1;
      }
    }
    for (const [date, review] of Object.entries(dailyReviews)) {
      await tx.run(`
        INSERT INTO journal_notes (user_id, account_id, title, content, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, account_id, title) DO UPDATE SET content=excluded.content, updated_at=CURRENT_TIMESTAMP
      `, [userId, req.params.accountId, `Daily Review: ${date}`, JSON.stringify(review)]);
      reviewsImported += 1;
    }
  });
  res.json({ inserted, skipped, failed, total: objects.length, reviewsImported });
}));

app.post('/api/accounts/:accountId/trades/transfer', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  const sourceAccountId = req.params.accountId;
  const targetAccountId = req.body.targetAccountId;
  if (!targetAccountId || Number(targetAccountId) === Number(sourceAccountId)) return res.status(400).json({ error: 'Choose a different target portfolio' });
  await ensureAccount(userId, sourceAccountId);
  await ensureAccount(userId, targetAccountId);
  const selectedIds = Array.isArray(req.body.tradeIds) ? req.body.tradeIds.map(Number).filter(Boolean) : [];
  const sourceRows = selectedIds.length
    ? await all(`SELECT * FROM trades WHERE user_id=? AND account_id=? AND id IN (${selectedIds.map(() => '?').join(',')})`, [userId, sourceAccountId, ...selectedIds])
    : await all('SELECT * FROM trades WHERE user_id=? AND account_id=? ORDER BY trade_date, entry_time, id', [userId, sourceAccountId]);
  const sourceReviewRows = await all(`
    SELECT title, content
    FROM journal_notes
    WHERE user_id=? AND account_id=? AND title LIKE 'Daily Review:%'
    ORDER BY title
  `, [userId, sourceAccountId]);
  const selectedDates = selectedIds.length ? new Set(sourceRows.map((row) => row.trade_date).filter(Boolean)) : null;
  const targetRows = await all('SELECT * FROM trades WHERE user_id=? AND account_id=?', [userId, targetAccountId]);
  const existing = new Set(targetRows.map(tradeSignature));
  let copied = 0;
  let skipped = 0;
  let reviewsCopied = 0;
  await transaction(async (tx) => {
    for (const row of sourceRows) {
      const signature = tradeSignature(row);
      if (existing.has(signature)) {
        skipped += 1;
        continue;
      }
      const cols = ['user_id', 'account_id', ...tradeColumns];
      const values = [userId, targetAccountId, ...tradeColumns.map((c) => row[c])];
      const placeholders = cols.map(() => '?').join(',');
      await tx.insert(`INSERT INTO trades (${cols.join(',')}) VALUES (${placeholders})`, values);
      existing.add(signature);
      copied += 1;
    }
    for (const row of sourceReviewRows) {
      const date = String(row.title || '').replace('Daily Review:', '').trim().slice(0, 10);
      if (selectedDates && !selectedDates.has(date)) continue;
      await tx.run(`
        INSERT INTO journal_notes (user_id, account_id, title, content, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, account_id, title) DO UPDATE SET content=excluded.content, updated_at=CURRENT_TIMESTAMP
      `, [userId, targetAccountId, row.title, row.content || '{}']);
      reviewsCopied += 1;
    }
  });
  res.json({ copied, skipped, total: sourceRows.length, reviewsCopied });
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

app.get('/api/accounts/:accountId/playbook-setups', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await ensureAccount(userId, req.params.accountId);
  const note = await get('SELECT content, updated_at "updatedAt" FROM journal_notes WHERE user_id=? AND account_id=? AND title=?', [userId, req.params.accountId, 'Setup Playbook']);
  let setups = [];
  try {
    setups = note?.content ? JSON.parse(note.content) : [];
  } catch {
    setups = [];
  }
  res.json({ setups: Array.isArray(setups) ? setups : [], updatedAt: note?.updatedAt || null });
}));

app.put('/api/accounts/:accountId/playbook-setups', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await ensureAccount(userId, req.params.accountId);
  const setups = Array.isArray(req.body.setups) ? req.body.setups.slice(0, 30) : [];
  await run(`
    INSERT INTO journal_notes (user_id, account_id, title, content, updated_at)
    VALUES (?, ?, 'Setup Playbook', ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, account_id, title) DO UPDATE SET content=excluded.content, updated_at=CURRENT_TIMESTAMP
  `, [userId, req.params.accountId, JSON.stringify(setups)]);
  res.json({ ok: true, setups });
}));

app.get('/api/accounts/:accountId/daily-reviews', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await ensureAccount(userId, req.params.accountId);
  const rows = await all(`
    SELECT title, content, updated_at "updatedAt"
    FROM journal_notes
    WHERE user_id=? AND account_id=? AND title LIKE 'Daily Review:%'
    ORDER BY title
  `, [userId, req.params.accountId]);
  const reviews = {};
  rows.forEach((row) => {
    const date = String(row.title || '').replace('Daily Review:', '').trim();
    if (!date) return;
    try {
      reviews[date] = row.content ? JSON.parse(row.content) : {};
    } catch {
      reviews[date] = { summary: row.content || '' };
    }
    reviews[date].updatedAt = row.updatedAt;
  });
  res.json({ reviews });
}));

app.put('/api/accounts/:accountId/daily-reviews/:date', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await ensureAccount(userId, req.params.accountId);
  const date = String(req.params.date || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Invalid review date' });
  const review = {
    summary: String(req.body.summary || ''),
    repeat: String(req.body.repeat || ''),
    reduce: String(req.body.reduce || ''),
    nextPlan: String(req.body.nextPlan || '')
  };
  await run(`
    INSERT INTO journal_notes (user_id, account_id, title, content, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, account_id, title) DO UPDATE SET content=excluded.content, updated_at=CURRENT_TIMESTAMP
  `, [userId, req.params.accountId, `Daily Review: ${date}`, JSON.stringify(review)]);
  res.json({ ok: true, review });
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

app.get('/api/admin/system/status', auth, asyncHandler(async (req, res) => {
  if (!canAdmin(req)) return res.status(403).json({ error: 'Admin only' });
  const demo = await get('SELECT username, role, status FROM users WHERE username=?', ['demo']);
  const counts = {
    users: Number((await get('SELECT COUNT(*) count FROM users')).count),
    accounts: Number((await get('SELECT COUNT(*) count FROM accounts')).count),
    trades: Number((await get('SELECT COUNT(*) count FROM trades')).count)
  };
  res.json({
    system: {
      database: isPostgres ? 'Postgres' : 'SQLite',
      production: process.env.NODE_ENV === 'production',
      publicBaseUrl: process.env.PUBLIC_BASE_URL || null,
      demoAccount: demo || null,
      demoLocked: !demo || demo.status === 'suspended',
      email: emailStatus(),
      exportReady: true,
      counts
    }
  });
}));

app.get('/api/admin/export/json', auth, asyncHandler(async (req, res) => {
  if (!canAdmin(req)) return res.status(403).json({ error: 'Admin only' });
  const payload = {
    exportedAt: new Date().toISOString(),
    app: 'Mr.Z Trading Journal',
    users: await all('SELECT id, username, email, role, email_verified, status, portfolio_limit, permissions_json, created_at FROM users ORDER BY id'),
    accounts: await all('SELECT * FROM accounts ORDER BY user_id, sort_order, id'),
    trades: await all('SELECT * FROM trades ORDER BY user_id, account_id, trade_date, id'),
    portfolioTemplates: await all('SELECT * FROM portfolio_templates ORDER BY sort_order, label'),
    optionSets: await all('SELECT * FROM option_sets ORDER BY user_id, field_key'),
    assetPresets: await all('SELECT * FROM asset_presets ORDER BY user_id, sort_order, symbol'),
    journalNotes: await all('SELECT * FROM journal_notes ORDER BY user_id, account_id, title')
  };
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName('mrz-trading-journal-backup', 'json')}"`);
  res.send(JSON.stringify(payload, null, 2));
}));

app.get('/api/admin/export/trades.csv', auth, asyncHandler(async (req, res) => {
  if (!canAdmin(req)) return res.status(403).json({ error: 'Admin only' });
  const rows = await all(`
    SELECT u.username, u.email, a.name account_name, a.type account_type, t.*
    FROM trades t
    JOIN users u ON u.id=t.user_id
    JOIN accounts a ON a.id=t.account_id
    ORDER BY u.username, a.sort_order, t.trade_date, t.id
  `);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName('mrz-trading-journal-trades', 'csv')}"`);
  res.send(toCsv(rows));
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

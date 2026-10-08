import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, rowToTrade } from './db.js';
import './migrate.js';

const app = express();
const port = Number(process.env.PORT || 5174);
const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '..', 'dist');

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));

function tokenFor(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, jwtSecret, { expiresIn: '7d' });
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

function ensureAccount(userId, accountId) {
  const account = db.prepare('SELECT * FROM accounts WHERE id=? AND user_id=?').get(accountId, userId);
  if (!account) {
    const err = new Error('Account not found');
    err.status = 404;
    throw err;
  }
  return account;
}

const defaultOptions = [
  ['htfBias', 'HTF Bias', ['Bullish', 'Bearish', 'Neutral']],
  ['htfPoi', 'HTF POI', ['OB', 'FVG', 'Supply', 'Demand', 'Liquidity', 'Premium', 'Discount']],
  ['mtfStructure', 'MTF Structure', ['BOS', 'CHoCH', 'Sweep', 'Internal BOS', 'Range']],
  ['ltfEntry', 'LTF Entry', ['OB', 'FVG', 'OB + FVG', 'Breaker', 'Mitigation']],
  ['keyZone', 'Key Zone', ['Premium', 'Discount', 'Equilibrium', 'Asia High/Low', 'London Open', 'NY AM']],
  ['ruleViolation', 'Rule Violation', ['None', 'Early Entry', 'Late Entry', 'No Confirmation', 'Oversized Lot', 'Revenge Trade', 'Chased Price']],
  ['emotion', 'Emotion', ['Calm', 'Confident', 'Anxious', 'Frustrated', 'Greedy', 'Impatient', 'Regretful']]
];

function createDefaultAccount(userId) {
  const insert = db.prepare('INSERT INTO accounts (user_id, name, type, sort_order) VALUES (?, ?, ?, ?)');
  const backtest = insert.run(userId, 'Backtest', 'backtest', 1).lastInsertRowid;
  insert.run(userId, 'Forward Test', 'forward', 2);
  const opt = db.prepare('INSERT INTO option_sets (user_id, field_key, label, options_json) VALUES (?, ?, ?, ?)');
  defaultOptions.forEach(([key, label, options]) => opt.run(userId, key, label, JSON.stringify(options)));
  return backtest;
}

app.post('/api/auth/register', (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!/^[a-z0-9_.-]{3,24}$/.test(username)) return res.status(400).json({ error: 'Username must be 3-24 chars: a-z, 0-9, _, ., -' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const create = db.transaction(() => {
      const userId = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(username, hash, 'trader').lastInsertRowid;
      createDefaultAccount(userId);
      return db.prepare('SELECT id, username, role FROM users WHERE id=?').get(userId);
    });
    const user = create();
    res.json({ token: tokenFor(user), user });
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) return res.status(409).json({ error: 'Username already exists' });
    res.status(500).json({ error: 'Could not create account' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid username or password' });
  res.json({ token: tokenFor(user), user: { id: user.id, username: user.username, role: user.role } });
});

app.get('/api/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, username, role, created_at createdAt FROM users WHERE id=?').get(req.user.id);
  res.json({ user });
});

app.get('/api/accounts', auth, (req, res) => {
  const rows = db.prepare('SELECT id, name, type, currency, starting_balance startingBalance, is_active isActive, sort_order sortOrder FROM accounts WHERE user_id=? ORDER BY sort_order, id').all(req.user.id);
  res.json({ accounts: rows });
});

app.post('/api/accounts', auth, (req, res) => {
  const count = db.prepare('SELECT COUNT(*) count FROM accounts WHERE user_id=?').get(req.user.id).count;
  const info = db.prepare('INSERT INTO accounts (user_id, name, type, starting_balance, sort_order) VALUES (?, ?, ?, ?, ?)').run(
    req.user.id,
    String(req.body.name || 'New Account').trim(),
    req.body.type || 'live',
    Number(req.body.startingBalance || 50000),
    count + 1
  );
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/accounts/:id', auth, (req, res) => {
  ensureAccount(req.user.id, req.params.id);
  db.prepare('UPDATE accounts SET name=?, type=?, starting_balance=? WHERE id=? AND user_id=?').run(
    String(req.body.name || 'Account').trim(),
    req.body.type || 'live',
    Number(req.body.startingBalance || 0),
    req.params.id,
    req.user.id
  );
  res.json({ ok: true });
});

app.delete('/api/accounts/:id', auth, (req, res) => {
  const count = db.prepare('SELECT COUNT(*) count FROM accounts WHERE user_id=?').get(req.user.id).count;
  if (count <= 1) return res.status(400).json({ error: 'Keep at least one account' });
  ensureAccount(req.user.id, req.params.id);
  db.prepare('DELETE FROM accounts WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

app.get('/api/options', auth, (req, res) => {
  const rows = db.prepare('SELECT field_key fieldKey, label, options_json optionsJson FROM option_sets WHERE user_id=?').all(req.user.id);
  res.json({ options: rows.map((r) => ({ fieldKey: r.fieldKey, label: r.label, options: JSON.parse(r.optionsJson) })) });
});

app.put('/api/options/:fieldKey', auth, (req, res) => {
  const label = String(req.body.label || req.params.fieldKey);
  const options = Array.isArray(req.body.options) ? req.body.options.map(String).filter(Boolean) : [];
  db.prepare(`
    INSERT INTO option_sets (user_id, field_key, label, options_json)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, field_key) DO UPDATE SET label=excluded.label, options_json=excluded.options_json
  `).run(req.user.id, req.params.fieldKey, label, JSON.stringify(options));
  res.json({ ok: true });
});

app.get('/api/accounts/:accountId/trades', auth, (req, res) => {
  ensureAccount(req.user.id, req.params.accountId);
  const rows = db.prepare('SELECT * FROM trades WHERE user_id=? AND account_id=? ORDER BY trade_date DESC, entry_time DESC, id DESC').all(req.user.id, req.params.accountId);
  res.json({ trades: rows.map(rowToTrade) });
});

const tradeColumns = [
  'trade_date','asset','direction','session','entry_time','exit_time','order_wait_minutes','entry_price','stop_loss','take_profit','tick_size','dollar_per_point',
  'planned_r','actual_r','max_r','mfe_r','mae_r','risk_amount','lot_size','pnl','result','htf_bias','htf_poi','poi_type','poi_has_fvg','fvg_position',
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
    order_wait_minutes: b.orderWaitMinutes ?? null,
    entry_price: b.entryPrice ?? null,
    stop_loss: b.stopLoss ?? null,
    take_profit: b.takeProfit ?? null,
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
    result: b.result,
    htf_bias: b.htfBias || null,
    htf_poi: b.htfPoi || null,
    poi_type: b.poiType || null,
    poi_has_fvg: b.poiHasFvg ? 1 : 0,
    fvg_position: b.fvgPosition || null,
    liquidity_sweep: b.liquiditySweep ? 1 : 0,
    bos: b.bos ? 1 : 0,
    choch: b.choch ? 1 : 0,
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

app.post('/api/accounts/:accountId/trades', auth, (req, res) => {
  ensureAccount(req.user.id, req.params.accountId);
  const t = normalizeTrade(req.body);
  const error = validateTrade(t);
  if (error) return res.status(400).json({ error });
  const cols = ['user_id', 'account_id', ...tradeColumns];
  const values = [req.user.id, req.params.accountId, ...tradeColumns.map((c) => t[c])];
  const placeholders = cols.map(() => '?').join(',');
  const info = db.prepare(`INSERT INTO trades (${cols.join(',')}) VALUES (${placeholders})`).run(...values);
  res.json({ trade: rowToTrade(db.prepare('SELECT * FROM trades WHERE id=?').get(info.lastInsertRowid)) });
});

app.put('/api/accounts/:accountId/trades/:id', auth, (req, res) => {
  ensureAccount(req.user.id, req.params.accountId);
  const t = normalizeTrade(req.body);
  const error = validateTrade(t);
  if (error) return res.status(400).json({ error });
  const setSql = tradeColumns.map((c) => `${c}=?`).join(',');
  db.prepare(`UPDATE trades SET ${setSql}, updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND account_id=?`)
    .run(...tradeColumns.map((c) => t[c]), req.params.id, req.user.id, req.params.accountId);
  res.json({ trade: rowToTrade(db.prepare('SELECT * FROM trades WHERE id=? AND user_id=?').get(req.params.id, req.user.id)) });
});

app.delete('/api/accounts/:accountId/trades/:id', auth, (req, res) => {
  ensureAccount(req.user.id, req.params.accountId);
  db.prepare('DELETE FROM trades WHERE id=? AND user_id=? AND account_id=?').run(req.params.id, req.user.id, req.params.accountId);
  res.json({ ok: true });
});

app.get('/api/accounts/:accountId/note', auth, (req, res) => {
  ensureAccount(req.user.id, req.params.accountId);
  const note = db.prepare('SELECT content, updated_at updatedAt FROM journal_notes WHERE user_id=? AND account_id=? AND title=?').get(req.user.id, req.params.accountId, 'Account Playbook');
  res.json({ note: note || { content: '', updatedAt: null } });
});

app.put('/api/accounts/:accountId/note', auth, (req, res) => {
  ensureAccount(req.user.id, req.params.accountId);
  db.prepare(`
    INSERT INTO journal_notes (user_id, account_id, title, content, updated_at)
    VALUES (?, ?, 'Account Playbook', ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, account_id, title) DO UPDATE SET content=excluded.content, updated_at=CURRENT_TIMESTAMP
  `).run(req.user.id, req.params.accountId, String(req.body.content || ''));
  res.json({ ok: true });
});

app.get('/api/admin/team', auth, (req, res) => {
  if (!['coach', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Coach/admin only' });
  const users = db.prepare(`
    SELECT u.id, u.username, u.role, COUNT(t.id) totalTrades, COALESCE(SUM(t.pnl),0) netPnl
    FROM users u
    LEFT JOIN trades t ON t.user_id=u.id
    GROUP BY u.id
    ORDER BY u.username
  `).all();
  res.json({ users });
});

app.use(express.static(distPath));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(port, () => {
  console.log(`API listening on http://127.0.0.1:${port}`);
});

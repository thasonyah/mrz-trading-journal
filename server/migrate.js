import fs from 'node:fs';
import path from 'node:path';
import { exec, get, isPostgres, run } from './db.js';

const pgSchema = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'trader' CHECK(role IN ('trader','coach','admin')),
  email_verified BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  portfolio_limit INTEGER NOT NULL DEFAULT 5,
  permissions_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'backtest',
  currency TEXT NOT NULL DEFAULT 'USD',
  starting_balance DOUBLE PRECISION NOT NULL DEFAULT 50000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS option_sets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  options_json TEXT NOT NULL,
  UNIQUE(user_id, field_key)
);

CREATE TABLE IF NOT EXISTS asset_presets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  tick_size DOUBLE PRECISION NOT NULL DEFAULT 1,
  dollar_per_point DOUBLE PRECISION NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, symbol)
);

CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  trade_date TEXT NOT NULL,
  asset TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('long','short')),
  session TEXT NOT NULL,
  entry_time TEXT,
  exit_time TEXT,
  duration_time TEXT,
  order_wait_minutes DOUBLE PRECISION,
  mode TEXT,
  entry_price DOUBLE PRECISION,
  stop_loss DOUBLE PRECISION,
  take_profit DOUBLE PRECISION,
  tp_ticks DOUBLE PRECISION,
  sl_ticks DOUBLE PRECISION,
  tick_size DOUBLE PRECISION NOT NULL DEFAULT 0.25,
  dollar_per_point DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  planned_r DOUBLE PRECISION,
  actual_r DOUBLE PRECISION,
  max_r DOUBLE PRECISION,
  mfe_r DOUBLE PRECISION,
  mae_r DOUBLE PRECISION,
  risk_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  lot_size DOUBLE PRECISION NOT NULL DEFAULT 0,
  pnl DOUBLE PRECISION NOT NULL DEFAULT 0,
  sl_amount DOUBLE PRECISION,
  tp_amount DOUBLE PRECISION,
  tp_percent DOUBLE PRECISION,
  balance_after DOUBLE PRECISION,
  con_loss INTEGER,
  sum_con_loss_amount DOUBLE PRECISION,
  dd_loss_pct DOUBLE PRECISION,
  sum_dd_loss_pct DOUBLE PRECISION,
  result TEXT NOT NULL CHECK(result IN ('win','loss','breakeven','miss','reversed')),
  picture_url TEXT,
  tip_url TEXT,
  htf_bias TEXT,
  htf_poi TEXT,
  poi_type TEXT,
  poi_has_fvg BOOLEAN NOT NULL DEFAULT false,
  fvg_position TEXT,
  liquidity_sweep BOOLEAN NOT NULL DEFAULT false,
  bos BOOLEAN NOT NULL DEFAULT false,
  choch BOOLEAN NOT NULL DEFAULT false,
  mtf_structure TEXT,
  ltf_entry TEXT,
  key_zone TEXT,
  setup_grade TEXT,
  setup_score INTEGER NOT NULL DEFAULT 0,
  rule_violation TEXT,
  emotion_before TEXT,
  emotion_after TEXT,
  discipline_score INTEGER,
  chart_htf TEXT,
  chart_mtf TEXT,
  chart_ltf TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journal_notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Account Playbook',
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, account_id, title)
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('verify_email','reset_password')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trades_user_account_date ON trades(user_id, account_id, trade_date);
CREATE INDEX IF NOT EXISTS idx_trades_setup ON trades(setup_grade, htf_bias, mtf_structure, ltf_entry);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_type ON auth_tokens(user_id, type, used_at, expires_at);
`;

async function migrateSqlite() {
  await exec('CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
  const dir = path.resolve('migrations');
  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.sql')).sort();
  for (const file of files) {
    const applied = await get('SELECT name FROM migrations WHERE name=?', [file]);
    if (applied) continue;
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    await exec(sql);
    await run('INSERT INTO migrations (name) VALUES (?)', [file]);
    console.log(`Applied ${file}`);
  }
}

if (isPostgres) {
  await exec(pgSchema);
  console.log('Postgres database is up to date');
} else {
  await migrateSqlite();
  console.log('SQLite database is up to date');
}

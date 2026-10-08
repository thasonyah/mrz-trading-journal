PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'trader' CHECK(role IN ('trader','coach','admin')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'backtest',
  currency TEXT NOT NULL DEFAULT 'USD',
  starting_balance REAL NOT NULL DEFAULT 50000,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS option_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  options_json TEXT NOT NULL,
  UNIQUE(user_id, field_key)
);

CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  trade_date TEXT NOT NULL,
  asset TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('long','short')),
  session TEXT NOT NULL,
  entry_time TEXT,
  exit_time TEXT,
  order_wait_minutes REAL,
  entry_price REAL,
  stop_loss REAL,
  take_profit REAL,
  tick_size REAL NOT NULL DEFAULT 0.25,
  dollar_per_point REAL NOT NULL DEFAULT 0.5,
  planned_r REAL,
  actual_r REAL,
  max_r REAL,
  mfe_r REAL,
  mae_r REAL,
  risk_amount REAL NOT NULL DEFAULT 0,
  lot_size REAL NOT NULL DEFAULT 0,
  pnl REAL NOT NULL DEFAULT 0,
  result TEXT NOT NULL CHECK(result IN ('win','loss','breakeven','miss','reversed')),
  htf_bias TEXT,
  htf_poi TEXT,
  poi_type TEXT,
  poi_has_fvg INTEGER NOT NULL DEFAULT 0,
  fvg_position TEXT,
  liquidity_sweep INTEGER NOT NULL DEFAULT 0,
  bos INTEGER NOT NULL DEFAULT 0,
  choch INTEGER NOT NULL DEFAULT 0,
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
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journal_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Account Playbook',
  content TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, account_id, title)
);

CREATE INDEX IF NOT EXISTS idx_trades_user_account_date ON trades(user_id, account_id, trade_date);
CREATE INDEX IF NOT EXISTS idx_trades_setup ON trades(setup_grade, htf_bias, mtf_structure, ltf_entry);

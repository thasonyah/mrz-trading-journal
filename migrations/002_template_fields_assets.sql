ALTER TABLE trades ADD COLUMN duration_time TEXT;
ALTER TABLE trades ADD COLUMN mode TEXT;
ALTER TABLE trades ADD COLUMN tp_ticks REAL;
ALTER TABLE trades ADD COLUMN sl_ticks REAL;
ALTER TABLE trades ADD COLUMN picture_url TEXT;
ALTER TABLE trades ADD COLUMN tip_url TEXT;
ALTER TABLE trades ADD COLUMN sl_amount REAL;
ALTER TABLE trades ADD COLUMN tp_amount REAL;
ALTER TABLE trades ADD COLUMN tp_percent REAL;
ALTER TABLE trades ADD COLUMN balance_after REAL;
ALTER TABLE trades ADD COLUMN con_loss INTEGER;
ALTER TABLE trades ADD COLUMN sum_con_loss_amount REAL;
ALTER TABLE trades ADD COLUMN dd_loss_pct REAL;
ALTER TABLE trades ADD COLUMN sum_dd_loss_pct REAL;

CREATE TABLE IF NOT EXISTS asset_presets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  tick_size REAL NOT NULL DEFAULT 1,
  dollar_per_point REAL NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, symbol)
);

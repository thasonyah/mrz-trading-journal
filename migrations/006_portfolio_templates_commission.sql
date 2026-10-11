ALTER TABLE accounts ADD COLUMN provider TEXT;
ALTER TABLE accounts ADD COLUMN plan_name TEXT;
ALTER TABLE accounts ADD COLUMN market_type TEXT;
ALTER TABLE accounts ADD COLUMN profit_target REAL;
ALTER TABLE accounts ADD COLUMN daily_loss_limit REAL;
ALTER TABLE accounts ADD COLUMN max_drawdown REAL;
ALTER TABLE accounts ADD COLUMN trailing_drawdown REAL;
ALTER TABLE accounts ADD COLUMN max_contracts REAL;
ALTER TABLE accounts ADD COLUMN min_trading_days INTEGER;
ALTER TABLE accounts ADD COLUMN consistency_rule TEXT;
ALTER TABLE accounts ADD COLUMN payout_rule TEXT;
ALTER TABLE accounts ADD COLUMN commission_type TEXT NOT NULL DEFAULT 'none';
ALTER TABLE accounts ADD COLUMN commission_amount REAL NOT NULL DEFAULT 0;
ALTER TABLE accounts ADD COLUMN commission_scope TEXT NOT NULL DEFAULT 'roundTrip';
ALTER TABLE accounts ADD COLUMN commission_notes TEXT;

ALTER TABLE trades ADD COLUMN gross_pnl REAL;
ALTER TABLE trades ADD COLUMN commission_amount REAL NOT NULL DEFAULT 0;
ALTER TABLE trades ADD COLUMN net_pnl REAL;

UPDATE trades
SET gross_pnl = COALESCE(gross_pnl, pnl),
    net_pnl = COALESCE(net_pnl, pnl),
    commission_amount = COALESCE(commission_amount, 0);

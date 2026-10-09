import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

export const isPostgres = Boolean(process.env.DATABASE_URL);

let sqlite;
let pool;

if (isPostgres) {
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
} else {
  const dbPath = process.env.DATABASE_PATH || './data/trading-journal.sqlite';
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
}

function toPg(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

export async function exec(sql) {
  if (isPostgres) return pool.query(sql);
  sqlite.exec(sql);
  return null;
}

export async function get(sql, params = []) {
  if (isPostgres) {
    const result = await pool.query(toPg(sql), params);
    return result.rows[0];
  }
  return sqlite.prepare(sql).get(...params);
}

export async function all(sql, params = []) {
  if (isPostgres) {
    const result = await pool.query(toPg(sql), params);
    return result.rows;
  }
  return sqlite.prepare(sql).all(...params);
}

export async function run(sql, params = []) {
  if (isPostgres) {
    const result = await pool.query(toPg(sql), params);
    return { changes: result.rowCount };
  }
  const result = sqlite.prepare(sql).run(...params);
  return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
}

export async function insert(sql, params = []) {
  if (isPostgres) {
    const result = await pool.query(`${toPg(sql)} RETURNING id`, params);
    return result.rows[0].id;
  }
  const result = sqlite.prepare(sql).run(...params);
  return result.lastInsertRowid;
}

export async function transaction(callback) {
  if (!isPostgres) {
    return callback({ get, all, run, insert });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tx = {
      get: async (sql, params = []) => {
        const result = await client.query(toPg(sql), params);
        return result.rows[0];
      },
      all: async (sql, params = []) => {
        const result = await client.query(toPg(sql), params);
        return result.rows;
      },
      run: async (sql, params = []) => {
        const result = await client.query(toPg(sql), params);
        return { changes: result.rowCount };
      },
      insert: async (sql, params = []) => {
        const result = await client.query(`${toPg(sql)} RETURNING id`, params);
        return result.rows[0].id;
      }
    };
    const value = await callback(tx);
    await client.query('COMMIT');
    return value;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export function upsertOptionSql() {
  return `
    INSERT INTO option_sets (user_id, field_key, label, options_json)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, field_key) DO UPDATE SET label=excluded.label, options_json=excluded.options_json
  `;
}

export function upsertNoteSql() {
  return `
    INSERT INTO journal_notes (user_id, account_id, title, content, updated_at)
    VALUES (?, ?, 'Account Playbook', ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, account_id, title) DO UPDATE SET content=excluded.content, updated_at=CURRENT_TIMESTAMP
  `;
}

export function boolValue(value) {
  return isPostgres ? Boolean(value) : value ? 1 : 0;
}

export function rowToTrade(row) {
  if (!row) return null;
  return {
    id: row.id,
    accountId: row.account_id,
    date: row.trade_date,
    asset: row.asset,
    direction: row.direction,
    session: row.session,
    entryTime: row.entry_time,
    exitTime: row.exit_time,
    durationTime: row.duration_time,
    orderWaitMinutes: row.order_wait_minutes,
    mode: row.mode,
    entryPrice: row.entry_price,
    stopLoss: row.stop_loss,
    takeProfit: row.take_profit,
    tpTicks: row.tp_ticks,
    slTicks: row.sl_ticks,
    tickSize: row.tick_size,
    dollarPerPoint: row.dollar_per_point,
    plannedR: row.planned_r,
    actualR: row.actual_r,
    maxR: row.max_r,
    mfeR: row.mfe_r,
    maeR: row.mae_r,
    riskAmount: row.risk_amount,
    lotSize: row.lot_size,
    pnl: row.pnl,
    slAmount: row.sl_amount,
    tpAmount: row.tp_amount,
    tpPercent: row.tp_percent,
    balanceAfter: row.balance_after,
    conLoss: row.con_loss,
    sumConLossAmount: row.sum_con_loss_amount,
    ddLossPct: row.dd_loss_pct,
    sumDdLossPct: row.sum_dd_loss_pct,
    result: row.result,
    pictureUrl: row.picture_url,
    tipUrl: row.tip_url,
    htfBias: row.htf_bias,
    htfPoi: row.htf_poi,
    poiType: row.poi_type,
    poiHasFvg: Boolean(row.poi_has_fvg),
    fvgPosition: row.fvg_position,
    liquiditySweep: Boolean(row.liquidity_sweep),
    bos: Boolean(row.bos),
    choch: Boolean(row.choch),
    mtfStructure: row.mtf_structure,
    ltfEntry: row.ltf_entry,
    keyZone: row.key_zone,
    setupGrade: row.setup_grade,
    setupScore: row.setup_score,
    ruleViolation: row.rule_violation,
    emotionBefore: row.emotion_before,
    emotionAfter: row.emotion_after,
    disciplineScore: row.discipline_score,
    chartHtf: row.chart_htf,
    chartMtf: row.chart_mtf,
    chartLtf: row.chart_ltf,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

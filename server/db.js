import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = process.env.DATABASE_PATH || './data/trading-journal.sqlite';
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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

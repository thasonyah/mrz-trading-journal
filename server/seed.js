import bcrypt from 'bcryptjs';
import { db } from './db.js';
import './migrate.js';

const exists = db.prepare('SELECT id FROM users WHERE username=?').get('demo');
if (exists) {
  console.log('Demo user already exists: demo / demo123');
  process.exit(0);
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

const demoTrades = [
  ['2026-09-21','MNQ1','long','London','08:30','09:05',12,20312.5,20292.5,20372.5,0.25,0.5,3,2.8,7.4,7.4,-0.5,30,3,84,'win','Bullish','OB','OB',1,'Middle of OB',1,1,0,'BOS','OB + FVG','Discount','A+',92,'None','Calm','Confident',95,'','', '', 'High quality discount OB with sweep and clean BOS.'],
  ['2026-09-22','MNQ1','short','NY','21:00','21:18',6,20488,20508,20448,0.25,0.5,2,-1,1.2,1.2,-1,30,3,-30,'loss','Bearish','Supply','OB',0,'',0,0,1,'CHoCH','Breaker','Premium','B',64,'Early Entry','Impatient','Frustrated',55,'','','','Entered before confirmation.'],
  ['2026-09-23','MES1','long','Asia','06:30','07:10',20,5482,5476,5494,0.25,1.25,2,0,3.2,3.2,-0.3,25,3.33,0,'breakeven','Bullish','Demand','FVG',1,'Lower third',1,1,0,'Sweep','FVG','Discount','A',78,'None','Calm','Calm',88,'','','','Moved to BE after first displacement.'],
  ['2026-09-24','NQ1','short','NY','20:30','20:42',4,20680,20700,20620,0.25,5,3,3,12.6,12.6,-0.2,100,1,300,'win','Bearish','Liquidity','OB',1,'Top of OB',1,1,1,'Internal BOS','OB + FVG','Premium','A+',96,'None','Confident','Calm',98,'','','','Best setup of the week.'],
  ['2026-09-25','MNQ1','long','London','09:30','09:50',8,20512,20492,20552,0.25,0.5,2,-1,0.8,0.8,-1,30,3,-30,'loss','Neutral','FVG','FVG',1,'Upper third',0,0,0,'Range','Mitigation','Equilibrium','C',42,'No Confirmation','Greedy','Regretful',44,'','','','Took range entry without HTF bias.'],
  ['2026-09-28','MGC1','long','NY','19:00','19:28',10,3821,3815,3839,0.1,1,3,3,5.4,5.4,-0.6,60,10,180,'win','Bullish','Demand','OB',1,'Lower third',1,1,0,'BOS','OB','Discount','A',84,'None','Calm','Confident',91,'','','','Gold respected demand after liquidity sweep.']
];

const trx = db.transaction(() => {
  const userId = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('demo', bcrypt.hashSync('demo123', 10), 'admin').lastInsertRowid;
  const accountId = db.prepare('INSERT INTO accounts (user_id, name, type, starting_balance, sort_order) VALUES (?, ?, ?, ?, ?)').run(userId, 'Backtest', 'backtest', 50000, 1).lastInsertRowid;
  db.prepare('INSERT INTO accounts (user_id, name, type, starting_balance, sort_order) VALUES (?, ?, ?, ?, ?)').run(userId, 'Forward Test', 'forward', 50000, 2);
  const opt = db.prepare('INSERT INTO option_sets (user_id, field_key, label, options_json) VALUES (?, ?, ?, ?)');
  defaultOptions.forEach(([key, label, options]) => opt.run(userId, key, label, JSON.stringify(options)));
  const asset = db.prepare('INSERT INTO asset_presets (user_id, symbol, tick_size, dollar_per_point, sort_order) VALUES (?, ?, ?, ?, ?)');
  defaultAssets.forEach(([symbol, tickSize, dollarPerPoint], index) => asset.run(userId, symbol, tickSize, dollarPerPoint, index + 1));
  const trade = db.prepare(`
    INSERT INTO trades (
      user_id, account_id, trade_date, asset, direction, session, entry_time, exit_time, order_wait_minutes, entry_price, stop_loss, take_profit,
      tick_size, dollar_per_point, planned_r, actual_r, max_r, mfe_r, mae_r, risk_amount, lot_size, pnl, result, htf_bias, htf_poi, poi_type,
      poi_has_fvg, fvg_position, liquidity_sweep, bos, choch, mtf_structure, ltf_entry, key_zone, setup_grade, setup_score, rule_violation,
      emotion_before, emotion_after, discipline_score, chart_htf, chart_mtf, chart_ltf, notes
    ) VALUES (${Array.from({ length: 44 }, () => '?').join(',')})
  `);
  demoTrades.forEach((t) => trade.run(userId, accountId, ...t));
  db.prepare('INSERT INTO journal_notes (user_id, account_id, title, content) VALUES (?, ?, ?, ?)').run(
    userId,
    accountId,
    'Account Playbook',
    'A+ setup requires HTF bias, POI with FVG, liquidity sweep, BOS/CHoCH confirmation, and clean LTF entry. Avoid trades with no confirmation or neutral HTF bias.'
  );
});

trx();
console.log('Seeded demo user: demo / demo123');

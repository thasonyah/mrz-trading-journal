import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const indexPath = fileURLToPath(new URL('./index.js', import.meta.url));
let source = fs.readFileSync(indexPath, 'utf8');

if (source.includes('SELECT id, symbol, tick_size "tickSize", dollar_per_point "dollarPerPoint", commission_amount "commissionAmount", sort_order "sortOrder" FROM asset_presets')) {
  console.log('Asset commission API patch already applied');
  process.exit(0);
}

const replacements = [
  [
    `  ['NQ1', 0.25, 5],
  ['MNQ1', 0.25, 0.5],
  ['MGC1', 0.1, 1],
  ['GC1', 0.1, 10],
  ['XAUUSD', 0.01, 1],
  ['MES1', 0.25, 1.25],
  ['ES1', 0.25, 12.5],
  ['MYM1', 1, 0.5],
  ['MCL1', 0.01, 1]`,
    `  ['NQ1', 0.25, 5, 0],
  ['MNQ1', 0.25, 0.5, 0],
  ['MGC1', 0.1, 1, 0],
  ['GC1', 0.1, 10, 0],
  ['XAUUSD', 0.01, 1, 0],
  ['MES1', 0.25, 1.25, 0],
  ['ES1', 0.25, 12.5, 0],
  ['MYM1', 1, 0.5, 0],
  ['MCL1', 0.01, 1, 0]`
  ],
  [
    `for (const [index, [symbol, tickSize, dollarPerPoint]] of defaultAssets.entries()) {
      await run('INSERT INTO asset_presets (user_id, symbol, tick_size, dollar_per_point, sort_order) VALUES (?, ?, ?, ?, ?)', [userId, symbol, tickSize, dollarPerPoint, index + 1]);`,
    `for (const [index, [symbol, tickSize, dollarPerPoint, commissionAmount]] of defaultAssets.entries()) {
      await run('INSERT INTO asset_presets (user_id, symbol, tick_size, dollar_per_point, commission_amount, sort_order) VALUES (?, ?, ?, ?, ?, ?)', [userId, symbol, tickSize, dollarPerPoint, commissionAmount, index + 1]);`
  ],
  [
    `SELECT id, symbol, tick_size "tickSize", dollar_per_point "dollarPerPoint", sort_order "sortOrder" FROM asset_presets`,
    `SELECT id, symbol, tick_size "tickSize", dollar_per_point "dollarPerPoint", commission_amount "commissionAmount", sort_order "sortOrder" FROM asset_presets`
  ],
  [
    `const id = await insert('INSERT INTO asset_presets (user_id, symbol, tick_size, dollar_per_point, sort_order) VALUES (?, ?, ?, ?, ?)', [
    userId,
    symbol,
    Number(req.body.tickSize || 1),
    Number(req.body.dollarPerPoint || 1),
    count + 1
  ]);`,
    `const id = await insert('INSERT INTO asset_presets (user_id, symbol, tick_size, dollar_per_point, commission_amount, sort_order) VALUES (?, ?, ?, ?, ?, ?)', [
    userId,
    symbol,
    Number(req.body.tickSize || 1),
    Number(req.body.dollarPerPoint || 1),
    Number(req.body.commissionAmount || 0),
    count + 1
  ]);`
  ],
  [
    `await run('UPDATE asset_presets SET symbol=?, tick_size=?, dollar_per_point=? WHERE id=? AND user_id=?', [
    symbol,
    Number(req.body.tickSize || 1),
    Number(req.body.dollarPerPoint || 1),
    req.params.id,
    userId
  ]);`,
    `await run('UPDATE asset_presets SET symbol=?, tick_size=?, dollar_per_point=?, commission_amount=? WHERE id=? AND user_id=?', [
    symbol,
    Number(req.body.tickSize || 1),
    Number(req.body.dollarPerPoint || 1),
    Number(req.body.commissionAmount || 0),
    req.params.id,
    userId
  ]);`
  ]
];

for (const [from, to] of replacements) {
  if (!source.includes(from)) {
    throw new Error('Asset commission API patch could not find an expected server/index.js segment');
  }
  source = source.replaceAll(from, to);
}

fs.writeFileSync(indexPath, source);
console.log('Applied asset commission API patch');

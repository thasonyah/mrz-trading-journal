import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const indexPath = fileURLToPath(new URL('./index.js', import.meta.url));
let source = fs.readFileSync(indexPath, 'utf8');
let changed = false;

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

if (!source.includes('SELECT id, symbol, tick_size "tickSize", dollar_per_point "dollarPerPoint", commission_amount "commissionAmount", sort_order "sortOrder" FROM asset_presets')) {
  for (const [from, to] of replacements) {
    if (!source.includes(from)) {
      throw new Error('Asset commission API patch could not find an expected server/index.js segment');
    }
    source = source.replaceAll(from, to);
  }
  changed = true;
  console.log('Applied asset commission API patch');
}

if (!source.includes('propFirmPortfolioTemplates')) {
  source = source.replace(
    `import './migrate.js';`,
    `import './migrate.js';\nimport { legacyPortfolioTemplateKeys, propFirmPortfolioTemplates } from '../shared/portfolio-templates.js';`
  );

  source = source.replace(
    /const defaultPortfolioTemplates = \[[\s\S]*?\n\];\n\nasync function ensureAccount/,
    `const defaultPortfolioTemplates = [
  { templateKey: 'custom', label: 'Custom / Manual', values: blankAccountTemplate },
  ...propFirmPortfolioTemplates
];

async function ensureAccount`
  );

  source = source.replace(
    /async function ensurePortfolioTemplates\(\) \{[\s\S]*?\n\}\n\nfunction templateForClient/,
    `async function ensurePortfolioTemplates() {
  for (const key of legacyPortfolioTemplateKeys) {
    await run('DELETE FROM portfolio_templates WHERE template_key=?', [key]);
  }
  for (const [index, template] of defaultPortfolioTemplates.entries()) {
    await run(
      \`INSERT INTO portfolio_templates (template_key, label, values_json, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(template_key) DO UPDATE SET
         label=excluded.label,
         values_json=excluded.values_json,
         sort_order=excluded.sort_order,
         is_active=excluded.is_active,
         updated_at=CURRENT_TIMESTAMP\`,
      [template.templateKey, template.label, JSON.stringify({ ...blankAccountTemplate, ...template.values }), template.sortOrder || index + 1, boolValue(template.isActive !== false)]
    );
  }
}

function templateForClient`
  );
  changed = true;
  console.log('Applied portfolio template library patch');
}

if (changed) {
  fs.writeFileSync(indexPath, source);
} else {
  console.log('Startup API patches already applied');
}

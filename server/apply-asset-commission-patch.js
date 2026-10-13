import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const indexPath = fileURLToPath(new URL('./index.js', import.meta.url));
const appPath = fileURLToPath(new URL('../src/main.jsx', import.meta.url));
const stylesPath = fileURLToPath(new URL('../src/styles.css', import.meta.url));
let source = fs.readFileSync(indexPath, 'utf8');
let appSource = fs.readFileSync(appPath, 'utf8');
let styleSource = fs.readFileSync(stylesPath, 'utf8');
let changed = false;
let appChanged = false;
let styleChanged = false;

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

if (!source.includes("app.post('/api/accounts/:accountId/trades/import'")) {
  const tradeImportApi = `function portableTrade(row) {
  const trade = rowToTrade(row);
  delete trade.id;
  delete trade.accountId;
  delete trade.balanceAfter;
  delete trade.conLoss;
  delete trade.sumConLossAmount;
  delete trade.ddLossPct;
  delete trade.sumDdLossPct;
  return trade;
}

function tradesFromImportBody(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.trades)) return body.trades;
  return null;
}

app.get('/api/accounts/:accountId/trades/export/json', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  const account = await ensureAccount(userId, req.params.accountId);
  const rows = await all('SELECT * FROM trades WHERE user_id=? AND account_id=? ORDER BY trade_date ASC, entry_time ASC, id ASC', [userId, req.params.accountId]);
  const filename = downloadName(\`mrz-trades-\${String(account.name || 'portfolio').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'portfolio'}\`, 'json');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', \`attachment; filename="\${filename}"\`);
  res.json({
    schema: 'mrz-trading-journal-trades',
    version: 1,
    exportedAt: new Date().toISOString(),
    source: { accountId: account.id, accountName: account.name, userId },
    trades: rows.map(portableTrade)
  });
}));

app.post('/api/accounts/:accountId/trades/import', auth, asyncHandler(async (req, res) => {
  const userId = scopeUserId(req);
  await ensureAccount(userId, req.params.accountId);
  const incoming = tradesFromImportBody(req.body);
  const mode = req.body?.mode === 'replace' ? 'replace' : 'append';
  if (!incoming) return res.status(400).json({ error: 'Import file must contain a trades array' });
  if (!incoming.length) return res.status(400).json({ error: 'No trades to import' });
  if (incoming.length > 5000) return res.status(400).json({ error: 'Import limit is 5,000 trades per file' });
  const errors = [];
  const normalized = incoming.map((trade, index) => {
    const t = normalizeTrade(trade);
    const error = validateTrade(t);
    if (error) errors.push({ row: index + 1, error });
    return t;
  });
  if (errors.length) return res.status(400).json({ error: 'Import validation failed', errors: errors.slice(0, 20) });
  const insertedRows = await transaction(async (dbx) => {
    if (mode === 'replace') {
      await dbx.run('DELETE FROM trades WHERE user_id=? AND account_id=?', [userId, req.params.accountId]);
    }
    const rows = [];
    for (const t of normalized) {
      const cols = ['user_id', 'account_id', ...tradeColumns];
      const values = [userId, req.params.accountId, ...tradeColumns.map((c) => t[c])];
      const placeholders = cols.map(() => '?').join(',');
      const id = await dbx.insert(\`INSERT INTO trades (\${cols.join(',')}) VALUES (\${placeholders})\`, values);
      rows.push(await dbx.get('SELECT * FROM trades WHERE id=?', [id]));
    }
    return rows;
  });
  res.json({ ok: true, imported: insertedRows.length, mode, trades: insertedRows.map(rowToTrade) });
}));

`;
  const marker = "app.post('/api/accounts/:accountId/trades', auth, asyncHandler(async (req, res) => {";
  if (!source.includes(marker)) throw new Error('Trade import/export API patch could not find the trade create route');
  source = source.replace(marker, `${tradeImportApi}${marker}`);
  changed = true;
  console.log('Applied trade import/export API patch');
}

if (changed) {
  fs.writeFileSync(indexPath, source);
} else {
  console.log('Startup API patches already applied');
}

const appReplacements = [
  [
    `const profileContactLabels = { phone: 'Phone', email: 'E-mail', facebook: 'Facebook', line: 'Line' };`,
    `const profileContactLabels = { phone: 'Phone', email: 'E-mail', facebook: 'Facebook', line: 'ข้อความสถานะ' };`
  ],
  [
    `<Field label="Line"><input value={profile.line || ''} onChange={(e) => setProfile({ ...profile, line: e.target.value })} placeholder="Line ID" /></Field>`,
    `<Field label="ข้อความสถานะ"><input value={profile.line || ''} onChange={(e) => setProfile({ ...profile, line: e.target.value })} placeholder="ข้อความสถานะ" /></Field>`
  ]
];

for (const [from, to] of appReplacements) {
  if (appSource.includes(from)) {
    appSource = appSource.replaceAll(from, to);
    appChanged = true;
  } else if (!appSource.includes(to)) {
    throw new Error('Profile status label patch could not find an expected src/main.jsx segment');
  }
}

if (!appSource.includes('function tradeExportPayload(trades, account)')) {
  const marker = `function profileContact(profile = {}, fallbackEmail = '') {
  const type = profile.contactType || 'email';
  return profile[type] || (type === 'email' ? fallbackEmail : '') || profile.email || fallbackEmail || '';
}

`;
  const helpers = `function profileContact(profile = {}, fallbackEmail = '') {
  const type = profile.contactType || 'email';
  return profile[type] || (type === 'email' ? fallbackEmail : '') || profile.email || fallbackEmail || '';
}

function safeFilePart(value = 'portfolio') {
  return String(value || 'portfolio').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'portfolio';
}

function portableTrades(trades = []) {
  return trades.map(({ id, accountId, balanceAfter, conLoss, sumConLossAmount, ddLossPct, sumDdLossPct, ...trade }) => trade);
}

function tradeExportPayload(trades, account) {
  return {
    schema: 'mrz-trading-journal-trades',
    version: 1,
    exportedAt: new Date().toISOString(),
    source: { accountId: account?.id, accountName: account?.name || 'Portfolio' },
    trades: portableTrades(trades)
  };
}

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

`;
  if (!appSource.includes(marker)) throw new Error('Trade transfer UI patch could not find profileContact helper');
  appSource = appSource.replace(marker, helpers);
  appChanged = true;
}

if (!appSource.includes('trades={trades} portfolioLimit')) {
  const from = `{page === 'settings' && <SettingsPage api={scopedApi} accounts={accounts} account={account} options={options} assets={assets} portfolioLimit={portfolioLimit} portfolioTemplates={portfolioTemplates} user={currentUser} setCurrentUser={setCurrentUser} reload={loadAll} setToast={setToast} />}`;
  const to = `{page === 'settings' && <SettingsPage api={scopedApi} accounts={accounts} account={account} options={options} assets={assets} trades={trades} portfolioLimit={portfolioLimit} portfolioTemplates={portfolioTemplates} user={currentUser} setCurrentUser={setCurrentUser} reload={loadAll} setToast={setToast} />}`;
  if (!appSource.includes(from)) throw new Error('Trade transfer UI patch could not find SettingsPage mount');
  appSource = appSource.replace(from, to);
  appChanged = true;
}

if (appSource.includes("function SettingsPage({ api, accounts, account, options, assets, portfolioLimit")) {
  appSource = appSource.replace(
    `function SettingsPage({ api, accounts, account, options, assets, portfolioLimit, portfolioTemplates, user, setCurrentUser, reload, setToast }) {`,
    `function SettingsPage({ api, accounts, account, options, assets, trades = [], portfolioLimit, portfolioTemplates, user, setCurrentUser, reload, setToast }) {`
  );
  appChanged = true;
}

if (!appSource.includes('const [transferTargetId, setTransferTargetId]')) {
  const from = `  const [profile, setProfile] = useState(user?.profile || {});
  useEffect(() => setAccountDraft(accountDraftFrom(account)), [account?.id]);`;
  const to = `  const [profile, setProfile] = useState(user?.profile || {});
  const [transferTargetId, setTransferTargetId] = useState(account?.id || '');
  const [transferMode, setTransferMode] = useState('append');
  const [transferBusy, setTransferBusy] = useState(false);
  useEffect(() => setAccountDraft(accountDraftFrom(account)), [account?.id]);`;
  if (!appSource.includes(from)) throw new Error('Trade transfer UI patch could not find SettingsPage state block');
  appSource = appSource.replace(from, to);
  appChanged = true;
}

if (!appSource.includes('useEffect(() => setTransferTargetId(account?.id || \'\'), [account?.id]);')) {
  const from = `  useEffect(() => setProfile(user?.profile || {}), [user?.id, user?.profile]);`;
  const to = `  useEffect(() => setProfile(user?.profile || {}), [user?.id, user?.profile]);
  useEffect(() => setTransferTargetId(account?.id || ''), [account?.id]);`;
  if (!appSource.includes(from)) throw new Error('Trade transfer UI patch could not find SettingsPage profile effect');
  appSource = appSource.replace(from, to);
  appChanged = true;
}

if (appSource.includes(`  function exportJson() {
    const blob = new Blob([JSON.stringify(trades, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = \`mrz-trading-journal-\${today()}.json\`;
    a.click();
  }`)) {
  appSource = appSource.replace(
    `  function exportJson() {
    const blob = new Blob([JSON.stringify(trades, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = \`mrz-trading-journal-\${today()}.json\`;
    a.click();
  }`,
    `  function exportJson() {
    downloadJson(tradeExportPayload(trades, account), \`mrz-trades-\${safeFilePart(account?.name)}-\${today()}.json\`);
  }`
  );
  appChanged = true;
}

if (!appSource.includes('function exportCurrentPortfolio()')) {
  const from = `  function togglePassword(key) {
    setVisiblePasswords({ ...visiblePasswords, [key]: !visiblePasswords[key] });
  }
  return <section>`;
  const to = `  function togglePassword(key) {
    setVisiblePasswords({ ...visiblePasswords, [key]: !visiblePasswords[key] });
  }
  function exportCurrentPortfolio() {
    downloadJson(tradeExportPayload(trades, account), \`mrz-trades-\${safeFilePart(account?.name)}-\${today()}.json\`);
    setToast('Trade export downloaded');
  }
  async function importTradesPayload(payload, targetId = transferTargetId) {
    const target = targetId || account?.id;
    if (!target) return;
    const body = Array.isArray(payload) ? { trades: payload } : { ...(payload || {}) };
    if (!Array.isArray(body.trades)) {
      setToast('Import file must contain trades');
      return;
    }
    if (transferMode === 'replace' && !confirm('Replace all trades in the target portfolio before import?')) return;
    setTransferBusy(true);
    try {
      const data = await api(\`/accounts/\${target}/trades/import\`, { method: 'POST', body: JSON.stringify({ ...body, mode: transferMode }) });
      await reload(target);
      setToast(\`Imported \${data.imported || 0} trades\`);
    } catch (error) {
      setToast(error.message || 'Import failed');
    } finally {
      setTransferBusy(false);
    }
  }
  async function copyToPortfolio() {
    if (!trades.length) {
      setToast('No trades to copy');
      return;
    }
    if (String(transferTargetId) === String(account?.id) && transferMode === 'append' && !confirm('Copying into the same portfolio will duplicate these trades. Continue?')) return;
    await importTradesPayload(tradeExportPayload(trades, account), transferTargetId);
  }
  async function importTradeFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importTradesPayload(JSON.parse(text), transferTargetId);
    } catch (error) {
      setToast(error.message || 'Could not read import file');
    } finally {
      event.target.value = '';
    }
  }
  return <section>`;
  if (!appSource.includes(from)) throw new Error('Trade transfer UI patch could not find SettingsPage return marker');
  appSource = appSource.replace(from, to);
  appChanged = true;
}

if (!appSource.includes('Trade Data Transfer')) {
  const from = `</div><div className="portfolio-list">{accounts.map((row) => <button key={row.id} className={row.id === account?.id ? 'selected' : ''}>{row.name}</button>)}</div></Panel>
    <Panel title="Security">`;
  const to = `</div><div className="portfolio-list">{accounts.map((row) => <button key={row.id} className={row.id === account?.id ? 'selected' : ''}>{row.name}</button>)}</div></Panel>
    <Panel title="Trade Data Transfer"><div className="transfer-panel"><div className="transfer-summary"><span>Current portfolio</span><b>{account?.name || 'Portfolio'}</b><small>{trades.length} trades ready to export or copy</small></div><div className="form-grid compact"><Field label="Target portfolio"><select value={transferTargetId} onChange={(e) => setTransferTargetId(e.target.value)}>{accounts.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field><Field label="Import mode"><select value={transferMode} onChange={(e) => setTransferMode(e.target.value)}><option value="append">Append to target</option><option value="replace">Replace target trades</option></select></Field></div><div className="actions transfer-actions"><button onClick={exportCurrentPortfolio} disabled={transferBusy}><Download size={16} />Export current JSON</button><button className="primary" onClick={copyToPortfolio} disabled={transferBusy || !trades.length}><Upload size={16} />Copy current to target</button><label className={\`file-button \${transferBusy ? 'disabled' : ''}\`}><Upload size={16} />Import JSON<input type="file" accept="application/json,.json" disabled={transferBusy} onChange={importTradeFile} /></label></div><p className="transfer-note">Export removes portfolio IDs and account-specific streak values. Import can append into another portfolio or replace the target before importing.</p></div></Panel>
    <Panel title="Security">`;
  if (!appSource.includes(from)) throw new Error('Trade transfer UI patch could not find Portfolio Management closing panel');
  appSource = appSource.replace(from, to);
  appChanged = true;
}

if (!styleSource.includes('.transfer-panel')) {
  styleSource += `

.transfer-panel {
  display: grid;
  gap: 14px;
}

.transfer-summary {
  display: grid;
  gap: 4px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.025);
}

.transfer-summary span,
.transfer-summary small,
.transfer-note {
  color: var(--muted);
}

.transfer-summary b {
  font-size: 18px;
}

.transfer-actions {
  align-items: stretch;
}

.file-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  background: #101116;
  cursor: pointer;
  font-weight: 700;
}

.file-button input {
  display: none;
}

.file-button.disabled {
  opacity: .55;
  cursor: not-allowed;
}

.transfer-note {
  margin: 0;
  line-height: 1.5;
}
`;
  styleChanged = true;
}

if (appChanged) {
  fs.writeFileSync(appPath, appSource);
  console.log('Applied profile status label patch');
} else {
  console.log('Profile status label patch already applied');
}

if (styleChanged) {
  fs.writeFileSync(stylesPath, styleSource);
  console.log('Applied trade transfer style patch');
} else {
  console.log('Trade transfer styles already applied');
}

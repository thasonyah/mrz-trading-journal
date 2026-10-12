const API = import.meta.env.VITE_API_BASE
  || (location.hostname === '127.0.0.1' && location.port === '5173' ? 'http://127.0.0.1:5174/api' : '/api');

const state = {
  assets: [],
  loadedAt: 0,
  loadPromise: null,
  scheduled: 0,
  viewKey: '',
  settingsSignature: '',
  tradeSyncedKey: ''
};

function token() {
  return localStorage.getItem('etj_token') || '';
}

async function loadAssets(force = false) {
  if (!force && state.assets.length && Date.now() - state.loadedAt < 15000) return state.assets;
  if (!force && state.loadPromise) return state.loadPromise;
  const auth = token();
  if (!auth) return [];
  state.loadPromise = (async () => {
    const response = await fetch(`${API}/assets`, { headers: { Authorization: `Bearer ${auth}` } });
    if (!response.ok) return state.assets;
    const data = await response.json();
    state.assets = data.assets || [];
    state.loadedAt = Date.now();
    return state.assets;
  })().catch(() => {
    return state.assets;
  }).finally(() => {
    state.loadPromise = null;
  });
  return state.loadPromise;
}

function setNativeValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function labeledControl(labelText) {
  const workspace = document.querySelector('.workspace') || document;
  const labels = [...workspace.querySelectorAll('label.field')];
  const label = labels.find((node) => node.querySelector(':scope > span')?.textContent?.trim() === labelText);
  return label?.querySelector('input, select, textarea') || null;
}

function currentAsset() {
  const assetSelect = labeledControl('Asset');
  return state.assets.find((asset) => asset.symbol === assetSelect?.value);
}

function resultValue() {
  return labeledControl('Result')?.value || '';
}

function syncTradeCommission() {
  const commissionInput = labeledControl('Commission');
  const asset = currentAsset();
  if (!commissionInput || !asset) return;
  const hint = commissionInput.parentElement?.querySelector('.field-hint');
  if (resultValue() === 'miss') {
    if (hint) hint.textContent = 'Miss trade: commission is 0';
    return;
  }
  const amount = Number(asset.commissionAmount || 0);
  if (amount > 0 && Number(commissionInput.value || 0) !== amount) {
    setNativeValue(commissionInput, String(asset.commissionAmount));
  }
  if (hint && amount > 0) hint.textContent = `Auto from ${asset.symbol}: $${amount.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}

function enhanceTradeForm() {
  if (!document.querySelector('.workspace h1')?.textContent?.includes('Add Trade')) return;
  const key = `${labeledControl('Asset')?.value || ''}|${resultValue()}`;
  if (state.tradeSyncedKey === key) return;
  state.tradeSyncedKey = key;
  loadAssets().then(syncTradeCommission);
}

function assetRows() {
  const panel = [...document.querySelectorAll('.panel')].find((node) => node.querySelector('.panel-title')?.textContent?.trim() === 'Asset Presets');
  return [...(panel?.querySelectorAll('.asset-row') || [])].filter((row) => row.querySelector('input'));
}

function commissionInputForRow(row, asset) {
  let input = row.querySelector('input[data-asset-commission]');
  if (input) return input;
  input = document.createElement('input');
  input.type = 'number';
  input.step = 'any';
  input.placeholder = 'Commission';
  input.dataset.assetCommission = 'true';
  input.value = asset?.commissionAmount ?? 0;
  row.style.gridTemplateColumns = '1.15fr .72fr .8fr .88fr 38px 38px';
  row.insertBefore(input, row.querySelector('button'));
  return input;
}

function enhanceAssetPresets() {
  const rows = assetRows();
  if (!rows.length) return;
  const signature = rows.map((row) => row.querySelector('input')?.value || '').join('|');
  const needsInputs = rows.some((row) => !row.querySelector('input[data-asset-commission]'));
  if (!needsInputs && state.settingsSignature === signature) return;
  state.settingsSignature = signature;
  loadAssets().then((assets) => {
    rows.forEach((row) => {
      const symbol = row.querySelector('input')?.value;
      const asset = assets.find((item) => item.symbol === symbol);
      commissionInputForRow(row, asset);
    });
  });
}

const originalFetch = window.fetch.bind(window);
window.fetch = async (resource, options = {}) => {
  const url = typeof resource === 'string' ? resource : resource?.url || '';
  const method = String(options.method || 'GET').toUpperCase();
  if (/\/api\/assets(\/\d+)?(\?|$)/.test(url) && ['POST', 'PUT'].includes(method) && options.body) {
    try {
      const body = JSON.parse(options.body);
      const rows = assetRows();
      const row = rows.find((item) => item.querySelector('input')?.value?.trim().toUpperCase() === String(body.symbol || '').trim().toUpperCase());
      const commissionInput = row?.querySelector('input[data-asset-commission]');
      body.commissionAmount = commissionInput ? Number(commissionInput.value || 0) : Number(body.commissionAmount || 0);
      options = { ...options, body: JSON.stringify(body) };
    } catch {
      // Preserve the app's original request if the body is not JSON.
    }
  }
  const response = await originalFetch(resource, options);
  if (/\/api\/assets(\/\d+)?(\?|$)/.test(url) && ['POST', 'PUT', 'DELETE'].includes(method)) {
    setTimeout(() => loadAssets(true).then(() => {
      state.settingsSignature = '';
      state.tradeSyncedKey = '';
      enhanceAssetPresets();
      syncTradeCommission();
    }), 350);
  }
  return response;
};

document.addEventListener('change', (event) => {
  const isTradeControl = event.target === labeledControl('Asset') || event.target === labeledControl('Result');
  if (isTradeControl) {
    state.tradeSyncedKey = '';
    loadAssets().then(syncTradeCommission);
  }
});

function enhanceCurrentView() {
  const heading = document.querySelector('.workspace h1')?.textContent?.trim() || '';
  const viewKey = `${heading}|${document.querySelectorAll('.asset-row').length}`;
  if (state.viewKey === viewKey && heading !== 'Settings') return;
  state.viewKey = viewKey;
  enhanceAssetPresets();
  enhanceTradeForm();
}

function scheduleEnhance() {
  window.clearTimeout(state.scheduled);
  state.scheduled = window.setTimeout(enhanceCurrentView, 180);
}

const observer = new MutationObserver(() => {
  scheduleEnhance();
});

observer.observe(document.body, { childList: true, subtree: true });
window.addEventListener('load', scheduleEnhance);
scheduleEnhance();

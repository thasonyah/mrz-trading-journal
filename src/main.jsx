import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  BarChart3, BookOpen, CalendarDays, Download, FileText, Filter, Gauge, History,
  LayoutDashboard, LogOut, Plus, Save, Settings, Shield, SlidersHorizontal, Trash2, Upload, UserRound
} from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_BASE
  || (location.hostname === '127.0.0.1' && location.port === '5173' ? 'http://127.0.0.1:5174/api' : '/api');
const money = (n) => Number.isFinite(Number(n)) ? `${Number(n) < 0 ? '-' : ''}$${Math.abs(Number(n)).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}` : '-';
const pct = (n) => `${(Number(n) || 0).toFixed(1)}%`;
const fmtR = (n) => Number.isFinite(Number(n)) ? `${Number(n).toFixed(2)}R` : '-';
const today = () => new Date().toISOString().slice(0, 10);

const assetPresets = {
  MNQ1: { tickSize: 0.25, dollarPerPoint: 0.5 },
  MES1: { tickSize: 0.25, dollarPerPoint: 1.25 },
  MYM1: { tickSize: 1, dollarPerPoint: 0.5 },
  NQ1: { tickSize: 0.25, dollarPerPoint: 5 },
  ES1: { tickSize: 0.25, dollarPerPoint: 12.5 },
  MGC1: { tickSize: 0.1, dollarPerPoint: 1 },
  MCL1: { tickSize: 0.01, dollarPerPoint: 1 },
  Custom: { tickSize: 1, dollarPerPoint: 1 }
};

const defaultOptions = {
  htfBias: ['Bullish', 'Bearish', 'Neutral'],
  htfPoi: ['OB', 'FVG', 'Supply', 'Demand', 'Liquidity', 'Premium', 'Discount'],
  mtfStructure: ['BOS', 'CHoCH', 'Sweep', 'Internal BOS', 'Range'],
  ltfEntry: ['OB', 'FVG', 'OB + FVG', 'Breaker', 'Mitigation'],
  keyZone: ['Premium', 'Discount', 'Equilibrium', 'Asia High/Low', 'London Open', 'NY AM'],
  ruleViolation: ['None', 'Early Entry', 'Late Entry', 'No Confirmation', 'Oversized Lot', 'Revenge Trade', 'Chased Price'],
  emotion: ['Calm', 'Confident', 'Anxious', 'Frustrated', 'Greedy', 'Impatient', 'Regretful']
};

const blankTrade = {
  date: today(), asset: 'MNQ1', direction: 'long', session: 'NY', entryTime: '20:30', exitTime: '',
  orderWaitMinutes: '', entryPrice: '', stopLoss: '', takeProfit: '', tickSize: 0.25, dollarPerPoint: 0.5,
  riskAmount: 30, result: 'win', htfBias: 'Bullish', htfPoi: 'OB', poiType: 'OB', poiHasFvg: true,
  fvgPosition: 'Middle of OB', liquiditySweep: true, bos: true, choch: false, mtfStructure: 'BOS',
  ltfEntry: 'OB + FVG', keyZone: 'Discount', setupGrade: 'A', setupScore: 80, maxR: '', mfeR: '', maeR: '',
  ruleViolation: 'None', emotionBefore: 'Calm', emotionAfter: 'Confident', disciplineScore: 90,
  chartHtf: '', chartMtf: '', chartLtf: '', notes: ''
};

function useApi(token) {
  return useMemo(() => async (path, options = {}) => {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }, [token]);
}

function enrichTrade(input) {
  const t = { ...input };
  const entry = Number(t.entryPrice);
  const stop = Number(t.stopLoss);
  const take = Number(t.takeProfit);
  const risk = Number(t.riskAmount) || 0;
  const dpp = Number(t.dollarPerPoint) || 1;
  const riskPoints = Math.abs(entry - stop);
  const rewardPoints = Math.abs(take - entry);
  const plannedR = riskPoints > 0 ? rewardPoints / riskPoints : 0;
  const lotSize = riskPoints > 0 ? risk / (riskPoints * dpp) : 0;
  const resultR = t.result === 'win' ? plannedR : t.result === 'loss' || t.result === 'reversed' ? -1 : 0;
  const pnl = t.result === 'win' ? risk * plannedR : (t.result === 'loss' || t.result === 'reversed') ? -risk : 0;
  return {
    ...t,
    entryPrice: entry || null,
    stopLoss: stop || null,
    takeProfit: take || null,
    riskAmount: risk,
    plannedR,
    actualR: resultR,
    lotSize,
    pnl,
    maxR: t.maxR === '' ? plannedR : Number(t.maxR),
    mfeR: t.mfeR === '' ? Number(t.maxR || plannedR || 0) : Number(t.mfeR),
    maeR: t.maeR === '' ? 0 : Number(t.maeR),
    orderWaitMinutes: t.orderWaitMinutes === '' ? null : Number(t.orderWaitMinutes),
    setupScore: Number(t.setupScore) || 0,
    disciplineScore: t.disciplineScore === '' ? null : Number(t.disciplineScore)
  };
}

function computeStats(trades, startingBalance = 50000) {
  const wins = trades.filter((t) => t.result === 'win');
  const losses = trades.filter((t) => t.result === 'loss' || t.result === 'reversed');
  const decided = wins.length + losses.length;
  const net = trades.reduce((s, t) => s + Number(t.pnl || 0), 0);
  const grossProfit = trades.reduce((s, t) => t.pnl > 0 ? s + t.pnl : s, 0);
  const grossLoss = Math.abs(trades.reduce((s, t) => t.pnl < 0 ? s + t.pnl : s, 0));
  const winRate = decided ? wins.length / decided : 0;
  const avgWinR = wins.length ? wins.reduce((s, t) => s + Number(t.actualR || t.plannedR || 0), 0) / wins.length : 0;
  const expectancy = decided ? (winRate * avgWinR) - ((1 - winRate) * 1) : 0;
  let equity = startingBalance, peak = startingBalance, maxDrawdown = 0;
  [...trades].sort((a, b) => `${a.date}${a.entryTime || ''}`.localeCompare(`${b.date}${b.entryTime || ''}`)).forEach((t) => {
    equity += Number(t.pnl || 0);
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak - equity);
  });
  const rrRows = [1, 1.5, 2, 3, 4, 5, 7, 10, 15, 20].map((level) => {
    const qualified = wins.filter((t) => Number(t.maxR || 0) >= level);
    return { level, count: qualified.length, winRate: decided ? qualified.length / decided : 0, value: qualified.reduce((s, t) => s + Number(t.riskAmount || 0) * level, 0) };
  });
  return {
    total: trades.length,
    wins: wins.length,
    losses: losses.length,
    net,
    winRate,
    profitFactor: grossLoss ? grossProfit / grossLoss : grossProfit ? Infinity : 0,
    expectancy,
    avgMaxR: wins.length ? wins.reduce((s, t) => s + Number(t.maxR || 0), 0) / wins.length : 0,
    maxDrawdown,
    rrRows,
    bestRr: rrRows.reduce((best, row) => row.value * row.winRate > best.value * best.winRate ? row : best, rrRows[0])
  };
}

function groupBy(trades, key) {
  const map = new Map();
  trades.forEach((t) => {
    const value = key === 'day' ? new Date(`${t.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' }) : (t[key] || 'Unspecified');
    const current = map.get(value) || { name: value, wins: 0, losses: 0, pnl: 0, trades: 0 };
    current.trades += 1;
    current.pnl += Number(t.pnl || 0);
    if (t.result === 'win') current.wins += 1;
    if (t.result === 'loss' || t.result === 'reversed') current.losses += 1;
    map.set(value, current);
  });
  return [...map.values()].sort((a, b) => b.pnl - a.pnl);
}

function AuthScreen({ setSession }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API}/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Auth failed');
      localStorage.setItem('etj_token', data.token);
      setSession(data);
    } catch (err) {
      setError(err.message);
    }
  }
  return <main className="auth-shell">
    <form className="auth-card" onSubmit={submit}>
      <div className="mark">ZTJ</div>
      <h1>Mr.Z Trading Journal</h1>
      <p>Log the setup, not just the result. Demo login: <b>demo</b> / <b>demo123</b></p>
      <div className="segmented">
        <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
        <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Sign up</button>
      </div>
      <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} /></label>
      <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {error && <div className="error">{error}</div>}
      <button className="primary" type="submit">{mode === 'login' ? 'Login' : 'Create Account'}</button>
    </form>
  </main>;
}

function App() {
  const [session, setSession] = useState(() => localStorage.getItem('etj_token') ? { token: localStorage.getItem('etj_token') } : null);
  const api = useApi(session?.token);
  const [page, setPage] = useState('dashboard');
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState(null);
  const [trades, setTrades] = useState([]);
  const [options, setOptions] = useState(defaultOptions);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');

  async function loadAll(nextAccountId = accountId) {
    const [a, o] = await Promise.all([api('/accounts'), api('/options')]);
    setAccounts(a.accounts);
    const active = nextAccountId || a.accounts[0]?.id;
    setAccountId(active);
    setOptions({ ...defaultOptions, ...Object.fromEntries(o.options.map((x) => [x.fieldKey, x.options])) });
    if (active) {
      const data = await api(`/accounts/${active}/trades`);
      setTrades(data.trades);
    }
  }
  useEffect(() => { if (session?.token) loadAll().catch(() => setSession(null)); }, [session?.token]);
  useEffect(() => { if (toast) { const id = setTimeout(() => setToast(''), 2200); return () => clearTimeout(id); } }, [toast]);

  if (!session?.token) return <AuthScreen setSession={setSession} />;
  const account = accounts.find((a) => a.id === Number(accountId)) || accounts[0];
  const stats = computeStats(trades, account?.startingBalance || 50000);
  const nav = [
    ['dashboard', LayoutDashboard, 'Dashboard'],
    ['log', Plus, editing ? 'Edit Trade' : 'Add Trade'],
    ['history', History, 'History'],
    ['calendar', CalendarDays, 'Calendar'],
    ['analytics', BarChart3, 'Analytics'],
    ['journal', BookOpen, 'Playbook'],
    ['settings', Settings, 'Settings'],
    ['coach', Shield, 'Coach']
  ];
  function logout() {
    localStorage.removeItem('etj_token');
    setSession(null);
  }
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="mark small">ZTJ</div><div><b>Mr.Z Trading Journal</b><span>POI to outcome</span></div></div>
      <label className="mini-label">Account</label>
      <select value={accountId || ''} onChange={async (e) => { setAccountId(e.target.value); const data = await api(`/accounts/${e.target.value}/trades`); setTrades(data.trades); }}>
        {accounts.map((a) => <option value={a.id} key={a.id}>{a.name}</option>)}
      </select>
      <nav>{nav.map(([id, Icon, label]) => <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}><Icon size={17} />{label}</button>)}</nav>
      <div className="sidebar-foot">
        <span>{trades.length} trades logged</span>
        <button onClick={logout}><LogOut size={15} />Logout</button>
      </div>
    </aside>
    <main className="workspace">
      {page === 'dashboard' && <Dashboard trades={trades} stats={stats} account={account} setPage={setPage} />}
      {page === 'log' && <TradeForm api={api} accountId={accountId} options={options} editing={editing} setEditing={setEditing} reload={loadAll} setToast={setToast} />}
      {page === 'history' && <HistoryPage api={api} accountId={accountId} trades={trades} setTrades={setTrades} setEditing={(t) => { setEditing(t); setPage('log'); }} setToast={setToast} />}
      {page === 'calendar' && <CalendarPage trades={trades} />}
      {page === 'analytics' && <AnalyticsPage trades={trades} stats={stats} />}
      {page === 'journal' && <JournalPage api={api} accountId={accountId} />}
      {page === 'settings' && <SettingsPage api={api} accounts={accounts} account={account} options={options} reload={loadAll} setToast={setToast} />}
      {page === 'coach' && <CoachPage api={api} />}
    </main>
    {toast && <div className="toast">{toast}</div>}
  </div>;
}

function Dashboard({ trades, stats, account, setPage }) {
  const daily = useMemo(() => {
    const map = new Map();
    [...trades].sort((a, b) => a.date.localeCompare(b.date)).forEach((t) => map.set(t.date, (map.get(t.date) || 0) + Number(t.pnl || 0)));
    let cum = 0;
    return [...map.entries()].map(([date, pnl]) => ({ date: date.slice(5), pnl, equity: (cum += pnl) }));
  }, [trades]);
  return <section>
    <Header title="Dashboard" hint={`${account?.name || 'Account'} performance overview`} action={<button className="primary" onClick={() => setPage('log')}><Plus size={16} />Log trade</button>} />
    <div className="kpi-grid">
      <Kpi label="Net P&L" value={money(stats.net)} tone={stats.net >= 0 ? 'good' : 'bad'} />
      <Kpi label="Win Rate" value={pct(stats.winRate * 100)} />
      <Kpi label="Profit Factor" value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)} />
      <Kpi label="Expectancy" value={fmtR(stats.expectancy)} tone={stats.expectancy >= 0 ? 'good' : 'bad'} />
      <Kpi label="Max Drawdown" value={money(-stats.maxDrawdown)} tone="bad" />
      <Kpi label="Avg Max RR" value={fmtR(stats.avgMaxR)} />
    </div>
    <div className="grid two">
      <Panel title="Equity Curve">
        <ChartWrap empty={!daily.length}><AreaChart data={daily}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip formatter={(v) => money(v)} /><Area type="monotone" dataKey="equity" stroke="#1f7a8c" fill="#1f7a8c33" /></AreaChart></ChartWrap>
      </Panel>
      <Panel title="Setup Quality Mix">
        <ChartWrap empty={!trades.length}><PieChart><Pie data={groupBy(trades, 'setupGrade')} dataKey="trades" nameKey="name" outerRadius={92}>{groupBy(trades, 'setupGrade').map((_, i) => <Cell key={i} fill={['#1f7a8c','#bf9b30','#5a6578','#a24936','#6a7f4e'][i % 5]} />)}</Pie><Tooltip /></PieChart></ChartWrap>
      </Panel>
    </div>
  </section>;
}

function TradeForm({ api, accountId, options, editing, setEditing, reload, setToast }) {
  const [form, setForm] = useState(editing || blankTrade);
  useEffect(() => setForm(editing || blankTrade), [editing]);
  const calc = enrichTrade(form);
  function set(key, value) {
    let next = { ...form, [key]: value };
    if (key === 'asset' && assetPresets[value]) next = { ...next, ...assetPresets[value] };
    setForm(next);
  }
  async function save(e) {
    e.preventDefault();
    const payload = enrichTrade(form);
    if (editing) await api(`/accounts/${accountId}/trades/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await api(`/accounts/${accountId}/trades`, { method: 'POST', body: JSON.stringify(payload) });
    setEditing(null);
    setForm(blankTrade);
    await reload(accountId);
    setToast(editing ? 'Trade updated' : 'Trade saved');
  }
  return <section>
    <Header title={editing ? 'Edit Trade' : 'Add Trade'} hint="Capture structure, execution, psychology, and result in one pass" />
    <form className="trade-layout" onSubmit={save}>
      <Panel title="Risk Engine">
        <div className="form-grid compact">
          <Field label="Asset"><select value={form.asset} onChange={(e) => set('asset', e.target.value)}>{Object.keys(assetPresets).map((a) => <option key={a}>{a}</option>)}</select></Field>
          <Field label="Risk $"><input type="number" value={form.riskAmount} onChange={(e) => set('riskAmount', e.target.value)} /></Field>
          <Field label="Entry"><input type="number" step="any" value={form.entryPrice} onChange={(e) => set('entryPrice', e.target.value)} /></Field>
          <Field label="Stop"><input type="number" step="any" value={form.stopLoss} onChange={(e) => set('stopLoss', e.target.value)} /></Field>
          <Field label="Target"><input type="number" step="any" value={form.takeProfit} onChange={(e) => set('takeProfit', e.target.value)} /></Field>
          <Field label="$ / point"><input type="number" step="any" value={form.dollarPerPoint} onChange={(e) => set('dollarPerPoint', e.target.value)} /></Field>
        </div>
        <div className="risk-strip">
          <Kpi label="Planned RR" value={fmtR(calc.plannedR)} />
          <Kpi label="Suggested lot" value={Number(calc.lotSize || 0).toFixed(2)} />
          <Kpi label="Projected P&L" value={money(calc.pnl)} tone={calc.pnl >= 0 ? 'good' : 'bad'} />
        </div>
      </Panel>
      <Panel title="Trade Information">
        <div className="form-grid">
          <Field label="Date"><input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required /></Field>
          <Field label="Session"><select value={form.session} onChange={(e) => set('session', e.target.value)}><option>Asia</option><option>London</option><option>NY</option></select></Field>
          <Field label="Entry time"><input type="time" value={form.entryTime || ''} onChange={(e) => set('entryTime', e.target.value)} /></Field>
          <Field label="Exit time"><input type="time" value={form.exitTime || ''} onChange={(e) => set('exitTime', e.target.value)} /></Field>
          <Field label="Direction"><select value={form.direction} onChange={(e) => set('direction', e.target.value)}><option value="long">Long</option><option value="short">Short</option></select></Field>
          <Field label="Result"><select value={form.result} onChange={(e) => set('result', e.target.value)}><option value="win">Win</option><option value="loss">Loss</option><option value="breakeven">Breakeven</option><option value="miss">Miss</option><option value="reversed">Reversed</option></select></Field>
        </div>
      </Panel>
      <Panel title="POI and Structure">
        <div className="form-grid">
          <Field label="HTF Bias"><Select options={options.htfBias} value={form.htfBias} onChange={(v) => set('htfBias', v)} /></Field>
          <Field label="HTF POI"><Select options={options.htfPoi} value={form.htfPoi} onChange={(v) => set('htfPoi', v)} /></Field>
          <Field label="MTF Structure"><Select options={options.mtfStructure} value={form.mtfStructure} onChange={(v) => set('mtfStructure', v)} /></Field>
          <Field label="LTF Entry"><Select options={options.ltfEntry} value={form.ltfEntry} onChange={(v) => set('ltfEntry', v)} /></Field>
          <Field label="Key Zone"><Select options={options.keyZone} value={form.keyZone} onChange={(v) => set('keyZone', v)} /></Field>
          <Field label="FVG Position"><input value={form.fvgPosition || ''} onChange={(e) => set('fvgPosition', e.target.value)} /></Field>
        </div>
        <div className="checks">
          {['poiHasFvg','liquiditySweep','bos','choch'].map((key) => <label key={key}><input type="checkbox" checked={!!form[key]} onChange={(e) => set(key, e.target.checked)} />{key.replace(/([A-Z])/g, ' $1')}</label>)}
        </div>
      </Panel>
      <Panel title="Grade, Excursion, Psychology">
        <div className="form-grid">
          <Field label="Setup Grade"><select value={form.setupGrade} onChange={(e) => set('setupGrade', e.target.value)}><option>A+</option><option>A</option><option>B</option><option>C</option></select></Field>
          <Field label="Setup Score"><input type="number" min="0" max="100" value={form.setupScore} onChange={(e) => set('setupScore', e.target.value)} /></Field>
          <Field label="Max RR"><input type="number" step="any" value={form.maxR} onChange={(e) => set('maxR', e.target.value)} /></Field>
          <Field label="MFE / MAE"><div className="inline-inputs"><input type="number" step="any" value={form.mfeR} onChange={(e) => set('mfeR', e.target.value)} /><input type="number" step="any" value={form.maeR} onChange={(e) => set('maeR', e.target.value)} /></div></Field>
          <Field label="Rule Violation"><Select options={options.ruleViolation} value={form.ruleViolation} onChange={(v) => set('ruleViolation', v)} /></Field>
          <Field label="Emotion After"><Select options={options.emotion} value={form.emotionAfter} onChange={(v) => set('emotionAfter', v)} /></Field>
        </div>
        <Field label="Reflection"><textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} placeholder="Why this trade, what followed the plan, what to avoid next time..." /></Field>
      </Panel>
      <Panel title="Chart Journal">
        <div className="form-grid">
          <Field label="HTF Chart URL"><input value={form.chartHtf || ''} onChange={(e) => set('chartHtf', e.target.value)} /></Field>
          <Field label="MTF Chart URL"><input value={form.chartMtf || ''} onChange={(e) => set('chartMtf', e.target.value)} /></Field>
          <Field label="LTF Chart URL"><input value={form.chartLtf || ''} onChange={(e) => set('chartLtf', e.target.value)} /></Field>
        </div>
        <div className="actions"><button className="primary" type="submit"><Save size={16} />{editing ? 'Update trade' : 'Save trade'}</button>{editing && <button type="button" onClick={() => setEditing(null)}>Cancel</button>}</div>
      </Panel>
    </form>
  </section>;
}

function HistoryPage({ api, accountId, trades, setTrades, setEditing, setToast }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const list = trades.filter((t) => (filter === 'all' || t.result === filter) && JSON.stringify(t).toLowerCase().includes(q.toLowerCase()));
  async function del(id) {
    if (!confirm('Delete this trade?')) return;
    await api(`/accounts/${accountId}/trades/${id}`, { method: 'DELETE' });
    setTrades(trades.filter((t) => t.id !== id));
    setToast('Trade deleted');
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify(trades, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mrz-trading-journal-${today()}.json`;
    a.click();
  }
  return <section>
    <Header title="History" hint={`${list.length} of ${trades.length} trades`} action={<button onClick={exportJson}><Download size={16} />Export JSON</button>} />
    <div className="toolbar"><div className="search"><Filter size={16} /><input placeholder="Search setup, notes, result, asset..." value={q} onChange={(e) => setQ(e.target.value)} /></div><select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All results</option><option value="win">Win</option><option value="loss">Loss</option><option value="breakeven">Breakeven</option><option value="miss">Miss</option></select></div>
    <div className="table-wrap"><table><thead><tr>{['Date','Asset','Session','Dir','Setup','POI','MTF','LTF','RR','Max RR','P&L','Psy','Charts',''].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>
      {list.map((t) => <tr key={t.id}><td>{t.date}<small>{t.entryTime}</small></td><td>{t.asset}</td><td>{t.session}</td><td>{t.direction}</td><td><b>{t.setupGrade}</b><small>{t.setupScore}/100</small></td><td>{t.htfBias} {t.htfPoi}</td><td>{t.mtfStructure}</td><td>{t.ltfEntry}</td><td>{fmtR(t.plannedR)}</td><td>{fmtR(t.maxR)}</td><td className={t.pnl >= 0 ? 'pos' : 'neg'}>{money(t.pnl)}</td><td>{t.ruleViolation || '-'}<small>{t.emotionAfter || ''}</small></td><td>{['chartHtf','chartMtf','chartLtf'].filter((k) => t[k]).map((k) => <a key={k} href={t[k]} target="_blank">↗</a>)}</td><td className="row-actions"><button onClick={() => setEditing(t)}>Edit</button><button onClick={() => del(t.id)}><Trash2 size={14} /></button></td></tr>)}
    </tbody></table></div>
  </section>;
}

function CalendarPage({ trades }) {
  const days = useMemo(() => groupBy(trades, 'date').map((d) => ({ ...d, name: d.name.slice(5) })).sort((a, b) => a.name.localeCompare(b.name)), [trades]);
  return <section><Header title="Calendar" hint="Daily P&L heatmap and activity" /><Panel title="Daily Results"><ChartWrap empty={!days.length}><BarChart data={days}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v) => money(v)} /><Bar dataKey="pnl">{days.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#2f855a' : '#c2410c'} />)}</Bar></BarChart></ChartWrap></Panel></section>;
}

function AnalyticsPage({ trades, stats }) {
  const [dimension, setDimension] = useState('htfBias');
  const data = groupBy(trades, dimension);
  return <section>
    <Header title="Analytics" hint="Find your edge by structure, time, psychology, and RR behavior" />
    <div className="kpi-grid"><Kpi label="Trades" value={stats.total} /><Kpi label="Wins / Losses" value={`${stats.wins} / ${stats.losses}`} /><Kpi label="Best RR" value={fmtR(stats.bestRr?.level || 0)} /><Kpi label="Best RR Hypothesis" value={money(stats.bestRr?.value || 0)} /></div>
    <div className="grid two">
      <Panel title="Breakdown"><div className="toolbar"><select value={dimension} onChange={(e) => setDimension(e.target.value)}><option value="htfBias">HTF Bias</option><option value="mtfStructure">MTF Structure</option><option value="ltfEntry">LTF Entry</option><option value="keyZone">Key Zone</option><option value="setupGrade">Setup Grade</option><option value="ruleViolation">Rule Violation</option><option value="emotionAfter">Emotion</option><option value="day">Day</option></select></div><ChartWrap empty={!data.length}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v, n) => n === 'pnl' ? money(v) : v} /><Bar dataKey="wins" stackId="a" fill="#2f855a" /><Bar dataKey="losses" stackId="a" fill="#c2410c" /><Bar dataKey="pnl" fill="#1f7a8c" /></BarChart></ChartWrap></Panel>
      <Panel title="RR Recommendation"><div className="table-wrap slim"><table><thead><tr><th>RR</th><th>Qualifying wins</th><th>Win Rate</th><th>Hypothetical value</th></tr></thead><tbody>{stats.rrRows.map((r) => <tr key={r.level} className={r.level === stats.bestRr?.level ? 'selected' : ''}><td>{fmtR(r.level)}</td><td>{r.count}</td><td>{pct(r.winRate * 100)}</td><td>{money(r.value)}</td></tr>)}</tbody></table></div></Panel>
    </div>
  </section>;
}

function JournalPage({ api, accountId }) {
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState('');
  useEffect(() => { if (accountId) api(`/accounts/${accountId}/note`).then((d) => setContent(d.note.content || '')); }, [accountId]);
  async function save() {
    await api(`/accounts/${accountId}/note`, { method: 'PUT', body: JSON.stringify({ content }) });
    setSaved(new Date().toLocaleTimeString());
  }
  return <section><Header title="Playbook" hint={saved ? `Saved ${saved}` : 'Account logic, rules, and review notes'} action={<button className="primary" onClick={save}><Save size={16} />Save note</button>} /><textarea className="playbook" value={content} onChange={(e) => setContent(e.target.value)} /></section>;
}

function SettingsPage({ api, accounts, account, options, reload, setToast }) {
  const [name, setName] = useState(account?.name || '');
  const [balance, setBalance] = useState(account?.startingBalance || 50000);
  useEffect(() => { setName(account?.name || ''); setBalance(account?.startingBalance || 50000); }, [account?.id]);
  async function saveAccount() {
    await api(`/accounts/${account.id}`, { method: 'PUT', body: JSON.stringify({ name, type: account.type, startingBalance: balance }) });
    await reload(account.id);
    setToast('Settings saved');
  }
  async function addAccount() {
    const data = await api('/accounts', { method: 'POST', body: JSON.stringify({ name: 'New Account', type: 'live', startingBalance: 50000 }) });
    await reload(data.id);
    setToast('Account created');
  }
  return <section><Header title="Settings" hint="Accounts and customizable field options" action={<button onClick={addAccount}><Plus size={16} />New account</button>} />
    <div className="grid two"><Panel title="Account Management"><div className="form-grid"><Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} /></Field><Field label="Starting Balance"><input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} /></Field></div><button className="primary" onClick={saveAccount}><Save size={16} />Save account</button></Panel>
    <Panel title="Field Options"><div className="option-list">{Object.entries(options).map(([key, vals]) => <details key={key}><summary>{key}</summary><div>{vals.join(', ')}</div></details>)}</div></Panel></div></section>;
}

function CoachPage({ api }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  async function load() {
    setError('');
    try { setRows((await api('/admin/team')).users); } catch (err) { setError(err.message); }
  }
  return <section><Header title="Coach View" hint="Read-only team overview for admin/coach users" action={<button onClick={load}><Shield size={16} />Refresh</button>} />{error && <div className="empty">{error}</div>}<div className="table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Trades</th><th>Net P&L</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td>{r.username}</td><td>{r.role}</td><td>{r.totalTrades}</td><td className={r.netPnl >= 0 ? 'pos' : 'neg'}>{money(r.netPnl)}</td></tr>)}</tbody></table></div></section>;
}

function Header({ title, hint, action }) { return <div className="page-head"><div><h1>{title}</h1><p>{hint}</p></div>{action}</div>; }
function Panel({ title, children }) { return <div className="panel"><div className="panel-title">{title}</div>{children}</div>; }
function Kpi({ label, value, tone }) { return <div className={`kpi ${tone || ''}`}><span>{label}</span><b>{value}</b></div>; }
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }
function Select({ options = [], value, onChange }) { return <select value={value || ''} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o}>{o}</option>)}</select>; }
function ChartWrap({ empty, children }) { return <div className="chart-wrap">{empty ? <div className="empty">No data yet</div> : <ResponsiveContainer width="100%" height={300}>{children}</ResponsiveContainer>}</div>; }

createRoot(document.getElementById('root')).render(<App />);

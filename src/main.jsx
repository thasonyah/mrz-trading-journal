import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  BarChart3, BookOpen, CalendarDays, Download, FileText, Filter, Gauge, History, Mail,
  Eye, EyeOff, LayoutDashboard, LogOut, Plus, Save, Settings, Shield, SlidersHorizontal, Trash2, Upload, UserRound
} from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_BASE
  || (location.hostname === '127.0.0.1' && location.port === '5173' ? 'http://127.0.0.1:5174/api' : '/api');
const money = (n) => Number.isFinite(Number(n)) ? `${Number(n) < 0 ? '-' : ''}$${Math.abs(Number(n)).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}` : '-';
const pct = (n) => `${(Number(n) || 0).toFixed(1)}%`;
const fmtR = (n) => Number.isFinite(Number(n)) ? `${Number(n).toFixed(2)}R` : '-';
const fmtMinutes = (minutes) => {
  const total = Math.round(Number(minutes) || 0);
  if (!total) return '-';
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return hours ? `${hours}h ${mins}m` : `${mins}m`;
};
const today = () => new Date().toISOString().slice(0, 10);
const profileContactLabels = { phone: 'Phone', email: 'E-mail', facebook: 'Facebook', line: 'Line' };

function profileContact(profile = {}, fallbackEmail = '') {
  const type = profile.contactType || 'email';
  return profile[type] || (type === 'email' ? fallbackEmail : '') || profile.email || fallbackEmail || '';
}

function resizeProfileImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file'));
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 250;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const scale = Math.max(size / img.width, size / img.height);
        const width = img.width * scale;
        const height = img.height * scale;
        ctx.drawImage(img, (size - width) / 2, (size - height) / 2, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => reject(new Error('Could not read image'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

const defaultAssets = [
  { symbol: 'NQ1', tickSize: 0.25, dollarPerPoint: 5 },
  { symbol: 'MNQ1', tickSize: 0.25, dollarPerPoint: 0.5 },
  { symbol: 'MGC1', tickSize: 0.1, dollarPerPoint: 1 },
  { symbol: 'GC1', tickSize: 0.1, dollarPerPoint: 10 },
  { symbol: 'XAUUSD', tickSize: 0.01, dollarPerPoint: 1 }
];

const defaultOptions = {
  session: ['AS', 'LO', 'NY', 'LC'],
  mode: ['BOSe', 'CHe', 'Flip'],
  htfBias: ['Bullish', 'Bearish', 'Neutral'],
  htfPoi: ['OB', 'FVG', 'Supply', 'Demand', 'Liquidity', 'Premium', 'Discount'],
  mtfStructure: ['BOS', 'CHoCH', 'Sweep', 'Internal BOS', 'Range'],
  ltfEntry: ['OB', 'FVG', 'OB + FVG', 'Breaker', 'Mitigation'],
  keyZone: ['Premium', 'Discount', 'Equilibrium', 'Asia High/Low', 'London Open', 'NY AM'],
  ruleViolation: ['None', 'Early Entry', 'Late Entry', 'No Confirmation', 'Oversized Lot', 'Revenge Trade', 'Chased Price'],
  emotion: ['Calm', 'Confident', 'Anxious', 'Frustrated', 'Greedy', 'Impatient', 'Regretful']
};

const blankTrade = {
  date: today(), asset: 'NQ1', direction: 'short', session: 'AS', mode: 'BOSe', entryTime: '06:00', exitTime: '',
  durationTime: '', orderWaitMinutes: '', entryPrice: '', stopLoss: '', takeProfit: '', tpTicks: '', slTicks: '',
  tickSize: 0.25, dollarPerPoint: 5, lotSize: '',
  riskAmount: 30, result: 'win', htfBias: 'Bullish', htfPoi: 'OB', poiType: 'OB', poiHasFvg: true,
  fvgPosition: 'Middle of OB', liquiditySweep: true, bos: true, choch: false, mtfStructure: 'BOS',
  ltfEntry: 'OB + FVG', keyZone: 'Discount', setupGrade: 'A', setupScore: 80, maxR: '', maxTick: '', mfeR: '', maeR: '',
  ruleViolation: 'None', emotionBefore: 'Calm', emotionAfter: 'Confident', disciplineScore: 90,
  chartHtf: '', chartMtf: '', chartLtf: '', pictureUrl: '', tipUrl: '', notes: ''
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

function withUser(path, userId) {
  if (!userId) return path;
  return `${path}${path.includes('?') ? '&' : '?'}userId=${userId}`;
}

function parseTimeMinutes(value) {
  if (!value || !/^\d{1,2}:\d{2}/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return (hours * 60) + minutes;
}

function minutesBetween(entryTime, exitTime) {
  const start = parseTimeMinutes(entryTime);
  const end = parseTimeMinutes(exitTime);
  if (start === null || end === null) return null;
  return end >= start ? end - start : (24 * 60) - start + end;
}

function durationLabelFromTimes(entryTime, exitTime) {
  const minutes = minutesBetween(entryTime, exitTime);
  if (minutes === null) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function durationMinutesOf(trade) {
  const direct = minutesBetween(trade.entryTime, trade.exitTime);
  if (direct !== null) return direct;
  const text = String(trade.durationTime || '').trim();
  if (!text) return 0;
  const clock = text.match(/^(\d+):(\d{2})$/);
  if (clock) return (Number(clock[1]) * 60) + Number(clock[2]);
  const h = text.match(/(\d+(?:\.\d+)?)\s*h/i);
  const m = text.match(/(\d+(?:\.\d+)?)\s*m/i);
  if (h || m) return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
  return Number(text) || 0;
}

function entryHourOf(trade) {
  const minutes = parseTimeMinutes(trade.entryTime);
  if (minutes === null) return 'No time';
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:00`;
}

function enrichTrade(input) {
  const t = { ...input };
  const durationTime = t.entryTime && t.exitTime ? durationLabelFromTimes(t.entryTime, t.exitTime) : (t.durationTime || '');
  const entry = Number(t.entryPrice);
  const tickSize = Number(t.tickSize) || 1;
  const tpTicks = t.tpTicks === '' || t.tpTicks == null ? null : Number(t.tpTicks);
  const slTicks = t.slTicks === '' || t.slTicks == null ? null : Number(t.slTicks);
  const tickTarget = Number.isFinite(entry) && Number.isFinite(tpTicks)
    ? (t.direction === 'long' ? entry + (tickSize * tpTicks) : entry - (tickSize * tpTicks))
    : null;
  const tickStop = Number.isFinite(entry) && Number.isFinite(slTicks)
    ? (t.direction === 'long' ? entry - (tickSize * slTicks) : entry + (tickSize * slTicks))
    : null;
  const stop = tickStop ?? Number(t.stopLoss);
  const take = tickTarget ?? Number(t.takeProfit);
  const risk = Number(t.riskAmount) || 0;
  const dpp = Number(t.dollarPerPoint) || 1;
  const riskPoints = Math.abs(entry - stop);
  const rewardPoints = Math.abs(take - entry);
  const plannedR = riskPoints > 0 ? rewardPoints / riskPoints : 0;
  const suggestedLot = riskPoints > 0 ? risk / (riskPoints * dpp) : 0;
  const lotSize = Number(t.lotSize) > 0 ? Number(t.lotSize) : suggestedLot;
  const slAmount = Number.isFinite(slTicks) ? slTicks * dpp * lotSize : risk;
  const tpAmount = Number.isFinite(tpTicks) ? tpTicks * dpp * lotSize : risk * plannedR;
  const resultR = t.result === 'win' ? plannedR : t.result === 'loss' || t.result === 'reversed' ? -1 : 0;
  const pnl = t.result === 'win' ? tpAmount : (t.result === 'loss' || t.result === 'reversed') ? -slAmount : 0;
  return {
    ...t,
    entryPrice: entry || null,
    stopLoss: stop || null,
    takeProfit: take || null,
    tpTicks,
    slTicks,
    tickSize,
    riskAmount: risk,
    plannedR,
    actualR: resultR,
    lotSize,
    suggestedLot,
    pnl,
    slAmount,
    tpAmount,
    tpPercent: 0,
    durationTime,
    durationMinutes: durationMinutesOf({ ...t, durationTime }),
    maxR: t.maxR === '' ? plannedR : Number(t.maxR),
    maxTick: t.maxTick === '' || t.maxTick == null ? null : Number(t.maxTick),
    mfeR: t.mfeR === '' ? Number(t.maxR || plannedR || 0) : Number(t.mfeR),
    maeR: t.maeR === '' ? 0 : Number(t.maeR),
    orderWaitMinutes: t.orderWaitMinutes === '' ? null : Number(t.orderWaitMinutes),
    setupScore: Number(t.setupScore) || 0,
    disciplineScore: t.disciplineScore === '' ? null : Number(t.disciplineScore)
  };
}

function computeLedger(trades, startingBalance = 50000) {
  let balance = startingBalance;
  let conLoss = 0;
  let sumConLossAmount = 0;
  let sumDdLossPct = 0;
  return [...trades]
    .sort((a, b) => `${a.date}${a.entryTime || ''}${a.id || 0}`.localeCompare(`${b.date}${b.entryTime || ''}${b.id || 0}`))
    .map((trade) => {
      const t = enrichTrade(trade);
      const before = balance;
      const isLoss = t.result === 'loss' || t.result === 'reversed';
      const isWin = t.result === 'win';
      const slAmount = Number(t.slAmount || 0);
      const tpAmount = Number(t.tpAmount || 0);
      const pnl = isWin ? tpAmount : isLoss ? -slAmount : 0;
      if (isWin) {
        conLoss = 0;
        sumConLossAmount = 0;
      } else if (isLoss) {
        conLoss += 1;
        sumConLossAmount += slAmount;
      }
      const ddLossPct = isLoss && before ? slAmount / before : 0;
      sumDdLossPct = isWin ? 0 : sumDdLossPct + ddLossPct;
      balance = before + pnl;
      return {
        ...trade,
        ...t,
        pnl,
        slAmount,
        tpAmount,
        tpPercent: before ? tpAmount / before : 0,
        balanceAfter: balance,
        conLoss,
        sumConLossAmount,
        ddLossPct,
        sumDdLossPct,
        dayName: trade.date ? new Date(`${trade.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' }) : '',
        monthNumber: trade.date ? new Date(`${trade.date}T00:00:00`).getMonth() + 1 : '',
        yearNumber: trade.date ? new Date(`${trade.date}T00:00:00`).getFullYear() : '',
        weekNumber: trade.date ? getWeekNumber(trade.date) : '',
        entryHour: entryHourOf(trade),
        durationMinutes: durationMinutesOf(t)
      };
    });
}

function getWeekNumber(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((((date - start) / 86400000) + start.getDay() + 1) / 7);
}

function computeStats(trades, startingBalance = 50000) {
  const rows = computeLedger(trades, startingBalance);
  const wins = rows.filter((t) => t.result === 'win');
  const losses = rows.filter((t) => t.result === 'loss' || t.result === 'reversed');
  const decided = wins.length + losses.length;
  const net = rows.reduce((s, t) => s + Number(t.pnl || 0), 0);
  const grossProfit = rows.reduce((s, t) => t.pnl > 0 ? s + t.pnl : s, 0);
  const grossLoss = Math.abs(rows.reduce((s, t) => t.pnl < 0 ? s + t.pnl : s, 0));
  const winRate = decided ? wins.length / decided : 0;
  const avgWinR = wins.length ? wins.reduce((s, t) => s + Number(t.actualR || t.plannedR || 0), 0) / wins.length : 0;
  const expectancy = decided ? (winRate * avgWinR) - ((1 - winRate) * 1) : 0;
  let equity = startingBalance, peak = startingBalance, maxDrawdown = 0;
  rows.forEach((t) => {
    equity += Number(t.pnl || 0);
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak - equity);
  });
  const rrs = rows.map((t) => Number(t.plannedR || 0)).filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  const median = rrs.length ? (rrs.length % 2 ? rrs[(rrs.length - 1) / 2] : (rrs[rrs.length / 2 - 1] + rrs[rrs.length / 2]) / 2) : 0;
  const durationRows = rows.filter((t) => Number(t.durationMinutes) > 0);
  const asiaRows = rows.filter((t) => String(t.session || '').toUpperCase() === 'AS');
  const ticks = rows.map((t) => Number(t.maxTick ?? t.tpTicks ?? 0)).filter((value) => Number.isFinite(value) && value > 0);
  const rrRows = [1, 1.5, 2, 3, 4, 5, 7, 10, 15, 20].map((level) => {
    const qualified = wins.filter((t) => Number(t.maxR || 0) >= level);
    return { level, count: qualified.length, winRate: decided ? qualified.length / decided : 0, value: qualified.reduce((s, t) => s + Number(t.riskAmount || 0) * level, 0) };
  });
  const byEntryHour = groupBy(rows, 'entryHour');
  const byLtfEntry = groupBy(rows, 'ltfEntry');
  return {
    total: trades.length,
    wins: wins.length,
    losses: losses.length,
    miss: rows.filter((t) => t.result === 'miss').length,
    net,
    winRate,
    profitFactor: grossLoss ? grossProfit / grossLoss : grossProfit ? Infinity : 0,
    expectancy,
    avgMaxR: wins.length ? wins.reduce((s, t) => s + Number(t.maxR || 0), 0) / wins.length : 0,
    avgDuration: durationRows.length ? durationRows.reduce((s, t) => s + Number(t.durationMinutes || 0), 0) / durationRows.length : 0,
    avgTick: ticks.length ? ticks.reduce((s, v) => s + v, 0) / ticks.length : 0,
    asiaAvgRr: asiaRows.length ? asiaRows.reduce((s, t) => s + Number(t.actualR || t.plannedR || 0), 0) / asiaRows.length : 0,
    asiaAvgTick: asiaRows.length ? asiaRows.reduce((s, t) => s + Number(t.maxTick ?? t.tpTicks ?? 0), 0) / asiaRows.length : 0,
    bestEntryHour: byEntryHour[0],
    topLtfEntry: byLtfEntry.sort((a, b) => b.trades - a.trades)[0],
    minRr: rrs[0] || 0,
    medianRr: median,
    maxRr: rrs[rrs.length - 1] || 0,
    maxDrawdown,
    rrRows,
    bestRr: rrRows.reduce((best, row) => row.value * row.winRate > best.value * best.winRate ? row : best, rrRows[0])
  };
}

function groupBy(trades, key) {
  const map = new Map();
  trades.forEach((t) => {
    const value = key === 'day' ? new Date(`${t.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' }) : (t[key] || 'Unspecified');
    const current = map.get(value) || { name: value, wins: 0, losses: 0, pnl: 0, trades: 0, rrSum: 0, rrCount: 0, tickSum: 0, tickCount: 0, durationSum: 0, durationCount: 0 };
    current.trades += 1;
    current.pnl += Number(t.pnl || 0);
    if (t.result === 'win') current.wins += 1;
    if (t.result === 'loss' || t.result === 'reversed') current.losses += 1;
    const rr = Number(t.actualR || t.plannedR || 0);
    if (Number.isFinite(rr)) {
      current.rrSum += rr;
      current.rrCount += 1;
    }
    const ticks = Number(t.maxTick ?? t.tpTicks ?? 0);
    if (Number.isFinite(ticks) && ticks > 0) {
      current.tickSum += ticks;
      current.tickCount += 1;
    }
    const duration = Number(t.durationMinutes || 0);
    if (Number.isFinite(duration) && duration > 0) {
      current.durationSum += duration;
      current.durationCount += 1;
    }
    map.set(value, current);
  });
  return [...map.values()].map((row) => ({
    ...row,
    avgRr: row.rrCount ? row.rrSum / row.rrCount : 0,
    avgTick: row.tickCount ? row.tickSum / row.tickCount : 0,
    avgDuration: row.durationCount ? row.durationSum / row.durationCount : 0,
    winRate: row.wins + row.losses ? row.wins / (row.wins + row.losses) : 0
  })).sort((a, b) => b.pnl - a.pnl);
}

function AuthScreen({ setSession }) {
  const initialMode = location.pathname.includes('reset-password') ? 'reset' : location.pathname.includes('verify-email') ? 'verify' : 'login';
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState('demo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState(new URLSearchParams(location.search).get('token') || '');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function submit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const body = mode === 'login' ? { username, password }
        : mode === 'register' ? { username, email, password }
          : mode === 'forgot' ? { email }
            : mode === 'verify' ? { token }
              : { token, password };
      const endpoint = mode === 'login' ? 'login'
        : mode === 'register' ? 'register'
          : mode === 'forgot' ? 'forgot-password'
            : mode === 'verify' ? 'verify-email'
              : 'reset-password';
      const res = await fetch(`${API}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Auth failed');
      if (data.token) {
        localStorage.setItem('etj_token', data.token);
        setSession(data);
      } else {
        setMessage(data.verificationLink || data.resetLink || data.message || 'Done');
        if (mode === 'reset') setMode('login');
      }
    } catch (err) {
      setError(err.message);
    }
  }
  return <main className="auth-shell">
    <form className="auth-card" onSubmit={submit}>
      <div className="mark">ZTJ</div>
      <h1>Mr.Z Trading Journal</h1>
      <p>Trading journal for structure, execution, psychology, and edge review.</p>
      <div className="segmented">
        <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
        <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Sign up</button>
      </div>
      {['login', 'register'].includes(mode) && <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} /></label>}
      {['register', 'forgot'].includes(mode) && <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>}
      {['verify', 'reset'].includes(mode) && <label>Token<input value={token} onChange={(e) => setToken(e.target.value)} /></label>}
      {['login', 'register', 'reset'].includes(mode) && <label>Password<PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} visible={showPassword} onToggle={() => setShowPassword(!showPassword)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>}
      {error && <div className="error">{error}</div>}
      {message && <div className="success-box">{message}</div>}
      <button className="primary" type="submit">{mode === 'login' ? 'Login' : mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Send reset link' : mode === 'verify' ? 'Verify email' : 'Reset password'}</button>
      <div className="auth-links">
        <button type="button" onClick={() => setMode('forgot')}>Forgot password</button>
        <button type="button" onClick={() => setMode('verify')}>Verify email</button>
      </div>
    </form>
  </main>;
}

function PasswordInput({ value, onChange, visible, onToggle, autoComplete }) {
  const Icon = visible ? EyeOff : Eye;
  return <div className="password-input"><input type={visible ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} /><button type="button" onClick={onToggle} aria-label={visible ? 'Hide password' : 'Show password'} title={visible ? 'Hide password' : 'Show password'}><Icon size={15} /></button></div>;
}

function App() {
  const [session, setSession] = useState(() => localStorage.getItem('etj_token') ? { token: localStorage.getItem('etj_token') } : null);
  const api = useApi(session?.token);
  const [currentUser, setCurrentUser] = useState(session?.user || null);
  const [viewUserId, setViewUserId] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState(null);
  const [portfolioLimit, setPortfolioLimit] = useState(5);
  const [trades, setTrades] = useState([]);
  const [options, setOptions] = useState(defaultOptions);
  const [assets, setAssets] = useState(defaultAssets);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');

  const scopedUserId = currentUser?.role === 'admin' && viewUserId ? viewUserId : null;
  const scopedApi = useMemo(() => (path, options = {}) => api(withUser(path, scopedUserId), options), [api, scopedUserId]);

  async function loadAll(nextAccountId = accountId) {
    const [a, o, assetData] = await Promise.all([scopedApi('/accounts'), scopedApi('/options'), scopedApi('/assets')]);
    setAccounts(a.accounts);
    setPortfolioLimit(a.portfolioLimit || 5);
    setAssets(assetData.assets?.length ? assetData.assets : defaultAssets);
    const active = nextAccountId || a.accounts[0]?.id;
    setAccountId(active);
    setOptions({ ...defaultOptions, ...Object.fromEntries(o.options.map((x) => [x.fieldKey, x.options])) });
    if (active) {
      const data = await scopedApi(`/accounts/${active}/trades`);
      setTrades(data.trades);
    }
  }
  useEffect(() => {
    if (!session?.token) return;
    api('/me').then((data) => setCurrentUser(data.user)).catch(() => setSession(null));
  }, [session?.token]);
  useEffect(() => { if (session?.token) loadAll().catch(() => setSession(null)); }, [session?.token, scopedUserId]);
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
    ['coach', Shield, 'Admin']
  ];
  function logout() {
    localStorage.removeItem('etj_token');
    setSession(null);
  }
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="brand"><div className="mark small">ZTJ</div><div><b>Mr.Z Trading Journal</b><span>POI to outcome</span></div></div>
        <ProfileCard user={currentUser} />
      </div>
      <label className="mini-label">Portfolio {accounts.length}/{portfolioLimit}</label>
      <select value={accountId || ''} onChange={async (e) => { setAccountId(e.target.value); const data = await scopedApi(`/accounts/${e.target.value}/trades`); setTrades(data.trades); }}>
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
      {page === 'log' && <TradeForm api={scopedApi} accountId={accountId} options={options} assets={assets} editing={editing} setEditing={setEditing} reload={loadAll} setToast={setToast} />}
      {page === 'history' && <HistoryPage api={scopedApi} accountId={accountId} account={account} trades={trades} setTrades={setTrades} setEditing={(t) => { setEditing(t); setPage('log'); }} setToast={setToast} />}
      {page === 'calendar' && <CalendarPage trades={trades} />}
      {page === 'analytics' && <AnalyticsPage trades={trades} stats={stats} account={account} />}
      {page === 'journal' && <JournalPage api={scopedApi} accountId={accountId} />}
      {page === 'settings' && <SettingsPage api={scopedApi} accounts={accounts} account={account} options={options} assets={assets} portfolioLimit={portfolioLimit} user={currentUser} setCurrentUser={setCurrentUser} reload={loadAll} setToast={setToast} />}
      {page === 'coach' && <CoachPage api={api} token={session?.token} currentUser={currentUser} viewUserId={viewUserId} setViewUserId={(id) => { setViewUserId(id); setPage('dashboard'); }} />}
    </main>
    {toast && <div className="toast">{toast}</div>}
  </div>;
}

function ProfileCard({ user }) {
  const profile = user?.profile || {};
  const contact = profileContact(profile, user?.email);
  const label = profileContactLabels[profile.contactType || 'email'] || 'Contact';
  return <div className="profile-card">
    <div className="profile-photo">{profile.image ? <img src={profile.image} alt="" /> : <UserRound size={84} strokeWidth={1.25} />}</div>
    <div className="profile-copy">
      <b>{profile.nickname || 'Nick Name'}</b>
      <span>{contact || label}</span>
    </div>
  </div>;
}

function Dashboard({ trades, stats, account, setPage }) {
  const ledger = useMemo(() => computeLedger(trades, account?.startingBalance || 50000), [trades, account?.startingBalance]);
  const daily = useMemo(() => {
    const map = new Map();
    ledger.sort((a, b) => a.date.localeCompare(b.date)).forEach((t) => map.set(t.date, (map.get(t.date) || 0) + Number(t.pnl || 0)));
    let cum = 0;
    return [...map.entries()].map(([date, pnl]) => ({ date: date.slice(5), pnl, equity: (cum += pnl) }));
  }, [ledger]);
  const hourRows = useMemo(() => groupBy(ledger, 'entryHour').sort((a, b) => String(a.name).localeCompare(String(b.name))), [ledger]);
  const ltfRows = useMemo(() => groupBy(ledger, 'ltfEntry').sort((a, b) => b.trades - a.trades), [ledger]);
  return <section>
    <Header title="Dashboard" hint={`${account?.name || 'Account'} performance overview`} action={<button className="primary" onClick={() => setPage('log')}><Plus size={16} />Log trade</button>} />
    <div className="kpi-grid">
      <Kpi label="Net P&L" value={money(stats.net)} tone={stats.net >= 0 ? 'good' : 'bad'} />
      <Kpi label="Win Rate" value={pct(stats.winRate * 100)} />
      <Kpi label="Profit Factor" value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)} />
      <Kpi label="Expectancy" value={fmtR(stats.expectancy)} tone={stats.expectancy >= 0 ? 'good' : 'bad'} />
      <Kpi label="Max Drawdown" value={money(-stats.maxDrawdown)} tone="bad" />
      <Kpi label="Avg Max RR" value={fmtR(stats.avgMaxR)} />
      <Kpi label="RR Min / Med / Max" value={`${stats.minRr.toFixed(2)} / ${stats.medianRr.toFixed(2)} / ${stats.maxRr.toFixed(2)}`} />
      <Kpi label="Avg Duration" value={fmtMinutes(stats.avgDuration)} />
      <Kpi label="Asia RR / Tick" value={`${fmtR(stats.asiaAvgRr)} / ${Number(stats.asiaAvgTick || 0).toFixed(1)}`} />
      <Kpi label="Top LTF Entry" value={stats.topLtfEntry?.name || '-'} />
    </div>
    <div className="grid two">
      <Panel title="Equity Curve">
        <ChartWrap empty={!daily.length}><AreaChart data={daily}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip formatter={(v) => money(v)} /><Area type="monotone" dataKey="equity" stroke="#1f7a8c" fill="#1f7a8c33" /></AreaChart></ChartWrap>
      </Panel>
      <Panel title="Setup Quality Mix">
        <ChartWrap empty={!trades.length}><PieChart><Pie data={groupBy(trades, 'setupGrade')} dataKey="trades" nameKey="name" outerRadius={92}>{groupBy(trades, 'setupGrade').map((_, i) => <Cell key={i} fill={['#1f7a8c','#bf9b30','#5a6578','#a24936','#6a7f4e'][i % 5]} />)}</Pie><Tooltip /></PieChart></ChartWrap>
      </Panel>
    </div>
    <div className="grid two dashboard-lower">
      <Panel title="Entry Time Edge">
        <ChartWrap empty={!hourRows.length}><BarChart data={hourRows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v, n) => n === 'pnl' ? money(v) : v} /><Bar dataKey="trades" fill="#bf9b30" /><Bar dataKey="pnl" fill="#1f7a8c" /></BarChart></ChartWrap>
      </Panel>
      <Panel title="LTF Entry Receive">
        <div className="table-wrap slim"><table><thead><tr><th>LTF Entry</th><th>Trades</th><th>Winrate</th><th>Avg RR</th><th>Avg Tick</th></tr></thead><tbody>{ltfRows.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.trades}</td><td>{pct(row.winRate * 100)}</td><td>{fmtR(row.avgRr)}</td><td>{row.avgTick.toFixed(1)}</td></tr>)}</tbody></table></div>
      </Panel>
    </div>
  </section>;
}

function TradeForm({ api, accountId, options, assets, editing, setEditing, reload, setToast }) {
  const [form, setForm] = useState(editing || blankTrade);
  useEffect(() => setForm(editing || blankTrade), [editing]);
  const calc = enrichTrade(form);
  function set(key, value) {
    let next = { ...form, [key]: value };
    if (key === 'asset') {
      const preset = assets.find((asset) => asset.symbol === value);
      if (preset) next = { ...next, tickSize: preset.tickSize, dollarPerPoint: preset.dollarPerPoint };
    }
    if ((key === 'entryPrice' || key === 'direction' || key === 'tpTicks' || key === 'slTicks' || key === 'tickSize') && next.entryPrice) {
      const preview = enrichTrade(next);
      next = { ...next, stopLoss: preview.stopLoss || '', takeProfit: preview.takeProfit || '' };
    }
    if (key === 'entryTime' || key === 'exitTime') {
      next = { ...next, durationTime: durationLabelFromTimes(next.entryTime, next.exitTime) || next.durationTime || '' };
    }
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
          <Field label="Asset"><select value={form.asset} onChange={(e) => set('asset', e.target.value)}>{assets.map((a) => <option key={a.symbol}>{a.symbol}</option>)}</select></Field>
          <Field label="Risk $"><input type="number" value={form.riskAmount} onChange={(e) => set('riskAmount', e.target.value)} /></Field>
          <Field label="Entry"><input type="number" step="any" value={form.entryPrice} onChange={(e) => set('entryPrice', e.target.value)} /></Field>
          <Field label="TP (Tick)"><input type="number" step="any" value={form.tpTicks ?? ''} onChange={(e) => set('tpTicks', e.target.value)} /></Field>
          <Field label="SL (Tick)"><input type="number" step="any" value={form.slTicks ?? ''} onChange={(e) => set('slTicks', e.target.value)} /></Field>
          <Field label="Point"><input type="number" step="any" value={form.tickSize} onChange={(e) => set('tickSize', e.target.value)} /></Field>
          <Field label="Lot"><input type="number" step="any" value={form.lotSize ?? ''} onChange={(e) => set('lotSize', e.target.value)} /></Field>
          <Field label="Stop"><input type="number" step="any" value={form.stopLoss} onChange={(e) => set('stopLoss', e.target.value)} /></Field>
          <Field label="Target"><input type="number" step="any" value={form.takeProfit} onChange={(e) => set('takeProfit', e.target.value)} /></Field>
          <Field label="$ / point"><input type="number" step="any" value={form.dollarPerPoint} onChange={(e) => set('dollarPerPoint', e.target.value)} /></Field>
        </div>
        <div className="risk-strip">
          <Kpi label="Planned RR" value={fmtR(calc.plannedR)} />
          <Kpi label="Suggested lot" value={Number(calc.suggestedLot || 0).toFixed(2)} />
          <Kpi label="Projected P&L" value={money(calc.pnl)} tone={calc.pnl >= 0 ? 'good' : 'bad'} />
          <Kpi label="SL$ / TP$" value={`${money(calc.slAmount)} / ${money(calc.tpAmount)}`} />
        </div>
      </Panel>
      <Panel title="Trade Information">
        <div className="form-grid">
          <Field label="Date"><input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required /></Field>
          <Field label="Session"><Select options={options.session} value={form.session} onChange={(v) => set('session', v)} /></Field>
          <Field label="Mode"><Select options={options.mode} value={form.mode} onChange={(v) => set('mode', v)} /></Field>
          <Field label="Entry time"><input type="time" value={form.entryTime || ''} onChange={(e) => set('entryTime', e.target.value)} /></Field>
          <Field label="Exit time"><input type="time" value={form.exitTime || ''} onChange={(e) => set('exitTime', e.target.value)} /></Field>
          <Field label="Duration Time"><input value={form.durationTime || ''} onChange={(e) => set('durationTime', e.target.value)} placeholder="Auto from time" readOnly={!!form.entryTime && !!form.exitTime} /></Field>
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
          <Field label="Max Tick"><input type="number" step="any" value={form.maxTick ?? ''} onChange={(e) => set('maxTick', e.target.value)} /></Field>
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
          <Field label="Picture URL"><input value={form.pictureUrl || ''} onChange={(e) => set('pictureUrl', e.target.value)} /></Field>
          <Field label="Tip URL"><input value={form.tipUrl || ''} onChange={(e) => set('tipUrl', e.target.value)} /></Field>
        </div>
        <div className="actions"><button className="primary" type="submit"><Save size={16} />{editing ? 'Update trade' : 'Save trade'}</button>{editing && <button type="button" onClick={() => setEditing(null)}>Cancel</button>}</div>
      </Panel>
    </form>
  </section>;
}

function HistoryPage({ api, accountId, account, trades, setTrades, setEditing, setToast }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const ledger = computeLedger(trades, account?.startingBalance || 50000);
  const list = ledger.filter((t) => (filter === 'all' || t.result === filter) && JSON.stringify(t).toLowerCase().includes(q.toLowerCase()));
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
    <div className="table-wrap"><table><thead><tr>{['Date','Asset','Session','Mode','Dir','Ticks','RR','SL$','TP$','Balance','Con Loss','DD%','Setup','P&L','Charts',''].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>
      {list.map((t) => <tr key={t.id}><td>{t.date}<small>{t.entryTime}{t.durationTime ? ` / ${t.durationTime}` : ''}</small></td><td>{t.asset}</td><td>{t.session}</td><td>{t.mode || '-'}</td><td>{t.direction}</td><td>{t.tpTicks || '-'} / {t.slTicks || '-'}<small>Max {t.maxTick ?? '-'}</small></td><td>{fmtR(t.plannedR)}<small>Max {fmtR(t.maxR)}</small></td><td>{money(t.slAmount)}</td><td>{money(t.tpAmount)}<small>{pct(t.tpPercent * 100)}</small></td><td>{money(t.balanceAfter)}</td><td>{t.conLoss || 0}<small>{money(t.sumConLossAmount || 0)}</small></td><td>{pct(t.ddLossPct * 100)}<small>{pct(t.sumDdLossPct * 100)}</small></td><td><b>{t.setupGrade}</b><small>{t.htfBias} {t.htfPoi}</small></td><td className={t.pnl >= 0 ? 'pos' : 'neg'}>{money(t.pnl)}</td><td><ChartLinks trade={t} /></td><td className="row-actions"><button onClick={() => setEditing(t)}>Edit</button><button onClick={() => del(t.id)}><Trash2 size={14} /></button></td></tr>)}
    </tbody></table></div>
  </section>;
}

function ChartLinks({ trade }) {
  const links = [
    ['H', trade.chartHtf],
    ['M', trade.chartMtf],
    ['L', trade.chartLtf],
    ['P', trade.pictureUrl],
    ['T', trade.tipUrl]
  ];
  return <table className="chart-link-table"><thead><tr>{links.map(([label]) => <th key={label}>{label}</th>)}</tr></thead><tbody><tr>{links.map(([label, url]) => <td key={label}>{url ? <a href={url} target="_blank" rel="noreferrer">↗</a> : <span>-</span>}</td>)}</tr></tbody></table>;
}

function CalendarPage({ trades }) {
  const days = useMemo(() => groupBy(computeLedger(trades), 'date').map((d) => ({ ...d, name: d.name.slice(5) })).sort((a, b) => a.name.localeCompare(b.name)), [trades]);
  return <section><Header title="Calendar" hint="Daily P&L heatmap and activity" /><Panel title="Daily Results"><ChartWrap empty={!days.length}><BarChart data={days}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v) => money(v)} /><Bar dataKey="pnl">{days.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#2f855a' : '#c2410c'} />)}</Bar></BarChart></ChartWrap></Panel></section>;
}

const dimensionOptions = [
  ['entryHour', 'Entry Time'],
  ['session', 'Session'],
  ['ltfEntry', 'LTF Entry'],
  ['htfBias', 'HTF Bias'],
  ['htfPoi', 'HTF POI'],
  ['mtfStructure', 'MTF Structure'],
  ['keyZone', 'Key Zone'],
  ['setupGrade', 'Setup Grade'],
  ['ruleViolation', 'Rule Violation'],
  ['emotionAfter', 'Emotion'],
  ['dayName', 'Day']
];

const metricOptions = [
  ['trades', 'Trades'],
  ['pnl', 'Net P&L'],
  ['winRate', 'Winrate'],
  ['avgRr', 'Avg RR'],
  ['avgTick', 'Avg Tick'],
  ['avgDuration', 'Avg Duration']
];

function metricValue(row, metric) {
  return metric === 'winRate' ? row.winRate * 100 : Number(row[metric] || 0);
}

function metricLabel(metric, value) {
  if (metric === 'pnl') return money(value);
  if (metric === 'winRate') return pct(value);
  if (metric === 'avgRr') return fmtR(value);
  if (metric === 'avgDuration') return fmtMinutes(value);
  if (metric === 'avgTick') return Number(value || 0).toFixed(1);
  return value;
}

function BuilderChart({ data, metric, chartType }) {
  const rows = data.map((row) => ({ ...row, value: metricValue(row, metric) }));
  if (chartType === 'pie') {
    return <PieChart><Pie data={rows} dataKey="value" nameKey="name" outerRadius={92}>{rows.map((_, i) => <Cell key={i} fill={['#1f7a8c','#bf9b30','#5a6578','#a24936','#6a7f4e'][i % 5]} />)}</Pie><Tooltip formatter={(v) => metricLabel(metric, v)} /></PieChart>;
  }
  if (chartType === 'line') {
    return <LineChart data={rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v) => metricLabel(metric, v)} /><Line type="monotone" dataKey="value" stroke="#bf9b30" strokeWidth={2} dot /></LineChart>;
  }
  return <BarChart data={rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v) => metricLabel(metric, v)} /><Bar dataKey="value" fill="#1f7a8c" /></BarChart>;
}

function AnalyticsPage({ trades, stats, account }) {
  const [dimension, setDimension] = useState('htfBias');
  const [builderDimension, setBuilderDimension] = useState('entryHour');
  const [builderMetric, setBuilderMetric] = useState('pnl');
  const [chartType, setChartType] = useState('bar');
  const ledger = computeLedger(trades, account?.startingBalance || 50000);
  const data = groupBy(ledger, dimension);
  const builderData = groupBy(ledger, builderDimension).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const dayRows = summaryRows(ledger, 'dayName', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const weekRows = summaryRows(ledger, 'weekNumber');
  const monthRows = summaryRows(ledger, 'monthNumber', Array.from({ length: 12 }, (_, i) => i + 1));
  return <section>
    <Header title="Analytics" hint="Find your edge by structure, time, psychology, and RR behavior" />
    <div className="kpi-grid"><Kpi label="Trades" value={stats.total} /><Kpi label="Win / Loss / Miss" value={`${stats.wins} / ${stats.losses} / ${stats.miss}`} /><Kpi label="Avg Duration" value={fmtMinutes(stats.avgDuration)} /><Kpi label="Asia RR / Tick" value={`${fmtR(stats.asiaAvgRr)} / ${Number(stats.asiaAvgTick || 0).toFixed(1)}`} /><Kpi label="Best Time" value={stats.bestEntryHour?.name || '-'} /><Kpi label="Best RR Hypothesis" value={money(stats.bestRr?.value || 0)} /></div>
    <Panel title="Custom Analyzer"><div className="builder-controls"><Field label="Dimension"><select value={builderDimension} onChange={(e) => setBuilderDimension(e.target.value)}>{dimensionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Metric"><select value={builderMetric} onChange={(e) => setBuilderMetric(e.target.value)}>{metricOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Chart"><select value={chartType} onChange={(e) => setChartType(e.target.value)}><option value="bar">Bar</option><option value="line">Line</option><option value="pie">Pie</option></select></Field></div><ChartWrap empty={!builderData.length}><BuilderChart data={builderData} metric={builderMetric} chartType={chartType} /></ChartWrap></Panel>
    <div className="grid two">
      <Panel title="Breakdown"><div className="toolbar"><select value={dimension} onChange={(e) => setDimension(e.target.value)}>{dimensionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><ChartWrap empty={!data.length}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v, n) => n === 'pnl' ? money(v) : v} /><Bar dataKey="wins" stackId="a" fill="#2f855a" /><Bar dataKey="losses" stackId="a" fill="#c2410c" /><Bar dataKey="pnl" fill="#1f7a8c" /></BarChart></ChartWrap></Panel>
      <Panel title="RR Recommendation"><div className="table-wrap slim"><table><thead><tr><th>RR</th><th>Qualifying wins</th><th>Win Rate</th><th>Hypothetical value</th></tr></thead><tbody>{stats.rrRows.map((r) => <tr key={r.level} className={r.level === stats.bestRr?.level ? 'selected' : ''}><td>{fmtR(r.level)}</td><td>{r.count}</td><td>{pct(r.winRate * 100)}</td><td>{money(r.value)}</td></tr>)}</tbody></table></div></Panel>
    </div>
    <div className="grid three summary-grid">
      <SummaryTable title="Day Summary" rows={dayRows} />
      <SummaryTable title="Week Summary" rows={weekRows} />
      <SummaryTable title="Month Summary" rows={monthRows} />
    </div>
  </section>;
}

function summaryRows(trades, key, fixed = null) {
  const keys = fixed || [...new Set(trades.map((t) => t[key]).filter(Boolean))].sort((a, b) => Number(a) - Number(b));
  return keys.map((name) => {
    const rows = trades.filter((t) => t[key] === name);
    const wins = rows.filter((t) => t.result === 'win');
    const losses = rows.filter((t) => t.result === 'loss' || t.result === 'reversed');
    const miss = rows.filter((t) => t.result === 'miss');
    const decided = wins.length + losses.length + miss.length;
    return {
      name,
      wins: wins.length,
      losses: losses.length,
      miss: miss.length,
      count: rows.length,
      winRate: decided ? wins.length / decided : 0,
      tp: rows.reduce((sum, t) => sum + (t.result === 'win' ? Number(t.tpAmount || 0) : 0), 0),
      sl: rows.reduce((sum, t) => sum + ((t.result === 'loss' || t.result === 'reversed') ? Number(t.slAmount || 0) : 0), 0)
    };
  });
}

function SummaryTable({ title, rows }) {
  return <Panel title={title}><div className="table-wrap slim"><table><thead><tr><th>Name</th><th>Count</th><th>W/L/M</th><th>Winrate</th><th>$</th></tr></thead><tbody>{rows.map((r) => <tr key={r.name}><td>{r.name}</td><td>{r.count}</td><td>{r.wins}/{r.losses}/{r.miss}</td><td>{pct(r.winRate * 100)}</td><td className={r.tp - r.sl >= 0 ? 'pos' : 'neg'}>{money(r.tp - r.sl)}</td></tr>)}</tbody></table></div></Panel>;
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

function SettingsPage({ api, accounts, account, options, assets, portfolioLimit, user, setCurrentUser, reload, setToast }) {
  const [name, setName] = useState(account?.name || '');
  const [balance, setBalance] = useState(account?.startingBalance || 50000);
  const [optionDrafts, setOptionDrafts] = useState({});
  const [assetDrafts, setAssetDrafts] = useState([]);
  const [savingOption, setSavingOption] = useState('');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [visiblePasswords, setVisiblePasswords] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });
  const [profile, setProfile] = useState(user?.profile || {});
  useEffect(() => { setName(account?.name || ''); setBalance(account?.startingBalance || 50000); }, [account?.id]);
  useEffect(() => setOptionDrafts(Object.fromEntries(Object.entries(options).map(([key, vals]) => [key, vals.join('\n')]))), [options]);
  useEffect(() => setAssetDrafts(assets.map((asset) => ({ ...asset }))), [assets]);
  useEffect(() => setProfile(user?.profile || {}), [user?.id, user?.profile]);
  async function saveAccount() {
    await api(`/accounts/${account.id}`, { method: 'PUT', body: JSON.stringify({ name, type: account.type, startingBalance: balance }) });
    await reload(account.id);
    setToast('Settings saved');
  }
  async function addAccount() {
    if (accounts.length >= portfolioLimit) {
      setToast(`Portfolio limit reached (${portfolioLimit})`);
      return;
    }
    const data = await api('/accounts', { method: 'POST', body: JSON.stringify({ name: 'New Account', type: 'live', startingBalance: 50000 }) });
    await reload(data.id);
    setToast('Portfolio created');
  }
  async function deleteAccount(id) {
    if (!confirm('Delete this portfolio and all trades inside it?')) return;
    await api(`/accounts/${id}`, { method: 'DELETE' });
    await reload();
    setToast('Portfolio deleted');
  }
  async function resetAccount(id) {
    if (!confirm('Reset this portfolio? All trades and playbook notes inside it will be removed.')) return;
    await api(`/accounts/${id}/reset`, { method: 'POST' });
    await reload(id);
    setToast('Portfolio reset');
  }
  async function changePassword() {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setToast('New passwords do not match');
      return;
    }
    await api('/me/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
    });
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setToast('Password changed');
  }
  async function saveProfile() {
    const data = await api('/me/profile', { method: 'PUT', body: JSON.stringify({ profile }) });
    setCurrentUser(data.user);
    setToast('Profile saved');
  }
  async function chooseProfileImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const image = await resizeProfileImage(file);
      setProfile({ ...profile, image });
      setToast('Profile image resized to 250x250');
    } catch (error) {
      setToast(error.message || 'Could not load image');
    } finally {
      event.target.value = '';
    }
  }
  async function saveOption(key) {
    const values = [...new Set(String(optionDrafts[key] || '').split('\n').map((value) => value.trim()).filter(Boolean))];
    setSavingOption(key);
    try {
      await api(`/options/${key}`, { method: 'PUT', body: JSON.stringify({ label: key, options: values }) });
      await reload(account.id);
      setToast('Options saved');
    } catch (error) {
      setToast(error.message || 'Could not save options');
    } finally {
      setSavingOption('');
    }
  }
  async function saveAsset(asset) {
    if (asset.id) await api(`/assets/${asset.id}`, { method: 'PUT', body: JSON.stringify(asset) });
    else await api('/assets', { method: 'POST', body: JSON.stringify(asset) });
    await reload(account.id);
    setToast('Asset saved');
  }
  async function deleteAsset(asset) {
    if (!asset.id) {
      setAssetDrafts(assetDrafts.filter((row) => row !== asset));
      return;
    }
    await api(`/assets/${asset.id}`, { method: 'DELETE' });
    await reload(account.id);
    setToast('Asset deleted');
  }
  function updateAsset(index, key, value) {
    setAssetDrafts(assetDrafts.map((asset, i) => i === index ? { ...asset, [key]: value } : asset));
  }
  function togglePassword(key) {
    setVisiblePasswords({ ...visiblePasswords, [key]: !visiblePasswords[key] });
  }
  return <section><Header title="Settings" hint={`Portfolios, presets, and customizable field options (${accounts.length}/${portfolioLimit})`} action={<button onClick={addAccount} disabled={accounts.length >= portfolioLimit}><Plus size={16} />New portfolio</button>} />
    <Panel title="Profile"><div className="profile-settings">
      <div className="profile-upload">
        <div className="profile-photo preview">{profile.image ? <img src={profile.image} alt="" /> : <UserRound size={96} strokeWidth={1.2} />}</div>
        <label className="upload-button"><Upload size={15} />Upload 250x250<input type="file" accept="image/*" onChange={chooseProfileImage} /></label>
      </div>
      <div className="profile-fields">
        <div className="form-grid compact"><Field label="Nickname"><input value={profile.nickname || ''} onChange={(e) => setProfile({ ...profile, nickname: e.target.value })} placeholder="Nick Name" /></Field><Field label="Show contact"><select value={profile.contactType || 'email'} onChange={(e) => setProfile({ ...profile, contactType: e.target.value })}>{Object.entries(profileContactLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field></div>
        <div className="form-grid compact"><Field label="Phone"><input value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="Phone number" /></Field><Field label="E-mail"><input type="email" value={profile.email || ''} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder={user?.email || 'name@email.com'} /></Field><Field label="Facebook"><input value={profile.facebook || ''} onChange={(e) => setProfile({ ...profile, facebook: e.target.value })} placeholder="Facebook" /></Field><Field label="Line"><input value={profile.line || ''} onChange={(e) => setProfile({ ...profile, line: e.target.value })} placeholder="Line ID" /></Field></div>
        <div className="profile-preview-line">Preview: <b>{profile.nickname || 'Nick Name'}</b><span>{profileContact(profile, user?.email) || profileContactLabels[profile.contactType || 'email']}</span></div>
        <div className="actions"><button className="primary" onClick={saveProfile}><Save size={16} />Save profile</button></div>
      </div>
    </div></Panel>
    <div className="grid two settings-lower"><Panel title="Portfolio Management"><div className="form-grid"><Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} /></Field><Field label="Starting Balance"><input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} /></Field></div><div className="actions"><button className="primary" onClick={saveAccount}><Save size={16} />Save portfolio</button><button onClick={() => resetAccount(account.id)}>Reset</button>{accounts.length > 1 && <button onClick={() => deleteAccount(account.id)}><Trash2 size={14} />Delete</button>}</div><div className="portfolio-list">{accounts.map((row) => <button key={row.id} className={row.id === account?.id ? 'selected' : ''}>{row.name}</button>)}</div></Panel>
    <Panel title="Security"><div className="form-grid"><Field label="Current password"><PasswordInput value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} visible={visiblePasswords.currentPassword} onToggle={() => togglePassword('currentPassword')} autoComplete="current-password" /></Field><Field label="New password"><PasswordInput value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} visible={visiblePasswords.newPassword} onToggle={() => togglePassword('newPassword')} autoComplete="new-password" /></Field><Field label="Confirm password"><PasswordInput value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} visible={visiblePasswords.confirmPassword} onToggle={() => togglePassword('confirmPassword')} autoComplete="new-password" /></Field></div><div className="actions"><button className="primary" onClick={changePassword} disabled={!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword}><Save size={16} />Change password</button></div></Panel></div>
    <div className="grid two settings-lower"><Panel title="Asset Presets"><div className="asset-editor">{assetDrafts.map((asset, index) => <div className="asset-row" key={asset.id || index}><input value={asset.symbol} onChange={(e) => updateAsset(index, 'symbol', e.target.value)} placeholder="Symbol" /><input type="number" step="any" value={asset.tickSize} onChange={(e) => updateAsset(index, 'tickSize', e.target.value)} placeholder="Point" /><input type="number" step="any" value={asset.dollarPerPoint} onChange={(e) => updateAsset(index, 'dollarPerPoint', e.target.value)} placeholder="Lot1 point/$" /><button onClick={() => saveAsset(asset)}><Save size={14} /></button><button onClick={() => deleteAsset(asset)}><Trash2 size={14} /></button></div>)}<button onClick={() => setAssetDrafts([...assetDrafts, { symbol: '', tickSize: 1, dollarPerPoint: 1 }])}><Plus size={16} />Add asset</button></div></Panel>
    <Panel title="Account note"><div className="empty compact-empty">Use Security to update your own password. Admins can manage roles, status, and portfolio limits from the Admin page.</div></Panel></div>
    <Panel title="Field Options"><div className="option-editor">{Object.entries(optionDrafts).map(([key, value]) => <div className="option-card" key={key}><Field label={key}><textarea value={value} onChange={(e) => setOptionDrafts({ ...optionDrafts, [key]: e.target.value })} /></Field><button onClick={() => saveOption(key)} disabled={savingOption === key}><Save size={14} />{savingOption === key ? 'Saving...' : `Save ${key}`}</button></div>)}</div></Panel></section>;
}

function CoachPage({ api, token, currentUser, viewUserId, setViewUserId }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(null);
  const [dirty, setDirty] = useState(new Set());
  const [emailStatus, setEmailStatus] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [emailTest, setEmailTest] = useState('');
  async function load() {
    setError('');
    try {
      const [team, email, system] = await Promise.all([
        api('/admin/team'),
        currentUser?.role === 'admin' ? api('/admin/email/status') : Promise.resolve(null),
        currentUser?.role === 'admin' ? api('/admin/system/status') : Promise.resolve(null)
      ]);
      setRows(team.users);
      setEmailStatus(email?.email || null);
      setSystemStatus(system?.system || null);
      setDirty(new Set());
    } catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);
  function updateRow(id, key, value) {
    setRows(rows.map((row) => row.id === id ? { ...row, [key]: value } : row));
    setDirty((current) => new Set([...current, id]));
  }
  async function save(row) {
    setSaving(row.id);
    try {
      const data = await api(`/admin/users/${row.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          role: row.role,
          status: row.status,
          portfolioLimit: row.portfolioLimit,
          emailVerified: row.emailVerified
        })
      });
      setRows(rows.map((item) => item.id === row.id ? { ...item, ...data.user } : item));
      setDirty((current) => {
        const next = new Set(current);
        next.delete(row.id);
        return next;
      });
    } finally {
      setSaving(null);
    }
  }
  async function saveAll() {
    for (const row of rows.filter((item) => dirty.has(item.id))) {
      await save(row);
    }
  }
  async function testEmail() {
    setEmailTest('Sending...');
    try {
      const result = await api('/admin/email/test', {
        method: 'POST',
        body: JSON.stringify({ to: currentUser?.email })
      });
      setEmailTest(`Sent to ${result.sentTo}`);
    } catch (err) {
      setEmailTest(err.message);
    }
  }
  async function downloadExport(path, filename) {
    const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Export failed');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  async function exportBackup() {
    await downloadExport('/admin/export/json', `mrz-trading-journal-backup-${today()}.json`);
  }
  async function exportTrades() {
    await downloadExport('/admin/export/trades.csv', `mrz-trading-journal-trades-${today()}.csv`);
  }
  if (!['coach', 'admin'].includes(currentUser?.role)) {
    return <section><Header title="Admin" hint="Admin and coach users only" /><div className="empty">No admin access for this account.</div></section>;
  }
  return <section><Header title="Admin" hint="Manage users, permissions, email verification, and portfolio access" action={<div className="admin-actions"><button onClick={load}><Shield size={16} />Refresh</button>{currentUser?.role === 'admin' && <button className="primary" onClick={saveAll} disabled={!dirty.size || saving}><Save size={16} />Save changes</button>}</div>} />{error && <div className="empty">{error}</div>}
    {currentUser?.role === 'admin' && <Panel title="System status"><div className="status-grid"><div><span>Database</span><b className={systemStatus?.database === 'Postgres' ? 'pos' : 'neg'}>{systemStatus?.database || '-'}</b></div><div><span>Demo account</span><b className={systemStatus?.demoLocked ? 'pos' : 'neg'}>{systemStatus?.demoLocked ? 'Locked' : 'Open'}</b></div><div><span>Email</span><b className={systemStatus?.email?.configured ? 'pos' : 'neg'}>{systemStatus?.email?.configured ? 'Ready' : 'Needs SMTP'}</b></div><div><span>Export</span><b className={systemStatus?.exportReady ? 'pos' : 'neg'}>{systemStatus?.exportReady ? 'Ready' : 'Check'}</b></div><div><span>Users</span><b>{systemStatus?.counts?.users ?? '-'}</b></div><div><span>Trades</span><b>{systemStatus?.counts?.trades ?? '-'}</b></div></div></Panel>}
    {currentUser?.role === 'admin' && <Panel title="Email delivery"><div className="email-status"><div><b className={emailStatus?.configured ? 'pos' : 'neg'}>{emailStatus?.configured ? 'SMTP configured' : 'SMTP not configured'}</b><p>{emailStatus?.configured ? `${emailStatus.host}:${emailStatus.port} • From ${emailStatus.from || '-'}` : 'Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and MAIL_FROM in Render Environment.'}</p>{emailTest && <small>{emailTest}</small>}</div><button onClick={testEmail} disabled={!emailStatus?.configured || !currentUser?.email}><Mail size={16} />Send test email</button></div></Panel>}
    {currentUser?.role === 'admin' && <Panel title="Backup & export"><div className="email-status"><div><b>Download data backup</b><p>Export a full JSON backup or trades-only CSV for spreadsheet analysis.</p></div><div className="admin-actions"><button onClick={exportBackup}><Download size={16} />JSON backup</button><button onClick={exportTrades}><Download size={16} />Trades CSV</button></div></div></Panel>}
    <div className="table-wrap"><table><thead><tr><th>User</th><th>Actions</th><th>Email</th><th>Role</th><th>Status</th><th>Verified</th><th>Portfolios</th><th>Trades</th><th>Net P&L</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id} className={viewUserId === r.id ? 'selected' : ''}><td><b>{r.username}</b>{dirty.has(r.id) && <small>Unsaved</small>}</td><td className="row-actions admin-row-actions"><button onClick={() => setViewUserId(r.id)}><UserRound size={14} />Open</button>{currentUser?.role === 'admin' && <button className={dirty.has(r.id) ? 'primary' : ''} onClick={() => save(r)} disabled={saving === r.id || !dirty.has(r.id)}><Save size={14} />Save</button>}</td><td>{r.email || '-'}</td><td><select value={r.role} onChange={(e) => updateRow(r.id, 'role', e.target.value)} disabled={currentUser?.role !== 'admin'}><option value="trader">trader</option><option value="coach">coach</option><option value="admin">admin</option></select></td><td><select value={r.status || 'active'} onChange={(e) => updateRow(r.id, 'status', e.target.value)} disabled={currentUser?.role !== 'admin'}><option value="active">active</option><option value="suspended">suspended</option></select></td><td><label className="table-check"><input type="checkbox" checked={!!r.emailVerified} onChange={(e) => updateRow(r.id, 'emailVerified', e.target.checked)} disabled={currentUser?.role !== 'admin'} />Yes</label></td><td><input className="tiny-input" type="number" min="1" max="5" value={r.portfolioLimit || 5} onChange={(e) => updateRow(r.id, 'portfolioLimit', e.target.value)} disabled={currentUser?.role !== 'admin'} /> <small>{r.portfolios || 0} used</small></td><td>{r.totalTrades}</td><td className={r.netPnl >= 0 ? 'pos' : 'neg'}>{money(r.netPnl)}</td></tr>)}</tbody></table></div></section>;
}

function Header({ title, hint, action }) { return <div className="page-head"><div><h1>{title}</h1><p>{hint}</p></div>{action}</div>; }
function Panel({ title, children }) { return <div className="panel"><div className="panel-title">{title}</div>{children}</div>; }
function Kpi({ label, value, tone }) { return <div className={`kpi ${tone || ''}`}><span>{label}</span><b>{value}</b></div>; }
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }
function Select({ options = [], value, onChange }) { return <select value={value || ''} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o}>{o}</option>)}</select>; }
function ChartWrap({ empty, children }) { return <div className="chart-wrap">{empty ? <div className="empty">No data yet</div> : <ResponsiveContainer width="100%" height={300}>{children}</ResponsiveContainer>}</div>; }

createRoot(document.getElementById('root')).render(<App />);

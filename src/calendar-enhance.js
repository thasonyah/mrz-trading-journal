import Chart from 'chart.js/auto';

const API = import.meta.env.VITE_API_BASE
  || (location.hostname === '127.0.0.1' && location.port === '5173' ? 'http://127.0.0.1:5174/api' : '/api');

const chartColors = {
  gold: '#e0a92e',
  goldSoft: 'rgba(224, 169, 46, 0.28)',
  win: '#2ecb70',
  winSoft: 'rgba(46, 203, 112, 0.26)',
  loss: '#e5484d',
  lossSoft: 'rgba(229, 72, 77, 0.26)',
  muted: '#8b8d99',
  grid: '#22242c'
};

const money = (n) => Number.isFinite(Number(n))
  ? `${Number(n) < 0 ? '-' : ''}$${Math.abs(Number(n)).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`
  : '-';
const today = () => dateKey(new Date());

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shortDate(dateString) {
  return dateString ? dateString.slice(5) : '';
}

function startOfWeek(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return dateKey(date);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

function weekLabel(weekStart) {
  return `${shortDate(weekStart)} - ${shortDate(addDays(weekStart, 4))}`;
}

function longDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function monthTitle(monthKey) {
  const date = new Date(`${monthKey}-01T00:00:00`);
  return Number.isNaN(date.getTime()) ? monthKey : date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function shiftMonth(monthKey, offset) {
  const date = new Date(`${monthKey}-01T00:00:00`);
  date.setMonth(date.getMonth() + offset);
  return dateKey(date).slice(0, 7);
}

function monthDays(monthKey) {
  const first = new Date(`${monthKey}-01T00:00:00`);
  const start = new Date(first);
  const offset = first.getDay() === 0 ? 6 : first.getDay() - 1;
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const date = dateKey(day);
    return { date, day: day.getDate(), inMonth: date.startsWith(monthKey), isToday: date === dateKey(new Date()) };
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function fmtR(value) {
  return Number.isFinite(Number(value)) ? `${Number(value).toFixed(2)}R` : '-';
}

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    animation: { duration: 650, easing: 'easeOutQuart' },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: chartColors.muted,
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: 'rectRounded',
          padding: 14
        }
      },
      tooltip: {
        backgroundColor: '#101116',
        borderColor: '#2f313b',
        borderWidth: 1,
        titleColor: '#e8e9ee',
        bodyColor: '#d9d5d3',
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label(context) {
            const label = context.dataset.label ? `${context.dataset.label}: ` : '';
            return `${label}${money(context.parsed?.y ?? context.parsed)}`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: { color: 'rgba(34, 36, 44, 0.55)', drawBorder: false },
        ticks: { color: chartColors.muted, maxRotation: 0, autoSkipPadding: 14 }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: chartColors.grid, drawBorder: false },
        ticks: { color: chartColors.muted, callback: (value) => money(value) }
      }
    }
  };
}

function dailyResultChart(rows) {
  return {
    labels: rows.map((row) => row.label || shortDate(row.date)),
    datasets: [
      {
        label: 'Daily P&L',
        data: rows.map((row) => Number(row.pnl || 0)),
        backgroundColor: rows.map((row) => Number(row.pnl || 0) >= 0 ? chartColors.winSoft : chartColors.lossSoft),
        borderColor: rows.map((row) => Number(row.pnl || 0) >= 0 ? chartColors.win : chartColors.loss),
        borderWidth: 1,
        borderRadius: 5,
        stack: 'daily-result'
      },
      {
        label: 'Commission',
        data: rows.map((row) => -Math.abs(Number(row.commission || 0))),
        backgroundColor: chartColors.goldSoft,
        borderColor: chartColors.gold,
        borderWidth: 1,
        borderRadius: 5,
        stack: 'daily-result'
      },
      {
        label: 'SL',
        data: rows.map((row) => -Math.abs(Number(row.sl || 0))),
        backgroundColor: chartColors.lossSoft,
        borderColor: chartColors.loss,
        borderWidth: 1,
        borderRadius: 5,
        stack: 'daily-result'
      }
    ]
  };
}

function resultClass(result) {
  if (result === 'win') return 'win';
  if (result === 'miss') return 'miss';
  if (result === 'breakeven') return 'be';
  return 'loss';
}

function tradePnl(trade) {
  return Number(trade.pnl ?? trade.netPnl ?? 0);
}

function filteredTrades(state) {
  const q = state.query.trim().toLowerCase();
  if (!q) return state.trades;
  return state.trades.filter((trade) => JSON.stringify(trade).toLowerCase().includes(q));
}

function dailyMap(trades) {
  const map = new Map();
  trades.forEach((trade) => {
    if (!trade.date) return;
    const current = map.get(trade.date) || { date: trade.date, label: shortDate(trade.date), pnl: 0, sl: 0, commission: 0, wins: 0, losses: 0, misses: 0, breakevens: 0, trades: [] };
    current.pnl += tradePnl(trade);
    current.sl += trade.result === 'loss' || trade.result === 'reversed' ? Number(trade.slAmount || 0) : 0;
    current.commission += Number(trade.commissionAmount || 0);
    current.trades.push(trade);
    if (trade.result === 'win') current.wins += 1;
    if (trade.result === 'loss' || trade.result === 'reversed') current.losses += 1;
    if (trade.result === 'miss') current.misses += 1;
    if (trade.result === 'breakeven') current.breakevens += 1;
    map.set(trade.date, current);
  });
  return map;
}

function weekOptions(trades) {
  return [...new Set(trades.filter((trade) => trade.date).map((trade) => startOfWeek(trade.date)))].sort();
}

function weekRows(trades, activeWeek) {
  if (!activeWeek) return [];
  return Array.from({ length: 5 }, (_, index) => {
    const date = addDays(activeWeek, index);
    const rows = trades.filter((trade) => trade.date === date);
    return {
      date,
      label: shortDate(date),
      pnl: rows.reduce((sum, trade) => sum + tradePnl(trade), 0),
      sl: rows.reduce((sum, trade) => sum + ((trade.result === 'loss' || trade.result === 'reversed') ? Number(trade.slAmount || 0) : 0), 0),
      commission: rows.reduce((sum, trade) => sum + Number(trade.commissionAmount || 0), 0),
      trades: rows.length
    };
  });
}

function chartLinks(trade) {
  return [['H', trade.chartHtf], ['M', trade.chartMtf], ['L', trade.chartLtf], ['P', trade.pictureUrl], ['T', trade.tipUrl]]
    .map(([label, url]) => `<td>${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">↗</a>` : '<span>-</span>'}</td>`)
    .join('');
}

function lightbox(day) {
  const trades = [...(day.trades || [])].sort((a, b) => String(a.entryTime || '').localeCompare(String(b.entryTime || '')));
  const body = trades.length ? trades.map((trade, index) => `
    <article class="order-card">
      <div class="order-top">
        <div class="order-index">${index + 1}</div>
        <div>
          <h3>${escapeHtml(trade.ltfEntry || trade.mtfStructure || trade.setupGrade || 'Trade setup')}</h3>
          <p>${escapeHtml(trade.asset || '-')} • ${escapeHtml(trade.direction || '-')} • ${escapeHtml(trade.entryTime || '--:--')}${trade.exitTime ? ` - ${escapeHtml(trade.exitTime)}` : ''}</p>
        </div>
        <span class="result-badge ${escapeHtml(trade.result || '')}">${escapeHtml(trade.result || '-')}</span>
      </div>
      <div class="order-metrics">
        <div><span>RR</span><b>${fmtR(trade.actualR || trade.plannedR)}</b></div>
        <div><span>P&L</span><b class="${tradePnl(trade) >= 0 ? 'pos' : 'neg'}">${money(tradePnl(trade))}</b></div>
        <div><span>SESSION</span><b>${escapeHtml(trade.session || '-')}</b></div>
        <div><span>LTF</span><b>${escapeHtml(trade.ltfEntry || '-')}</b></div>
        <div><span>MAX TICK</span><b>${escapeHtml(trade.maxTick ?? '-')}</b></div>
        <div><span>FEE</span><b>${money(trade.commissionAmount || 0)}</b></div>
      </div>
      <div class="order-notes">
        <span>${escapeHtml(trade.notes || '-')}</span>
        <table class="chart-link-table"><thead><tr><th>H</th><th>M</th><th>L</th><th>P</th><th>T</th></tr></thead><tbody><tr>${chartLinks(trade)}</tr></tbody></table>
      </div>
    </article>
  `).join('') : '<div class="empty">No trades logged for this day</div>';

  return `
    <div class="lightbox-backdrop" role="dialog" aria-modal="true">
      <div class="trade-lightbox">
        <button class="lightbox-close" type="button" aria-label="Close">×</button>
        <div class="lightbox-head">
          <div>
            <h2>Orders - ${longDate(day.date)}</h2>
            <p><b class="pos">${day.wins || 0}W</b><span>•</span><b class="neg">${day.losses || 0}L</b><span>•</span><b>${day.breakevens || 0}BE</b><span>•</span><b>${day.misses || 0} Miss</b><span>•</span><b>P&L: <em class="${day.pnl >= 0 ? 'pos' : 'neg'}">${money(day.pnl)}</em></b></p>
          </div>
          <div class="lightbox-totals">
            <span>Commission ${money(day.commission || 0)}</span>
            <span>SL ${money(day.sl || 0)}</span>
          </div>
        </div>
        <div class="order-list">${body}</div>
      </div>
    </div>
  `;
}

function calendarMarkup(state) {
  const matchingTrades = filteredTrades(state);
  const map = dailyMap(matchingTrades);
  const days = monthDays(state.month);
  const filtered = map;
  const visible = days.map((day) => filtered.get(day.date)).filter(Boolean);
  const monthNet = visible.reduce((sum, day) => sum + Number(day.pnl || 0), 0);
  const monthCommission = visible.reduce((sum, day) => sum + Number(day.commission || 0), 0);
  const weeks = weekOptions(matchingTrades);
  const activeWeek = weeks.includes(state.week) ? state.week : weeks.at(-1) || '';
  state.week = activeWeek;

  return `
    <div class="page-head"><div><h1>Calendar</h1><p>Month view, daily trade activity, and order drilldown</p></div></div>
    <div class="calendar-layout">
      <aside class="calendar-side panel">
        <div class="panel-title">Calendar Filters</div>
        <div class="calendar-mini-stats">
          <div><span>Month Net</span><b class="${monthNet >= 0 ? 'pos' : 'neg'}">${money(monthNet)}</b></div>
          <div><span>Commission</span><b>${money(monthCommission)}</b></div>
          <div><span>Trades</span><b>${visible.reduce((sum, day) => sum + day.trades.length, 0)}</b></div>
        </div>
        <div class="calendar-search"><input value="${escapeHtml(state.query)}" placeholder="Search asset, setup, note..." data-calendar-search /></div>
        <div class="calendar-legend">
          <span><i class="win-dot"></i>Win / profit</span>
          <span><i class="loss-dot"></i>Loss / SL</span>
          <span><i class="gold-dot"></i>Commission</span>
          <span><i class="blue-dot"></i>Setup note</span>
        </div>
      </aside>
      <div class="panel">
        <div class="panel-title">Month Calendar</div>
        <div class="calendar-toolbar">
          <div><h2>${monthTitle(state.month)}</h2><span>${visible.length ? `${visible.length} active trading days` : 'No trading days in this month'}</span></div>
          <div class="calendar-actions">
            <button type="button" data-calendar-prev>‹</button>
            <button type="button" data-calendar-today>Today</button>
            <button type="button" data-calendar-next>›</button>
          </div>
        </div>
        <div class="calendar-weekdays">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => `<span>${day}</span>`).join('')}</div>
        <div class="month-grid">
          ${days.map((day) => {
            const summary = filtered.get(day.date);
            const trades = summary?.trades || [];
            return `<button type="button" data-date="${day.date}" class="month-cell ${day.inMonth ? '' : 'muted'} ${day.isToday ? 'today' : ''} ${summary ? 'has-trades' : ''}">
              <span class="date-number">${day.day}</span>
              <div class="day-pills">
                ${trades.slice(0, 3).map((trade) => `<span class="trade-pill ${resultClass(trade.result)}">${escapeHtml(trade.asset || '-')} ${trade.result === 'win' ? money(tradePnl(trade)) : escapeHtml(String(trade.result || '').toUpperCase())}</span>`).join('')}
                ${trades.length > 3 ? `<span class="trade-pill more">+${trades.length - 3} more</span>` : ''}
              </div>
              ${summary ? `<div class="day-summary"><b class="${summary.pnl >= 0 ? 'pos' : 'neg'}">${money(summary.pnl)}</b><small>${summary.wins || 0}W / ${summary.losses || 0}L</small></div>` : ''}
            </button>`;
          }).join('')}
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-title">Daily Results</div>
      <div class="panel-toolbar">
        <span>${activeWeek ? `Week ${weekLabel(activeWeek)}` : 'No week selected'}</span>
        <select data-calendar-week ${weeks.length ? '' : 'disabled'}>
          ${weeks.map((week) => `<option value="${week}" ${week === activeWeek ? 'selected' : ''}>${weekLabel(week)}</option>`).join('')}
        </select>
      </div>
      <div class="chart-wrap tall">
        ${weeks.length ? '<canvas data-daily-results-chart></canvas>' : '<div class="empty">No data yet</div>'}
      </div>
    </div>
  `;
}

function renderDailyResultsChart(section) {
  if (state.chart) {
    state.chart.destroy();
    state.chart = null;
  }
  const canvas = section.querySelector('[data-daily-results-chart]');
  if (!canvas) return;
  const rows = weekRows(filteredTrades(state), state.week);
  state.chart = new Chart(canvas, {
    type: 'bar',
    data: dailyResultChart(rows),
    options: chartOptions()
  });
}

async function fetchTrades(accountId) {
  const token = localStorage.getItem('etj_token');
  if (!token) return [];
  if (!accountId) return [];
  const response = await fetch(`${API}/accounts/${accountId}/trades`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.trades || [];
}

let state = { month: today().slice(0, 7), week: '', query: '', trades: [], mounted: false, chart: null, accountId: '' };

async function mountCalendar() {
  const section = [...document.querySelectorAll('.workspace section')].find((node) => node.querySelector('h1')?.textContent?.trim() === 'Calendar');
  if (!section) return;
  const accountId = document.querySelector('.sidebar select')?.value;
  if (!accountId) return;
  if (section.dataset.ztjCalendar === 'ready' && state.accountId === accountId) return;
  const trades = await fetchTrades(accountId);
  const latest = trades.filter((trade) => trade.date).sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  state = { ...state, accountId, trades, month: latest?.date?.slice(0, 7) || state.month, week: latest?.date ? startOfWeek(latest.date) : state.week, mounted: true };
  render(section);
}

function render(section) {
  section.dataset.ztjCalendar = 'ready';
  if (state.chart) {
    state.chart.destroy();
    state.chart = null;
  }
  section.innerHTML = calendarMarkup(state);
  renderDailyResultsChart(section);
  section.querySelector('[data-calendar-prev]')?.addEventListener('click', () => {
    state.month = shiftMonth(state.month, -1);
    render(section);
  });
  section.querySelector('[data-calendar-next]')?.addEventListener('click', () => {
    state.month = shiftMonth(state.month, 1);
    render(section);
  });
  section.querySelector('[data-calendar-today]')?.addEventListener('click', () => {
    state.month = today().slice(0, 7);
    render(section);
  });
  section.querySelector('[data-calendar-search]')?.addEventListener('input', (event) => {
    state.query = event.target.value;
    render(section);
  });
  section.querySelector('[data-calendar-week]')?.addEventListener('change', (event) => {
    state.week = event.target.value;
    render(section);
  });
  section.querySelectorAll('[data-date]').forEach((button) => {
    button.addEventListener('click', () => {
      const day = dailyMap(state.trades).get(button.dataset.date) || { date: button.dataset.date, pnl: 0, sl: 0, commission: 0, wins: 0, losses: 0, misses: 0, breakevens: 0, trades: [] };
      document.body.insertAdjacentHTML('beforeend', lightbox(day));
      const backdrop = document.querySelector('.lightbox-backdrop');
      backdrop?.addEventListener('click', (event) => {
        if (event.target === backdrop || event.target.closest('.lightbox-close')) backdrop.remove();
      });
    });
  });
}

const observer = new MutationObserver(() => {
  window.requestAnimationFrame(mountCalendar);
});

observer.observe(document.body, { childList: true, subtree: true });
window.addEventListener('load', mountCalendar);

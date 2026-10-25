import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import 'chart.js/auto';
import { Chart as ReactChart } from 'react-chartjs-2';
import {
  BarChart3, BookOpen, CalendarDays, Download, FileText, Filter, Gauge, History, Mail,
  Eye, EyeOff, LayoutDashboard, LogOut, Pencil, Plus, RotateCcw, Save, Settings, Shield, SlidersHorizontal, Trash2, Upload, UserRound, X
} from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_BASE
  || (location.hostname === '127.0.0.1' && location.port === '5173' ? 'http://127.0.0.1:5174/api' : '/api');

const languages = [
  { code: 'th', label: 'ไทย', short: 'TH' },
  { code: 'en', label: 'English', short: 'EN' }
];

const translations = {
  en: {},
  th: {
    'Trading journal for structure, execution, psychology, and edge review.': 'สมุดบันทึกเทรดสำหรับโครงสร้างตลาด การเข้าเทรด จิตวิทยา และการหา edge',
    Login: 'เข้าสู่ระบบ',
    'Sign up': 'สมัครสมาชิก',
    Username: 'ชื่อผู้ใช้',
    Email: 'อีเมล',
    'Status message': 'ข้อความสถานะ',
    Token: 'โทเคน',
    Password: 'รหัสผ่าน',
    'Create Account': 'สร้างบัญชี',
    'Send reset link': 'ส่งลิงก์รีเซ็ตรหัสผ่าน',
    'Verify email': 'ยืนยันอีเมล',
    'Reset password': 'รีเซ็ตรหัสผ่าน',
    'Forgot password': 'ลืมรหัสผ่าน',
    'Show password': 'แสดงรหัสผ่าน',
    'Hide password': 'ซ่อนรหัสผ่าน',
    Dashboard: 'แดชบอร์ด',
    'Add Trade': 'เพิ่มรายการเทรด',
    'Edit Trade': 'แก้ไขรายการเทรด',
    History: 'ประวัติ',
    Calendar: 'ปฏิทิน',
    Analytics: 'วิเคราะห์',
    Playbook: 'เพลย์บุ๊ก',
    Settings: 'ตั้งค่า',
    Admin: 'แอดมิน',
    Portfolio: 'พอร์ต',
    Logout: 'ออกจากระบบ',
    Language: 'ภาษา',
    'POI to outcome': 'จาก POI สู่ผลลัพธ์',
    'trades logged': 'รายการที่บันทึก',
    'Log trade': 'บันทึกเทรด',
    'performance overview': 'ภาพรวมผลลัพธ์',
    'Backtest performance overview': 'ภาพรวมผลการ Backtest',
    'Gross P&L': 'กำไร/ขาดทุนก่อนหักค่าใช้จ่าย',
    Commission: 'ค่าคอมมิชชัน',
    'Net P&L': 'กำไร/ขาดทุนสุทธิ',
    'Win Rate': 'อัตราชนะ',
    'Profit Factor': 'Profit Factor',
    Expectancy: 'Expectancy',
    'Max Drawdown': 'Drawdown สูงสุด',
    'Avg Max RR': 'ค่าเฉลี่ย Max RR',
    'RR Min / Med / Max': 'RR ต่ำสุด / กลาง / สูงสุด',
    'Avg Duration': 'เวลาเฉลี่ย',
    'Asia RR / Tick': 'Asia RR / Tick',
    'Top LTF Entry': 'LTF Entry ที่ใช้บ่อยที่สุด',
    'Prop Firm Rules': 'กฎของพอร์ต Prop Firm',
    'Equity Curve': 'Equity Curve',
    'Daily Results': 'ผลลัพธ์รายวัน',
    'Entry Time Edge': 'ช่วงเวลาเข้าเทรดที่ได้เปรียบ',
    'LTF Entry Receive': 'LTF Entry Receive',
    Trades: 'รายการเทรด',
    Winrate: 'อัตราชนะ',
    'Avg RR': 'RR เฉลี่ย',
    'Avg Tick': 'Tick เฉลี่ย',
    'Latest Review Notes': 'บันทึกรีวิวล่าสุด',
    'Risk Engine': 'Risk Engine',
    Asset: 'สินทรัพย์',
    'Risk $': 'เงินที่เสี่ยง',
    Entry: 'จุดเข้า',
    'TP (Tick)': 'TP (Tick)',
    'SL (Tick)': 'SL (Tick)',
    Point: 'Point',
    Lot: 'Lot',
    Stop: 'Stop',
    Target: 'Target',
    '$ / point': '$ / point',
    'Planned RR': 'RR ที่วางแผน',
    'Suggested lot': 'Lot แนะนำ',
    'SL$ / TP$': 'SL$ / TP$',
    'Trade Information': 'ข้อมูลการเทรด',
    Date: 'วันที่',
    Session: 'Session',
    Mode: 'Mode',
    'Entry time': 'เวลาเข้า',
    'Exit time': 'เวลาออก',
    'Duration Time': 'ระยะเวลา',
    Direction: 'ทิศทาง',
    Result: 'ผลลัพธ์',
    Long: 'Long',
    Short: 'Short',
    Win: 'ชนะ',
    Loss: 'แพ้',
    Breakeven: 'เสมอ',
    Miss: 'พลาด',
    Reversed: 'กลับทาง',
    'POI and Structure': 'POI และโครงสร้าง',
    'HTF Bias': 'HTF Bias',
    'HTF POI': 'HTF POI',
    'MTF Structure': 'MTF Structure',
    'LTF Entry': 'LTF Entry',
    'Key Zone': 'Key Zone',
    'FVG Position': 'ตำแหน่ง FVG',
    'Grade, Excursion, Psychology': 'เกรด, Excursion, จิตวิทยา',
    'Setup Grade': 'เกรด Setup',
    'Setup Score': 'คะแนน Setup',
    'Max RR': 'Max RR',
    'Max Tick': 'Max Tick',
    'MFE / MAE': 'MFE / MAE',
    'Rule Violation': 'ผิดกฎ',
    'Emotion After': 'อารมณ์หลังเทรด',
    Calm: 'สงบ',
    Confident: 'มั่นใจ',
    Anxious: 'กังวล',
    Frustrated: 'หงุดหงิด',
    Greedy: 'โลภ',
    Impatient: 'ใจร้อน',
    Regretful: 'เสียใจ/เสียดาย',
    Reflection: 'บันทึกทบทวน',
    'Chart Journal': 'Chart Journal',
    'HTF Chart URL': 'ลิงก์กราฟ HTF',
    'MTF Chart URL': 'ลิงก์กราฟ MTF',
    'LTF Chart URL': 'ลิงก์กราฟ LTF',
    'Picture URL': 'ลิงก์รูปภาพ',
    'Tip URL': 'ลิงก์ Tip',
    'Save trade': 'บันทึกเทรด',
    'Update trade': 'อัปเดตเทรด',
    Cancel: 'ยกเลิก',
    'Export JSON': 'ส่งออก JSON',
    'All results': 'ทุกผลลัพธ์',
    'Search setup, notes, result, asset...': 'ค้นหา setup, notes, result, asset...',
    Profile: 'โปรไฟล์',
    Nickname: 'ชื่อเล่น',
    'Show contact': 'เลือกข้อมูลที่แสดง',
    Phone: 'เบอร์โทร',
    Facebook: 'Facebook',
    'ข้อความสถานะ': 'ข้อความสถานะ',
    Preview: 'ดูตัวอย่าง',
    'Preview label': 'ตัวอย่าง:',
    'Save profile': 'บันทึกโปรไฟล์',
    'Portfolio Management': 'จัดการพอร์ต',
    'New portfolio': 'สร้างพอร์ตใหม่',
    'Auto preset': 'Preset อัตโนมัติ',
    Apply: 'นำไปใช้',
    Name: 'ชื่อ',
    Provider: 'ผู้ให้บริการ',
    Plan: 'แผน',
    Market: 'ตลาด',
    Type: 'ประเภท',
    'Starting Balance': 'Balance เริ่มต้น',
    'Profit Target': 'เป้ากำไร',
    'Daily Loss': 'ขาดทุนรายวัน',
    'Trailing DD': 'Trailing DD',
    'Max Contracts': 'จำนวนสัญญาสูงสุด',
    'Min Days': 'จำนวนวันขั้นต่ำ',
    'Consistency Rule': 'กฎ Consistency',
    'Payout Rule': 'กฎ Payout',
    'Commission type': 'ประเภทค่าคอมมิชชัน',
    Amount: 'จำนวน',
    Add: 'เพิ่ม',
    Scope: 'ขอบเขต',
    Save: 'บันทึก',
    'Clear set': 'ล้างชุด',
    'Commission note': 'หมายเหตุค่าคอมมิชชัน',
    'Save portfolio': 'บันทึกพอร์ต',
    Reset: 'รีเซ็ต',
    Delete: 'ลบ',
    Security: 'ความปลอดภัย',
    'Current password': 'รหัสผ่านปัจจุบัน',
    'New password': 'รหัสผ่านใหม่',
    'Confirm password': 'ยืนยันรหัสผ่าน',
    'Change password': 'เปลี่ยนรหัสผ่าน',
    'Asset Presets': 'พรีเซ็ตสินทรัพย์',
    Symbol: 'Symbol',
    'Add asset': 'เพิ่ม Asset',
    'Field Options': 'ตัวเลือกฟิลด์',
    'Reset to Default': 'รีเซ็ตเป็นค่าเริ่มต้น',
    'Reset label': 'รีเซ็ตชื่อหัวข้อ',
    'Add new option': 'เพิ่มตัวเลือกใหม่',
    Rename: 'เปลี่ยนชื่อ',
    Remove: 'ลบ',
    'Micro Analytics': 'Micro Analytics',
    'No data yet': 'ยังไม่มีข้อมูล',
    'No week selected': 'ยังไม่ได้เลือกสัปดาห์',
    Week: 'สัปดาห์',
    'Not set': 'ยังไม่ได้ตั้งค่า',
    'Set this in Settings': 'ตั้งค่านี้ใน Settings',
    'Setup Needed': 'ต้องตั้งค่า Setup',
    'No prop-firm limits yet': 'ยังไม่มีกฎ Prop Firm',
    'Portfolio rules are active': 'กฎพอร์ตเปิดใช้งานแล้ว',
    'Edit rules': 'แก้ไขกฎ',
    'Daily review': 'รีวิวรายวัน',
    'Repeat': 'ทำซ้ำ',
    Reduce: 'ลด',
    'No leak noted': 'ยังไม่พบจุดรั่วไหล',
    'used': 'ใช้ไปแล้ว',
    'Healthy': 'ปกติ',
    'Watch': 'เฝ้าระวัง',
    'Alert': 'แจ้งเตือน',
    'Setup needed': 'ต้องตั้งค่า',
    'Use this before adding size: target progress must rise while daily loss, drawdown, and contracts stay controlled.': 'ใช้ตรวจสอบก่อนเพิ่มขนาดการเทรด โดยให้ความคืบหน้าเป้ากำไรเพิ่มขึ้น และควบคุมขาดทุนรายวัน Drawdown และจำนวนสัญญาให้อยู่ในเกณฑ์',
    'Add target, drawdown, daily loss, and max contracts in Settings to turn this into a live rule monitor.': 'เพิ่มเป้ากำไร Drawdown ขาดทุนรายวัน และจำนวนสัญญาสูงสุดใน Settings เพื่อเปิดใช้ตัวติดตามกฎแบบเรียลไทม์',
    'Portfolios, presets, and customizable field options': 'พอร์ต พรีเซ็ต และตัวเลือกฟิลด์ที่ปรับแต่งได้',
    'Upload 250x250': 'อัปโหลดรูป 250x250',
    'No commission': 'ไม่มีค่าคอม',
    'Fixed per trade': 'คงที่ต่อไม้',
    'Per contract': 'ต่อสัญญา',
    'Percent of gross P&L': 'เปอร์เซ็นต์ของ Gross P&L',
    'Round trip': 'ไป-กลับ',
    'Entry only': 'เฉพาะเข้า',
    'Exit only': 'เฉพาะออก',
    'Data Transfer': 'นำเข้า / ส่งออกข้อมูล',
    'Choose CSV / JSON': 'เลือกไฟล์ CSV / JSON',
    'Import data': 'นำเข้าข้อมูล',
    'Export CSV': 'ส่งออก CSV',
    'Copy data': 'คัดลอกข้อมูล',
    'COPY TRADES & REVIEWS TO': 'คัดลอกเทรดและรีวิวไปยัง',
    'JSON package includes trades and daily reviews. CSV import/export is trades only.': 'ไฟล์ JSON รวมข้อมูลเทรดและรีวิวรายวัน ส่วน CSV ใช้สำหรับข้อมูลเทรดเท่านั้น',
    'No file selected': 'ยังไม่ได้เลือกไฟล์',
    'No daily reviews yet': 'ยังไม่มีรีวิวรายวัน',
    'Save reviews from Calendar to keep your newest lessons on the Dashboard.': 'บันทึกรีวิวจากหน้า Calendar เพื่อแสดงบทเรียนล่าสุดบน Dashboard',
    'Open Calendar': 'เปิด Calendar',
    'No portfolio commission': 'พอร์ตนี้ยังไม่ได้ตั้งค่าคอมมิชชัน',
    'Miss trade: commission is 0': 'รายการ Miss จะไม่คิดค่าคอมมิชชัน',
    'Portfolio template applied': 'นำค่าเทมเพลตพอร์ตไปใช้แล้ว',
    'Options saved': 'บันทึกตัวเลือกแล้ว',
    'Option already exists': 'ตัวเลือกนี้มีอยู่แล้ว',
    'Asset saved': 'บันทึก Asset แล้ว',
    'Asset deleted': 'ลบ Asset แล้ว',
    'Profile saved': 'บันทึกโปรไฟล์แล้ว',
    'Password changed': 'เปลี่ยนรหัสผ่านแล้ว',
    'Trade saved': 'บันทึกเทรดแล้ว',
    'Trade updated': 'อัปเดตเทรดแล้ว',
    'Portfolio saved': 'บันทึกพอร์ตแล้ว',
    'Portfolio created': 'สร้างพอร์ตแล้ว',
    'Portfolio deleted': 'ลบพอร์ตแล้ว',
    'Portfolio reset': 'รีเซ็ตพอร์ตแล้ว',
    'TradingView Auto Sync': 'ซิงก์อัตโนมัติกับ TradingView',
    'Webhook name': 'ชื่อ Webhook',
    'Target portfolio': 'พอร์ตปลายทาง',
    'Create webhook': 'สร้าง Webhook',
    'Copy this URL now': 'คัดลอก URL นี้ตอนนี้',
    'Copy URL': 'คัดลอก URL',
    'Copy JSON': 'คัดลอก JSON',
    'Disable': 'ปิดใช้งาน',
    'Enable': 'เปิดใช้งาน',
    'Rotate': 'หมุน Token ใหม่',
    'TradingView Alert sends a completed trade as JSON to your selected portfolio. Set a unique event_id to prevent duplicates.': 'TradingView Alert จะส่งรายการเทรดที่ปิดแล้วเป็น JSON ไปยังพอร์ตที่เลือก กำหนด event_id ให้ไม่ซ้ำเพื่อป้องกันรายการซ้ำ',
    'TradingView webhooks require HTTPS and TradingView 2FA. This integration imports completed records; it does not place orders.': 'TradingView Webhook ต้องใช้ HTTPS และเปิด 2FA ระบบนี้นำเข้ารายการที่ปิดแล้วเท่านั้น ไม่ได้ส่งคำสั่งซื้อขาย',
    'สรุปข้อค้นพบอัตโนมัติ · Heatmap วัน×ชั่วโมง · คอมโบที่ชนะ/แพ้บ่อยที่สุด': 'สรุปข้อค้นพบอัตโนมัติ · Heatmap วัน×ชั่วโมง · คอมโบที่ชนะ/แพ้บ่อยที่สุด'
  }
};

const I18nContext = React.createContext({ language: 'en', setLanguage: () => {}, t: (text) => text });
const translate = (language, text) => {
  if (text == null || typeof text !== 'string') return text;
  return translations[language]?.[text] || text;
};
function useI18n() {
  return React.useContext(I18nContext);
}
function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage, t } = useI18n();
  return <div className={`language-switcher ${compact ? 'compact' : ''}`} aria-label={t('Language')}>
    {!compact && <span>{t('Language')}</span>}
    <div>
      {languages.map((lang) => <button type="button" key={lang.code} className={language === lang.code ? 'active' : ''} onClick={() => setLanguage(lang.code)}>{compact ? lang.short : lang.label}</button>)}
    </div>
  </div>;
}

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
const profileContactLabels = { phone: 'Phone', email: 'E-mail', facebook: 'Facebook', line: 'Status message' };

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

const chartColors = {
  gold: '#e0a92e',
  goldSoft: 'rgba(224, 169, 46, 0.28)',
  teal: '#1f7a8c',
  tealSoft: 'rgba(31, 122, 140, 0.24)',
  win: '#2ecb70',
  winSoft: 'rgba(46, 203, 112, 0.26)',
  loss: '#e5484d',
  lossSoft: 'rgba(229, 72, 77, 0.26)',
  purple: '#a78bfa',
  slate: '#5a6578',
  muted: '#8b8d99',
  grid: '#22242c'
};
const chartPalette = [chartColors.teal, chartColors.gold, chartColors.purple, chartColors.win, chartColors.loss, chartColors.slate, '#6a7f4e', '#c06f3d'];

function chartGradient(ctx, color) {
  const chart = ctx.chart;
  const area = chart.chartArea;
  if (!area) return color;
  const gradient = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(13, 14, 19, 0.04)');
  return gradient;
}

function chartFormat(kind, value) {
  if (kind === 'money') return money(value);
  if (kind === 'percent') return pct(value);
  if (kind === 'rr') return fmtR(value);
  if (kind === 'minutes') return fmtMinutes(value);
  if (kind === 'tick') return Number(value || 0).toFixed(1);
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 }) : value;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

function shortDate(dateString) {
  return dateString ? dateString.slice(5) : '';
}

function weekLabel(weekStart) {
  return `${shortDate(weekStart)} - ${shortDate(addDays(weekStart, 4))}`;
}

function marketWeekDates(weekStart) {
  return Array.from({ length: 5 }, (_, index) => addDays(weekStart, index));
}

function monthKey(dateString = today()) {
  return dateString.slice(0, 7);
}

function addMonths(monthString, amount) {
  const date = new Date(`${monthString}-01T00:00:00`);
  date.setMonth(date.getMonth() + amount);
  return dateKey(date).slice(0, 7);
}

function monthTitle(monthString) {
  const date = new Date(`${monthString}-01T00:00:00`);
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function calendarCells(monthString) {
  const first = new Date(`${monthString}-01T00:00:00`);
  const day = first.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(first);
  start.setDate(first.getDate() + mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return dateKey(date);
  });
}

function summarizeDay(rows = [], date = '') {
  const wins = rows.filter((row) => row.result === 'win').length;
  const losses = rows.filter((row) => ['loss', 'reversed'].includes(row.result)).length;
  const misses = rows.filter((row) => ['miss', 'breakeven'].includes(row.result)).length;
  const pnl = rows.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
  const sl = rows.reduce((sum, trade) => sum + ((trade.result === 'loss' || trade.result === 'reversed') ? Number(trade.slAmount || 0) : 0), 0);
  const commission = rows.reduce((sum, trade) => sum + Number(trade.commissionAmount || 0), 0);
  const rrRows = rows.filter((trade) => Number.isFinite(Number(trade.actualR ?? trade.plannedR)));
  return {
    date,
    label: shortDate(date),
    rows,
    trades: rows.length,
    wins,
    losses,
    misses,
    pnl,
    sl,
    commission,
    avgRr: rrRows.length ? rrRows.reduce((sum, trade) => sum + Number(trade.actualR ?? trade.plannedR), 0) / rrRows.length : 0
  };
}

function dailyReviewHasContent(review = {}) {
  return ['summary', 'repeat', 'reduce', 'nextPlan'].some((key) => String(review[key] || '').trim());
}

function dayTone(summary) {
  if (!summary?.trades) return '';
  if (summary.pnl > 0) return 'win';
  if (summary.pnl < 0) return 'loss';
  return 'be';
}

function chartOptions(kind = 'number') {
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
            const formatter = context.dataset.valueKind || kind;
            const parsed = context.parsed;
            const value = typeof parsed === 'object'
              ? (Number.isFinite(Number(parsed.y)) && context.chart.options.indexAxis !== 'y' ? parsed.y : parsed.x)
              : parsed;
            return `${label}${chartFormat(formatter, value)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(34, 36, 44, 0.55)', drawBorder: false },
        ticks: { color: chartColors.muted, maxRotation: 0, autoSkipPadding: 14 }
      },
      y: {
        beginAtZero: true,
        grid: { color: chartColors.grid, drawBorder: false },
        ticks: { color: chartColors.muted, callback: (value) => chartFormat(kind, value) }
      }
    }
  };
}

function makeOptions(kind = 'number', overrides = {}) {
  const base = chartOptions(kind);
  const hasScaleOverride = Object.prototype.hasOwnProperty.call(overrides, 'scales');
  const scales = hasScaleOverride && overrides.scales === null ? undefined : {
    ...base.scales,
    ...(overrides.scales || {}),
    x: { ...base.scales.x, ...(overrides.scales?.x || {}) },
    y: { ...base.scales.y, ...(overrides.scales?.y || {}) }
  };
  return {
    ...base,
    ...overrides,
    plugins: {
      ...base.plugins,
      ...(overrides.plugins || {}),
      legend: { ...base.plugins.legend, ...(overrides.plugins?.legend || {}) },
      tooltip: { ...base.plugins.tooltip, ...(overrides.plugins?.tooltip || {}) }
    },
    scales
  };
}

function SmartChart({ type = 'bar', data, options }) {
  return <ReactChart type={type} data={data} options={options} />;
}

function dailyResultChart(rows = []) {
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
        valueKind: 'money'
      },
      {
        label: 'Commission',
        data: rows.map((row) => -Math.abs(Number(row.commission || 0))),
        backgroundColor: chartColors.goldSoft,
        borderColor: chartColors.gold,
        borderWidth: 1,
        borderRadius: 5,
        valueKind: 'money'
      },
      {
        label: 'SL',
        data: rows.map((row) => -Math.abs(Number(row.sl || 0))),
        backgroundColor: chartColors.lossSoft,
        borderColor: chartColors.loss,
        borderWidth: 1,
        borderRadius: 5,
        valueKind: 'money'
      }
    ]
  };
}

function dailyResultOptions() {
  return makeOptions('money', {
    scales: {
      x: { stacked: true },
      y: { stacked: true }
    }
  });
}

const defaultAssets = [
  { symbol: 'NQ1', tickSize: 0.25, dollarPerPoint: 20, commissionAmount: 4.68 },
  { symbol: 'MNQ1', tickSize: 0.25, dollarPerPoint: 2, commissionAmount: 1.9 },
  { symbol: 'MGC1', tickSize: 0.1, dollarPerPoint: 1, commissionAmount: 0 },
  { symbol: 'GC1', tickSize: 0.1, dollarPerPoint: 10, commissionAmount: 0 },
  { symbol: 'XAUUSD', tickSize: 0.01, dollarPerPoint: 1, commissionAmount: 0 }
];

const FIELD_OPTIONS_VERSION = 'v2026.10.25';
const visibleFieldOptionKeys = ['session', 'mode', 'htfBias', 'htfPoi', 'mtfStructure', 'ltfEntry'];
const hiddenLegacyFieldOptionKeys = new Set(['keyZone', 'ruleViolation', 'emotion']);

const defaultOptions = {
  session: ['AS', 'LO', 'NY', 'LC'],
  mode: ['CANDLE + CODE'],
  htfBias: ['BUY', 'SELL'],
  htfPoi: ['OB+BOS', 'OB+CHOCH', 'OB+BOS+CHOCH'],
  mtfStructure: ['RBD', 'DBR'],
  ltfEntry: ['BTC', 'OB', 'OTB'],
  keyZone: ['None', 'Premium', 'Discount', 'Equilibrium', 'Asia High/Low', 'London Open', 'NY AM'],
  ruleViolation: ['None', 'Early Entry', 'Late Entry', 'No Confirmation', 'Oversized Lot', 'Revenge Trade', 'Chased Price'],
  emotion: ['Calm', 'Confident', 'Anxious', 'Frustrated', 'Greedy', 'Impatient', 'Regretful']
};

const legacyDefaultOptions = {
  mode: ['CANDLE + CODE', 'BOSe', 'CHe', 'Flip'],
  htfBias: ['Bullish', 'Bearish', 'Neutral'],
  htfPoi: ['OB', 'FVG', 'Supply', 'Demand', 'Liquidity', 'Premium', 'Discount'],
  mtfStructure: ['BOS', 'CHoCH', 'Sweep', 'Internal BOS', 'Range'],
  ltfEntry: ['OB', 'FVG', 'OB + FVG', 'Breaker', 'Mitigation']
};

const defaultOptionLabels = {
  session: 'Session',
  mode: 'Mode',
  htfBias: 'HTFBIAS (H4)',
  htfPoi: 'HTF (5M)',
  mtfStructure: 'MTF (30S)',
  ltfEntry: 'LTF (5S)',
  keyZone: 'Key Zone',
  ruleViolation: 'Rule Violation',
  emotion: 'Emotion'
};

const blankAccount = {
  name: 'New Account',
  type: 'live',
  provider: 'Custom',
  planName: '',
  marketType: 'Futures',
  startingBalance: 50000,
  profitTarget: '',
  dailyLossLimit: '',
  maxDrawdown: '',
  trailingDrawdown: '',
  maxContracts: '',
  minTradingDays: '',
  consistencyRule: '',
  payoutRule: '',
  commissionType: 'none',
  commissionAmount: '',
  commissionScope: 'roundTrip',
  commissionNotes: ''
};

const fallbackPortfolioTemplates = [
  { id: 'custom', templateKey: 'custom', label: 'Custom / Manual', values: blankAccount },
  {
    id: 'apex-50k', templateKey: 'apex-50k', label: 'Apex 50K Futures', values: {
      ...blankAccount, name: 'Apex 50K', provider: 'Apex', planName: '50K Evaluation', marketType: 'Futures', startingBalance: 50000,
      profitTarget: 3000, maxDrawdown: 2500, trailingDrawdown: 2500, maxContracts: 10, minTradingDays: 7,
      consistencyRule: 'Edit to match the current Apex rule for this plan.', payoutRule: 'Edit to match the current payout rule before trading live.',
      commissionType: 'perContract', commissionAmount: 2.8, commissionScope: 'roundTrip',
      commissionNotes: 'Estimated round-trip futures commission per contract. Adjust to your broker statement.'
    }
  },
  {
    id: 'topstep-50k', templateKey: 'topstep-50k', label: 'TopStep 50K Futures', values: {
      ...blankAccount, name: 'TopStep 50K', provider: 'TopStep', planName: '50K Trading Combine', marketType: 'Futures', startingBalance: 50000,
      profitTarget: 3000, dailyLossLimit: 1000, maxDrawdown: 2000, maxContracts: 5, minTradingDays: 2,
      consistencyRule: 'Edit to match current TopStep rules.', payoutRule: 'Edit to match current TopStep payout rules.',
      commissionType: 'perContract', commissionAmount: 2.8, commissionScope: 'roundTrip', commissionNotes: 'Estimated round-trip futures commission per contract.'
    }
  },
  {
    id: 'ftmo-100k', templateKey: 'ftmo-100k', label: 'FTMO 100K Forex/CFD', values: {
      ...blankAccount, name: 'FTMO 100K', provider: 'FTMO', planName: '100K Challenge', marketType: 'Forex / CFD', startingBalance: 100000,
      profitTarget: 10000, dailyLossLimit: 5000, maxDrawdown: 10000, minTradingDays: 4,
      consistencyRule: 'Edit to match the instrument and account type.', payoutRule: 'Edit to match current FTMO payout rules.',
      commissionType: 'fixed', commissionAmount: 0, commissionScope: 'roundTrip', commissionNotes: 'Set fixed commission manually if your symbol has a fee.'
    }
  },
  {
    id: 'mff-100k', templateKey: 'mff-100k', label: 'MFF / Prop 100K', values: {
      ...blankAccount, name: 'Prop 100K', provider: 'MFF / Prop Firm', planName: '100K Evaluation', marketType: 'Forex / CFD', startingBalance: 100000,
      profitTarget: 8000, dailyLossLimit: 5000, maxDrawdown: 12000, minTradingDays: 5,
      consistencyRule: 'Use as a starter template; verify all rules with the active plan.', payoutRule: 'Edit payout split, minimum days, and withdrawal cycle.',
      commissionType: 'fixed', commissionAmount: 0, commissionScope: 'roundTrip', commissionNotes: 'Manual starter preset for prop-firm style accounts.'
    }
  }
];

function templateDraftFrom(template = {}) {
  const values = { ...blankAccount, ...(template.values || {}) };
  return {
    id: template.id || null,
    templateKey: template.templateKey || `custom-${Date.now()}`,
    label: template.label || 'New template',
    sortOrder: template.sortOrder || 99,
    isActive: template.isActive !== false,
    values
  };
}

const commissionTypeLabels = {
  none: 'No commission',
  fixed: 'Fixed per trade',
  perContract: 'Per contract',
  percent: 'Percent of gross P&L'
};

function accountDraftFrom(account = {}) {
  return { ...blankAccount, ...(account || {}), startingBalance: account?.startingBalance ?? blankAccount.startingBalance };
}

const blankTrade = {
  date: today(), asset: 'NQ1', direction: 'short', session: 'AS', mode: 'CANDLE + CODE', entryTime: '06:00', exitTime: '',
  durationTime: '', orderWaitMinutes: '', entryPrice: '', stopLoss: '', takeProfit: '', tpTicks: '', slTicks: '',
  tickSize: 0.25, dollarPerPoint: 20, lotSize: '', commissionAmount: '',
  riskAmount: 30, result: 'win', htfBias: 'BUY', htfPoi: 'OB+BOS', poiType: 'OB', poiHasFvg: false, receivePoint: [],
  fvgPosition: '', liquiditySweep: false, bos: false, choch: false, mtfStructure: 'DBR',
  ltfEntry: 'OB', keyZone: 'None', setupGrade: 'A', setupScore: 80, maxR: '', maxTick: '', mfeR: '', maeR: '',
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

function startingBalanceOf(accountOrBalance = 50000) {
  if (typeof accountOrBalance === 'object' && accountOrBalance !== null) return Number(accountOrBalance.startingBalance || 50000);
  return Number(accountOrBalance || 50000);
}

function commissionForTrade(trade, grossPnl, account, assetPreset) {
  if (trade.result === 'miss') return 0;
  const type = account?.commissionType || 'none';
  if (trade.commissionAmount !== '' && trade.commissionAmount != null && (Number(trade.commissionAmount) > 0 || type === 'none')) return Number(trade.commissionAmount) || 0;
  const amount = Number(account?.commissionAmount || 0);
  if (amount && type !== 'none') {
    if (type === 'fixed') return amount;
    if (type === 'perContract') return amount * (Number(trade.lotSize || trade.suggestedLot || 0) || 0);
    if (type === 'percent') return Math.abs(Number(grossPnl || 0)) * (amount / 100);
  }
  const assetAmount = Number(assetPreset?.commissionAmount || 0);
  if (assetAmount > 0) return assetAmount * (Number(trade.lotSize || trade.suggestedLot || 0) || 0);
  return 0;
}

function enrichTrade(input, account = null, assetPreset = null) {
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
  const grossPnl = t.result === 'win' ? tpAmount : (t.result === 'loss' || t.result === 'reversed') ? -slAmount : 0;
  const commissionAmount = commissionForTrade({ ...t, lotSize, suggestedLot }, grossPnl, account, assetPreset);
  const netPnl = grossPnl - commissionAmount;
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
    grossPnl,
    commissionAmount,
    netPnl,
    pnl: netPnl,
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

function computeLedger(trades, accountOrBalance = 50000) {
  const startingBalance = startingBalanceOf(accountOrBalance);
  const account = typeof accountOrBalance === 'object' ? accountOrBalance : null;
  let balance = startingBalance;
  let conLoss = 0;
  let sumConLossAmount = 0;
  let sumDdLossPct = 0;
  return [...trades]
    .sort((a, b) => `${a.date}${a.entryTime || ''}${a.id || 0}`.localeCompare(`${b.date}${b.entryTime || ''}${b.id || 0}`))
    .map((trade) => {
      const t = enrichTrade(trade, account);
      const before = balance;
      const isLoss = t.result === 'loss' || t.result === 'reversed';
      const isWin = t.result === 'win';
      const slAmount = Number(t.slAmount || 0);
      const tpAmount = Number(t.tpAmount || 0);
      const grossPnl = isWin ? tpAmount : isLoss ? -slAmount : 0;
      const commissionAmount = Number(t.commissionAmount || 0);
      const pnl = Number(t.netPnl ?? t.pnl ?? (grossPnl - commissionAmount));
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
        grossPnl,
        commissionAmount,
        netPnl: pnl,
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

function computeStats(trades, accountOrBalance = 50000) {
  const startingBalance = startingBalanceOf(accountOrBalance);
  const rows = computeLedger(trades, accountOrBalance);
  const wins = rows.filter((t) => t.result === 'win');
  const losses = rows.filter((t) => t.result === 'loss' || t.result === 'reversed');
  const decided = wins.length + losses.length;
  const net = rows.reduce((s, t) => s + Number(t.pnl || 0), 0);
  const gross = rows.reduce((s, t) => s + Number(t.grossPnl ?? t.pnl ?? 0), 0);
  const totalCommission = rows.reduce((s, t) => s + Number(t.commissionAmount || 0), 0);
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
    gross,
    totalCommission,
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

function rulePercent(used, limit) {
  const max = Number(limit || 0);
  if (!max) return 0;
  return Math.min(100, Math.max(0, (Math.abs(Number(used || 0)) / max) * 100));
}

function ruleTone(percent, reverse = false) {
  if (reverse) {
    if (percent >= 90) return 'good';
    if (percent >= 65) return 'watch';
    return 'bad';
  }
  if (percent >= 85) return 'bad';
  if (percent >= 60) return 'watch';
  return 'good';
}

function computePropRules(trades, accountOrBalance = 50000) {
  const account = typeof accountOrBalance === 'object' ? accountOrBalance : null;
  const startingBalance = startingBalanceOf(accountOrBalance);
  const rows = computeLedger(trades, accountOrBalance);
  const net = rows.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
  const balance = startingBalance + net;
  const profitTarget = Number(account?.profitTarget || 0);
  const dailyLossLimit = Number(account?.dailyLossLimit || 0);
  const maxDrawdown = Number(account?.maxDrawdown || account?.trailingDrawdown || 0);
  const maxContracts = Number(account?.maxContracts || 0);
  const latestDate = rows.reduce((latest, trade) => trade.date && (!latest || trade.date > latest) ? trade.date : latest, '');
  const latestRows = latestDate ? rows.filter((trade) => trade.date === latestDate) : [];
  const dayNet = latestRows.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
  const dayLossUsed = Math.max(0, -dayNet);
  const peakBalance = rows.reduce((peak, trade) => Math.max(peak, Number(trade.balanceAfter || startingBalance)), startingBalance);
  const drawdownUsed = Math.max(0, peakBalance - balance);
  const largestLot = rows.reduce((max, trade) => Math.max(max, Number(trade.lotSize || 0)), 0);
  const targetProgress = profitTarget ? Math.max(0, Math.min(100, (net / profitTarget) * 100)) : 0;
  const dailyLossPct = rulePercent(dayLossUsed, dailyLossLimit);
  const drawdownPct = rulePercent(drawdownUsed, maxDrawdown);
  const contractPct = rulePercent(largestLot, maxContracts);
  const checks = [
    {
      label: 'Profit Target',
      value: profitTarget ? `${money(net)} / ${money(profitTarget)}` : 'Not set',
      percent: targetProgress,
      tone: profitTarget ? ruleTone(targetProgress, true) : 'neutral',
      enabled: !!profitTarget
    },
    {
      label: latestDate ? `Daily Loss ${shortDate(latestDate)}` : 'Daily Loss',
      value: dailyLossLimit ? `${money(dayLossUsed)} / ${money(dailyLossLimit)}` : 'Not set',
      percent: dailyLossPct,
      tone: dailyLossLimit ? ruleTone(dailyLossPct) : 'neutral',
      enabled: !!dailyLossLimit
    },
    {
      label: account?.trailingDrawdown ? 'Trailing DD' : 'Max Drawdown',
      value: maxDrawdown ? `${money(drawdownUsed)} / ${money(maxDrawdown)}` : 'Not set',
      percent: drawdownPct,
      tone: maxDrawdown ? ruleTone(drawdownPct) : 'neutral',
      enabled: !!maxDrawdown
    },
    {
      label: 'Max Contracts',
      value: maxContracts ? `${largestLot.toFixed(2)} / ${maxContracts}` : 'Not set',
      percent: contractPct,
      tone: maxContracts ? ruleTone(contractPct) : 'neutral',
      enabled: !!maxContracts
    }
  ];
  const alertCount = checks.filter((check) => check.tone === 'bad').length;
  const watchCount = checks.filter((check) => check.tone === 'watch').length;
  const activeCount = checks.filter((check) => check.enabled).length;
  return {
    balance,
    net,
    latestDate,
    dayNet,
    peakBalance,
    drawdownUsed,
    checks,
    status: !activeCount ? 'Setup needed' : alertCount ? 'Alert' : watchCount ? 'Watch' : 'Healthy',
    tone: !activeCount ? 'neutral' : alertCount ? 'bad' : watchCount ? 'watch' : 'good'
  };
}

function computeRuleMonitor(trades, accountOrBalance = 50000) {
  const account = typeof accountOrBalance === 'object' ? accountOrBalance : null;
  const startingBalance = startingBalanceOf(accountOrBalance);
  const dailyLossLimit = Number(account?.dailyLossLimit || 0);
  const drawdownLimit = Number(account?.maxDrawdown || account?.trailingDrawdown || 0);
  const rows = computeLedger(trades, accountOrBalance);
  const dates = [...new Set(rows.map((trade) => trade.date).filter(Boolean))].sort();
  let peakBalance = startingBalance;
  const days = dates.map((date) => {
    const dayRows = rows.filter((trade) => trade.date === date);
    const pnl = dayRows.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
    const lossUsed = Math.max(0, -pnl);
    const endBalance = Number(dayRows[dayRows.length - 1]?.balanceAfter || startingBalance);
    peakBalance = Math.max(peakBalance, ...dayRows.map((trade) => Number(trade.balanceAfter || startingBalance)), endBalance);
    const drawdownUsed = Math.max(0, peakBalance - endBalance);
    const dailyPct = rulePercent(lossUsed, dailyLossLimit);
    const drawdownPct = rulePercent(drawdownUsed, drawdownLimit);
    const tone = dailyPct >= 85 || drawdownPct >= 85 ? 'bad' : dailyPct >= 60 || drawdownPct >= 60 ? 'watch' : 'good';
    return {
      date,
      trades: dayRows.length,
      pnl,
      commission: dayRows.reduce((sum, trade) => sum + Number(trade.commissionAmount || 0), 0),
      lossUsed,
      dailyLossBuffer: dailyLossLimit ? Math.max(0, dailyLossLimit - lossUsed) : 0,
      dailyPct,
      drawdownUsed,
      drawdownBuffer: drawdownLimit ? Math.max(0, drawdownLimit - drawdownUsed) : 0,
      drawdownPct,
      dailyLossActive: !!dailyLossLimit,
      drawdownActive: !!drawdownLimit,
      endBalance,
      tone
    };
  });
  return {
    days,
    latest: days[days.length - 1] || null,
    dangerDays: days.filter((day) => day.tone === 'bad').length,
    watchDays: days.filter((day) => day.tone === 'watch').length,
    hasRules: !!(dailyLossLimit || drawdownLimit)
  };
}

function medianValue(values) {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function groupBy(trades, key) {
  const map = new Map();
  const boolFields = new Set(['poiHasFvg', 'liquiditySweep', 'bos', 'choch']);
  trades.forEach((t) => {
    const value = key === 'day'
      ? new Date(`${t.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })
      : boolFields.has(key)
        ? (t[key] ? 'Yes' : 'No')
        : (t[key] || 'Unspecified');
    const current = map.get(value) || { name: value, wins: 0, losses: 0, pnl: 0, grossPnl: 0, commissionAmount: 0, trades: 0, rrSum: 0, rrCount: 0, tickSum: 0, tickCount: 0, durationSum: 0, durationCount: 0 };
    current.trades += 1;
    current.pnl += Number(t.pnl || 0);
    current.grossPnl += Number(t.grossPnl ?? t.pnl ?? 0);
    current.commissionAmount += Number(t.commissionAmount || 0);
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

function buildSessionTickRows(trades = []) {
  const sessionOrder = ['AS', 'LO', 'NY', 'LC'];
  const sessionAliases = { ASIA: 'AS', AS: 'AS', LONDON: 'LO', LO: 'LO', NEWYORK: 'NY', NY: 'NY', LONDONCLOSE: 'LC', LC: 'LC' };
  const rows = new Map();
  trades.forEach((trade) => {
    const rawSession = String(trade.session || 'Unspecified').toUpperCase().replace(/[^A-Z]/g, '');
    const session = sessionAliases[rawSession] || rawSession || 'UNSPECIFIED';
    const tick = Number(trade.maxTick ?? trade.tpTicks);
    const row = rows.get(session) || { session, trades: 0, tickValues: [], wins: 0, losses: 0, pnl: 0 };
    row.trades += 1;
    row.pnl += Number(trade.pnl || 0);
    if (trade.result === 'win') row.wins += 1;
    if (trade.result === 'loss' || trade.result === 'reversed') row.losses += 1;
    if (Number.isFinite(tick) && tick > 0) row.tickValues.push(tick);
    rows.set(session, row);
  });
  return [...rows.values()]
    .sort((a, b) => (sessionOrder.indexOf(a.session) - sessionOrder.indexOf(b.session)) || a.session.localeCompare(b.session))
    .map((row) => ({
      ...row,
      tickCount: row.tickValues.length,
      avgTick: row.tickValues.length ? row.tickValues.reduce((sum, value) => sum + value, 0) / row.tickValues.length : 0,
      medianTick: medianValue(row.tickValues),
      winRate: row.wins + row.losses ? row.wins / (row.wins + row.losses) : 0
    }));
}

function AuthScreen({ setSession }) {
  const { t } = useI18n();
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
      <img className="brand-logo auth-logo" src="/ztj-logo.png" alt="Mr.Z Trading Journal" />
      <h1>Mr.Z Trading Journal</h1>
      <p>{t('Trading journal for structure, execution, psychology, and edge review.')}</p>
      <LanguageSwitcher />
      <div className="segmented">
        <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>{t('Login')}</button>
        <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>{t('Sign up')}</button>
      </div>
      {['login', 'register'].includes(mode) && <label>{t('Username')}<input value={username} onChange={(e) => setUsername(e.target.value)} /></label>}
      {['register', 'forgot'].includes(mode) && <label>{t('Email')}<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>}
      {['verify', 'reset'].includes(mode) && <label>{t('Token')}<input value={token} onChange={(e) => setToken(e.target.value)} /></label>}
      {['login', 'register', 'reset'].includes(mode) && <label>{t('Password')}<PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} visible={showPassword} onToggle={() => setShowPassword(!showPassword)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>}
      {error && <div className="error">{error}</div>}
      {message && <div className="success-box">{message}</div>}
      <button className="primary" type="submit">{t(mode === 'login' ? 'Login' : mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Send reset link' : mode === 'verify' ? 'Verify email' : 'Reset password')}</button>
      <div className="auth-links">
        <button type="button" onClick={() => setMode('forgot')}>{t('Forgot password')}</button>
        <button type="button" onClick={() => setMode('verify')}>{t('Verify email')}</button>
      </div>
    </form>
  </main>;
}

function PasswordInput({ value, onChange, visible, onToggle, autoComplete }) {
  const { t } = useI18n();
  const Icon = visible ? EyeOff : Eye;
  const label = visible ? 'Hide password' : 'Show password';
  return <div className="password-input"><input type={visible ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} /><button type="button" onClick={onToggle} aria-label={t(label)} title={t(label)}><Icon size={15} /></button></div>;
}

function App() {
  const [language, setLanguageState] = useState(() => localStorage.getItem('ztj_language') || 'en');
  const [session, setSession] = useState(() => localStorage.getItem('etj_token') ? { token: localStorage.getItem('etj_token') } : null);
  const api = useApi(session?.token);
  const [currentUser, setCurrentUser] = useState(session?.user || null);
  const [viewUserId, setViewUserId] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState(null);
  const [portfolioLimit, setPortfolioLimit] = useState(5);
  const [portfolioTemplates, setPortfolioTemplates] = useState(fallbackPortfolioTemplates);
  const [trades, setTrades] = useState([]);
  const [options, setOptions] = useState(defaultOptions);
  const [optionLabels, setOptionLabels] = useState(defaultOptionLabels);
  const [assets, setAssets] = useState(defaultAssets);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');
  const [calendarFocusDate, setCalendarFocusDate] = useState('');
  function setLanguage(nextLanguage) {
    setLanguageState(nextLanguage);
    localStorage.setItem('ztj_language', nextLanguage);
  }
  const i18n = useMemo(() => ({ language, setLanguage, t: (text) => translate(language, text) }), [language]);

  const scopedUserId = currentUser?.role === 'admin' && viewUserId ? viewUserId : null;
  const scopedApi = useMemo(() => (path, options = {}) => api(withUser(path, scopedUserId), options), [api, scopedUserId]);

  async function loadAll(nextAccountId = accountId) {
    const [a, o, assetData, templateData] = await Promise.all([scopedApi('/accounts'), scopedApi('/options'), scopedApi('/assets'), api('/portfolio-templates')]);
    setAccounts(a.accounts);
    setPortfolioLimit(a.portfolioLimit || 5);
    const loadedAssets = assetData.assets?.length ? assetData.assets : defaultAssets;
    setAssets(loadedAssets.map((asset) => ({
      ...(defaultAssets.find((preset) => preset.symbol === asset.symbol) || {}),
      ...asset,
      commissionAmount: asset.commissionAmount ?? defaultAssets.find((preset) => preset.symbol === asset.symbol)?.commissionAmount ?? 0
    })));
    setPortfolioTemplates(templateData.templates?.length ? templateData.templates : fallbackPortfolioTemplates);
    const active = nextAccountId || a.accounts[0]?.id;
    setAccountId(active);
    const loadedOptions = Object.fromEntries(o.options.map((x) => [x.fieldKey, x.options]));
    const mergedOptions = Object.fromEntries([
      ...Object.entries(defaultOptions).map(([key, defaults]) => [
        key,
        Object.prototype.hasOwnProperty.call(loadedOptions, key)
          ? JSON.stringify(loadedOptions[key]) === JSON.stringify(legacyDefaultOptions[key]) ? defaults : loadedOptions[key]
          : defaults
      ]),
      ...o.options
        .filter((item) => !Object.prototype.hasOwnProperty.call(defaultOptions, item.fieldKey))
        .map((item) => [item.fieldKey, Array.isArray(item.options) ? item.options : []])
    ]);
    setOptions(mergedOptions);
    setOptionLabels({ ...defaultOptionLabels, ...Object.fromEntries(o.options.map((x) => [x.fieldKey, x.label || defaultOptionLabels[x.fieldKey] || x.fieldKey])) });
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
  useEffect(() => {
    if (page === 'coach' && currentUser?.role !== 'admin') setPage('dashboard');
  }, [page, currentUser?.role]);
  useEffect(() => { if (toast) { const id = setTimeout(() => setToast(''), 2200); return () => clearTimeout(id); } }, [toast]);

  if (!session?.token) return <I18nContext.Provider value={i18n}><AuthScreen setSession={setSession} /></I18nContext.Provider>;
  const account = accounts.find((a) => a.id === Number(accountId)) || accounts[0];
  const stats = computeStats(trades, account || 50000);
  const t = i18n.t;
  const nav = [
    ['dashboard', LayoutDashboard, 'Dashboard'],
    ['log', Plus, editing ? 'Edit Trade' : 'Add Trade'],
    ['history', History, 'History'],
    ['calendar', CalendarDays, 'Calendar'],
    ['analytics', BarChart3, 'Analytics'],
    ['journal', BookOpen, 'Playbook'],
    ['settings', Settings, 'Settings']
  ];
  if (currentUser?.role === 'admin') nav.push(['coach', Shield, 'Admin']);
  function logout() {
    localStorage.removeItem('etj_token');
    setSession(null);
  }
  return <I18nContext.Provider value={i18n}><div className="app-shell">
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="brand"><img className="brand-logo" src="/ztj-logo.png" alt="Mr.Z Trading Journal" /><div><b>Mr.Z Trading Journal</b><span>{t('POI to outcome')}</span></div></div>
        <ProfileCard user={currentUser} />
      </div>
      <LanguageSwitcher compact />
      <label className="mini-label">{t('Portfolio')} {accounts.length}/{portfolioLimit}</label>
      <select value={accountId || ''} onChange={async (e) => { setAccountId(e.target.value); const data = await scopedApi(`/accounts/${e.target.value}/trades`); setTrades(data.trades); }}>
        {accounts.map((a) => <option value={a.id} key={a.id}>{a.name}</option>)}
      </select>
      <nav>{nav.map(([id, Icon, label]) => <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}><Icon size={17} />{t(label)}</button>)}</nav>
      <div className="sidebar-foot">
        <span>{trades.length} {t('trades logged')}</span>
        <button onClick={logout}><LogOut size={15} />{t('Logout')}</button>
      </div>
    </aside>
    <main className="workspace">
      {page === 'dashboard' && <Dashboard api={scopedApi} accountId={accountId} trades={trades} stats={stats} account={account} openCalendar={(date = '') => { setCalendarFocusDate(date); setPage('calendar'); }} setPage={setPage} />}
      {page === 'log' && <TradeForm api={scopedApi} accountId={accountId} account={account} trades={trades} options={options} assets={assets} editing={editing} setEditing={setEditing} reload={loadAll} setToast={setToast} />}
      {page === 'history' && <HistoryPage api={scopedApi} accountId={accountId} account={account} trades={trades} setTrades={setTrades} setEditing={(t) => { setEditing(t); setPage('log'); }} setToast={setToast} />}
      {page === 'calendar' && <CalendarPage api={scopedApi} accountId={accountId} trades={trades} account={account} focusDate={calendarFocusDate} clearFocusDate={() => setCalendarFocusDate('')} setToast={setToast} />}
      {page === 'analytics' && <AnalyticsPage trades={trades} stats={stats} account={account} />}
      {page === 'journal' && <JournalPage api={scopedApi} accountId={accountId} />}
      {page === 'settings' && <SettingsPage api={scopedApi} accounts={accounts} account={account} options={options} optionLabels={optionLabels} assets={assets} portfolioLimit={portfolioLimit} portfolioTemplates={portfolioTemplates} user={currentUser} setCurrentUser={setCurrentUser} reload={loadAll} setToast={setToast} />}
      {page === 'coach' && <CoachPage api={api} token={session?.token} currentUser={currentUser} viewUserId={viewUserId} setViewUserId={(id) => { setViewUserId(id); setPage('dashboard'); }} portfolioTemplates={portfolioTemplates} setPortfolioTemplates={setPortfolioTemplates} setToast={setToast} />}
    </main>
    {toast && <div className="toast">{toast}</div>}
  </div></I18nContext.Provider>;
}

function ProfileCard({ user }) {
  const { t } = useI18n();
  const profile = user?.profile || {};
  const contact = profileContact(profile, user?.email);
  const label = profileContactLabels[profile.contactType || 'email'] || 'Contact';
  return <div className="profile-card">
    <div className="profile-photo">{profile.image ? <img src={profile.image} alt="" /> : <UserRound size={84} strokeWidth={1.25} />}</div>
    <div className="profile-copy">
      <b>{profile.nickname || 'Nick Name'}</b>
      <span>{contact || t(label)}</span>
    </div>
  </div>;
}

function Dashboard({ api, accountId, trades, stats, account, openCalendar, setPage }) {
  const { t } = useI18n();
  const [selectedWeek, setSelectedWeek] = useState('');
  const [dailyReviews, setDailyReviews] = useState({});
  const ledger = useMemo(() => computeLedger(trades, account || 50000), [trades, account]);
  const propRules = useMemo(() => computePropRules(trades, account || 50000), [trades, account]);
  useEffect(() => {
    if (!accountId) return;
    api(`/accounts/${accountId}/daily-reviews`)
      .then((data) => setDailyReviews(data.reviews || {}))
      .catch(() => setDailyReviews({}));
  }, [accountId, api]);
  const latestReviews = useMemo(() => Object.entries(dailyReviews)
    .filter(([, review]) => dailyReviewHasContent(review))
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 4)
    .map(([date, review]) => ({ date, review })), [dailyReviews]);
  const daily = useMemo(() => {
    const map = new Map();
    ledger.sort((a, b) => a.date.localeCompare(b.date)).forEach((t) => map.set(t.date, (map.get(t.date) || 0) + Number(t.pnl || 0)));
    let cum = 0;
    return [...map.entries()].map(([date, pnl]) => ({ date: date.slice(5), pnl, equity: (cum += pnl) }));
  }, [ledger]);
  const hourRows = useMemo(() => groupBy(ledger, 'entryHour').sort((a, b) => String(a.name).localeCompare(String(b.name))), [ledger]);
  const ltfRows = useMemo(() => groupBy(ledger, 'ltfEntry').sort((a, b) => b.trades - a.trades), [ledger]);
  const dashboardWeeks = useMemo(() => [...new Set(ledger.filter((row) => row.date).map((row) => startOfWeek(row.date)))].sort(), [ledger]);
  useEffect(() => {
    if (!dashboardWeeks.length) setSelectedWeek('');
    else if (!selectedWeek || !dashboardWeeks.includes(selectedWeek)) setSelectedWeek(dashboardWeeks[dashboardWeeks.length - 1]);
  }, [dashboardWeeks, selectedWeek]);
  const activeWeek = selectedWeek || dashboardWeeks[dashboardWeeks.length - 1] || '';
  const weekDaily = useMemo(() => {
    if (!activeWeek) return [];
    return marketWeekDates(activeWeek).map((date) => {
      const rows = ledger.filter((trade) => trade.date === date);
      return {
        date,
        label: shortDate(date),
        pnl: rows.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0),
        sl: rows.reduce((sum, trade) => sum + ((trade.result === 'loss' || trade.result === 'reversed') ? Number(trade.slAmount || 0) : 0), 0),
        commission: rows.reduce((sum, trade) => sum + Number(trade.commissionAmount || 0), 0),
        trades: rows.length
      };
    });
  }, [activeWeek, ledger]);
  const equityChart = {
    labels: daily.map((row) => row.date),
    datasets: [{
      label: 'Equity',
      data: daily.map((row) => row.equity),
      borderColor: chartColors.teal,
      backgroundColor: (ctx) => chartGradient(ctx, chartColors.tealSoft),
      borderWidth: 2,
      fill: true,
      tension: 0.38,
      pointRadius: 3,
      pointHoverRadius: 6,
      valueKind: 'money'
    }]
  };
  const dashboardDailyChart = dailyResultChart(weekDaily);
  const entryTimeChart = {
    labels: hourRows.map((row) => row.name),
    datasets: [
      {
        label: 'Trades',
        data: hourRows.map((row) => row.trades),
        backgroundColor: chartColors.goldSoft,
        borderColor: chartColors.gold,
        borderWidth: 1,
        borderRadius: 5,
        valueKind: 'number',
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'P&L',
        data: hourRows.map((row) => row.pnl),
        borderColor: chartColors.teal,
        backgroundColor: chartColors.teal,
        borderWidth: 2,
        tension: 0.36,
        pointRadius: 3,
        valueKind: 'money',
        yAxisID: 'y1'
      }
    ]
  };
  const ltfReceiveChart = {
    labels: ltfRows.map((row) => row.name),
    datasets: [{
      label: 'Trades',
      data: ltfRows.map((row) => row.trades),
      backgroundColor: ltfRows.map((_, index) => chartPalette[index % chartPalette.length]),
      borderColor: ltfRows.map((_, index) => chartPalette[index % chartPalette.length]),
      borderWidth: 1,
      borderRadius: 5,
      valueKind: 'number'
    }]
  };
  return <section>
    <Header title="Dashboard" hint={`${account?.name || 'Account'} ${t('Backtest performance overview')}`} action={<button className="primary" onClick={() => setPage('log')}><Plus size={16} />{t('Log trade')}</button>} />
    <div className="kpi-grid">
      <Kpi label="Gross P&L" value={money(stats.gross)} tone={stats.gross >= 0 ? 'good' : 'bad'} />
      <Kpi label="Commission" value={money(stats.totalCommission)} />
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
    <PropFirmRulesPanel account={account} rules={propRules} setPage={setPage} />
    <div className="grid two">
      <Panel title="Equity Curve">
        <ChartWrap empty={!daily.length}><SmartChart type="line" data={equityChart} options={makeOptions('money')} /></ChartWrap>
      </Panel>
      <Panel title="Daily Results">
        <div className="panel-toolbar">
          <span>{activeWeek ? `${t('Week')} ${weekLabel(activeWeek)}` : t('No week selected')}</span>
          <select value={activeWeek} onChange={(e) => setSelectedWeek(e.target.value)} disabled={!dashboardWeeks.length}>
            {dashboardWeeks.map((week) => <option key={week} value={week}>{weekLabel(week)}</option>)}
          </select>
        </div>
        <ChartWrap empty={!dashboardWeeks.length} tall><SmartChart type="bar" data={dashboardDailyChart} options={dailyResultOptions()} /></ChartWrap>
      </Panel>
    </div>
    <div className="grid two dashboard-lower">
      <Panel title="Entry Time Edge">
        <ChartWrap empty={!hourRows.length}><SmartChart type="bar" data={entryTimeChart} options={makeOptions('number', { scales: { y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: chartColors.muted, callback: (value) => money(value) } } } })} /></ChartWrap>
      </Panel>
      <Panel title="LTF Entry Receive">
        <div className="table-wrap slim"><table><thead><tr><th>{t('LTF Entry')}</th><th>{t('Trades')}</th><th>{t('Winrate')}</th><th>{t('Avg RR')}</th><th>{t('Avg Tick')}</th></tr></thead><tbody>{ltfRows.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.trades}</td><td>{pct(row.winRate * 100)}</td><td>{fmtR(row.avgRr)}</td><td>{row.avgTick.toFixed(1)}</td></tr>)}</tbody></table></div>
        <div className="chart-subsection">
          <ChartWrap empty={!ltfRows.length}><SmartChart type="bar" data={ltfReceiveChart} options={makeOptions('number', { indexAxis: 'y', plugins: { legend: { display: false } } })} /></ChartWrap>
        </div>
      </Panel>
      <Panel title="Latest Review Notes">
        <LatestReviewNotes rows={latestReviews} onOpenCalendar={openCalendar} />
      </Panel>
    </div>
  </section>;
}

function LatestReviewNotes({ rows, onOpenCalendar }) {
  const { t } = useI18n();
  if (!rows.length) return <div className="review-empty">
    <b>{t('No daily reviews yet')}</b>
    <span>{t('Save reviews from Calendar to keep your newest lessons on the Dashboard.')}</span>
    <button onClick={() => onOpenCalendar()}><CalendarDays size={15} />{t('Open Calendar')}</button>
  </div>;
  return <div className="latest-reviews">
    {rows.map(({ date, review }) => <button type="button" key={date} onClick={() => onOpenCalendar(date)}>
      <span className="review-date">{shortDate(date)}</span>
      <span><b>{review.summary || review.nextPlan || t('Daily review')}</b><small>{t('Repeat')}: {review.repeat || '-'}</small></span>
      <em>{review.reduce ? `${t('Reduce')}: ${review.reduce}` : t('No leak noted')}</em>
    </button>)}
  </div>;
}

function PropFirmRulesPanel({ account, rules, setPage }) {
  const { t } = useI18n();
  const hasRules = ['profitTarget', 'dailyLossLimit', 'maxDrawdown', 'trailingDrawdown', 'maxContracts'].some((key) => Number(account?.[key] || 0) > 0);
  return <Panel title="Prop Firm Rules">
    <div className="rule-control">
      <div className={`rule-status ${rules.tone}`}>
        <Gauge size={20} />
        <div>
          <span>{t(rules.status)}</span>
          <b>{money(rules.balance)}</b>
          <small>{account?.provider || 'Custom'} {account?.planName ? `· ${account.planName}` : ''}</small>
        </div>
      </div>
      <div className="rule-check-grid">
        {rules.checks.map((check) => <div className={`rule-check ${check.tone}`} key={check.label}>
          <div className="rule-check-head"><span>{t(check.label)}</span><b>{check.value}</b></div>
          <div className="rule-meter"><i style={{ width: `${check.percent}%` }} /></div>
          <small>{check.value === 'Not set' ? t('Set this in Settings') : `${check.percent.toFixed(0)}% ${t('used')}`}</small>
        </div>)}
      </div>
      <div className="rule-notes">
        <b>{hasRules ? t('Portfolio rules are active') : t('No prop-firm limits yet')}</b>
        <span>{hasRules ? t('Use this before adding size: target progress must rise while daily loss, drawdown, and contracts stay controlled.') : t('Add target, drawdown, daily loss, and max contracts in Settings to turn this into a live rule monitor.')}</span>
        <button onClick={() => setPage('settings')}><SlidersHorizontal size={15} />{t('Edit rules')}</button>
      </div>
    </div>
  </Panel>;
}

function TradeForm({ api, accountId, account, trades, options, assets, editing, setEditing, reload, setToast }) {
  const { t } = useI18n();
  const [form, setForm] = useState(editing || blankTrade);
  useEffect(() => setForm(editing || blankTrade), [editing]);
  const assetPreset = assets.find((asset) => asset.symbol === form.asset);
  const calc = enrichTrade(form, account, assetPreset);
  const projectedRules = useMemo(() => {
    const nextTrade = { ...form, id: editing?.id };
    const projectedTrades = editing
      ? trades.map((trade) => trade.id === editing.id ? nextTrade : trade)
      : [...trades, nextTrade];
    return computePropRules(projectedTrades, account || 50000);
  }, [form, editing, trades, account]);
  const activeRuleChecks = projectedRules.checks.filter((check) => check.enabled);
  const accountCommissionRate = account?.commissionType && account.commissionType !== 'none'
    ? Number(account.commissionAmount || 0)
    : 0;
  const assetCommissionRate = Number(assetPreset?.commissionAmount || 0);
  const autoCommissionRate = accountCommissionRate > 0 ? accountCommissionRate : assetCommissionRate;
  const autoCommissionUnit = accountCommissionRate > 0
    ? (account?.commissionType === 'perContract' ? ' / contract' : account?.commissionType === 'percent' ? ' / %' : '')
    : assetCommissionRate > 0 ? ' / contract' : '';
  const commissionInputValue = form.result === 'miss'
    ? 0
    : (form.commissionAmount !== '' && form.commissionAmount != null ? form.commissionAmount : (autoCommissionRate || calc.commissionAmount || ''));
  const commissionHint = form.result === 'miss'
    ? 'Miss trade: commission is 0'
    : account?.commissionType && account.commissionType !== 'none'
      ? `Auto from ${account.name || 'portfolio'}: ${commissionTypeLabels[account.commissionType]}`
      : assetPreset?.commissionAmount > 0
        ? `Auto from ${assetPreset.symbol}: per contract`
        : 'No portfolio or asset commission';
  function set(key, value) {
    let next = { ...form, [key]: value };
    if (key === 'asset') {
      const preset = assets.find((asset) => asset.symbol === value);
      if (preset) next = { ...next, tickSize: preset.tickSize, dollarPerPoint: preset.dollarPerPoint, commissionAmount: '' };
    }
    if (key === 'result' && value === 'miss') next = { ...next, commissionAmount: '' };
    if ((key === 'entryPrice' || key === 'direction' || key === 'tpTicks' || key === 'slTicks' || key === 'tickSize') && next.entryPrice) {
      const preview = enrichTrade(next, account, assets.find((asset) => asset.symbol === next.asset));
      next = { ...next, stopLoss: preview.stopLoss || '', takeProfit: preview.takeProfit || '' };
    }
    if (key === 'entryTime' || key === 'exitTime') {
      next = { ...next, durationTime: durationLabelFromTimes(next.entryTime, next.exitTime) || next.durationTime || '' };
    }
    setForm(next);
  }
  async function save(e) {
    e.preventDefault();
    try {
      const payload = enrichTrade(form, account, assetPreset);
      if (editing) await api(`/accounts/${accountId}/trades/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await api(`/accounts/${accountId}/trades`, { method: 'POST', body: JSON.stringify(payload) });
      setEditing(null);
      setForm(blankTrade);
      await reload(accountId);
      setToast(editing ? 'Trade updated' : 'Trade saved');
    } catch (error) {
      setToast(error?.message || (editing ? 'Could not update trade' : 'Could not save trade'));
    }
  }
  return <section>
    <Header title={editing ? 'Edit Trade' : 'Add Trade'} hint="Capture structure, execution, psychology, and result in one pass" />
    <form className="trade-layout" onSubmit={save}>
      <Panel title="Risk Engine" className="trade-risk">
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
          <Field label="Commission"><input type="number" step="any" value={commissionInputValue} onChange={(e) => set('commissionAmount', e.target.value)} placeholder="0" disabled={form.result === 'miss'} /><small className="field-hint">{commissionHint}{autoCommissionUnit}</small></Field>
        </div>
        <div className="risk-strip">
          <Kpi label="Planned RR" value={fmtR(calc.plannedR)} />
          <Kpi label="Suggested lot" value={Number(calc.suggestedLot || 0).toFixed(2)} />
          <Kpi label="Gross P&L" value={money(calc.grossPnl)} tone={calc.grossPnl >= 0 ? 'good' : 'bad'} />
          <Kpi label="Commission" value={money(calc.commissionAmount)} />
          <Kpi label="Net P&L" value={money(calc.netPnl)} tone={calc.netPnl >= 0 ? 'good' : 'bad'} />
          <Kpi label="SL$ / TP$" value={`${money(calc.slAmount)} / ${money(calc.tpAmount)}`} />
        </div>
        <div className={`trade-rule-preview ${projectedRules.tone}`}>
          <div>
            <span>After save</span>
            <b>{projectedRules.status}</b>
            <small>Projected balance {money(projectedRules.balance)}</small>
          </div>
          <div className="trade-rule-list">
            {activeRuleChecks.length ? activeRuleChecks.map((check) => <span className={check.tone} key={check.label}>{check.label}: <b>{check.value}</b></span>) : <span>No portfolio rules set yet. Add prop-firm limits in Settings.</span>}
          </div>
        </div>
      </Panel>
      <Panel title="Trade Information" className="trade-information">
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
        <div className="checks receive-point-checks">
          <span className="check-group-label">จุดรับ</span>
          {['FirstOB', 'MiddleOB', 'LastOB'].map((point) => <label key={point}><input type="checkbox" checked={Array.isArray(form.receivePoint) && form.receivePoint.includes(point)} onChange={(e) => {
            const current = new Set(Array.isArray(form.receivePoint) ? form.receivePoint : []);
            if (e.target.checked) current.add(point); else current.delete(point);
            set('receivePoint', [...current]);
          }} />{point}</label>)}
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
          <Field label="Emotion After"><select value={form.emotionAfter} onChange={(e) => set('emotionAfter', e.target.value)}>{options.emotion.map((emotion) => <option key={emotion} value={emotion}>{t(emotion)}</option>)}</select></Field>
        </div>
        <Field label="Reflection"><textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} placeholder="Why this trade, what followed the plan, what to avoid next time..." /></Field>
      </Panel>
      <Panel title="Chart Journal" className="chart-journal-panel">
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
  const ledger = computeLedger(trades, account || 50000);
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
    <div className="table-wrap"><table><thead><tr>{['Date','Asset','Session','Mode','Dir','Ticks','RR','SL$','TP$','Balance','Con Loss','DD%','Setup','LTF Entry','Net P&L','Charts',''].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>
      {list.map((t) => <tr key={t.id}><td>{t.date}<small>{t.entryTime}{t.durationTime ? ` / ${t.durationTime}` : ''}</small></td><td>{t.asset}</td><td>{t.session}</td><td>{t.mode || '-'}</td><td>{t.direction}</td><td>{t.tpTicks || '-'} / {t.slTicks || '-'}<small>Max {t.maxTick ?? '-'}</small></td><td>{fmtR(t.plannedR)}<small>Max {fmtR(t.maxR)}</small></td><td>{money(t.slAmount)}</td><td>{money(t.tpAmount)}<small>{pct(t.tpPercent * 100)}</small></td><td>{money(t.balanceAfter)}</td><td>{t.conLoss || 0}<small>{money(t.sumConLossAmount || 0)}</small></td><td>{pct(t.ddLossPct * 100)}<small>{pct(t.sumDdLossPct * 100)}</small></td><td><b>{t.setupGrade}</b><small>{t.htfBias} {t.htfPoi}</small></td><td><b>{t.ltfEntry || '-'}</b><small>{t.keyZone || '-'}</small></td><td className={t.pnl >= 0 ? 'pos' : 'neg'}>{money(t.pnl)}<small>Fee {money(t.commissionAmount || 0)}</small></td><td><ChartLinks trade={t} /></td><td className="row-actions"><button onClick={() => setEditing(trades.find((rawTrade) => rawTrade.id === t.id) || t)}>Edit</button><button onClick={() => del(t.id)}><Trash2 size={14} /></button></td></tr>)}
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

function CalendarPage({ api, accountId, trades, account, focusDate, clearFocusDate, setToast }) {
  const [visibleMonth, setVisibleMonth] = useState(() => monthKey(trades.find((trade) => trade.date)?.date || today()));
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [dailyReviews, setDailyReviews] = useState({});
  const ledger = useMemo(() => computeLedger(trades, account || 50000), [trades, account]);
  useEffect(() => {
    if (!accountId) return;
    api(`/accounts/${accountId}/daily-reviews`)
      .then((data) => setDailyReviews(data.reviews || {}))
      .catch(() => setDailyReviews({}));
  }, [accountId, api]);
  useEffect(() => {
    if (!focusDate) return;
    setVisibleMonth(monthKey(focusDate));
    setSelectedWeek(startOfWeek(focusDate));
    setSelectedDay(focusDate);
    clearFocusDate?.();
  }, [focusDate, clearFocusDate]);
  async function saveDailyReview(date, review) {
    const data = await api(`/accounts/${accountId}/daily-reviews/${date}`, { method: 'PUT', body: JSON.stringify(review) });
    setDailyReviews((current) => ({ ...current, [date]: data.review }));
    setToast('Daily review saved');
  }
  const dayMap = useMemo(() => {
    const map = new Map();
    ledger.forEach((trade) => {
      if (!trade.date) return;
      map.set(trade.date, [...(map.get(trade.date) || []), trade]);
    });
    return map;
  }, [ledger]);
  const monthDays = useMemo(() => calendarCells(visibleMonth), [visibleMonth]);
  const summaries = useMemo(() => new Map(monthDays.map((date) => [date, summarizeDay(dayMap.get(date) || [], date)])), [monthDays, dayMap]);
  const monthSummaries = useMemo(() => [...summaries.values()].filter((day) => day.date.startsWith(visibleMonth)), [summaries, visibleMonth]);
  const monthStats = useMemo(() => {
    const traded = monthSummaries.filter((day) => day.trades);
    return {
      pnl: traded.reduce((sum, day) => sum + day.pnl, 0),
      commission: traded.reduce((sum, day) => sum + day.commission, 0),
      trades: traded.reduce((sum, day) => sum + day.trades, 0),
      winDays: traded.filter((day) => day.pnl > 0).length,
      lossDays: traded.filter((day) => day.pnl < 0).length,
      beDays: traded.filter((day) => day.pnl === 0).length,
      avgRr: traded.length ? traded.reduce((sum, day) => sum + day.avgRr, 0) / traded.length : 0
    };
  }, [monthSummaries]);
  const weekOptions = useMemo(() => [...new Set(monthSummaries.map((day) => startOfWeek(day.date)))].sort(), [monthSummaries]);
  const preferredWeek = useMemo(() => {
    const tradedWeeks = monthSummaries.filter((day) => day.trades).map((day) => startOfWeek(day.date));
    return tradedWeeks.length ? tradedWeeks[tradedWeeks.length - 1] : weekOptions[0];
  }, [monthSummaries, weekOptions]);
  useEffect(() => {
    if (!weekOptions.length) setSelectedWeek('');
    else if (!selectedWeek || !weekOptions.includes(selectedWeek)) setSelectedWeek(preferredWeek);
  }, [weekOptions, selectedWeek, preferredWeek]);
  const activeWeek = selectedWeek || preferredWeek || '';
  const weekDaily = useMemo(() => activeWeek ? marketWeekDates(activeWeek).map((date) => summarizeDay(dayMap.get(date) || [], date)) : [], [activeWeek, dayMap]);
  const selectedSummary = selectedDay ? summarizeDay(dayMap.get(selectedDay) || [], selectedDay) : null;
  const reviewRows = useMemo(() => Object.entries(dailyReviews)
    .filter(([date, review]) => date.startsWith(visibleMonth) && review && ['summary', 'repeat', 'reduce', 'nextPlan'].some((key) => String(review[key] || '').trim()))
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, review]) => ({ date, review, summary: summarizeDay(dayMap.get(date) || [], date) })), [dailyReviews, visibleMonth, dayMap]);
  const dayChart = dailyResultChart(weekDaily);
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return <section>
    <Header title="Calendar" hint="Month review, trading days, and daily order detail" />
    <div className="calendar-layout">
      <Panel title="Calendar Filters">
        <div className="calendar-mini-stats">
          <div><span>Month Net</span><b className={monthStats.pnl >= 0 ? 'pos' : 'neg'}>{money(monthStats.pnl)}</b></div>
          <div><span>Trades</span><b>{monthStats.trades}</b></div>
          <div><span>Win Days</span><b>{monthStats.winDays}</b></div>
          <div><span>Loss Days</span><b>{monthStats.lossDays}</b></div>
          <div><span>Commission</span><b>{money(monthStats.commission)}</b></div>
          <div><span>Avg RR</span><b>{fmtR(monthStats.avgRr)}</b></div>
        </div>
        <div className="calendar-legend">
          <span><i className="win-dot" />Winning day</span>
          <span><i className="loss-dot" />Losing day</span>
          <span><i className="gold-dot" />Miss / BE / commission</span>
          <span><i className="blue-dot" />Trade details</span>
        </div>
      </Panel>
      <Panel title="Month Review">
        <div className="calendar-toolbar">
          <div><h2>{monthTitle(visibleMonth)}</h2><span>{monthStats.winDays}W / {monthStats.lossDays}L / {monthStats.beDays}BE days</span></div>
          <div className="calendar-actions">
            <button onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}>‹</button>
            <button onClick={() => setVisibleMonth(monthKey(today()))}>Today</button>
            <button onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}>›</button>
          </div>
        </div>
        <div className="calendar-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="month-grid">
          {monthDays.map((date) => {
            const summary = summaries.get(date);
            const tone = dayTone(summary);
            const rows = summary.rows || [];
            return <button
              key={date}
              type="button"
              className={`month-cell ${date.startsWith(visibleMonth) ? '' : 'muted'} ${date === today() ? 'today' : ''} ${rows.length ? 'has-trades' : ''}`}
              onClick={() => rows.length && setSelectedDay(date)}
            >
              <span className="date-number">{new Date(`${date}T00:00:00`).getDate()}</span>
              <span className="day-pills">
                {rows.slice(0, 3).map((trade, index) => <span key={trade.id || `${date}-${index}`} className={`trade-pill ${trade.result || tone}`}>{trade.asset || 'Trade'} · {trade.ltfEntry || trade.setupGrade || trade.result}</span>)}
                {rows.length > 3 && <span className="trade-pill more">+{rows.length - 3} more</span>}
                {dailyReviews[date] && <span className="trade-pill review">Review saved</span>}
              </span>
              <span className="day-summary">
                <b className={summary.pnl >= 0 ? 'pos' : 'neg'}>{rows.length ? money(summary.pnl) : '-'}</b>
                <small>{rows.length ? `${summary.trades} trades` : 'No trades'}</small>
              </span>
            </button>;
          })}
        </div>
      </Panel>
    </div>
    <Panel title="Daily Results">
      <div className="panel-toolbar">
        <span>{activeWeek ? `Week ${weekLabel(activeWeek)}` : 'No week selected'}</span>
        <select value={activeWeek} onChange={(e) => setSelectedWeek(e.target.value)} disabled={!weekOptions.length}>
          {weekOptions.map((week) => <option key={week} value={week}>{weekLabel(week)}</option>)}
        </select>
      </div>
      <ChartWrap empty={!weekDaily.some((day) => day.trades)} tall><SmartChart type="bar" data={dayChart} options={dailyResultOptions()} /></ChartWrap>
    </Panel>
    <Panel title="Daily Review Log">
      <DailyReviewLog rows={reviewRows} onOpen={(date) => setSelectedDay(date)} />
    </Panel>
    {selectedSummary?.trades > 0 && <CalendarLightbox summary={selectedSummary} review={dailyReviews[selectedSummary.date] || {}} onSaveReview={saveDailyReview} onClose={() => setSelectedDay('')} />}
  </section>;
}

function DailyReviewLog({ rows, onOpen }) {
  if (!rows.length) return <div className="compact-empty">No daily reviews saved for this month yet.</div>;
  return <div className="review-log">
    {rows.map(({ date, review, summary }) => <button key={date} type="button" onClick={() => onOpen(date)}>
      <span className="review-log-date"><b>{shortDate(date)}</b><small>{summary.trades} trades · {money(summary.pnl)}</small></span>
      <span><b>Repeat</b><small>{review.repeat || '-'}</small></span>
      <span><b>Reduce</b><small>{review.reduce || '-'}</small></span>
      <span><b>Next</b><small>{review.nextPlan || review.summary || '-'}</small></span>
    </button>)}
  </div>;
}

function CalendarLightbox({ summary, review, onSaveReview, onClose }) {
  const [draft, setDraft] = useState({ summary: '', repeat: '', reduce: '', nextPlan: '', ...(review || {}) });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setDraft({ summary: '', repeat: '', reduce: '', nextPlan: '', ...(review || {}) });
  }, [summary.date, review]);
  async function saveReview() {
    setSaving(true);
    try {
      await onSaveReview(summary.date, draft);
    } finally {
      setSaving(false);
    }
  }
  return <div className="lightbox-backdrop" onClick={onClose}>
    <div className="trade-lightbox" onClick={(event) => event.stopPropagation()}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">×</button>
      <div className="lightbox-head">
        <div>
          <h2>Orders — {summary.date}</h2>
          <p>
            <em className="pos">{summary.wins}W</em>
            <em className="neg">{summary.losses}L</em>
            <em>{summary.misses}M</em>
            <em>{summary.trades} trades</em>
            <em>P&L: <b className={summary.pnl >= 0 ? 'pos' : 'neg'}>{money(summary.pnl)}</b></em>
          </p>
        </div>
        <div className="lightbox-totals">
          <span>Commission {money(summary.commission)}</span>
          <span>SL {money(summary.sl)}</span>
          <span>Avg RR {fmtR(summary.avgRr)}</span>
        </div>
      </div>
      <div className="order-list">
        <div className="daily-review-card">
          <div className="daily-review-head">
            <div><b>Daily Review</b><span>Keep the lesson close to the trades it came from.</span></div>
            <button onClick={saveReview} disabled={saving}><Save size={15} />{saving ? 'Saving...' : 'Save review'}</button>
          </div>
          <div className="daily-review-grid">
            <label>Summary<textarea value={draft.summary || ''} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} placeholder="What happened today?" /></label>
            <label>Repeat<textarea value={draft.repeat || ''} onChange={(e) => setDraft({ ...draft, repeat: e.target.value })} placeholder="What should be repeated?" /></label>
            <label>Reduce<textarea value={draft.reduce || ''} onChange={(e) => setDraft({ ...draft, reduce: e.target.value })} placeholder="What leaked or broke rules?" /></label>
            <label>Next Plan<textarea value={draft.nextPlan || ''} onChange={(e) => setDraft({ ...draft, nextPlan: e.target.value })} placeholder="What is the next session plan?" /></label>
          </div>
        </div>
        {summary.rows.map((trade, index) => <div className="order-card" key={trade.id || `${summary.date}-${index}`}>
          <div className="order-top">
            <span className="order-index">{index + 1}</span>
            <div><h3>{trade.ltfEntry || trade.mtfStructure || trade.setupGrade || 'Trade setup'}</h3><p>{trade.asset} · {trade.session} · {trade.entryTime || '-'}{trade.exitTime ? ` - ${trade.exitTime}` : ''}</p></div>
            <span className={`result-badge ${trade.result || ''}`}>{trade.result || '-'}</span>
          </div>
          <div className="order-metrics">
            <div><span>RR</span><b>{fmtR(trade.actualR ?? trade.plannedR)}</b></div>
            <div><span>P&L</span><b className={trade.pnl >= 0 ? 'pos' : 'neg'}>{money(trade.pnl)}</b></div>
            <div><span>Max Tick</span><b>{trade.maxTick ?? '-'}</b></div>
            <div><span>Duration</span><b>{trade.durationTime || fmtMinutes(trade.durationMinutes)}</b></div>
            <div><span>Rule</span><b>{trade.ruleViolation || 'None'}</b></div>
            <div><span>Emotion</span><b>{trade.emotionAfter || '-'}</b></div>
          </div>
          <div className="order-notes">
            <span>{trade.notes || 'No daily note yet'}</span>
            {(trade.chartLtf || trade.chartMtf || trade.chartHtf || trade.pictureUrl) && <a href={trade.chartLtf || trade.chartMtf || trade.chartHtf || trade.pictureUrl} target="_blank" rel="noreferrer">TradingView ↗</a>}
          </div>
        </div>)}
      </div>
    </div>
  </div>;
}

const dimensionOptions = [
  ['entryHour', 'Entry Time'],
  ['session', 'Session'],
  ['asset', 'Asset'],
  ['mode', 'Mode'],
  ['ltfEntry', 'LTF Entry'],
  ['htfBias', 'HTF Bias'],
  ['htfPoi', 'HTF POI'],
  ['poiHasFvg', 'POI has FVG'],
  ['liquiditySweep', 'Liquidity Sweep'],
  ['bos', 'BOS'],
  ['choch', 'CHoCH'],
  ['mtfStructure', 'MTF Structure'],
  ['keyZone', 'Key Zone'],
  ['setupGrade', 'Setup Grade'],
  ['ruleViolation', 'Rule Violation'],
  ['emotionBefore', 'Emotion Before'],
  ['emotionAfter', 'Emotion'],
  ['dayName', 'Day']
];

const metricOptions = [
  ['trades', 'Trades'],
  ['grossPnl', 'Gross P&L'],
  ['commissionAmount', 'Commission'],
  ['pnl', 'Net P&L'],
  ['winRate', 'Winrate'],
  ['avgRr', 'Avg RR'],
  ['avgTick', 'Avg Tick'],
  ['avgDuration', 'Avg Duration']
];

function metricValue(row, metric) {
  return metric === 'winRate' ? row.winRate * 100 : Number(row[metric] || 0);
}

function metricKind(metric) {
  if (metric === 'pnl' || metric === 'grossPnl' || metric === 'commissionAmount') return 'money';
  if (metric === 'winRate') return 'percent';
  if (metric === 'avgRr') return 'rr';
  if (metric === 'avgDuration') return 'minutes';
  if (metric === 'avgTick') return 'tick';
  return 'number';
}

function metricLabel(metric, value) {
  if (metric === 'pnl' || metric === 'grossPnl' || metric === 'commissionAmount') return money(value);
  if (metric === 'winRate') return pct(value);
  if (metric === 'avgRr') return fmtR(value);
  if (metric === 'avgDuration') return fmtMinutes(value);
  if (metric === 'avgTick') return Number(value || 0).toFixed(1);
  return value;
}

const microWeekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const microHours = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`);
const microComboDimensions = [
  ['keyZone', 'Key Zone'],
  ['session', 'Session'],
  ['dayName', 'วัน'],
  ['entryHour', 'เวลาเข้า'],
  ['htfPoi', 'คุณภาพ OB'],
  ['htfBias', 'HTF'],
  ['mtfStructure', 'MTF'],
  ['ltfEntry', 'LTF']
];

function decidedTrades(rows = []) {
  return rows.filter((trade) => trade.result === 'win' || trade.result === 'loss' || trade.result === 'reversed');
}

function microCellTone(value, maxAbs) {
  if (!value || !maxAbs) return {};
  const strength = Math.min(0.48, 0.12 + (Math.abs(value) / maxAbs) * 0.36);
  const color = value > 0 ? '46, 203, 112' : '229, 72, 77';
  return {
    background: `rgba(${color}, ${strength})`,
    borderColor: `rgba(${color}, ${Math.min(0.72, strength + 0.18)})`
  };
}

function buildMicroHeatmap(rows = []) {
  const cells = new Map();
  rows.forEach((trade) => {
    const day = trade.dayName || 'Unspecified';
    const hour = trade.entryHour || 'No time';
    if (!microWeekdays.includes(day) || !microHours.includes(hour)) return;
    const key = `${day}-${hour}`;
    const current = cells.get(key) || { trades: 0, wins: 0, losses: 0, pnl: 0, rrSum: 0, rrCount: 0 };
    current.trades += 1;
    current.pnl += Number(trade.pnl || 0);
    if (trade.result === 'win') current.wins += 1;
    if (trade.result === 'loss' || trade.result === 'reversed') current.losses += 1;
    const rr = Number(trade.actualR || trade.plannedR || 0);
    if (Number.isFinite(rr)) {
      current.rrSum += rr;
      current.rrCount += 1;
    }
    cells.set(key, current);
  });
  const maxAbs = Math.max(0, ...[...cells.values()].map((cell) => Math.abs(cell.pnl)));
  return { cells, maxAbs };
}

function microComboParts(trade, selected) {
  return microComboDimensions
    .filter(([key]) => selected[key])
    .map(([key, label]) => {
      const value = trade[key] || 'Unspecified';
      return `${label}: ${value}`;
    });
}

function buildMicroCombos(rows = [], selected = {}) {
  const map = new Map();
  rows.forEach((trade) => {
    const parts = microComboParts(trade, selected);
    if (!parts.length) return;
    const name = parts.join(' | ');
    const current = map.get(name) || { name, trades: 0, wins: 0, losses: 0, pnl: 0, avgRr: 0, rrSum: 0 };
    current.trades += 1;
    current.pnl += Number(trade.pnl || 0);
    if (trade.result === 'win') current.wins += 1;
    if (trade.result === 'loss' || trade.result === 'reversed') current.losses += 1;
    current.rrSum += Number(trade.actualR || trade.plannedR || 0);
    map.set(name, current);
  });
  return [...map.values()].map((row) => ({
    ...row,
    avgRr: row.trades ? row.rrSum / row.trades : 0,
    winRate: row.wins + row.losses ? row.wins / (row.wins + row.losses) : 0
  }));
}

function buildMicroRrRows(rows = [], includeWinRate = true, includeValue = true) {
  const decided = decidedTrades(rows);
  const winners = decided.filter((trade) => trade.result === 'win' && Number(trade.maxR || 0) > 0);
  const avgRisk = decided.length
    ? decided.reduce((sum, trade) => sum + (Number(trade.riskAmount || 0) || 50), 0) / decided.length
    : 50;
  const fixed = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20];
  const levels = [...new Set([...fixed, ...winners.map((trade) => Number(trade.maxR || 0).toFixed(1)).map(Number)])]
    .filter((level) => Number.isFinite(level) && level > 0)
    .sort((a, b) => a - b);
  return levels.map((level) => {
    const pass = winners.filter((trade) => Number(trade.maxR || 0) >= level);
    const hitRate = decided.length ? pass.length / decided.length : 0;
    const assumedValue = (pass.length * level * avgRisk) - ((decided.length - pass.length) * avgRisk);
    const score = (includeWinRate ? hitRate * 100 : 0) + (includeValue ? assumedValue / Math.max(avgRisk, 1) : 0) + level;
    return { level, passCount: pass.length, hitRate, assumedValue, score };
  }).filter((row) => row.passCount > 0).sort((a, b) => b.score - a.score).slice(0, 8);
}

function MicroAnalytics({ ledger }) {
  const [comboFilter, setComboFilter] = useState({
    keyZone: false,
    session: false,
    dayName: false,
    entryHour: false,
    htfPoi: false,
    htfBias: false,
    mtfStructure: false,
    ltfEntry: true
  });
  const [includeWinRate, setIncludeWinRate] = useState(true);
  const [includeValue, setIncludeValue] = useState(true);
  const outcomes = useMemo(() => decidedTrades(ledger), [ledger]);
  const heatmap = useMemo(() => buildMicroHeatmap(ledger), [ledger]);
  const sessionTickRows = useMemo(() => buildSessionTickRows(ledger), [ledger]);
  const combos = useMemo(() => buildMicroCombos(outcomes, comboFilter), [outcomes, comboFilter]);
  const bestCombos = useMemo(() => [...combos].filter((row) => row.wins > 0 && row.pnl >= 0).sort((a, b) => (b.winRate - a.winRate) || (b.pnl - a.pnl) || (b.trades - a.trades)).slice(0, 5), [combos]);
  const worstCombos = useMemo(() => [...combos].filter((row) => row.losses > 0 || row.pnl < 0).sort((a, b) => (a.winRate - b.winRate) || (a.pnl - b.pnl) || (b.trades - a.trades)).slice(0, 5), [combos]);
  const rrRows = useMemo(() => buildMicroRrRows(ledger, includeWinRate, includeValue), [ledger, includeWinRate, includeValue]);
  const bestHour = useMemo(() => groupBy(ledger, 'entryHour').filter((row) => row.name !== 'No time').sort((a, b) => b.pnl - a.pnl)[0], [ledger]);
  const bestDay = useMemo(() => groupBy(ledger, 'dayName').sort((a, b) => b.pnl - a.pnl)[0], [ledger]);
  const bestRr = rrRows[0];

  return <div className="micro-page">
    <Header title="Micro Analytics" hint="สรุปข้อค้นพบอัตโนมัติ · Heatmap วัน×ชั่วโมง · คอมโบที่ชนะ/แพ้บ่อยที่สุด" />
    <SectionLabel tone="gold">Insights</SectionLabel>
    <Panel title="สรุปข้อค้นพบสำคัญ">
      {outcomes.length < 5 ? <div className="compact-empty micro-empty">ยังมีข้อมูลไม่พอสำหรับวิเคราะห์เชิงลึก (ต้องมีไม้ที่ปิดผลแพ้/ชนะแล้วอย่างน้อย 5 ไม้)</div> : <div className="micro-insights">
        <Insight title="ช่วงเวลาที่เด่น" value={bestHour?.name || '-'} meta={bestHour ? `${money(bestHour.pnl)} · ${pct(bestHour.winRate * 100)} · ${bestHour.trades} trades` : 'No time data'} tone="good" />
        <Insight title="วันที่เด่น" value={bestDay?.name || '-'} meta={bestDay ? `${money(bestDay.pnl)} · ${fmtR(bestDay.avgRr)}` : 'No day data'} tone="good" />
        <Insight title="Combo ที่ควรทำซ้ำ" value={bestCombos[0]?.name || '-'} meta={bestCombos[0] ? `${pct(bestCombos[0].winRate * 100)} · ${money(bestCombos[0].pnl)}` : 'เลือกเงื่อนไขเพื่อวิเคราะห์'} />
        <Insight title="Combo ที่ต้องระวัง" value={worstCombos[0]?.name || '-'} meta={worstCombos[0] ? `${pct(worstCombos[0].winRate * 100)} · ${money(worstCombos[0].pnl)}` : 'ยังไม่มีข้อมูล'} tone={worstCombos[0] ? 'bad' : ''} />
        <Insight title="RR ขั้นต่ำที่น่าสนใจ" value={bestRr ? fmtR(bestRr.level) : '-'} meta={bestRr ? `${pct(bestRr.hitRate * 100)} hit · ${money(bestRr.assumedValue)}` : 'ต้องกรอก Max RR'} tone={bestRr ? 'good' : ''} />
      </div>}
    </Panel>

    <SectionLabel>Heatmap วัน × ชั่วโมง</SectionLabel>
    <Panel title="Win Rate / กำไรขาดทุน ตามวันและชั่วโมง">
      <p className="micro-note">เขียว = กำไรสุทธิ, แดง = ขาดทุนสุทธิ, เลขในช่อง = จำนวนไม้</p>
      <div className="micro-heatmap-shell">
        <div className="micro-heatmap">
          <div className="micro-heatmap-corner" />
          {microWeekdays.map((day) => <div className="micro-heatmap-head" key={day}>{day}</div>)}
          {microHours.map((hour) => <React.Fragment key={hour}>
            <div className="micro-hour">{hour}</div>
            {microWeekdays.map((day) => {
              const cell = heatmap.cells.get(`${day}-${hour}`);
              const winRate = cell?.wins + cell?.losses ? cell.wins / (cell.wins + cell.losses) : 0;
              return <div className={`micro-cell ${cell?.trades ? 'has-data' : ''}`} key={`${day}-${hour}`} style={microCellTone(cell?.pnl || 0, heatmap.maxAbs)} title={cell?.trades ? `${day} ${hour}: ${cell.trades} trades, ${money(cell.pnl)}, ${pct(winRate * 100)}` : `${day} ${hour}`}>
                {cell?.trades ? <><b>{cell.trades}</b><span>{money(cell.pnl)}</span><small>{pct(winRate * 100)}</small></> : null}
              </div>;
            })}
          </React.Fragment>)}
        </div>
      </div>
    </Panel>

    <SectionLabel>Tick ตาม Session</SectionLabel>
    <Panel title="ค่าเฉลี่ยและค่ากลาง Tick ในแต่ละ Session">
      <p className="micro-note">Tick ใช้ค่า Max Tick ก่อน หากไม่มีจะใช้ TP Tick และแสดงจำนวนไม้ที่มีข้อมูล Tick เพื่อประกอบการตัดสินใจ</p>
      <div className="table-wrap slim"><table><thead><tr><th>Session</th><th>Trades</th><th>มีข้อมูล Tick</th><th>ค่าเฉลี่ย Tick</th><th>ค่ากลาง Tick</th><th>Win Rate</th><th>Net P&amp;L</th></tr></thead><tbody>
        {sessionTickRows.length ? sessionTickRows.map((row) => <tr key={row.session}><td><b>{row.session}</b></td><td>{row.trades}</td><td>{row.tickCount}</td><td>{row.tickCount ? row.avgTick.toFixed(1) : '-'}</td><td>{row.tickCount ? row.medianTick.toFixed(1) : '-'}</td><td>{pct(row.winRate * 100)}</td><td className={row.pnl >= 0 ? 'pos' : 'neg'}>{money(row.pnl)}</td></tr>) : <tr><td colSpan="7">ยังไม่มีข้อมูล Session สำหรับวิเคราะห์</td></tr>}
      </tbody></table></div>
    </Panel>

    <SectionLabel>Top 5 คอมโบที่ชนะ/แพ้บ่อยที่สุด</SectionLabel>
    <p className="micro-desc">เลือกเงื่อนไขที่ใช้จับคู่ด้านล่าง ระบบจะรวมไม้ที่ตรงกันเป็นคอมโบเดียว เพื่อดูว่าชุดเงื่อนไขไหนควรทำซ้ำและชุดไหนควรลดหรือเลี่ยง</p>
    <Panel title="เลือกเงื่อนไขที่ใช้จับคอมโบ">
      <div className="micro-checks">
        {microComboDimensions.map(([key, label]) => <label key={key}>
          <input type="checkbox" checked={!!comboFilter[key]} onChange={(event) => setComboFilter({ ...comboFilter, [key]: event.target.checked })} />
          <span>{label}</span>
        </label>)}
      </div>
    </Panel>
    <div className="grid two micro-combo-grid">
      <Panel title="TOP 5 คอมโบที่ชนะบ่อยที่สุด"><ComboList rows={bestCombos} tone="good" /></Panel>
      <Panel title="TOP 5 คอมโบที่แพ้บ่อยที่สุด"><ComboList rows={worstCombos} tone="bad" /></Panel>
    </div>

    <SectionLabel>RR ขั้นต่ำที่ควรตั้ง (จากไม้ที่ชนะ)</SectionLabel>
    <Panel title="แนะนำ RR ขั้นต่ำจากสถิติไม้ที่ชนะจริง">
      <p className="micro-note">เทียบ Max RR ของไม้ที่ชนะแต่ละระดับ ว่าถ้าตั้งเป้า TP ไว้ที่ RR นี้จะมีจำนวนไม้ที่เข้าเงื่อนไขและมูลค่าสมมติเท่าไร</p>
      <div className="micro-checks rr-controls">
        <label><input type="checkbox" checked={includeWinRate} onChange={(event) => setIncludeWinRate(event.target.checked)} /><span>รวม Win Rate ในการให้คะแนน</span></label>
        <label><input type="checkbox" checked={includeValue} onChange={(event) => setIncludeValue(event.target.checked)} /><span>รวมมูลค่าเงินที่ชนะในการให้คะแนน</span></label>
      </div>
      <div className="table-wrap slim rr-table"><table><thead><tr><th>RR ≥</th><th>ไม้ที่ผ่านเกณฑ์</th><th>Win Rate</th><th>มูลค่ารวม (สมมติ)</th><th>คะแนน</th></tr></thead><tbody>{rrRows.length ? rrRows.map((row, index) => <tr key={row.level} className={index === 0 ? 'selected' : ''}><td>{fmtR(row.level)}</td><td>{row.passCount}</td><td>{pct(row.hitRate * 100)}</td><td className={row.assumedValue >= 0 ? 'pos' : 'neg'}>{money(row.assumedValue)}</td><td>{row.score.toFixed(1)}</td></tr>) : <tr><td colSpan="5">ไม้ที่ชนะยังไม่มีการกรอกค่า Max RR ต้องมีข้อมูลนี้ก่อนจึงจะวิเคราะห์ได้</td></tr>}</tbody></table></div>
    </Panel>
  </div>;
}

function SectionLabel({ children, tone = '' }) {
  return <div className={`section-label ${tone}`}>{children}</div>;
}

function ComboList({ rows, tone }) {
  if (!rows.length) return <div className="compact-empty">เลือกเงื่อนไขหรือเพิ่มข้อมูลเทรดให้พอสำหรับจัดอันดับคอมโบ</div>;
  return <div className={`combo-list ${tone}`}>
    {rows.map((row, index) => <div className="combo-row" key={row.name}>
      <span>#{index + 1}</span>
      <b>{row.name}</b>
      <small>{money(row.pnl)}</small>
      <strong>{row.trades} ไม้</strong>
      <em>Win Rate = {pct(row.winRate * 100)}</em>
    </div>)}
  </div>;
}

function BuilderChart({ data, metric, chartType }) {
  const rows = data.map((row) => ({ ...row, value: metricValue(row, metric) }));
  const valueKind = metricKind(metric);
  if (chartType === 'pie' || chartType === 'doughnut') {
    const radialRows = rows.map((row) => ({ ...row, value: Math.abs(row.value) }));
    return <SmartChart type={chartType} data={{
      labels: radialRows.map((row) => row.name),
      datasets: [{
        label: metricOptions.find(([value]) => value === metric)?.[1] || 'Value',
        data: radialRows.map((row) => row.value),
        backgroundColor: radialRows.map((_, index) => chartPalette[index % chartPalette.length]),
        borderColor: '#101116',
        borderWidth: 2,
        hoverOffset: 10,
        valueKind
      }]
    }} options={makeOptions(valueKind, { cutout: chartType === 'doughnut' ? '62%' : 0, scales: null })} />;
  }
  const chartData = {
    labels: rows.map((row) => row.name),
    datasets: [{
      label: metricOptions.find(([value]) => value === metric)?.[1] || 'Value',
      data: rows.map((row) => row.value),
      backgroundColor: chartType === 'line' ? (ctx) => chartGradient(ctx, chartColors.goldSoft) : chartColors.tealSoft,
      borderColor: chartType === 'line' ? chartColors.gold : chartColors.teal,
      borderWidth: 2,
      borderRadius: chartType === 'bar' ? 5 : 0,
      fill: chartType === 'line',
      tension: 0.36,
      pointRadius: chartType === 'line' ? 3 : 0,
      valueKind
    }]
  };
  if (chartType === 'line') {
    return <SmartChart type="line" data={chartData} options={makeOptions(valueKind)} />;
  }
  return <SmartChart type="bar" data={chartData} options={makeOptions(valueKind, chartType === 'horizontal' ? { indexAxis: 'y' } : {})} />;
}

function AnalyticsPage({ trades, stats, account }) {
  const reportTabs = ['Overview', 'Time', 'Setup', 'Risk', 'Psychology', 'Micro', 'Custom'];
  const [activeTab, setActiveTab] = useState('Overview');
  const [dimension, setDimension] = useState('htfBias');
  const [builderDimension, setBuilderDimension] = useState('entryHour');
  const [builderMetric, setBuilderMetric] = useState('pnl');
  const [chartType, setChartType] = useState('bar');
  const [focusDimension, setFocusDimension] = useState('ltfEntry');
  const [focusValue, setFocusValue] = useState('');
  const ledger = useMemo(() => computeLedger(trades, account || 50000), [trades, account]);
  const data = useMemo(() => groupBy(ledger, dimension), [ledger, dimension]);
  const builderData = useMemo(() => groupBy(ledger, builderDimension).sort((a, b) => String(a.name).localeCompare(String(b.name))), [ledger, builderDimension]);
  const timeRows = useMemo(() => groupBy(ledger, 'entryHour').sort((a, b) => String(a.name).localeCompare(String(b.name))), [ledger]);
  const sessionRows = useMemo(() => groupBy(ledger, 'session'), [ledger]);
  const ltfRows = useMemo(() => groupBy(ledger, 'ltfEntry').sort((a, b) => b.trades - a.trades), [ledger]);
  const gradeRows = useMemo(() => groupBy(ledger, 'setupGrade'), [ledger]);
  const violationRows = useMemo(() => groupBy(ledger.filter((t) => t.ruleViolation && t.ruleViolation !== 'None'), 'ruleViolation'), [ledger]);
  const psychologyRows = useMemo(() => groupBy(ledger, 'emotionAfter'), [ledger]);
  const structureRows = useMemo(() => groupBy(ledger, 'mtfStructure'), [ledger]);
  const poiRows = useMemo(() => groupBy(ledger, 'htfPoi'), [ledger]);
  const focusRows = useMemo(() => {
    if (!focusValue) return ledger.slice(-8).reverse();
    const boolFields = new Set(['poiHasFvg', 'liquiditySweep', 'bos', 'choch']);
    return ledger.filter((trade) => {
      const value = boolFields.has(focusDimension) ? (trade[focusDimension] ? 'Yes' : 'No') : (trade[focusDimension] || 'Unspecified');
      return String(value) === String(focusValue);
    }).slice(0, 12);
  }, [ledger, focusDimension, focusValue]);
  const bestSetup = [...ltfRows].sort((a, b) => (b.pnl || 0) - (a.pnl || 0))[0];
  const worstSetup = [...ltfRows].sort((a, b) => (a.pnl || 0) - (b.pnl || 0))[0];
  const bestTime = [...timeRows].sort((a, b) => (b.pnl || 0) - (a.pnl || 0))[0];
  const costlyViolation = [...violationRows].sort((a, b) => (a.pnl || 0) - (b.pnl || 0))[0];
  const bestEmotion = [...psychologyRows].sort((a, b) => (b.pnl || 0) - (a.pnl || 0))[0];
  const breakdownChart = outcomePnlChart(data);
  const timeChart = barLineChart(timeRows, 'pnl', 'winRate', 'Net P&L', 'Winrate');
  const sessionChart = barLineChart(sessionRows, 'pnl', 'avgRr', 'Net P&L', 'Avg RR');
  const ltfChart = horizontalMetricChart(ltfRows, 'trades', 'LTF Entry Receive', 'number');
  const gradeChart = barLineChart(gradeRows, 'pnl', 'avgRr', 'Net P&L', 'Avg RR');
  const structureChart = horizontalMetricChart(structureRows, 'pnl', 'Structure P&L', 'money');
  const poiChart = horizontalMetricChart(poiRows, 'winRate', 'POI Winrate', 'percent');
  const riskChart = barLineChart(violationRows.length ? violationRows : groupBy(ledger, 'ruleViolation'), 'pnl', 'trades', 'Rule Cost', 'Trades');
  const commissionChart = barLineChart(groupBy(ledger, 'asset'), 'commissionAmount', 'pnl', 'Commission', 'Net P&L');
  const psychologyChart = barLineChart(psychologyRows, 'pnl', 'winRate', 'Psychology P&L', 'Winrate');
  const dayRows = summaryRows(ledger, 'dayName', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const weekRows = summaryRows(ledger, 'weekNumber');
  const monthRows = summaryRows(ledger, 'monthNumber', Array.from({ length: 12 }, (_, i) => i + 1));
  const ruleMonitor = useMemo(() => computeRuleMonitor(trades, account || 50000), [trades, account]);
  const ruleChartRows = ruleMonitor.days.slice(-12);
  const ruleChart = ruleBufferChart(ruleChartRows);
  return <section>
    <Header title="Analytics" hint="Find your edge by structure, time, psychology, and RR behavior" />
    <div className="report-tabs">{reportTabs.map((tab) => <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
    {activeTab !== 'Micro' && <div className="kpi-grid analytics-kpis"><Kpi label="Trades" value={stats.total} /><Kpi label="Win / Loss / Miss" value={`${stats.wins} / ${stats.losses} / ${stats.miss}`} /><Kpi label="Avg Duration" value={fmtMinutes(stats.avgDuration)} /><Kpi label="Asia RR / Tick" value={`${fmtR(stats.asiaAvgRr)} / ${Number(stats.asiaAvgTick || 0).toFixed(1)}`} /><Kpi label="Best Time" value={bestTime?.name || '-'} /><Kpi label="Best RR Hypothesis" value={money(stats.bestRr?.value || 0)} /></div>}
    {activeTab !== 'Micro' && <div className="insight-strip">
      <Insight title="Repeat" value={bestSetup?.name || '-'} meta={bestSetup ? `${money(bestSetup.pnl)} / ${pct(bestSetup.winRate * 100)}` : 'No setup data'} tone="good" />
      <Insight title="Reduce" value={worstSetup?.name || '-'} meta={worstSetup ? `${money(worstSetup.pnl)} / ${worstSetup.trades} trades` : 'No setup data'} tone="bad" />
      <Insight title="Golden Hour" value={bestTime?.name || '-'} meta={bestTime ? `${money(bestTime.pnl)} / ${fmtR(bestTime.avgRr)}` : 'No time data'} />
      <Insight title="Leak" value={costlyViolation?.name || 'None'} meta={costlyViolation ? `${money(costlyViolation.pnl)} rule cost` : 'No violations logged'} tone={costlyViolation ? 'bad' : 'good'} />
      <Insight title="Mindset" value={bestEmotion?.name || '-'} meta={bestEmotion ? `${money(bestEmotion.pnl)} / ${pct(bestEmotion.winRate * 100)}` : 'No psychology data'} />
    </div>}

    {activeTab === 'Overview' && <>
      <Panel title="Performance Breakdown"><div className="toolbar"><select value={dimension} onChange={(e) => setDimension(e.target.value)}>{dimensionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><ChartWrap empty={!data.length}><SmartChart type="bar" data={breakdownChart} options={makeOptions('number', { scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, grid: { color: chartColors.grid }, ticks: { color: chartColors.muted } }, y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: chartColors.muted, callback: (value) => money(value) } } } })} /></ChartWrap><ReportTable rows={data} focusDimension={dimension} setFocusDimension={setFocusDimension} setFocusValue={setFocusValue} /></Panel>
      <div className="grid three summary-grid">
        <SummaryTable title="Day Summary" rows={dayRows} />
        <SummaryTable title="Week Summary" rows={weekRows} />
        <SummaryTable title="Month Summary" rows={monthRows} />
      </div>
    </>}

    {activeTab === 'Time' && <div className="grid two">
      <Panel title="Entry Time Edge"><ChartWrap empty={!timeRows.length}><SmartChart type="bar" data={timeChart} options={dualAxisOptions('money', 'percent')} /></ChartWrap><ReportTable rows={timeRows} focusDimension="entryHour" setFocusDimension={setFocusDimension} setFocusValue={setFocusValue} /></Panel>
      <Panel title="Session Quality"><ChartWrap empty={!sessionRows.length}><SmartChart type="bar" data={sessionChart} options={dualAxisOptions('money', 'rr')} /></ChartWrap><ReportTable rows={sessionRows} focusDimension="session" setFocusDimension={setFocusDimension} setFocusValue={setFocusValue} /></Panel>
    </div>}

    {activeTab === 'Setup' && <div className="grid two">
      <Panel title="LTF Entry Receive"><ChartWrap empty={!ltfRows.length}><SmartChart type="bar" data={ltfChart} options={makeOptions('number', { indexAxis: 'y', plugins: { legend: { display: false } } })} /></ChartWrap><ReportTable rows={ltfRows} focusDimension="ltfEntry" setFocusDimension={setFocusDimension} setFocusValue={setFocusValue} /></Panel>
      <Panel title="Setup Grade Edge"><ChartWrap empty={!gradeRows.length}><SmartChart type="bar" data={gradeChart} options={dualAxisOptions('money', 'rr')} /></ChartWrap><ReportTable rows={gradeRows} focusDimension="setupGrade" setFocusDimension={setFocusDimension} setFocusValue={setFocusValue} /></Panel>
      <Panel title="MTF Structure"><ChartWrap empty={!structureRows.length}><SmartChart type="bar" data={structureChart} options={makeOptions('money', { indexAxis: 'y', plugins: { legend: { display: false } } })} /></ChartWrap></Panel>
      <Panel title="POI Quality"><ChartWrap empty={!poiRows.length}><SmartChart type="bar" data={poiChart} options={makeOptions('percent', { indexAxis: 'y', plugins: { legend: { display: false } } })} /></ChartWrap></Panel>
    </div>}

    {activeTab === 'Risk' && <div className="grid two">
      <Panel title="Prop Firm Rule Monitor">
        <div className="rule-monitor-head">
          <Insight title="Latest Day" value={ruleMonitor.latest ? shortDate(ruleMonitor.latest.date) : '-'} meta={ruleMonitor.latest ? `${money(ruleMonitor.latest.pnl)} / ${ruleMonitor.latest.trades} trades` : 'No trades yet'} tone={ruleMonitor.latest?.tone || ''} />
          <Insight title="Watch Days" value={ruleMonitor.watchDays} meta="60%+ limit usage" tone={ruleMonitor.watchDays ? 'watch' : 'good'} />
          <Insight title="Alert Days" value={ruleMonitor.dangerDays} meta="85%+ limit usage" tone={ruleMonitor.dangerDays ? 'bad' : 'good'} />
        </div>
        <ChartWrap empty={!ruleChartRows.length || !ruleMonitor.hasRules}><SmartChart type="bar" data={ruleChart} options={makeOptions('money')} /></ChartWrap>
      </Panel>
      <Panel title="Daily Rule Ledger">
        <RuleMonitorTable rows={ruleMonitor.days.slice(-10).reverse()} hasRules={ruleMonitor.hasRules} />
      </Panel>
      <Panel title="Rule Violation Cost"><ChartWrap empty={!ledger.length}><SmartChart type="bar" data={riskChart} options={dualAxisOptions('money', 'number')} /></ChartWrap><ReportTable rows={violationRows.length ? violationRows : groupBy(ledger, 'ruleViolation')} focusDimension="ruleViolation" setFocusDimension={setFocusDimension} setFocusValue={setFocusValue} /></Panel>
      <Panel title="Commission Load"><ChartWrap empty={!ledger.length}><SmartChart type="bar" data={commissionChart} options={dualAxisOptions('money', 'money')} /></ChartWrap><ReportTable rows={groupBy(ledger, 'asset')} focusDimension="asset" setFocusDimension={setFocusDimension} setFocusValue={setFocusValue} /></Panel>
      <Panel title="RR Recommendation"><div className="table-wrap slim"><table><thead><tr><th>RR</th><th>Qualifying wins</th><th>Win Rate</th><th>Hypothetical value</th></tr></thead><tbody>{stats.rrRows.map((r) => <tr key={r.level} className={r.level === stats.bestRr?.level ? 'selected' : ''}><td>{fmtR(r.level)}</td><td>{r.count}</td><td>{pct(r.winRate * 100)}</td><td>{money(r.value)}</td></tr>)}</tbody></table></div></Panel>
      <Panel title="Risk Notes"><div className="report-notes"><b>What to watch</b><span>Compare commission, SL cost, and rule violations before increasing size. A profitable setup with high rule leakage should be fixed before it is scaled.</span><b>Prop firm lens</b><span>Use drawdown, losing streak, and daily loss behavior together with the portfolio rules in Settings.</span></div></Panel>
    </div>}

    {activeTab === 'Psychology' && <div className="grid two">
      <Panel title="Emotion After Outcome"><ChartWrap empty={!psychologyRows.length}><SmartChart type="bar" data={psychologyChart} options={dualAxisOptions('money', 'percent')} /></ChartWrap><ReportTable rows={psychologyRows} focusDimension="emotionAfter" setFocusDimension={setFocusDimension} setFocusValue={setFocusValue} /></Panel>
      <Panel title="Discipline Review"><div className="table-wrap slim"><table><thead><tr><th>Emotion</th><th>Trades</th><th>Winrate</th><th>Avg Duration</th><th>Net</th></tr></thead><tbody>{psychologyRows.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.trades}</td><td>{pct(row.winRate * 100)}</td><td>{fmtMinutes(row.avgDuration)}</td><td className={row.pnl >= 0 ? 'pos' : 'neg'}>{money(row.pnl)}</td></tr>)}</tbody></table></div></Panel>
    </div>}

    {activeTab === 'Micro' && <MicroAnalytics ledger={ledger} />}

    {activeTab === 'Custom' && <Panel title="Custom Analyzer"><div className="builder-controls"><Field label="Dimension"><select value={builderDimension} onChange={(e) => setBuilderDimension(e.target.value)}>{dimensionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Metric"><select value={builderMetric} onChange={(e) => setBuilderMetric(e.target.value)}>{metricOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Chart"><select value={chartType} onChange={(e) => setChartType(e.target.value)}><option value="bar">Vertical Bar</option><option value="horizontal">Horizontal Bar</option><option value="line">Line</option><option value="doughnut">Doughnut</option><option value="pie">Pie</option></select></Field></div><ChartWrap empty={!builderData.length}><BuilderChart data={builderData} metric={builderMetric} chartType={chartType} /></ChartWrap><ReportTable rows={builderData} focusDimension={builderDimension} setFocusDimension={setFocusDimension} setFocusValue={setFocusValue} metric={builderMetric} /></Panel>}

    {activeTab !== 'Micro' && <Panel title={focusValue ? `Trade Drilldown: ${focusValue}` : 'Recent Trade Drilldown'}><TradeDrilldown rows={focusRows} /></Panel>}
  </section>;
}

function outcomePnlChart(rows) {
  return {
    labels: rows.map((row) => row.name),
    datasets: [
      { label: 'Wins', data: rows.map((row) => row.wins), backgroundColor: chartColors.winSoft, borderColor: chartColors.win, borderWidth: 1, borderRadius: 5, stack: 'outcome', valueKind: 'number', yAxisID: 'y' },
      { label: 'Losses', data: rows.map((row) => row.losses), backgroundColor: chartColors.lossSoft, borderColor: chartColors.loss, borderWidth: 1, borderRadius: 5, stack: 'outcome', valueKind: 'number', yAxisID: 'y' },
      { type: 'line', label: 'P&L', data: rows.map((row) => row.pnl), borderColor: chartColors.gold, backgroundColor: chartColors.gold, borderWidth: 2, tension: 0.35, pointRadius: 3, valueKind: 'money', yAxisID: 'y1' }
    ]
  };
}

function barLineChart(rows, barMetric, lineMetric, barLabel, lineLabel) {
  return {
    labels: rows.map((row) => row.name),
    datasets: [
      { label: barLabel, data: rows.map((row) => metricValue(row, barMetric)), backgroundColor: rows.map((row) => metricValue(row, barMetric) >= 0 ? chartColors.winSoft : chartColors.lossSoft), borderColor: rows.map((row) => metricValue(row, barMetric) >= 0 ? chartColors.win : chartColors.loss), borderWidth: 1, borderRadius: 5, valueKind: metricKind(barMetric), yAxisID: 'y' },
      { type: 'line', label: lineLabel, data: rows.map((row) => metricValue(row, lineMetric)), borderColor: chartColors.gold, backgroundColor: chartColors.gold, borderWidth: 2, tension: 0.35, pointRadius: 3, valueKind: metricKind(lineMetric), yAxisID: 'y1' }
    ]
  };
}

function horizontalMetricChart(rows, metric, label, kind = 'number') {
  return {
    labels: rows.map((row) => row.name),
    datasets: [{
      label,
      data: rows.map((row) => metricValue(row, metric)),
      backgroundColor: rows.map((_, index) => `${chartPalette[index % chartPalette.length]}44`),
      borderColor: rows.map((_, index) => chartPalette[index % chartPalette.length]),
      borderWidth: 1,
      borderRadius: 5,
      valueKind: kind
    }]
  };
}

function ruleBufferChart(rows) {
  return {
    labels: rows.map((row) => shortDate(row.date)),
    datasets: [
      {
        label: 'Daily loss used',
        data: rows.map((row) => row.lossUsed),
        backgroundColor: rows.map((row) => row.tone === 'bad' ? chartColors.lossSoft : row.tone === 'watch' ? chartColors.goldSoft : chartColors.tealSoft),
        borderColor: rows.map((row) => row.tone === 'bad' ? chartColors.loss : row.tone === 'watch' ? chartColors.gold : chartColors.teal),
        borderWidth: 1,
        borderRadius: 5,
        valueKind: 'money',
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Drawdown used',
        data: rows.map((row) => row.drawdownUsed),
        borderColor: chartColors.loss,
        backgroundColor: chartColors.loss,
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 3,
        valueKind: 'money',
        yAxisID: 'y'
      }
    ]
  };
}

function dualAxisOptions(leftKind, rightKind) {
  return makeOptions(leftKind, {
    scales: {
      y: { beginAtZero: true, grid: { color: chartColors.grid }, ticks: { color: chartColors.muted, callback: (value) => chartFormat(leftKind, value) } },
      y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: chartColors.muted, callback: (value) => chartFormat(rightKind, value) } }
    }
  });
}

function Insight({ title, value, meta, tone = '' }) {
  return <div className={`insight ${tone}`}>
    <span>{title}</span>
    <b>{value}</b>
    <small>{meta}</small>
  </div>;
}

function ReportTable({ rows, focusDimension, setFocusDimension, setFocusValue, metric = 'pnl' }) {
  return <div className="table-wrap slim report-table"><table><thead><tr><th>Group</th><th>Trades</th><th>Winrate</th><th>Avg RR</th><th>Avg Tick</th><th>{metricOptions.find(([value]) => value === metric)?.[1] || 'Net'}</th><th></th></tr></thead><tbody>{rows.map((row) => {
    const value = metricValue(row, metric);
    const tone = metric === 'commissionAmount' ? 'neg' : value >= 0 ? 'pos' : 'neg';
    return <tr key={row.name}><td><b>{row.name}</b><small>{row.wins}W / {row.losses}L</small></td><td>{row.trades}</td><td>{pct(row.winRate * 100)}</td><td>{fmtR(row.avgRr)}</td><td>{row.avgTick.toFixed(1)}</td><td className={tone}>{metricLabel(metric, value)}</td><td><button onClick={() => { setFocusDimension(focusDimension); setFocusValue(row.name); }}>View</button></td></tr>;
  })}</tbody></table></div>;
}

function TradeDrilldown({ rows }) {
  return <div className="table-wrap analytics-drilldown"><table><thead><tr><th>Date</th><th>Asset</th><th>Session</th><th>Setup</th><th>LTF Entry</th><th>Grade</th><th>RR / Tick</th><th>Psychology</th><th>P&L</th></tr></thead><tbody>{rows.map((trade) => <tr key={trade.id || `${trade.date}-${trade.entryTime}-${trade.asset}`}><td>{trade.date}<small>{trade.entryTime || '-'} / {trade.durationTime || fmtMinutes(trade.durationMinutes)}</small></td><td>{trade.asset}</td><td>{trade.session}</td><td>{trade.mtfStructure || '-'}<small>{trade.htfBias || '-'} / {trade.htfPoi || '-'}</small></td><td>{trade.ltfEntry || '-'}<small>{trade.keyZone || '-'}</small></td><td><b>{trade.setupGrade || '-'}</b><small>{trade.setupScore || 0}/100</small></td><td>{fmtR(trade.actualR ?? trade.plannedR)}<small>Max {trade.maxTick ?? '-'} tick</small></td><td>{trade.emotionAfter || '-'}<small>{trade.ruleViolation || 'None'}</small></td><td className={trade.pnl >= 0 ? 'pos' : 'neg'}>{money(trade.pnl)}<small>Fee {money(trade.commissionAmount || 0)}</small></td></tr>)}</tbody></table></div>;
}

function RuleMonitorTable({ rows, hasRules }) {
  if (!hasRules) return <div className="compact-empty">Set Daily Loss and Drawdown in Settings to activate prop-firm rule monitoring.</div>;
  return <div className="table-wrap slim rule-ledger"><table><thead><tr><th>Date</th><th>Trades</th><th>Net</th><th>Daily Loss</th><th>DD Used</th><th>Buffer</th></tr></thead><tbody>{rows.map((row) => {
    const buffers = [row.dailyLossActive ? row.dailyLossBuffer : null, row.drawdownActive ? row.drawdownBuffer : null].filter((value) => value !== null);
    const buffer = buffers.length ? Math.min(...buffers) : null;
    return <tr key={row.date} className={row.tone === 'bad' ? 'invalid' : row.tone === 'watch' ? 'watch-row' : ''}><td><b>{row.date}</b><small>{row.tone}</small></td><td>{row.trades}</td><td className={row.pnl >= 0 ? 'pos' : 'neg'}>{money(row.pnl)}</td><td>{row.dailyLossActive ? money(row.lossUsed) : '-'}<small>{row.dailyLossActive ? `${row.dailyPct.toFixed(0)}%` : 'not set'}</small></td><td>{row.drawdownActive ? money(row.drawdownUsed) : '-'}<small>{row.drawdownActive ? `${row.drawdownPct.toFixed(0)}%` : 'not set'}</small></td><td>{buffer === null ? '-' : money(buffer)}</td></tr>;
  })}</tbody></table></div>;
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

const defaultPlaybookSetups = [
  {
    id: 'ob-fvg-sweep',
    name: 'OB + FVG Sweep',
    gradeTarget: 'A',
    market: 'NQ / MNQ',
    entryModel: 'HTF POI -> LQ Sweep -> CHoCH/BOS -> LTF OB+FVG',
    conditions: [
      { label: 'HTF bias aligns with trade direction', weight: 20, checked: true },
      { label: 'Price is inside valid HTF POI / OB', weight: 15, checked: true },
      { label: 'Liquidity sweep before entry', weight: 15, checked: true },
      { label: 'LTF OB + FVG receives price cleanly', weight: 20, checked: true },
      { label: 'BOS or CHoCH confirms displacement', weight: 20, checked: true },
      { label: 'Entry is inside planned session window', weight: 10, checked: true }
    ],
    invalidation: 'POI is mitigated without reaction, no displacement, or entry chases outside plan.',
    management: 'Take partials at planned RR, track Max RR / Max Tick, and journal any rule break immediately.',
    notes: 'Core continuation/reversal setup for edge testing.'
  }
];

function setupScore(setup) {
  const conditions = setup?.conditions || [];
  const total = conditions.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  const score = conditions.reduce((sum, item) => sum + (item.checked ? Number(item.weight || 0) : 0), 0);
  return total ? Math.round((score / total) * 100) : 0;
}

function gradeForScore(score) {
  if (score >= 90) return 'A+';
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  return 'C';
}

function blankPlaybookSetup() {
  return {
    id: `setup-${Date.now()}`,
    name: 'New Setup',
    gradeTarget: 'A',
    market: 'NQ1',
    entryModel: 'Define POI, confirmation, trigger, and invalidation.',
    conditions: [
      { label: 'HTF bias is clear', weight: 20, checked: false },
      { label: 'POI is valid', weight: 20, checked: false },
      { label: 'Entry trigger is confirmed', weight: 20, checked: false },
      { label: 'Risk and target are planned', weight: 20, checked: false },
      { label: 'No rule violation before entry', weight: 20, checked: false }
    ],
    invalidation: '',
    management: '',
    notes: ''
  };
}

function JournalPage({ api, accountId }) {
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState('');
  const [setups, setSetups] = useState(defaultPlaybookSetups);
  const [activeId, setActiveId] = useState(defaultPlaybookSetups[0].id);
  const activeSetup = setups.find((setup) => setup.id === activeId) || setups[0];
  const activeScore = setupScore(activeSetup);
  useEffect(() => {
    if (!accountId) return;
    Promise.all([
      api(`/accounts/${accountId}/note`),
      api(`/accounts/${accountId}/playbook-setups`)
    ]).then(([note, setupData]) => {
      setContent(note.note.content || '');
      const rows = setupData.setups?.length ? setupData.setups : defaultPlaybookSetups;
      setSetups(rows);
      setActiveId(rows[0]?.id || defaultPlaybookSetups[0].id);
    });
  }, [accountId]);
  async function save() {
    await Promise.all([
      api(`/accounts/${accountId}/note`, { method: 'PUT', body: JSON.stringify({ content }) }),
      api(`/accounts/${accountId}/playbook-setups`, { method: 'PUT', body: JSON.stringify({ setups }) })
    ]);
    setSaved(new Date().toLocaleTimeString());
  }
  function updateSetup(key, value) {
    setSetups(setups.map((setup) => setup.id === activeSetup.id ? { ...setup, [key]: value } : setup));
  }
  function updateCondition(index, key, value) {
    updateSetup('conditions', activeSetup.conditions.map((item, i) => i === index ? { ...item, [key]: value } : item));
  }
  function addSetup() {
    const setup = blankPlaybookSetup();
    setSetups([...setups, setup]);
    setActiveId(setup.id);
  }
  function deleteSetup() {
    if (setups.length <= 1) return;
    const next = setups.filter((setup) => setup.id !== activeSetup.id);
    setSetups(next);
    setActiveId(next[0].id);
  }
  return <section>
    <Header title="Playbook" hint={saved ? `Saved ${saved}` : 'Setup templates, scoring rules, and review notes'} action={<button className="primary" onClick={save}><Save size={16} />Save playbook</button>} />
    <div className="playbook-layout">
      <Panel title="Setup Library">
        <div className="setup-list">
          {setups.map((setup) => <button key={setup.id} className={setup.id === activeSetup.id ? 'selected' : ''} onClick={() => setActiveId(setup.id)}><b>{setup.name}</b><span>{setup.market || 'Any market'} · target {setup.gradeTarget}</span></button>)}
          <button onClick={addSetup}><Plus size={15} />New setup</button>
        </div>
      </Panel>
      <Panel title="Setup Checklist">
        {activeSetup && <div className="setup-editor">
          <div className="setup-headline">
            <div><h2>{activeSetup.name}</h2><span>{activeSetup.entryModel}</span></div>
            <div className="setup-score"><b>{activeScore}</b><small>{gradeForScore(activeScore)}</small></div>
          </div>
          <div className="form-grid compact">
            <Field label="Setup name"><input value={activeSetup.name} onChange={(e) => updateSetup('name', e.target.value)} /></Field>
            <Field label="Market / Asset"><input value={activeSetup.market || ''} onChange={(e) => updateSetup('market', e.target.value)} /></Field>
            <Field label="Target grade"><select value={activeSetup.gradeTarget || 'A'} onChange={(e) => updateSetup('gradeTarget', e.target.value)}><option>A+</option><option>A</option><option>B</option><option>C</option></select></Field>
          </div>
          <Field label="Entry model"><textarea value={activeSetup.entryModel || ''} onChange={(e) => updateSetup('entryModel', e.target.value)} /></Field>
          <div className="checklist-editor">
            {(activeSetup.conditions || []).map((item, index) => <div className="checklist-row" key={index}>
              <label><input type="checkbox" checked={!!item.checked} onChange={(e) => updateCondition(index, 'checked', e.target.checked)} />Rule</label>
              <input value={item.label || ''} onChange={(e) => updateCondition(index, 'label', e.target.value)} />
              <input type="number" value={item.weight || 0} onChange={(e) => updateCondition(index, 'weight', e.target.value)} />
              <button onClick={() => updateSetup('conditions', activeSetup.conditions.filter((_, i) => i !== index))}><Trash2 size={14} /></button>
            </div>)}
            <button onClick={() => updateSetup('conditions', [...(activeSetup.conditions || []), { label: 'New rule', weight: 10, checked: false }])}><Plus size={15} />Add rule</button>
          </div>
          <div className="form-grid compact">
            <Field label="Invalidation"><textarea value={activeSetup.invalidation || ''} onChange={(e) => updateSetup('invalidation', e.target.value)} /></Field>
            <Field label="Management"><textarea value={activeSetup.management || ''} onChange={(e) => updateSetup('management', e.target.value)} /></Field>
          </div>
          <Field label="Setup notes"><textarea value={activeSetup.notes || ''} onChange={(e) => updateSetup('notes', e.target.value)} /></Field>
          <div className="actions">{setups.length > 1 && <button onClick={deleteSetup}><Trash2 size={14} />Delete setup</button>}</div>
        </div>}
      </Panel>
    </div>
    <Panel title="Account Review Notes"><textarea className="playbook" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Daily lessons, rules, review process, and account-specific notes..." /></Panel>
  </section>;
}

function SettingsPage({ api, accounts, account, options, optionLabels, assets, portfolioLimit, portfolioTemplates, user, setCurrentUser, reload, setToast }) {
  const { t } = useI18n();
  const [accountDraft, setAccountDraft] = useState(accountDraftFrom(account));
  const [templateId, setTemplateId] = useState('custom');
  const [optionDrafts, setOptionDrafts] = useState({});
  const [optionLabelDrafts, setOptionLabelDrafts] = useState({});
  const [optionInputs, setOptionInputs] = useState({});
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [showNewFieldForm, setShowNewFieldForm] = useState(false);
  const [assetDrafts, setAssetDrafts] = useState([]);
  const [savingOption, setSavingOption] = useState('');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [visiblePasswords, setVisiblePasswords] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });
  const [profile, setProfile] = useState(user?.profile || {});
  useEffect(() => setAccountDraft(accountDraftFrom(account)), [account?.id]);
  useEffect(() => setOptionDrafts(Object.fromEntries(Object.entries(options).map(([key, vals]) => [key, vals]))), [options]);
  useEffect(() => setOptionLabelDrafts({ ...defaultOptionLabels, ...optionLabels }), [optionLabels]);
  useEffect(() => setAssetDrafts(assets.map((asset) => ({ ...asset }))), [assets]);
  useEffect(() => setProfile(user?.profile || {}), [user?.id, user?.profile]);
  function setAccountField(key, value) {
    setAccountDraft((draft) => ({ ...draft, [key]: value }));
  }
  function applyTemplate() {
    const selected = portfolioTemplates.find((template) => String(template.id || template.templateKey) === templateId);
    if (!selected) return;
    setAccountDraft((draft) => ({ ...draft, ...selected.values }));
    setToast('Portfolio template applied');
  }
  async function saveAccount() {
    await api(`/accounts/${account.id}`, { method: 'PUT', body: JSON.stringify(accountDraft) });
    await reload(account.id);
    setToast('Portfolio saved');
  }
  async function addAccount() {
    if (accounts.length >= portfolioLimit) {
      setToast(`Portfolio limit reached (${portfolioLimit})`);
      return;
    }
    const data = await api('/accounts', { method: 'POST', body: JSON.stringify(blankAccount) });
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
  async function saveOption(key, nextValues = optionDrafts[key], nextLabel = optionLabelDrafts[key]) {
    const values = [...new Set((Array.isArray(nextValues) ? nextValues : []).map((value) => String(value).trim()).filter(Boolean))];
    setSavingOption(key);
    try {
      await api(`/options/${key}`, { method: 'PUT', body: JSON.stringify({ label: nextLabel || defaultOptionLabels[key] || key, options: values }) });
      await reload(account.id);
      setToast('Options saved');
    } catch (error) {
      setToast(error.message || 'Could not save options');
    } finally {
      setSavingOption('');
    }
  }
  async function addOptionValue(key) {
    const value = String(optionInputs[key] || '').trim();
    if (!value) return;
    const current = optionDrafts[key] || [];
    if (current.map((item) => item.toLowerCase()).includes(value.toLowerCase())) {
      setToast('Option already exists');
      return;
    }
    const next = [...current, value];
    setOptionDrafts({ ...optionDrafts, [key]: next });
    setOptionInputs({ ...optionInputs, [key]: '' });
    await saveOption(key, next);
  }
  function updateOptionValue(key, index, value) {
    const next = (optionDrafts[key] || []).map((item, itemIndex) => itemIndex === index ? value : item);
    setOptionDrafts({ ...optionDrafts, [key]: next });
  }
  async function removeOptionValue(key, value) {
    const next = (optionDrafts[key] || []).filter((item) => item !== value);
    setOptionDrafts({ ...optionDrafts, [key]: next });
    await saveOption(key, next);
  }
  async function resetOptionValues(key) {
    const next = defaultOptions[key] || [];
    setOptionDrafts({ ...optionDrafts, [key]: next });
    await saveOption(key, next);
  }
  async function clearOptionSet(key) {
    const label = optionLabelDrafts[key] || defaultOptionLabels[key] || key;
    if (!window.confirm(`ลบตัวเลือกทั้งหมดในชุด ${label} ใช่หรือไม่?`)) return;
    setOptionDrafts({ ...optionDrafts, [key]: [] });
    await saveOption(key, []);
    setToast(`${label} cleared`);
  }
  async function renameOptionLabel(key) {
    const current = optionLabelDrafts[key] || defaultOptionLabels[key] || key;
    const next = prompt('ชื่อหัวข้อ', current);
    if (next === null) return;
    const label = next.trim() || current;
    setOptionLabelDrafts({ ...optionLabelDrafts, [key]: label });
    await saveOption(key, optionDrafts[key], label);
  }
  async function resetOptionLabel(key) {
    const label = defaultOptionLabels[key] || key;
    setOptionLabelDrafts({ ...optionLabelDrafts, [key]: label });
    await saveOption(key, optionDrafts[key], label);
  }
  async function addFieldOptionSet() {
    const label = newFieldLabel.trim();
    if (!label) return;
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 32) || 'field';
    const baseKey = `custom_${slug}`;
    let key = baseKey;
    let index = 2;
    while (Object.prototype.hasOwnProperty.call(optionDrafts, key)) key = `${baseKey}_${index++}`;
    try {
      await api(`/options/${key}`, { method: 'PUT', body: JSON.stringify({ label, options: [] }) });
      setNewFieldLabel('');
      setShowNewFieldForm(false);
      await reload(account.id);
      setToast(`Created ${label}`);
    } catch (error) {
      setToast(error.message || 'Could not create field option set');
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
  const optionEntries = [
    ...visibleFieldOptionKeys
      .filter((key) => Object.prototype.hasOwnProperty.call(optionDrafts, key))
      .map((key) => [key, optionDrafts[key]]),
    ...Object.entries(optionDrafts).filter(([key]) => !visibleFieldOptionKeys.includes(key) && !hiddenLegacyFieldOptionKeys.has(key))
  ];
  return <section><Header title="Settings" hint={`${t('Portfolios, presets, and customizable field options')} (${accounts.length}/${portfolioLimit})`} action={<button onClick={addAccount} disabled={accounts.length >= portfolioLimit}><Plus size={16} />{t('New portfolio')}</button>} />
    <Panel title="Language"><LanguageSwitcher /></Panel>
    <Panel title="Profile"><div className="profile-settings">
      <div className="profile-upload">
        <div className="profile-photo preview">{profile.image ? <img src={profile.image} alt="" /> : <UserRound size={96} strokeWidth={1.2} />}</div>
        <label className="upload-button"><Upload size={15} />{t('Upload 250x250')}<input type="file" accept="image/*" onChange={chooseProfileImage} /></label>
      </div>
      <div className="profile-fields">
        <div className="form-grid compact"><Field label="Nickname"><input value={profile.nickname || ''} onChange={(e) => setProfile({ ...profile, nickname: e.target.value })} placeholder="Nick Name" /></Field><Field label="Show contact"><select value={profile.contactType || 'email'} onChange={(e) => setProfile({ ...profile, contactType: e.target.value })}>{Object.entries(profileContactLabels).map(([key, label]) => <option key={key} value={key}>{t(label)}</option>)}</select></Field></div>
        <div className="form-grid compact"><Field label="Phone"><input value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="Phone number" /></Field><Field label="E-mail"><input type="email" value={profile.email || ''} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder={user?.email || 'name@email.com'} /></Field><Field label="Facebook"><input value={profile.facebook || ''} onChange={(e) => setProfile({ ...profile, facebook: e.target.value })} placeholder="Facebook" /></Field><Field label="Status message"><input value={profile.line || ''} onChange={(e) => setProfile({ ...profile, line: e.target.value })} placeholder={t('Status message')} /></Field></div>
        <div className="profile-preview-line">{t('Preview label')} <b>{profile.nickname || 'Nick Name'}</b><span>{profileContact(profile, user?.email) || t(profileContactLabels[profile.contactType || 'email'])}</span></div>
        <div className="actions"><button className="primary" onClick={saveProfile}><Save size={16} />{t('Save profile')}</button></div>
      </div>
    </div></Panel>
    <div className="grid two settings-lower"><Panel title="Portfolio Management"><div className="template-row"><Field label="Auto preset"><select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>{portfolioTemplates.map((template) => <option key={template.id || template.templateKey} value={String(template.id || template.templateKey)}>{template.label}</option>)}</select></Field><button onClick={applyTemplate}><SlidersHorizontal size={15} />{t('Apply')}</button></div><div className="form-grid"><Field label="Name"><input value={accountDraft.name || ''} onChange={(e) => setAccountField('name', e.target.value)} /></Field><Field label="Provider"><input value={accountDraft.provider || ''} onChange={(e) => setAccountField('provider', e.target.value)} placeholder="Apex, MFF, TopStep, FTMO..." /></Field><Field label="Plan"><input value={accountDraft.planName || ''} onChange={(e) => setAccountField('planName', e.target.value)} placeholder="50K Evaluation" /></Field><Field label="Market"><input value={accountDraft.marketType || ''} onChange={(e) => setAccountField('marketType', e.target.value)} placeholder="Futures / Forex" /></Field><Field label="Type"><select value={accountDraft.type || 'live'} onChange={(e) => setAccountField('type', e.target.value)}><option value="backtest">backtest</option><option value="forward">forward</option><option value="live">live</option><option value="funded">funded</option></select></Field><Field label="Starting Balance"><input type="number" value={accountDraft.startingBalance || ''} onChange={(e) => setAccountField('startingBalance', e.target.value)} /></Field></div><div className="rule-grid"><Field label="Profit Target"><input type="number" value={accountDraft.profitTarget || ''} onChange={(e) => setAccountField('profitTarget', e.target.value)} /></Field><Field label="Daily Loss"><input type="number" value={accountDraft.dailyLossLimit || ''} onChange={(e) => setAccountField('dailyLossLimit', e.target.value)} /></Field><Field label="Max Drawdown"><input type="number" value={accountDraft.maxDrawdown || ''} onChange={(e) => setAccountField('maxDrawdown', e.target.value)} /></Field><Field label="Trailing DD"><input type="number" value={accountDraft.trailingDrawdown || ''} onChange={(e) => setAccountField('trailingDrawdown', e.target.value)} /></Field><Field label="Max Contracts"><input type="number" value={accountDraft.maxContracts || ''} onChange={(e) => setAccountField('maxContracts', e.target.value)} /></Field><Field label="Min Days"><input type="number" value={accountDraft.minTradingDays || ''} onChange={(e) => setAccountField('minTradingDays', e.target.value)} /></Field></div><div className="form-grid compact"><Field label="Consistency Rule"><textarea value={accountDraft.consistencyRule || ''} onChange={(e) => setAccountField('consistencyRule', e.target.value)} /></Field><Field label="Payout Rule"><textarea value={accountDraft.payoutRule || ''} onChange={(e) => setAccountField('payoutRule', e.target.value)} /></Field></div><div className="fee-grid"><Field label="Commission type"><select value={accountDraft.commissionType || 'none'} onChange={(e) => setAccountField('commissionType', e.target.value)}>{Object.entries(commissionTypeLabels).map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}</select></Field><Field label="Amount"><input type="number" step="any" value={accountDraft.commissionAmount ?? ''} onChange={(e) => setAccountField('commissionAmount', e.target.value)} /></Field><Field label="Scope"><select value={accountDraft.commissionScope || 'roundTrip'} onChange={(e) => setAccountField('commissionScope', e.target.value)}><option value="roundTrip">{t('Round trip')}</option><option value="entry">{t('Entry only')}</option><option value="exit">{t('Exit only')}</option></select></Field></div><Field label="Commission note"><input value={accountDraft.commissionNotes || ''} onChange={(e) => setAccountField('commissionNotes', e.target.value)} placeholder="Keep this synced with your broker statement" /></Field><div className="portfolio-summary"><span>{accountDraft.provider || 'Custom'} / {accountDraft.planName || 'Manual plan'}</span><b>{money(accountDraft.startingBalance || 0)}</b><small>{t(commissionTypeLabels[accountDraft.commissionType || 'none'])} {accountDraft.commissionAmount ? `• ${accountDraft.commissionAmount}` : ''}</small></div><div className="actions"><button className="primary" onClick={saveAccount}><Save size={16} />{t('Save portfolio')}</button><button onClick={() => resetAccount(account.id)}>{t('Reset')}</button>{accounts.length > 1 && <button onClick={() => deleteAccount(account.id)}><Trash2 size={14} />{t('Delete')}</button>}</div><div className="portfolio-list">{accounts.map((row) => <button key={row.id} className={row.id === account?.id ? 'selected' : ''}>{row.name}</button>)}</div></Panel>
    <Panel title="Security"><div className="form-grid"><Field label="Current password"><PasswordInput value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} visible={visiblePasswords.currentPassword} onToggle={() => togglePassword('currentPassword')} autoComplete="current-password" /></Field><Field label="New password"><PasswordInput value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} visible={visiblePasswords.newPassword} onToggle={() => togglePassword('newPassword')} autoComplete="new-password" /></Field><Field label="Confirm password"><PasswordInput value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} visible={visiblePasswords.confirmPassword} onToggle={() => togglePassword('confirmPassword')} autoComplete="new-password" /></Field></div><div className="actions"><button className="primary" onClick={changePassword} disabled={!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword}><Save size={16} />{t('Change password')}</button></div></Panel></div>
    <TradingViewIntegrationPanel api={api} accounts={accounts} account={account} setToast={setToast} />
    <div className="grid two settings-lower"><Panel title="Asset Presets"><div className="asset-editor">{assetDrafts.map((asset, index) => <div className="asset-row" key={asset.id || index}><input value={asset.symbol} onChange={(e) => updateAsset(index, 'symbol', e.target.value)} placeholder={t('Symbol')} /><input type="number" step="any" value={asset.tickSize} onChange={(e) => updateAsset(index, 'tickSize', e.target.value)} placeholder="Point" /><input type="number" step="any" value={asset.dollarPerPoint} onChange={(e) => updateAsset(index, 'dollarPerPoint', e.target.value)} placeholder="Lot1 point/$" /><input type="number" step="any" min="0" value={asset.commissionAmount ?? 0} onChange={(e) => updateAsset(index, 'commissionAmount', e.target.value)} placeholder="Commission/contract" /><button onClick={() => saveAsset(asset)}><Save size={14} /></button><button onClick={() => deleteAsset(asset)}><Trash2 size={14} /></button></div>)}<button onClick={() => setAssetDrafts([...assetDrafts, { symbol: '', tickSize: 1, dollarPerPoint: 1, commissionAmount: 0 }])}><Plus size={16} />{t('Add asset')}</button></div></Panel>
    <DataTransferPanel api={api} accounts={accounts} account={account} reload={reload} setToast={setToast} /></div>
    <Panel title={<span className="field-options-title"><span>Field Options</span><small>{FIELD_OPTIONS_VERSION}</small></span>}>
      <div className="field-options-toolbar">
        <p>กำหนดชุดตัวเลือกสำหรับฟอร์มบันทึกเทรด</p>
        <button type="button" onClick={() => setShowNewFieldForm((open) => !open)}><Plus size={15} />{showNewFieldForm ? 'Cancel' : 'Add field'}</button>
      </div>
      {showNewFieldForm && <div className="new-field-form">
        <input value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addFieldOptionSet(); }} placeholder="ชื่อแถบใหม่ เช่น Market Type" autoFocus />
        <button type="button" className="primary" onClick={addFieldOptionSet} disabled={!newFieldLabel.trim()}><Save size={14} />Create</button>
      </div>}
      <div className="option-editor">{optionEntries.map(([key, values]) => <div className="option-card" key={key}>
      <div className="option-card-head">
        <h3>{optionLabelDrafts[key] || defaultOptionLabels[key] || key}</h3>
        <button onClick={() => renameOptionLabel(key)} disabled={savingOption === key}><Pencil size={14} />{t('Rename')}</button>
      </div>
      <div className="option-chip-grid">
        {(values || []).map((value, index) => <span className="option-chip" key={`${key}-${index}`}><input aria-label={`${optionLabelDrafts[key] || key} option ${index + 1}`} value={value} onChange={(e) => updateOptionValue(key, index, e.target.value)} /><button aria-label={`${t('Remove')} ${value}`} title={`${t('Remove')} ${value}`} onClick={() => removeOptionValue(key, value)} disabled={savingOption === key}><X size={15} /></button></span>)}
      </div>
      <div className="option-add-row">
        <input value={optionInputs[key] || ''} onChange={(e) => setOptionInputs({ ...optionInputs, [key]: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') addOptionValue(key); }} placeholder={t('Add new option')} />
        <button onClick={() => addOptionValue(key)} disabled={savingOption === key || !String(optionInputs[key] || '').trim()}><Plus size={15} />{t('Add')}</button>
      </div>
      <div className="option-reset-row">
        <button className="primary" onClick={() => saveOption(key)} disabled={savingOption === key}><Save size={14} />{t('Save')}</button>
        <button className="danger-button" onClick={() => clearOptionSet(key)} disabled={savingOption === key || !(values || []).some(Boolean)}><Trash2 size={14} />{t('Clear set')}</button>
        <button onClick={() => resetOptionValues(key)} disabled={savingOption === key}><RotateCcw size={14} />{t('Reset to Default')}</button>
        <button onClick={() => resetOptionLabel(key)} disabled={savingOption === key}><RotateCcw size={14} />{t('Reset label')}</button>
      </div>
    </div>)}</div></Panel></section>;
}

function TradingViewIntegrationPanel({ api, accounts, account, setToast }) {
  const { t } = useI18n();
  const [integrations, setIntegrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [name, setName] = useState('TradingView Alerts');
  const [selectedAccountId, setSelectedAccountId] = useState(String(account?.id || ''));
  const [revealed, setRevealed] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await api('/integrations/tradingview');
    setIntegrations(data.integrations || []);
  }
  async function loadEvents() {
    const data = await api('/integrations/tradingview/events?limit=20');
    setEvents(data.events || []);
  }
  useEffect(() => { setSelectedAccountId(String(account?.id || '')); }, [account?.id]);
  useEffect(() => { Promise.all([load(), loadEvents()]).catch(() => {}); }, []);

  async function createIntegration() {
    if (!selectedAccountId) return;
    setBusy(true);
    try {
      const data = await api('/integrations/tradingview', { method: 'POST', body: JSON.stringify({ name, accountId: Number(selectedAccountId) }) });
      setRevealed(data.integration);
      setIntegrations([data.integration, ...integrations]);
      await loadEvents();
      setToast('TradingView webhook created. Copy the URL now.');
    } catch (error) { setToast(error.message || 'Could not create TradingView webhook'); }
    finally { setBusy(false); }
  }
  async function rotate(id) {
    if (!confirm('Rotate this webhook? The old TradingView URL will stop working.')) return;
    setBusy(true);
    try {
      const data = await api(`/integrations/tradingview/${id}/rotate`, { method: 'POST' });
      setRevealed(data.integration);
      setToast('TradingView webhook rotated. Update the Alert URL.');
    } catch (error) { setToast(error.message || 'Could not rotate webhook'); }
    finally { setBusy(false); }
  }
  async function toggle(row) {
    await api(`/integrations/tradingview/${row.id}`, { method: 'PATCH', body: JSON.stringify({ name: row.name, isActive: !row.isActive }) });
    await load();
  }
  async function remove(id) {
    if (!confirm('Remove this TradingView webhook?')) return;
    await api(`/integrations/tradingview/${id}`, { method: 'DELETE' });
    setIntegrations(integrations.filter((row) => row.id !== id));
    if (revealed?.id === id) setRevealed(null);
  }
  async function copy(text) {
    await navigator.clipboard.writeText(text);
    setToast('Copied to clipboard');
  }
  const signalMessage = '{"event_id":"{{timenow}}-{{ticker}}","event_type":"signal","date":"{{time}}","asset":"{{ticker}}","direction":"long","session":"AS","ltf_entry":"OB + FVG"}';
  const tradeMessage = '{"event_id":"{{timenow}}-{{ticker}}","event_type":"trade","date":"{{time}}","asset":"{{ticker}}","direction":"long","result":"win","pnl":{{strategy.netprofit}}}';
  return <Panel title="TradingView Auto Sync"><div className="integration-panel">
    <p className="muted">{t('TradingView Alert sends a completed trade as JSON to your selected portfolio. Set a unique event_id to prevent duplicates.')}</p>
    <div className="form-grid compact"><Field label="Webhook name"><input value={name} onChange={(e) => setName(e.target.value)} /></Field><Field label="Target portfolio"><select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}>{accounts.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field></div>
    <div className="actions"><button className="primary" onClick={createIntegration} disabled={busy || !selectedAccountId}><Plus size={15} />{t('Create webhook')}</button></div>
    {revealed && <div className="integration-secret"><b>{t('Copy this URL now')}</b><div className="copy-row"><input readOnly value={revealed.webhookUrl} /><button onClick={() => copy(revealed.webhookUrl)}><Download size={14} />{t('Copy URL')}</button></div><small>Secret token is shown only once. Do not share this URL publicly.</small><label className="copy-label">Signal JSON · Indicator setup</label><div className="copy-row"><textarea readOnly value={signalMessage} /><button onClick={() => copy(signalMessage)}><FileText size={14} />{t('Copy JSON')}</button></div><label className="copy-label">Trade JSON · completed result</label><div className="copy-row"><textarea readOnly value={tradeMessage} /><button onClick={() => copy(tradeMessage)}><FileText size={14} />{t('Copy JSON')}</button></div></div>}
    {import.meta.env.DEV && revealed && <TradingViewSimulator webhookUrl={revealed.webhookUrl} onDone={loadEvents} setToast={setToast} />}
    <div className="integration-list">{integrations.map((row) => <div className="integration-row" key={row.id}><div><b>{row.name}</b><small>{accounts.find((item) => item.id === row.accountId)?.name || `Portfolio ${row.accountId}`} · {row.receivedCount || 0} received{row.lastReceivedAt ? ` · last ${row.lastReceivedAt}` : ''}</small></div><div className="row-actions"><button onClick={() => toggle(row)}>{row.isActive ? t('Disable') : t('Enable')}</button><button onClick={() => rotate(row.id)} disabled={busy}>{t('Rotate')}</button><button onClick={() => remove(row.id)}><Trash2 size={14} /></button></div></div>)}</div>
    <div className="sync-center"><div className="sync-center-head"><div><b>Sync Center</b><small>ตรวจสอบ Signal และ Trade ที่รับเข้าล่าสุดจาก TradingView</small></div><button onClick={() => loadEvents().catch((error) => setToast(error.message || 'Could not load sync events'))} title="Refresh sync events"><RotateCcw size={14} />Refresh</button></div>{events.length ? <div className="sync-event-list">{events.map((event) => <div className="sync-event" key={`${event.eventType}-${event.id}`}><div className={`sync-event-status ${event.eventType === 'signal' ? 'signal' : ''}`}><span className="sync-dot" />{event.eventType === 'signal' ? `Signal · ${event.status}` : 'Imported'}</div><div className="sync-event-main"><b>{event.asset || 'Unknown asset'} · {event.direction || '-'}</b><small>{event.accountName} · {event.integrationName}</small></div><div className="sync-event-meta"><b className={Number(event.netPnl || 0) >= 0 ? 'pos' : 'neg'}>{event.netPnl == null ? '-' : money(event.netPnl)}</b><small>{event.receivedAt || '-'}</small></div></div>)}</div> : <div className="sync-empty">ยังไม่มี Signal หรือ Trade ที่รับจาก TradingView</div>}</div>
    <small className="transfer-note">TradingView webhooks require HTTPS and TradingView 2FA. This integration imports completed records; it does not place orders.</small>
  </div></Panel>;
}

function TradingViewSimulator({ webhookUrl, onDone, setToast }) {
  const [busy, setBusy] = useState(false);
  async function sendSimulation() {
    setBusy(true);
    const eventId = 'local-sim-' + Date.now();
    const base = { event_id: eventId, date: new Date().toISOString(), asset: 'NQ1', direction: 'long', session: 'AS', ltf_entry: 'OB + FVG', setup_grade: 'A' };
    try {
      const signal = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...base, event_type: 'signal' }) });
      if (!signal.ok) throw new Error('Signal failed (' + signal.status + ')');
      const trade = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...base, event_type: 'trade', result: 'win', pnl: 125, entry_price: 21000, stop_loss: 20950, take_profit: 21100, planned_r: 2, max_rr: 2.6, max_tick: 100, commission: 2.8 }) });
      if (!trade.ok) throw new Error('Trade failed (' + trade.status + ')');
      await onDone();
      setToast('Local TradingView simulation completed: Signal matched to Trade');
    } catch (error) { setToast(error.message || 'Local TradingView simulation failed'); }
    finally { setBusy(false); }
  }
  return <div className="sync-simulator"><div><b>Local TradingView Simulator</b><small>ส่ง Signal และ Completed Trade ผ่าน Webhook จริงเพื่อทดสอบการจับคู่</small></div><button onClick={sendSimulation} disabled={busy}><RotateCcw size={14} />{busy ? 'Sending...' : 'Run simulation'}</button></div>;
}

function DataTransferPanel({ api, accounts, account, reload, setToast }) {
  const { t } = useI18n();
  const [fileName, setFileName] = useState('');
  const [importText, setImportText] = useState('');
  const [preview, setPreview] = useState(null);
  const [targetAccountId, setTargetAccountId] = useState('');
  const [busy, setBusy] = useState('');
  const otherAccounts = accounts.filter((row) => row.id !== account?.id);
  useEffect(() => {
    setTargetAccountId(otherAccounts[0]?.id ? String(otherAccounts[0].id) : '');
  }, [account?.id, accounts.length]);

  function fileFormat(name) {
    return String(name || '').toLowerCase().endsWith('.csv') ? 'csv' : 'auto';
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsText(file);
    });
  }

  async function chooseFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFile(file);
      setFileName(file.name);
      setImportText(text);
      setPreview(null);
      setToast('File loaded. Preview before import.');
    } catch (error) {
      setToast(error.message || 'Could not read file');
    } finally {
      event.target.value = '';
    }
  }

  async function previewImport() {
    if (!importText.trim()) {
      setToast('Choose a CSV or JSON file first');
      return;
    }
    setBusy('preview');
    try {
      const data = await api(`/accounts/${account.id}/trades/import/preview`, {
        method: 'POST',
        body: JSON.stringify({ text: importText, format: fileFormat(fileName) })
      });
      setPreview(data);
      setToast(`Preview ready: ${data.ready} ready, ${data.duplicate} duplicate, ${data.error} error${data.reviews ? `, ${data.reviews} reviews` : ''}`);
    } catch (error) {
      setToast(error.message || 'Preview failed');
    } finally {
      setBusy('');
    }
  }

  async function importTrades() {
    if (!preview) {
      setToast('Preview the file before importing');
      return;
    }
    setBusy('import');
    try {
      const data = await api(`/accounts/${account.id}/trades/import`, {
        method: 'POST',
        body: JSON.stringify({ text: importText, format: fileFormat(fileName) })
      });
      await reload(account.id);
      setToast(`Imported ${data.inserted}, skipped ${data.skipped}, failed ${data.failed}${data.reviewsImported ? `, reviews ${data.reviewsImported}` : ''}`);
    } catch (error) {
      setToast(error.message || 'Import failed');
    } finally {
      setBusy('');
    }
  }

  async function exportPortfolio() {
    setBusy('export');
    try {
      const [tradeData, reviewData] = await Promise.all([
        api(`/accounts/${account.id}/trades`),
        api(`/accounts/${account.id}/daily-reviews`)
      ]);
      const blob = new Blob([JSON.stringify({
        account: account.name,
        exportedAt: new Date().toISOString(),
        trades: tradeData.trades,
        dailyReviews: reviewData.reviews || {}
      }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ztj-${String(account.name || 'portfolio').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${today()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setToast('Portfolio JSON exported with trades and daily reviews');
    } catch (error) {
      setToast(error.message || 'Export failed');
    } finally {
      setBusy('');
    }
  }

  async function exportPortfolioCsv() {
    setBusy('csv');
    try {
      const data = await api(`/accounts/${account.id}/trades`);
      const rows = data.trades || [];
      const headers = ['date', 'asset', 'direction', 'session', 'entryTime', 'exitTime', 'durationTime', 'result', 'pnl', 'commissionAmount', 'plannedR', 'actualR', 'maxR', 'maxTick', 'ltfEntry', 'setupGrade', 'ruleViolation', 'emotionAfter', 'notes'];
      const escape = (value) => {
        if (value === null || value === undefined) return '';
        const text = String(value);
        return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
      };
      const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ztj-${String(account.name || 'portfolio').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${today()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setToast('Portfolio CSV exported');
    } catch (error) {
      setToast(error.message || 'CSV export failed');
    } finally {
      setBusy('');
    }
  }

  async function transferAll() {
    if (!targetAccountId) {
      setToast('Create another portfolio before transfer');
      return;
    }
    setBusy('transfer');
    try {
      const data = await api(`/accounts/${account.id}/trades/transfer`, {
        method: 'POST',
        body: JSON.stringify({ targetAccountId })
      });
      await reload(account.id);
      setToast(`Copied ${data.copied}, skipped ${data.skipped}${data.reviewsCopied ? `, reviews ${data.reviewsCopied}` : ''}`);
    } catch (error) {
      setToast(error.message || 'Transfer failed');
    } finally {
      setBusy('');
    }
  }

  const canImportPreview = Boolean(preview && (preview.ready > 0 || preview.reviews > 0));

  return <Panel title="Data Transfer">
    <div className="transfer-panel">
      <div className="transfer-actions">
        <label className="upload-button"><Upload size={15} />{t('Choose CSV / JSON')}<input type="file" accept=".csv,.json,application/json,text/csv" onChange={chooseFile} /></label>
        <button onClick={previewImport} disabled={!importText || busy === 'preview'}><FileText size={15} />{t('Preview')}</button>
        <button className="primary" onClick={importTrades} disabled={!canImportPreview || busy === 'import'}><Upload size={15} />{t('Import data')}</button>
      </div>
      <small className="transfer-note">{t('JSON package includes trades and daily reviews. CSV import/export is trades only.')}</small>
      <div className="transfer-status">
        <span>{fileName || t('No file selected')}</span>
        {preview && <b>{preview.ready} ready · {preview.duplicate} duplicate · {preview.error} error{preview.reviews ? ` · ${preview.reviews} reviews` : ''}</b>}
      </div>
      {preview?.preview?.length > 0 && <div className="table-wrap slim transfer-preview"><table><thead><tr><th>Status</th><th>Date</th><th>Asset</th><th>Session</th><th>Result</th><th>P&L</th></tr></thead><tbody>{preview.preview.map((row) => <tr key={row.index} className={row.status === 'error' ? 'invalid' : row.status === 'duplicate' ? 'muted-row' : ''}><td><b>{row.status}</b><small>{row.error || ''}</small></td><td>{row.trade.date || '-'}</td><td>{row.trade.asset || '-'}</td><td>{row.trade.session || '-'}</td><td>{row.trade.result || '-'}</td><td className={Number(row.trade.pnl || 0) >= 0 ? 'pos' : 'neg'}>{money(row.trade.pnl || 0)}</td></tr>)}</tbody></table></div>}
      <div className="transfer-split">
        <div className="transfer-export">
          <button onClick={exportPortfolio} disabled={busy === 'export'}><Download size={15} />{t('Export JSON')}</button>
          <button onClick={exportPortfolioCsv} disabled={busy === 'csv'}><Download size={15} />{t('Export CSV')}</button>
        </div>
        <div className="transfer-copy">
          <Field label="COPY TRADES & REVIEWS TO"><select value={targetAccountId} onChange={(e) => setTargetAccountId(e.target.value)} disabled={!otherAccounts.length}>{otherAccounts.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field>
          <button onClick={transferAll} disabled={!targetAccountId || busy === 'transfer'}><Upload size={15} />{t('Copy data')}</button>
        </div>
      </div>
    </div>
  </Panel>;
}

function CoachPage({ api, token, currentUser, viewUserId, setViewUserId, portfolioTemplates, setPortfolioTemplates, setToast }) {
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
      if (currentUser?.role === 'admin') {
        const templateData = await api('/admin/portfolio-templates');
        setPortfolioTemplates(templateData.templates?.length ? templateData.templates : fallbackPortfolioTemplates);
      }
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
    {currentUser?.role === 'admin' && <TemplateManager templates={portfolioTemplates} setTemplates={setPortfolioTemplates} api={api} setToast={setToast} />}
    <div className="table-wrap"><table><thead><tr><th>User</th><th>Actions</th><th>Email</th><th>Role</th><th>Status</th><th>Verified</th><th>Portfolios</th><th>Trades</th><th>Net P&L</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id} className={viewUserId === r.id ? 'selected' : ''}><td><b>{r.username}</b>{dirty.has(r.id) && <small>Unsaved</small>}</td><td className="row-actions admin-row-actions"><button onClick={() => setViewUserId(r.id)}><UserRound size={14} />Open</button>{currentUser?.role === 'admin' && <button className={dirty.has(r.id) ? 'primary' : ''} onClick={() => save(r)} disabled={saving === r.id || !dirty.has(r.id)}><Save size={14} />Save</button>}</td><td>{r.email || '-'}</td><td><select value={r.role} onChange={(e) => updateRow(r.id, 'role', e.target.value)} disabled={currentUser?.role !== 'admin'}><option value="trader">trader</option><option value="coach">coach</option><option value="admin">admin</option></select></td><td><select value={r.status || 'active'} onChange={(e) => updateRow(r.id, 'status', e.target.value)} disabled={currentUser?.role !== 'admin'}><option value="active">active</option><option value="suspended">suspended</option></select></td><td><label className="table-check"><input type="checkbox" checked={!!r.emailVerified} onChange={(e) => updateRow(r.id, 'emailVerified', e.target.checked)} disabled={currentUser?.role !== 'admin'} />Yes</label></td><td><input className="tiny-input" type="number" min="1" max="5" value={r.portfolioLimit || 5} onChange={(e) => updateRow(r.id, 'portfolioLimit', e.target.value)} disabled={currentUser?.role !== 'admin'} /> <small>{r.portfolios || 0} used</small></td><td>{r.totalTrades}</td><td className={r.netPnl >= 0 ? 'pos' : 'neg'}>{money(r.netPnl)}</td></tr>)}</tbody></table></div></section>;
}

function TemplateManager({ templates, setTemplates, api, setToast }) {
  const [draft, setDraft] = useState(templateDraftFrom(templates[0] || fallbackPortfolioTemplates[0]));
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!draft.id && templates[0]) setDraft(templateDraftFrom(templates[0]));
  }, [templates]);
  const updateValue = (key, value) => setDraft((current) => ({ ...current, values: { ...current.values, [key]: value } }));
  async function saveTemplate() {
    setSaving(true);
    try {
      const payload = { templateKey: draft.templateKey, label: draft.label, sortOrder: draft.sortOrder, isActive: draft.isActive, values: draft.values };
      const result = draft.id
        ? await api(`/admin/portfolio-templates/${draft.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await api('/admin/portfolio-templates', { method: 'POST', body: JSON.stringify(payload) });
      const next = draft.id ? templates.map((item) => item.id === draft.id ? result.template : item) : [...templates, result.template];
      setTemplates(next.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99)));
      setDraft(templateDraftFrom(result.template));
      setToast('Portfolio template saved');
    } catch (error) {
      setToast(error.message || 'Could not save template');
    } finally {
      setSaving(false);
    }
  }
  async function deleteTemplate() {
    if (!draft.id || !confirm('Delete this template? Existing portfolios will not be changed.')) return;
    await api(`/admin/portfolio-templates/${draft.id}`, { method: 'DELETE' });
    const next = templates.filter((item) => item.id !== draft.id);
    setTemplates(next);
    setDraft(templateDraftFrom(next[0] || fallbackPortfolioTemplates[0]));
    setToast('Portfolio template deleted');
  }
  return <Panel title="Portfolio template library"><div className="template-manager">
    <div className="template-list">
      <button onClick={() => setDraft(templateDraftFrom({ label: 'New template', values: blankAccount, sortOrder: templates.length + 1 }))}><Plus size={15} />New template</button>
      {templates.map((template) => <button key={template.id || template.templateKey} className={draft.id === template.id ? 'selected' : ''} onClick={() => setDraft(templateDraftFrom(template))}><b>{template.label}</b><span>{template.values?.provider || 'Custom'} / {template.values?.planName || 'Manual'}</span></button>)}
    </div>
    <div className="template-form">
      <div className="form-grid"><Field label="Template name"><input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} /></Field><Field label="Template key"><input value={draft.templateKey} onChange={(e) => setDraft({ ...draft, templateKey: e.target.value })} /></Field><Field label="Sort"><input type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} /></Field></div>
      <div className="form-grid"><Field label="Provider"><input value={draft.values.provider || ''} onChange={(e) => updateValue('provider', e.target.value)} /></Field><Field label="Plan"><input value={draft.values.planName || ''} onChange={(e) => updateValue('planName', e.target.value)} /></Field><Field label="Market"><input value={draft.values.marketType || ''} onChange={(e) => updateValue('marketType', e.target.value)} /></Field><Field label="Starting Balance"><input type="number" value={draft.values.startingBalance || ''} onChange={(e) => updateValue('startingBalance', e.target.value)} /></Field><Field label="Profit Target"><input type="number" value={draft.values.profitTarget || ''} onChange={(e) => updateValue('profitTarget', e.target.value)} /></Field><Field label="Daily Loss"><input type="number" value={draft.values.dailyLossLimit || ''} onChange={(e) => updateValue('dailyLossLimit', e.target.value)} /></Field></div>
      <div className="rule-grid"><Field label="Max Drawdown"><input type="number" value={draft.values.maxDrawdown || ''} onChange={(e) => updateValue('maxDrawdown', e.target.value)} /></Field><Field label="Trailing DD"><input type="number" value={draft.values.trailingDrawdown || ''} onChange={(e) => updateValue('trailingDrawdown', e.target.value)} /></Field><Field label="Max Contracts"><input type="number" value={draft.values.maxContracts || ''} onChange={(e) => updateValue('maxContracts', e.target.value)} /></Field><Field label="Min Days"><input type="number" value={draft.values.minTradingDays || ''} onChange={(e) => updateValue('minTradingDays', e.target.value)} /></Field><Field label="Commission"><input type="number" step="any" value={draft.values.commissionAmount ?? ''} onChange={(e) => updateValue('commissionAmount', e.target.value)} /></Field><Field label="Commission type"><select value={draft.values.commissionType || 'none'} onChange={(e) => updateValue('commissionType', e.target.value)}>{Object.entries(commissionTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field></div>
      <div className="form-grid compact"><Field label="Consistency Rule"><textarea value={draft.values.consistencyRule || ''} onChange={(e) => updateValue('consistencyRule', e.target.value)} /></Field><Field label="Payout Rule"><textarea value={draft.values.payoutRule || ''} onChange={(e) => updateValue('payoutRule', e.target.value)} /></Field></div>
      <div className="template-actions"><label className="table-check"><input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />Active</label><button className="primary" onClick={saveTemplate} disabled={saving}><Save size={15} />{saving ? 'Saving...' : 'Save template'}</button>{draft.id && <button onClick={deleteTemplate}><Trash2 size={15} />Delete</button>}</div>
    </div>
  </div></Panel>;
}

function Header({ title, hint, action }) {
  const { t } = useI18n();
  return <div className="page-head"><div><h1>{t(title)}</h1><p>{t(hint)}</p></div>{action}</div>;
}
function Panel({ title, children, className = '' }) {
  const { t } = useI18n();
  return <div className={`panel ${className}`.trim()}><div className="panel-title">{t(title)}</div>{children}</div>;
}
function Kpi({ label, value, tone }) {
  const { t } = useI18n();
  return <div className={`kpi ${tone || ''}`}><span>{t(label)}</span><b>{value}</b></div>;
}
function Field({ label, children }) {
  const { t } = useI18n();
  return <label className="field"><span>{t(label)}</span>{children}</label>;
}
function Select({ options = [], value, onChange }) { return <select value={value || ''} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o}>{o}</option>)}</select>; }
function ChartWrap({ empty, children, tall = false }) { return <div className={`chart-wrap ${tall ? 'tall' : ''}`}>{empty ? <div className="empty">No data yet</div> : children}</div>; }

createRoot(document.getElementById('root')).render(<App />);

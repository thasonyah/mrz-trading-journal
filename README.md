# Mr.Z Trading Journal

A runnable trading journal rebuilt from observed behavior, not copied code. It keeps the important workflows from the reference system while expanding the data model for POI(OB), FVG, BOS, CHoCH, Liquidity Sweep, HTF/MTF/LTF, setup grading, Max RR, MFE/MAE, psychology, rule violations, and edge analytics.

## Features

- Email + password authentication with JWT, email verification, and password reset links
- Local SQLite database with migrations, plus Render Postgres support through `DATABASE_URL`
- Portfolio management for Backtest, Forward Test, and Live-style datasets, limited to 5 portfolios per user by default
- Prop-firm portfolio rules for provider, plan, profit target, daily loss, max drawdown, trailing drawdown, max contracts, minimum trading days, payout rules, and default commission
- Admin user management for roles, status, email verification, portfolio limits, and opening any user's portfolios
- Add/edit/delete trades with automatic risk, lot, planned RR, result R, commission, net P&L, duration, projected balance, and prop-firm rule preview
- Market structure fields: HTF bias/POI, POI type, FVG position, Liquidity Sweep, BOS, CHoCH, MTF Structure, LTF Entry, Key Zone
- Excursion and psychology fields: Max RR, Max Tick, MFE/MAE, rule violation, emotion before/after, discipline score, reflection
- Dashboard, History filters/search, Calendar, Daily Review lightbox/log, Analytics, RR recommendation table, Playbook notes, Settings, and Admin/Coach View
- JSON import/export and portfolio-to-portfolio transfer for trades plus Daily Reviews; CSV remains trades-only for spreadsheet workflows
- Custom field options, asset presets, profile display, password changes, and email verification/password reset flows
- Demo seed data for immediate testing

## Run

```bash
npm install
npm run migrate
npm run seed
npm run dev
```

Open the Vite URL printed by the client, usually `http://127.0.0.1:5173`.

Local demo login after `npm run seed`:

```text
username: demo
password: demo123
```

The demo user is a local trader account only. In production, `npm run seed` skips demo data unless `DEMO_SEED_ENABLED=true` is set. When the database has no users, the first registered account becomes `admin`.

## Configuration

Copy `.env.example` to `.env` if you want to change the API port, JWT secret, database file, public URL, or SMTP email settings. Local development uses SQLite by default. If `DATABASE_URL` is present, the server uses Postgres instead.

```bash
cp .env.example .env
```

## Deploy to Render

This project is ready for Render as a single Node web service. The production server serves both:

- the React build from `dist`
- the API under `/api`

The Render Blueprint is in `render.yaml`.

Recommended Render setup:

1. Push this folder to a GitHub/GitLab repository.
2. In Render, create a new Blueprint from that repository.
3. Render will read `render.yaml`.
4. Set `JWT_SECRET` in the Render dashboard when prompted.
5. Render will create a free Postgres database and pass its connection string to the app as `DATABASE_URL`.

Render commands:

```bash
Build Command: npm install && npm run build
Start Command: npm run seed && npm start
```

Render environment variables:

```text
NODE_ENV=production
DATABASE_URL=<provided by Render Postgres>
JWT_SECRET=<set in Render dashboard>

## Source protection and backups

- Keep the GitHub repository private and store Render environment variables in Render, never in the repository.
- Production API access is restricted by `CORS_ORIGINS`, protected with security headers, and rate-limited. Keep `JWT_SECRET` long and random.
- Important calculation and permission checks should remain on the server; browser code cannot be made impossible to inspect.
- Create a local recovery archive with `./scripts/backup.sh`. The archive includes source, migrations, public assets, indicators, and the local SQLite data directory, but excludes `.env`, `node_modules`, `dist`, and Git metadata.
- Restore with `./scripts/restore.sh backups/<archive>.tar.gz <target-dir>`, create a new `.env` from `.env.example`, then run `npm install`, `npm run migrate`, and `npm run build`.

PUBLIC_BASE_URL=https://your-render-service.onrender.com
SMTP_HOST=<optional SMTP host>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<optional SMTP username>
SMTP_PASS=<optional SMTP password>
MAIL_FROM=<optional from email>
DEMO_SEED_ENABLED=false
```

For Brevo SMTP Free, use values like:

```text
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your Brevo SMTP login>
SMTP_PASS=<your Brevo SMTP key>
MAIL_FROM=<verified sender email>
```

Important: Render Free web service files are ephemeral, so this project uses Render Postgres instead of SQLite in production. Render Free Postgres is useful for testing, but as of October 2026 it expires 30 days after creation and has no automatic backups. Upgrade the database plan or move to a long-term Postgres provider before storing critical trading records.

If SMTP is not configured, the app still works for testing: registration and password reset responses include a one-time verification/reset link, and the server logs the same link. Configure SMTP before using the system with real users.

## Data Transfer

Use Settings > Data Transfer for migration between portfolios or accounts:

- `Export JSON` creates a package with trades and Daily Reviews.
- `Import data` accepts the JSON package and imports new trades while upserting Daily Reviews by date.
- `Copy data` copies trades and Daily Reviews from the current portfolio to another portfolio on the same account.
- `Export CSV` and CSV import are trades-only, intended for spreadsheets and quick audits.

Always preview imports before importing. Duplicate trades are skipped using date, entry time, asset, direction, result, and P&L.

## Calculation Notes

- `riskPoints = abs(entryPrice - stopLoss)`
- `rewardPoints = abs(takeProfit - entryPrice)`
- `plannedR = rewardPoints / riskPoints`
- `lotSize = riskAmount / (riskPoints * dollarPerPoint)`
- Gross win P&L uses `riskAmount * plannedR`
- Gross loss/reversed P&L uses `-riskAmount`
- Breakeven/Miss gross P&L uses `0`
- Commission can come from the portfolio default, per-trade override, per-contract rule, or percent of gross P&L
- Miss trades force commission to `0`
- Net P&L is `grossPnl - commissionAmount`
- Duration Time is calculated from Entry Time and Exit Time when both are present
- Expectancy uses `winRate * avgWinR - lossRate * 1R`
- Max drawdown walks chronological trade P&L from account starting balance
- RR recommendation tests candidate RR thresholds against winning trades whose `maxR` reached that threshold
- Dashboard and Calendar Daily Results show market weekdays only, Monday through Friday
- Daily Results stacks Daily P&L above zero and Commission/SL below zero

## Local QA Before Deploy

Before deploying, run:

```bash
npm run build
node /Users/mrz/.agents/skills/impeccable/scripts/detect.mjs --json src/main.jsx src/styles.css
```

Then preview locally at `http://127.0.0.1:5173` and check:

- Dashboard: Prop Firm Rules, Daily Results, LTF Entry Receive, Latest Review Notes
- Add Trade: defaults, duration auto calculation, Miss commission behavior, projected rule preview
- History: LTF Entry column and chart link table
- Calendar: month grid, lightbox, Daily Review, Daily Results, Daily Review Log
- Analytics: Overview, Time, Setup, Risk, Psychology, Custom tabs
- Settings: profile, portfolio commission, asset presets, Data Transfer, field options
- Admin: user role/status/verification/limit save flow and SMTP status

Do not deploy until the local preview is approved.

## Project Structure

- `server/index.js` API, auth, validation, and CRUD routes
- `server/db.js` SQLite/Postgres connection helpers and row mapping
- `server/migrate.js` SQLite migration runner and Postgres schema setup
- `server/seed.js` demo user and sample trades
- `migrations/001_initial.sql` schema
- `vite.config.js` production chunk splitting
- `src/main.jsx` React application and analytics logic
- `src/styles.css` responsive UI styling

## Safety

The reference site was inspected read-only. This project uses its own database and does not modify or depend on the original user data.

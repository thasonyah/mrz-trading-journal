# Mr.Z Trading Journal

A runnable trading journal rebuilt from observed behavior, not copied code. It keeps the important workflows from the reference system while expanding the data model for POI(OB), FVG, BOS, CHoCH, Liquidity Sweep, HTF/MTF/LTF, setup grading, Max RR, MFE/MAE, psychology, rule violations, and edge analytics.

## Features

- Username/password authentication with JWT
- SQLite database with migration in `migrations/001_initial.sql`
- Account management for Backtest, Forward Test, and Live-style datasets
- Add/edit/delete trades with automatic risk, lot, planned RR, result R, and P&L calculation
- Market structure fields: HTF bias/POI, POI type, FVG position, Liquidity Sweep, BOS, CHoCH, MTF Structure, LTF Entry, Key Zone
- Psychology fields: rule violation, emotion before/after, discipline score, reflection
- Dashboard, History filters/search, Calendar, Analytics, RR recommendation table, Playbook notes, Settings, and read-only Coach View
- Demo seed data for immediate testing

## Run

```bash
npm install
npm run migrate
npm run seed
npm run dev
```

Open the Vite URL printed by the client, usually `http://127.0.0.1:5173`.

Demo login:

```text
username: demo
password: demo123
```

## Configuration

Copy `.env.example` to `.env` if you want to change the API port, JWT secret, or database file.

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
5. Keep the persistent disk enabled if you want SQLite data to survive deploys/restarts.

Render commands:

```bash
Build Command: npm install && npm run build
Start Command: npm start
```

Render environment variables:

```text
NODE_ENV=production
DATABASE_PATH=/opt/render/project/src/data/trading-journal.sqlite
JWT_SECRET=<set in Render dashboard>
```

Important: the included `render.yaml` uses a persistent disk for SQLite. On Render, persistent disks may require a paid plan. Without a disk, the app can run, but journal data can be lost when the service restarts or redeploys.

## Calculation Notes

- `riskPoints = abs(entryPrice - stopLoss)`
- `rewardPoints = abs(takeProfit - entryPrice)`
- `plannedR = rewardPoints / riskPoints`
- `lotSize = riskAmount / (riskPoints * dollarPerPoint)`
- Win P&L uses `riskAmount * plannedR`
- Loss/Reversed P&L uses `-riskAmount`
- Breakeven/Miss P&L uses `0`
- Expectancy uses `winRate * avgWinR - lossRate * 1R`
- Max drawdown walks chronological trade P&L from account starting balance
- RR recommendation tests candidate RR thresholds against winning trades whose `maxR` reached that threshold

## Project Structure

- `server/index.js` API, auth, validation, and CRUD routes
- `server/db.js` SQLite connection and row mapping
- `server/migrate.js` migration runner
- `server/seed.js` demo user and sample trades
- `migrations/001_initial.sql` schema
- `src/main.jsx` React application and analytics logic
- `src/styles.css` responsive UI styling

## Safety

The reference site was inspected read-only. This project uses its own local SQLite database and does not modify or depend on the original user data.

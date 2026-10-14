# Pre-Deploy Checklist

Use this checklist before pushing Mr.Z Trading Journal to Render.

## Local Approval

- Open `http://127.0.0.1:5173/`.
- Check Dashboard, Add Trade, History, Calendar, Analytics, Settings, and Admin.
- Confirm Calendar lightbox and Daily Review work.
- Confirm Data Transfer preview works with a JSON package.
- Confirm the user has explicitly approved deploy.

## Required Commands

```bash
npm run build
node /Users/mrz/.agents/skills/impeccable/scripts/detect.mjs --json src/main.jsx src/styles.css
```

Both commands should pass before deploy.

## Render Environment

Required:

- `NODE_ENV=production`
- `DATABASE_URL` from Render Postgres
- `JWT_SECRET`
- `PUBLIC_BASE_URL=https://mrz-trading-journal.onrender.com`
- `DEMO_SEED_ENABLED=false`

Email verification / reset:

- `SMTP_HOST=smtp-relay.brevo.com`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_USER=<Brevo SMTP login>`
- `SMTP_PASS=<Brevo SMTP key>`
- `MAIL_FROM=<verified sender email>`

## After Deploy

- Open the Render URL.
- Register a new test user and verify the email link.
- Test login, forgot password, and reset password.
- Confirm non-admin users do not see the Admin menu.
- Confirm admin can open Manage Users and save role/status/verification changes.
- Confirm Add Trade, Dashboard, Calendar, Analytics, Settings, and Data Transfer load without console errors.

## Safety

- Do not enable demo seed on production unless intentionally creating demo data.
- Do not import real trade data until email/auth and backups are confirmed.
- Render Free Postgres is suitable for testing only; move critical records to a durable database plan.

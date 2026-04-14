# WatchDog

WatchDog is a self-hosted uptime monitor for small projects and personal services. It lets you track endpoint availability, inspect recent checks, and receive Telegram alerts when a service goes down or recovers.

## What It Does

- monitors websites and HTTP endpoints on a schedule
- stores check history in SQLite via Drizzle ORM
- shows current status, response time, and recent uptime history in the UI
- sends Telegram notifications on outage and recovery
- supports Docker-based deployment for a small VPS or home server

## Stack

- Nuxt 4
- Nuxt UI
- Nitro scheduled tasks
- Drizzle ORM
- SQLite
- Telegram Bot API
- Docker / Docker Compose

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env
```

3. Fill in the required variables in `.env`:

```env
NUXT_SESSION_PASSWORD=your-random-session-secret
ADMIN_PASSWORD=your-admin-password
```

4. Start the app:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
```

## Environment Variables

Required:

- `NUXT_SESSION_PASSWORD`: session secret for `nuxt-auth-utils`
- `ADMIN_PASSWORD`: password for the admin login

Optional:

- `MONITOR_ENABLED`: enable or disable scheduled monitoring
- `MONITOR_SCHEDULE`: cron schedule for checks
- `TELEGRAM_BOT_TOKEN`: Telegram bot token
- `TELEGRAM_CHAT_ID`: Telegram chat ID for alerts
- `DATABASE_URL`: custom path to the SQLite database

See [.env.example](.env.example) for the full template.

## Architecture Notes

- `server/tasks/monitor.ts` runs scheduled checks and updates the cached snapshot
- `server/api/status.get.ts` serves the dashboard from cache when possible
- `server/api/sites/*.ts` handles CRUD operations for monitored sites
- `server/utils/telegram.ts` sends outage and recovery notifications

## Deployment

Docker deployment instructions are documented in [DEPLOY.md](DEPLOY.md).

## Portfolio Notes

This project was built as a practical monitoring tool for personal infrastructure. The focus was on shipping a useful end-to-end product: authenticated dashboard, background checks, persistence, alerting, and lightweight self-hosted deployment.

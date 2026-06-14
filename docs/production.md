# Production Operations

## Environment

Required:

```bash
DATABASE_URL=
ADMIN_SYNC_TOKEN=
ADMIN_USERNAME=
ADMIN_PASSWORD_HASH=
ADMIN_SESSION_SECRET=
```

Optional:

```bash
API_FOOTBALL_KEY=
THESPORTSDB_KEY=
CRON_SECRET=
ERROR_TRACKING_DSN=
SYNC_ALERT_WEBHOOK_URL=
```

## Migration Deployment

```bash
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run build
npm run start
```

## Scheduled Synchronization

Vercel cron is configured in `vercel.json`. GitHub Actions has a fallback workflow in `.github/workflows/scheduled-sync.yml`.

## Smoke Test

```bash
SMOKE_BASE_URL=https://your-domain.example npm run smoke
```

## Backups

Use managed PostgreSQL point-in-time recovery where available. At minimum, schedule daily `pg_dump` exports and retain encrypted backups for 30 days.

## Recovery

Restore the latest backup into a new database, set `DATABASE_URL` to the restored database, run `npm run prisma:deploy`, then run `npm run smoke`.

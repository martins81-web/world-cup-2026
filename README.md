# World Cup 2026

Production-ready Phase 1 foundation for a Next.js, TypeScript, Tailwind CSS, PostgreSQL, Prisma World Cup 2026 website.

## Setup

```bash
npm install
cp .env.example .env
docker run --name worldcup2026-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=worldcup2026 -p 5432:5432 -d postgres:16
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000`.

## Environment

`DATABASE_URL` and `ADMIN_SYNC_TOKEN` are required. Provider keys are optional. With no provider key, the site works from clearly labelled development seed data.

`API_FOOTBALL_KEY` is used only on the server. `THESPORTSDB_KEY` is optional enrichment and is also server-only.

## Sync

Run a server-side sync:

```bash
npm run sync
```

During the tournament, keep local scores refreshing automatically while the dev server is running:

```bash
npm run sync:auto
```

Or visit `/admin/sync`, enter `ADMIN_SYNC_TOKEN`, and run synchronization from the admin page.

Vercel cron calls `/api/admin/sync` every 5 minutes for hosted score updates. The route only syncs between 12:00 PM and 2:00 AM Montreal time. External API responses are cached in PostgreSQL via `ExternalApiCache`. API-Football request usage is tracked daily in `ApiQuotaUsage`. Admin sync requires `ADMIN_SYNC_TOKEN` and is rate limited.

## Tests

```bash
npm run test
npm run test:integration
npm run test:e2e
npm run typecheck
npm run build
npm run smoke-test
```

## Phase 1 Notes

Public pages read from PostgreSQL. External API keys are never exposed to client components. Seed data is intentionally labelled as development data. Player statistics are not modelled or invented in this phase.

## Production

See `docs/production.md` for deployment, migrations, scheduled sync, smoke tests, backups, and recovery.

## First GitHub Push

Create the repository on GitHub without adding a README, license, or gitignore, then run:

```bash
git init
git add .
git commit -m "Initial World Cup 2026 app"
git branch -M main
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

## GitHub Secrets

Add repository secrets in GitHub under Settings > Secrets and variables > Actions.

Required for production deployment:

```bash
DATABASE_URL
API_FOOTBALL_KEY
ADMIN_SESSION_SECRET
CRON_SECRET
```

Optional:

```bash
THESPORTSDB_API_KEY
NEXT_PUBLIC_API_SPORTS_WIDGET_KEY
NEXT_PUBLIC_API_SPORTS_WIDGET_HOST
NEXT_PUBLIC_SITE_URL
SENTRY_DSN
NEXT_PUBLIC_SENTRY_DSN
```

The CI workflow uses its own PostgreSQL 16 service container for tests, so no developer-installed PostgreSQL is required.

## Running CI

Push to `main`, open a pull request, or run the `CI` workflow manually from the GitHub Actions tab.

The workflow runs dependency install, Prisma generate, migration deploy, seed, unit tests, PostgreSQL integration tests, Playwright tests, TypeScript, production build, Prisma migration validation, npm audit at high severity, and smoke tests.

## Failed Test Reports

When Playwright fails, GitHub uploads `playwright-report` and `playwright-test-results` artifacts from the failed workflow run. Open the failed run, scroll to Artifacts, download the report, and inspect screenshots, traces, and error context.

Deploy only after the CI workflow is green. Do not deploy from a branch or commit with failing checks.

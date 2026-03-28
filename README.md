# glitch-graders

Single-app hackathon judging backend built on Next.js, Prisma, and PostgreSQL.

## What ships now

- one App Router application
- one shared PostgreSQL schema
- DB-backed admin auth code and judge invite redemption
- multi-event admin area
- CSV project import with field mapping preview
- persisted judge assignments
- persisted draft/submitted weighted scorecards
- live leaderboard calculation plus explicit publish snapshots
- Docker Compose stack for one app container and one Postgres container

## Local development

1. Install dependencies:

```bash
npm install
```

2. Copy the env template:

```bash
cp .env.example .env.local
```

3. Start PostgreSQL and the app with Docker Compose:

```bash
docker compose up --build
```

For local dev without running the app in Docker, use:

```bash
npm run dev:stack
```

The app container will:

1. wait for Postgres
2. run Prisma migrations
3. seed baseline demo data
4. start the Next.js server on `http://localhost:3000`

## Useful commands

```bash
npm run dev
npm run dev:stack
npm run build
npm test
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:seed
```

## Demo access

- Admin code: `ORBIT-ADMIN-2026`
- Judge invite: `JUDGE-ORBIT-27`
- Judge invite: `JUDGE-TERRA-08`

## Main routes

- `/` overview
- `/admin/access` admin sign-in
- `/admin` organizer workspace
- `/join` judge invite redemption
- `/workspace` judge scoring workspace
- `/api/imports/preview` CSV preview route
- `/api/imports/execute` CSV import route
- `/api/leaderboard` leaderboard payload route

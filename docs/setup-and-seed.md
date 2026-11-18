# Setup and Seed

## Prerequisites

- Node.js 20+ (the project is developed on Node 24/26; Prisma 6 requires 18.18+)
- PostgreSQL 14+ (the schema uses a native string array)
- A database named `openmusabaqah` (or any name you put in `DATABASE_URL`)

## Environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Pooled/runtime PostgreSQL connection |
| `DIRECT_URL` | Yes | Direct PostgreSQL connection used by Prisma CLI (`db push`, migrations, seed). Can equal `DATABASE_URL` locally. |
| `NEXT_PUBLIC_APP_URL` | Recommended | Base URL used when the admin UI renders public links |
| `AUTH_SECRET` | Yes in production | HMAC secret for session cookies, minimum 16 characters |

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Next.js loads `.env`, then `.env.development`/`.env.production` with higher priority. If you keep a `.env.development` file, it must contain a non-empty `DATABASE_URL` and `DIRECT_URL`; an empty value overrides `.env` and Prisma will fail.

## Install

```bash
npm install
```

`postinstall` runs `prisma generate`. If the generated client is missing, run:

```bash
npx prisma generate
```

## Database setup

```bash
npm run db:push
```

`db push` synchronizes the schema without creating migration files. This is appropriate for the current development workflow. For production, create migrations instead:

```bash
npx prisma migrate dev --name init
```

## Seed

```bash
npm run db:seed
```

The seed (`prisma/seed.js`) is idempotent and creates:

| Role | Username | Password | Organization |
| --- | --- | --- | --- |
| `SUPERADMIN` | `superadmin` | `SuperAdmin@123` | none |
| `ADMIN` | `admin` | `Admin@123` | `OpenMusabaqah Demo` (`openmusabaqah-demo`) |

No judges, competitions, groups, questions, or participants are seeded.

The seed upserts by username and email. Re-running it resets both passwords to the values above and reactivates the accounts. Change the passwords after first sign-in.

## Run

```bash
npm run dev       # development (webpack)
npm run build     # production build
npm start         # production server
npm run typecheck # tsc --noEmit
npm run lint      # next lint
```

Default URL: `http://localhost:3000`.

## First-run checklist

1. Sign in at `/login` as `superadmin` and confirm the organization list.
2. Sign in as `admin`; create a competition in `/admin`.
3. Add at least one group and a question batch (for example batch 1 with two ayahs).
4. Create a judge from the **Judges** tab, copy the generated credentials, and confirm the assignment.
5. Optionally enable public registration in **Setup** and open `/register/[slug]`.
6. In the **Live stage** tab, activate an approved participant.
7. Sign in as the judge in a second browser/profile, open `/judge`, and submit a score.
8. Watch `submittedCount` advance; the last judge completes the turn and marks the batch used.
9. Open `/leaderboard/[slug]` and confirm the visibility mode behaves as configured.

## Testing without email

There is no mail delivery. Registration reference codes appear on screen, and judge credentials appear once in the admin UI. If a credential is lost, reset the judge password from the **Judges** tab.

## Existing single-tenant database

The previous version stored `Group`, `Participant`, `Question`, `Score`, and `SystemState` without organization or competition ownership. Running `db push` against that database fails with:

```
Added the required column `competitionId` ... without a default value
Added the required column `registrationCode` to `Participant` ...
```

Prisma cannot invent a competition owner for existing rows. Choose one of these paths:

1. **Fresh start (destructive):** back up the legacy data outside the app, then:
   ```bash
   npx prisma db push --force-reset
   npm run db:seed
   ```
   This drops all legacy tables and data.
2. **Preserve data:** export the legacy tables, reset the schema, create an organization and competition, then import participants/questions/groups with the new required fields (`competitionId`, `registrationCode`, status/source). Scores need a judge account and competition mapping.
3. **Custom SQL migration:** add nullable columns, create a legacy organization/competition, backfill, then enforce `NOT NULL` and create the new tables. This is the only path that keeps the legacy database intact in place.

Until the schema is applied, API routes that touch the database will fail, because new tables (`User`, `Competition`, etc.) and columns do not exist.

## Troubleshooting

### `Can't reach database server at localhost:5432`

- Start PostgreSQL and confirm the port/host in `DATABASE_URL`.
- If using Docker:

```bash
docker run --name openmusabaqah-db -e POSTGRES_PASSWORD=12345678 -e POSTGRES_DB=openmusabaqah -p 5432:5432 -d postgres:16
```

### `Environment variable not found: DIRECT_URL`

Add `DIRECT_URL` to `.env` (and to `.env.development` if it exists). Prisma validates datasource variables for CLI commands.

### `AUTH_SECRET must be set to at least 16 characters in production`

Set a 32+ character random secret in the production environment. The development fallback is not used when `NODE_ENV=production`.

### Sessions stop working after a restart

Sessions are signed with `AUTH_SECRET`. If the secret changes between deployments, all existing cookies become invalid. Keep it stable.

### Prisma client errors after schema changes

```bash
npx prisma generate
```

### Public registration returns `403` or `409`

- `403`: `publicRegistration` is disabled.
- `409`: `registrationOpen` is false, or the competition is `COMPLETED`/`ARCHIVED`.

### Public batch selection returns `409`

- No participant is active.
- The live state is not `waiting_batch` (a batch was already selected or judging started).
- The batch is already used.
- The competition is closed.

### Judge sees no competitions

Verify the judge has an **active** assignment for a non-archived competition and that the judge account is enabled.

## Deployment notes

- Set `AUTH_SECRET`, `DATABASE_URL`, `DIRECT_URL`, and `NEXT_PUBLIC_APP_URL` in the hosting provider.
- Run `prisma migrate deploy` (or `db push`) during release, then optionally `db:seed` once.
- Use HTTPS; cookies become `secure` automatically in production.
- Polling endpoints are cheap but called frequently. If you scale horizontally, keep the database connection pool sized for the number of instances.
- The login rate limiter is per process. For strict limits, put a shared limiter in front (reverse proxy or Redis).
- `next-pwa` generates the service worker at build time. Verify `/manifest.json` and icons are reachable after deployment.

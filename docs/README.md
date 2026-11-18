# OpenMusabaqah Documentation

OpenMusabaqah is a multi-organization Quran competition platform. Organizations register, create competitions, invite judges, accept public registrations, run a live stage, and publish leaderboards with configurable privacy.

## Roles

| Role | Entry point | Capabilities |
| --- | --- | --- |
| `SUPERADMIN` | `/superadmin` | Create, enable, and disable organizations. Sees platform-wide data only through superadmin endpoints. |
| `ADMIN` | `/admin` | Manage competitions, groups, questions, participants, judges, scoring criteria, visibility, and the live stage for their own organization. |
| `JUDGE` | `/judge` | Score participants independently for assigned competitions, manage participants/groups/batches, and operate the live stage for assigned competitions. |
| Public visitor | `/results`, `/live/[slug]`, `/leaderboard/[slug]`, `/register/[slug]` | Browse competitions, follow the live stage, view public leaderboards, and register when enabled. |

## Feature map

1. **Organization onboarding** — `/signup` creates an organization and its first admin in a single transaction and signs the admin in.
2. **Competition management** — admins create competitions, groups, question batches, scoring criteria, leaderboards, and judge accounts. Judges are attached per competition.
3. **Judge credentials** — admins can create judges with a custom or generated username/password, reset passwords (generated or chosen), and disable/enable access. Password changes and disabling increment `sessionVersion`, invalidating existing cookies.
4. **Public registration** — when enabled, `/register/[slug]` collects name, age, desired groups, country, city, and optional phone. Registrations arrive as `PENDING` with a reference code; admins approve or reject.
5. **Independent judging** — each judge submits one score per participant. The participant's turn is complete when every active assigned judge has submitted; the average is then computed. A judge's submission never overwrites another judge's score.
6. **Participant and batch management** — admins and assigned judges can add, edit, delete participants, assign groups/batches, and choose the active participant and batch on the live stage.
7. **Leaderboard visibility** — `PUBLIC`, `PRIVATE`, or `HIDDEN_POINTS`. Hidden mode shows participants and whether they have participated, without points or ranks. Private mode requires staff access.
8. **Point ponderation** — `FIXED` mode sums criterion point caps; `PERCENT` mode weights criteria and normalizes the total to 100.
9. **Seed data** — `npm run db:seed` creates exactly one superadmin and one admin (with a demo organization), plus no judges or competitions.

## Documentation index

| Document | Contents |
| --- | --- |
| [architecture.md](./architecture.md) | System structure, request pipeline, tenant isolation, real-time strategy |
| [data-model.md](./data-model.md) | Prisma models, enums, relationships, invariants |
| [auth-and-security.md](./auth-and-security.md) | Password hashing, sessions, revocation, rate limiting, guards |
| [flows.md](./flows.md) | End-to-end product flows for every role |
| [api-reference.md](./api-reference.md) | Every HTTP endpoint, payload, and response |
| [setup-and-seed.md](./setup-and-seed.md) | Environment, database setup, seeding, scripts, troubleshooting |
| [decisions.md](./decisions.md) | Architectural decisions and trade-offs |

## Quick start

```bash
npm install
cp .env.example .env        # fill DATABASE_URL, DIRECT_URL, AUTH_SECRET
npm run db:push
npm run db:seed
npm run dev
```

Seeded accounts:

| Role | Username | Password |
| --- | --- | --- |
| Superadmin | `superadmin` | `SuperAdmin@123` |
| Admin | `admin` | `Admin@123` |

Change both passwords after first sign-in.

## Tech stack

- Next.js 16 App Router, React 19, TypeScript strict
- PostgreSQL with Prisma 6
- Tailwind CSS 3 with the turquoise/gold design system
- `lucide-react` icons
- Quran content/audio from `https://quranapi.pages.dev` (client-side, admin questions tab and judge recitation view)

## Important constraints

- **Near-real-time uses polling**, not WebSockets/SSE. Intervals are documented in [architecture.md](./architecture.md). The database is the single source of truth, so multiple app instances stay consistent.
- **No external auth provider.** Sessions are HMAC-signed cookies backed by database checks; there are no new runtime dependencies for auth.
- **No email delivery.** Registration reference codes are shown on screen; password resets are performed by admins.
- **Legacy databases need an explicit upgrade.** The old single-tenant tables contain data that cannot be backfilled automatically into the multi-tenant schema. See [Existing single-tenant database](./setup-and-seed.md#existing-single-tenant-database) before running `db push` against an existing installation.

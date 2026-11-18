# OpenMusabaqah

Multi-organization Quran competition platform with independent judging, live stages, public registration, and configurable leaderboards.

## Highlights

- **SaaS tenancy** — organizations register and manage their own competitions, judges, and participants.
- **Independent judging** — each judge submits one score per participant; the turn completes when the last active judge submits and the average is computed.
- **Public registration** — participants register with personal details and desired groups; admins approve or reject.
- **Live stage** — participants select an available question batch; judges and audiences follow progress in near real time.
- **Leaderboard privacy** — public, private, or hidden points (participants and participation visible, points and ranks hidden).
- **Flexible scoring** — fixed point caps or weighted percentages out of 100.
- **Judge access control** — custom/generated credentials, password resets, disable/enable with session revocation.
- **PWA** — installable with manifest, icons, and a generated service worker.

## Roles

| Role | Entry |
| --- | --- |
| Superadmin | `/superadmin` |
| Organization admin | `/admin` |
| Judge | `/judge` |
| Public | `/results`, `/live/[slug]`, `/leaderboard/[slug]`, `/register/[slug]` |

## Quick start

```bash
npm install
cp .env.example .env   # set DATABASE_URL, DIRECT_URL, AUTH_SECRET
npm run db:push
npm run db:seed
npm run dev
```

Seeded accounts:

| Role | Username | Password |
| --- | --- | --- |
| Superadmin | `superadmin` | `SuperAdmin@123` |
| Admin | `admin` | `Admin@123` |

Change the passwords after signing in.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS · Prisma 6 · PostgreSQL

## Documentation

Full project context is in [`/docs`](./docs/README.md):

- [Architecture](./docs/architecture.md)
- [Data model](./docs/data-model.md)
- [Auth and security](./docs/auth-and-security.md)
- [Product flows](./docs/flows.md)
- [API reference](./docs/api-reference.md)
- [Setup and seed](./docs/setup-and-seed.md)
- [Decision records](./docs/decisions.md)

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm start          # production server
npm run typecheck  # TypeScript check
npm run lint       # Next lint
npm run db:push    # sync Prisma schema
npm run db:seed    # seed superadmin + admin
```

## License

MIT

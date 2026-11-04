# Architecture

## Overview

OpenMusabaqah is a single Next.js application that serves four audiences from one deployment:

- public pages (competition discovery, live stage, leaderboards, registration)
- organization admin dashboards
- judge consoles
- a superadmin organization console

All persistent state lives in PostgreSQL through Prisma. There are no background workers and no in-memory domain state: every page and API route reads from the database so the app can run on multiple instances.

## Layering

```
src/app/**/page.tsx          Server components: session check + redirect + shell
src/app/**/*Console.tsx      Client dashboards: fetch JSON APIs, poll, render
src/app/api/**/route.ts      HTTP handlers: parse → authorize → validate → service → Prisma
src/lib/access.ts            Tenant guards (authentication + competition/org scoping)
src/lib/auth.ts              Session cookies, scrypt hashing, revocation
src/lib/http.ts              JSON parsing, validation helpers, error envelope
src/lib/scoring.ts           Criteria normalization and score calculation
src/lib/participants.ts      Participant CRUD, judge counts, progress summaries
src/lib/leaderboard.ts       Visibility-aware leaderboard construction
src/lib/identifiers.ts       Unique slugs, usernames, registration codes
prisma/schema.prisma         Multi-tenant data model
prisma/seed.js               Superadmin + admin bootstrap
```

Every API route follows the same shape:

1. `handleRoute(async () => { ... })` catches `HttpError` and unexpected failures.
2. `readJson` parses the body.
3. A guard from `src/lib/access.ts` proves the caller may touch the target competition/organization.
4. Field validators from `src/lib/http.ts` validate input.
5. A service helper performs the Prisma operation.
6. The route returns JSON or throws `HttpError(status, message)`.

## Tenant isolation

All domain rows hang from `Organization → Competition` (or are global users with a role).

| Caller | Access rule |
| --- | --- |
| `SUPERADMIN` | Explicitly allowed by `requireCompetitionManager`/`requireCompetitionAccess`; no implicit org scoping. |
| `ADMIN` | `user.organizationId` must equal `competition.organizationId` for every competition operation. Lists are always filtered by the admin's organization. |
| `JUDGE` | Must have an **active** `JudgeAssignment` for the competition (`requireScoringJudge`, or `requireCompetitionAccess` for the live stage). Judge APIs never expose other judges' points. |
| Public | Only `/api/public/**` routes and only data explicitly selected by those routes. |

Admin routes never accept an `organizationId` from the client except for superadmin competition creation. The organization is derived from the session.

## Real-time strategy

The platform uses polling because the database is the source of truth and the app may run behind a load balancer without sticky sessions.

| Surface | Interval | Endpoint |
| --- | --- | --- |
| Admin live tab | 3 s | `GET /api/live?competitionId=...` |
| Judge console | 4 s | `GET /api/judge/workspace?competitionId=...` |
| Public live stage | 3 s | `GET /api/public/competitions/[slug]/live` |
| Public leaderboard | 5 s | `GET /api/public/competitions/[slug]/leaderboard` |

Polling is intentionally non-overlapping per surface and errors are ignored during quiet refreshes so a temporary network failure does not clear the screen. Server-sent events or WebSockets can replace polling later without changing the data model; the write APIs already return the updated state.

## Live turn state machine

`LiveState` has one row per competition.

```
inactive
  │  admin/judge sets currentParticipantId
  ▼
waiting_batch
  │  participant (public stage) or admin/judge assigns currentBatchNumber
  ▼
batch_selected ──(judge forces status)──► judging
  │
  │  every active assigned judge has a JudgeScore
  ▼
completed
```

- `batch_selected` is set by the public stage endpoint. Admin/judge batch assignment sets `judging`.
- The score endpoint marks participating questions `isUsed = true` and transitions the live state to `completed` only when the judge count equals the number of scores.
- Resetting the live stage clears participant/group/batch and returns to `inactive`. Resetting is available from the admin live tab; clearing a participant is available to admins and assigned judges.

## Scoring pipeline

1. Competition stores `pointsMode` (`FIXED` | `PERCENT`) and `scoringCriteria` JSON (`[{ key, label, max, weight }]`).
2. The judge UI renders one numeric input per criterion. The maximum is `criterion.max` for `FIXED` and `100` for `PERCENT`.
3. `POST /api/judge/score` re-normalizes criteria and recomputes the total server-side; client totals are display-only.
4. `calculateScore`:
   - `FIXED`: sum the entered values; each value ≤ its criterion maximum.
   - `PERCENT`: each value must be 0–100; total = Σ value × (weight / Σ weights); maximum 100.
5. A judge's row is upserted on `(participantId, judgeId)`. Submitting again edits that judge's score only.
6. Progress = number of `JudgeScore` rows for the participant vs. active assigned judges (`JudgeAssignment.isActive` and `User.isActive`).
7. Average = mean of all judge points, computed only when progress is complete.

## Presentation

- Global turquoise/gold theme in `src/app/globals.css` with `glass-card`, `btn-gold`, `btn-turquoise`, and `.admin-input`/`.admin-label` form primitives.
- Public pages are client components that fetch public APIs and poll.
- Admin/judge entry pages are server components; they call `getSession`, redirect unauthenticated users to `/login`, and redirect users with the wrong role to `homeForRole`.
- Competition `themeColor`, `logoUrl`, and description are stored for customization; the current UI uses the global theme and shows the stored values in the admin settings tab.

## PWA

`manifest.json` and icons are in `public/`. The Next config is wrapped by `next-pwa`, which generates the service worker in production builds. Auth responses are not cached; the SW caches static assets only according to the default Workbox configuration.

## Error model

All API failures return:

```json
{ "error": "Human-readable message" }
```

| Status | Meaning |
| --- | --- |
| 400 | Validation failure |
| 401 | Not authenticated (or private leaderboard without a session) |
| 403 | Authenticated but not allowed (wrong role, disabled account/org, private leaderboard) |
| 404 | Resource not found or outside the caller's tenant |
| 409 | Conflict (duplicate username/slug/email, closed registration, batch already used, rejected participant) |
| 429 | Too many login attempts |
| 500 | Unexpected server error |

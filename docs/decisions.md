# Architecture Decisions

## ADR-001 — Multi-tenancy by organization ownership, not row-level security

**Decision:** Every competition belongs to exactly one organization. Guards derive the organization from the session and match it to `competition.organizationId`. Superadmin bypasses scope only in explicit endpoints.

**Why:** The product is SaaS with simple tenant boundaries. Application-level guards are portable across databases and easy to audit in one file (`src/lib/access.ts`).

**Trade-off:** A missed guard is a cross-tenant leak. Every route follows the same pattern, and generic helpers always accept the competition/participant ID and resolve its owner before granting access. PostgreSQL RLS would add defense in depth but requires connection-level tenant context, which is awkward with pooled connections.

## ADR-002 — Zero-dependency authentication

**Decision:** Use Node crypto (`scrypt` + HMAC-SHA256) and a signed cookie instead of NextAuth, Auth.js, or JWT libraries.

**Why:** Next.js 16 / React 19 compatibility, no new dependencies, full control over revocation, and a small auditable surface.

**Trade-off:** We own password reset, email verification, and session storage concerns. Email flows are intentionally omitted; admins reset passwords manually. Sessions require a database read per request.

## ADR-003 — Session revocation via `sessionVersion`

**Decision:** Sessions embed the user's `sessionVersion`. Password changes, disabling a judge, and disabling an organization increment it, invalidating all existing cookies.

**Why:** Stateless cookies cannot be individually revoked without a store. A single integer delivers global revocation with one write.

**Trade-off:** Revocation is all-or-nothing per user. Per-device sessions would need a session table.

## ADR-004 — Independent per-judge scores with dynamic completion

**Decision:** `JudgeScore` is unique on `(participantId, judgeId)`. Completion compares submitted scores to the number of **active** assigned judges. No participant-level rollup row is stored.

**Why:** Judges submit independently and must never overwrite each other. Dynamic completion adapts when judges are added, disabled, or unassigned mid-competition. It also avoids stale denormalized averages.

**Trade-off:** Completion and averages are computed on read. With large datasets this can be optimized later with a materialized summary. Currently each request does a handful of indexed queries.

## ADR-005 — Polling instead of WebSockets/SSE

**Decision:** Client surfaces poll JSON endpoints at 3–5 second intervals.

**Why:** Works with serverless and multi-instance deployments without sticky sessions or a pub/sub layer. The database is the source of truth. Implementation is simple and resilient; failures leave existing data on screen.

**Trade-off:** Up to one interval of latency and constant read load. Load is modest, and polling can be replaced by SSE later because writes already return fresh state.

## ADR-006 — Public registration creates PENDING participants

**Decision:** Public submissions are not immediately eligible. They carry a registration code and require admin approval.

**Why:** Prevents spam and bad data from entering leaderboards, and gives organizers an explicit moderation step. Judges can still view non-rejected participants.

**Trade-off:** Manual approval work for organizers. Judges see pending participants and could score them before approval; the API allows scoring anything except `REJECTED`. Approval mainly gates public leaderboards.

## ADR-007 — Hidden points are omitted server-side

**Decision:** In `HIDDEN_POINTS` mode, `buildLeaderboard` sets `average` and `rank` to `null` and sorts by group/name.

**Why:** Hiding points in the UI alone leaks via API responses and ordering. Returning no values and no rank prevents inference.

**Trade-off:** Hidden leaderboards cannot reuse the ranking UI for silver/bronze badges. Participation status and submission counts remain visible by design.

## ADR-008 — FIXED and PERCENT scoring modes

**Decision:** Criteria are stored as JSON `[{ key, label, max, weight }]`. `FIXED` sums values bounded by `max`; `PERCENT` interprets values as 0–100 percentages multiplied by normalized weights.

**Why:** Organizations use either raw point tables or weighted-judging formats. Both can be represented without a separate criteria table.

**Trade-off:** `PERCENT` inputs are percentages per criterion, not points out of the criterion cap. The UI labels the mode to avoid confusion. Changing mode or criteria does not recalculate historical scores; stored `points` are authoritative.

## ADR-009 — Batches are implicit question groups

**Decision:** A batch is the set of `Question` rows sharing `(competitionId, groupId, number)`. There is no `Batch` table.

**Why:** Matches the existing competition domain (the organizer assigns a numbered set of ayah ranges) and avoids synchronization between a batch table and its questions.

**Trade-off:** Batches cannot carry metadata (label, difficulty summary) independently. Used state is duplicated per question row, though completion updates them together.

## ADR-010 — Legacy single-tenant code removed, not migrated

**Decision:** The previous `Group`/`Participant`/`Score`/`SystemState` single-tenant API and pages were replaced outright. No migration script was written.

**Why:** The legacy database was not reachable during implementation, and the new model has different ownership, scoring, and identifiers. A fresh `db push` is the intended upgrade path.

**Trade-off:** Existing deployments must export/reset data. The old services (`src/lib/store.ts`, `/api/state`, `/api/results`, `/api/events`, `/api/questions`, `/api/participants*`, `/api/judge/selections`) were deleted to avoid unauthenticated data access.

## ADR-011 — In-memory login rate limiting

**Decision:** Track failures in a process-local map (10 per 15 minutes per IP + username).

**Why:** No external dependency and adequate for a single instance. Successful logins clear failures, and errors are generic to avoid username enumeration.

**Trade-off:** Horizontally scaled instances multiply the effective limit; a restart clears counters. A shared store is the upgrade path.

## ADR-012 — Seed only platform identities

**Decision:** The seed creates exactly one superadmin and one admin attached to a demo organization. No demo competitions or judges.

**Why:** A predictable bootstrap for local development and first deployment without polluting real environments with sample competitions.

**Trade-off:** Developers must create their own competition/group/question/judge data during onboarding, which also exercises the admin flows.

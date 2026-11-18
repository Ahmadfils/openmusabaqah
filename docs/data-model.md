# Data Model

The Prisma schema lives in `prisma/schema.prisma`. PostgreSQL is required because `Participant.desiredGroupIds` uses a native string array.

## Relationship overview

```
Organization 1───* User (ADMIN, JUDGE; SUPERADMIN has no organization)
Organization 1───* Competition
Competition  1───* Group
Competition  1───* Question ──* Group
Competition  1───* Participant ──? Group
Competition  1───* JudgeAssignment *───1 User (JUDGE)
Competition  1───1 LiveState
Participant  1───* JudgeScore *───1 User (JUDGE)
```

## Enums

| Enum | Values | Meaning |
| --- | --- | --- |
| `UserRole` | `SUPERADMIN`, `ADMIN`, `JUDGE` | Platform owner, organization manager, scorer. |
| `CompetitionStatus` | `DRAFT`, `ACTIVE`, `COMPLETED`, `ARCHIVED` | Public listing shows everything except `ARCHIVED`. Registration and public batch selection are closed for `COMPLETED`/`ARCHIVED`. |
| `LeaderboardVisibility` | `PUBLIC`, `PRIVATE`, `HIDDEN_POINTS` | See [auth-and-security.md](./auth-and-security.md#leaderboard-privacy). |
| `PointsMode` | `FIXED`, `PERCENT` | Sum of criterion caps vs. weighted percentage out of 100. |
| `ParticipantStatus` | `PENDING`, `APPROVED`, `REJECTED` | Leaderboards use `APPROVED` only; judges see non-rejected participants; scores cannot be submitted for `REJECTED`. |
| `ParticipantSource` | `ADMIN`, `PUBLIC_FORM` | Where the participant came from. |

## Models

### Organization

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String @id` | cuid |
| `name` | `String` | Display name |
| `slug` | `String @unique` | Generated from name; used for URLs |
| `email` | `String @unique` | Organization contact and uniqueness key |
| `phone`, `country`, `city`, `address` | `String?` | Optional location/contact |
| `isActive` | `Boolean` | Disabling revokes all organization users' sessions |
| `createdAt`, `updatedAt` | `DateTime` | |

### User

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String @id` | |
| `username` | `String @unique` | Lowercase, `[a-z0-9._-]`, 3–32 chars |
| `passwordHash` | `String` | `scrypt$<saltHex>$<hashHex>` |
| `role` | `UserRole` | Defaults to `JUDGE` |
| `displayName`, `email`, `phone` | nullable | |
| `isActive` | `Boolean` | Disabled users cannot log in and are not counted as active judges |
| `sessionVersion` | `Int` | Incremented to revoke sessions |
| `organizationId` | `String?` | `null` only for `SUPERADMIN` |
| `scores` | `JudgeScore[]` | A judge's submissions |
| `judgeAssignments` | `JudgeAssignment[]` | |

Indexes: `organizationId`, `role`.

### Competition

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String @id` | |
| `name` | `String` | Unique per organization |
| `slug` | `String @unique` | Public URL key |
| `description` | `String?` | |
| `organizationId` | `String` | Tenant owner |
| `status` | `CompetitionStatus` | Default `DRAFT` |
| `leaderboardVisibility` | `LeaderboardVisibility` | Default `PUBLIC` |
| `publicRegistration` | `Boolean` | Enables `/register/[slug]` |
| `registrationOpen` | `Boolean` | Secondary switch; default `true` |
| `pointsMode` | `PointsMode` | Default `FIXED` |
| `scoringCriteria` | `Json?` | `[{ key, label, max, weight }]`; normalized on read |
| `themeColor`, `logoUrl` | `String?` | Branding metadata |
| `liveState` | `LiveState?` | One per competition |

Constraints: `@@unique([organizationId, name])`.

### JudgeAssignment

Joins a judge to a competition.

| Field | Type | Notes |
| --- | --- | --- |
| `userId`, `competitionId` | `String` | Composite unique `@@unique([userId, competitionId])` |
| `isActive` | `Boolean` | Inactive assignments do not count toward completion and do not grant access |
| `createdAt` | `DateTime` | |

Cascade deletes from both `User` and `Competition`.

### Group

| Field | Type | Notes |
| --- | --- | --- |
| `name` | `String` | Unique per competition |
| `description` | `String?` | |
| `competitionId` | `String` | |

Deleting a group with participants or questions is rejected by the API, not by the database (relations use `SetNull`/`Cascade` as a safety net).

### Question

A question row is one ayah range inside a batch. Multiple rows sharing `(groupId, number)` form the batch.

| Field | Type | Notes |
| --- | --- | --- |
| `number` | `Int` | Batch number |
| `surah` | `String` | English/transliterated surah name |
| `surahArabic` | `String?` | Arabic surah name |
| `surahNumber` | `Int` | 1–114 |
| `startAyah`, `endAyah` | `Int?` | Optional range |
| `difficulty` | `String` | `easy` \| `medium` \| `hard` |
| `isUsed` | `Boolean` | Set when a turn completes for a participant in that batch |
| `groupId`, `competitionId` | `String` | Both are stored for scoping and cascade behavior |

Index: `@@index([competitionId, groupId, number])`.

### Participant

| Field | Type | Notes |
| --- | --- | --- |
| `name` | `String` | |
| `identifier` | `String?` | Optional seat/admin reference; unique per competition when present |
| `registrationCode` | `String @unique` | `OM-XXXXXXXX`, generated for every participant |
| `age` | `Int?` | Required by the public form; optional for admin-created participants |
| `country`, `city`, `phone` | nullable | Phone optional |
| `desiredGroupIds` | `String[]` | Groups selected on the public form |
| `groupId` | `String?` | Actual competing group, set by admin/judge |
| `batchNumber` | `Int?` | Assigned batch |
| `status` | `ParticipantStatus` | Default `APPROVED` for admin-created; `PENDING` for public form |
| `source` | `ParticipantSource` | |
| `competitionId` | `String` | |

Constraints: `@@unique([competitionId, identifier])`, index `(competitionId, groupId)`.

Note: PostgreSQL unique constraints do not consider `NULL` equal, so multiple participants without identifiers are allowed.

### JudgeScore

One row per `(participant, judge)`.

| Field | Type | Notes |
| --- | --- | --- |
| `participantId`, `judgeId`, `competitionId` | `String` | |
| `batchNumber` | `Int?` | Batch being scored at submission time |
| `criteria` | `Json?` | Raw per-criterion values `{ key: number }` |
| `points` | `Float` | Server-calculated total |
| `notes` | `String?` | |
| `submittedAt`, `updatedAt` | `DateTime` | |

Constraints: `@@unique([participantId, judgeId])`; index `competitionId`. Deletes cascade with the participant; deleting a judge is restricted while scores exist.

### LiveState

| Field | Type | Notes |
| --- | --- | --- |
| `competitionId` | `String @id` | One row per competition |
| `currentGroupId` | `String?` | Derived from the active participant when set |
| `currentParticipantId` | `String?` | Active participant |
| `currentBatchNumber` | `Int?` | Selected batch |
| `status` | `String` | `inactive`, `waiting_batch`, `batch_selected`, `judging`, `completed` |
| `updatedAt` | `DateTime` | |

There are no foreign keys on the `current*` fields; the API validates that the participant and batch belong to the competition before writing.

## Invariants enforced by the API

1. A participant can only be activated if it belongs to the competition.
2. A batch can only be assigned if it exists in the participant's group within the competition.
3. A public batch selection requires `status = waiting_batch`, an available (unused) batch, and an open competition.
4. A score requires an active judge assignment and a non-rejected participant.
5. Completion requires `submittedCount >= activeJudgeCount`, with `activeJudgeCount > 0`.
6. Used batches are marked only on completion, not on individual score submission.

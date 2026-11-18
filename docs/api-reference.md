# API Reference

All endpoints return JSON. Errors use `{ "error": "message" }` with the statuses described in [architecture.md](./architecture.md#error-model). Authentication uses the `om_session` cookie.

Guard shorthand:

- **Public** — no session.
- **Session** — any authenticated user.
- **Org admin** — `ADMIN` of the target organization.
- **Manager** — `ADMIN` of the organization or `SUPERADMIN`.
- **Judge** — `JUDGE` with an active assignment for the competition.
- **Competition access** — superadmin, owning-org admin, or actively assigned judge.

---

## Authentication

### `POST /api/auth/login`

Public. Body:

```json
{ "username": "admin", "password": "Admin@123" }
```

Response: `{ user, redirectTo }`. Sets the session cookie. Returns `401` for invalid credentials and `429` after 10 failed attempts in 15 minutes for the same IP + username.

### `POST /api/auth/logout`

Session. Clears the cookie. Response: `{ "ok": true }`.

### `GET /api/auth/me`

Public. Response: `{ user: SessionUser | null }`.

### `POST /api/auth/register-organization`

Public. Creates an organization and its first admin, then signs the admin in.

```json
{
  "organizationName": "Al-Noor Center",
  "organizationEmail": "contact@alnoor.org",
  "organizationPhone": "+000000000",
  "country": "Country",
  "city": "City",
  "address": "Optional",
  "displayName": "Admin Name",
  "username": "optional.username",
  "password": "Password123"
}
```

Response `201`: `{ organization, user, redirectTo: "/admin" }`. Conflicts return `409`.

---

## Admin — competitions

### `GET /api/admin/competitions`

Manager. Lists competitions for the caller's organization (superadmin sees all, optionally filtered by `?organizationId=`). Includes organization summary and counts of groups, participants, questions, and judge assignments.

### `POST /api/admin/competitions`

Manager. Body:

```json
{ "name": "Ramadan Qur'an Contest", "slug": "optional-slug", "description": "Optional" }
```

Superadmin must also send `organizationId`. New competitions start as `DRAFT` with default criteria. Response `201` with the competition.

### `GET /api/admin/competitions/[id]`

Manager. Full detail: organization, groups with counts, judge assignments with users, live state, counts, normalized `scoringCriteria`, and `activeJudgeCount`.

### `PUT /api/admin/competitions/[id]`

Manager. Accepts any subset of:

| Field | Type |
| --- | --- |
| `name` | string (2–120) |
| `slug` | string (slugified, globally unique) |
| `description` | string or null |
| `status` | `DRAFT` \| `ACTIVE` \| `COMPLETED` \| `ARCHIVED` |
| `leaderboardVisibility` | `PUBLIC` \| `PRIVATE` \| `HIDDEN_POINTS` |
| `publicRegistration`, `registrationOpen` | boolean |
| `pointsMode` | `FIXED` \| `PERCENT` |
| `themeColor`, `logoUrl` | string or null |
| `scoringCriteria` | array of `{ key, label, max, weight }` |

Returns the updated detail.

### `DELETE /api/admin/competitions/[id]`

Manager. Deletes the competition and cascades groups, questions, participants, scores, assignments, and live state.

---

## Admin — groups

### `GET /api/admin/groups?competitionId=...`

Manager. Groups with participant and question counts.

### `POST /api/admin/groups`

Manager. `{ competitionId, name, description? }`. `409` on duplicate name within the competition.

### `PUT /api/admin/groups`

Manager. `{ id, name, description? }`.

### `DELETE /api/admin/groups?id=...`

Manager. `409` if the group still contains participants or questions.

---

## Admin — questions

Questions are rows within a batch `(groupId, number)`.

### `GET /api/admin/questions?competitionId=...&groupId=...`

Manager. Optional `groupId` filter. Ordered by group, batch number, creation time.

### `POST /api/admin/questions`

Manager. Body:

```json
{
  "competitionId": "...",
  "groupId": "...",
  "number": 1,
  "surah": "Al-Fatiha",
  "surahArabic": "الفاتحة",
  "surahNumber": 1,
  "startAyah": 1,
  "endAyah": 7,
  "difficulty": "easy"
}
```

`number` 1–999, `surahNumber` 1–114, ayah values 1–286, `difficulty` `easy`/`medium`/`hard` (default `medium`). End ayah must be ≥ start ayah.

### `PUT /api/admin/questions`

Manager. Same fields plus `id`; requires `groupId`. Optional `isUsed` boolean to manually mark a batch row used/available.

### `DELETE /api/admin/questions?id=...`

Manager. Deletes one question row.

---

## Admin — participants

### `GET /api/admin/participants?competitionId=...&groupId=...&status=...`

Manager. Adds `judgeScores` with judge names and progress fields per participant (`submittedCount`, `judgeCount`, `complete`, `average`).

### `POST /api/admin/participants`

Manager. Body:

```json
{
  "competitionId": "...",
  "name": "Participant",
  "identifier": "optional-unique-per-competition",
  "age": 15,
  "country": "...",
  "city": "...",
  "phone": "...",
  "groupId": "...",
  "batchNumber": 1,
  "desiredGroupIds": [],
  "status": "APPROVED"
}
```

`status` defaults to `APPROVED`. Response `201`.

### `PUT /api/admin/participants`

Manager. Send `id` plus any subset of `name`, `identifier`, `age`, `country`, `city`, `phone`, `groupId`, `batchNumber`, `desiredGroupIds`, `status`.

### `DELETE /api/admin/participants?id=...`

Manager. Deletes the participant, their scores, and clears the live state if they were active.

---

## Admin — judges and assignments

### `GET /api/admin/judges`

Org admin. Lists judges in the organization with assignments.

### `POST /api/admin/judges`

Org admin. Body:

```json
{
  "displayName": "Judge Name",
  "username": "optional",
  "password": "optional",
  "email": "optional",
  "phone": "optional",
  "competitionIds": ["..."]
}
```

If username is omitted, one is generated and made unique. If password is omitted, `generatedPassword` is returned once in the response. All competition IDs must belong to the organization.

### `PUT /api/admin/judges/[id]`

Org admin. Accepts any subset:

| Field | Effect |
| --- | --- |
| `displayName`, `email`, `phone` | Profile fields |
| `username` | Unique normalized username |
| `password` | Sets a new password and revokes sessions |
| `resetPassword: true` | Generates a password, returns `generatedPassword`, revokes sessions |
| `isActive` | Disable/enable; disabling revokes sessions |

### `GET /api/admin/assignments?competitionId=...`

Manager. Lists assignments with user summaries.

### `POST /api/admin/assignments`

Manager. `{ competitionId, judgeId }`. Upserts an active assignment. Judge must be active and in the same organization.

### `DELETE /api/admin/assignments?competitionId=...&judgeId=...`

Manager. Deletes the assignment.

---

## Live stage

### `GET /api/live?competitionId=...`

Competition access. Returns:

```json
{
  "competitionId": "...",
  "state": { "competitionId": "...", "currentGroupId": null, "currentParticipantId": null, "currentBatchNumber": null, "status": "inactive", "updatedAt": "..." },
  "judgeCount": 2,
  "participant": {
    "id": "...", "name": "...", "identifier": null, "groupId": "...", "batchNumber": 1,
    "group": { "name": "..." }, "judgeScores": [],
    "submittedCount": 1, "complete": false, "average": null
  }
}
```

`participant` is `null` when nobody is active.

### `POST /api/live`

Competition access. Three modes:

1. **Set/reset participant**

```json
{ "competitionId": "...", "currentParticipantId": "...", "status": "waiting_batch" }
```

Omit `status` to let the server choose `judging` when `currentBatchNumber` is present, otherwise `waiting_batch`. Send `currentParticipantId: null` to clear the active participant (keeps the live row).

2. **Assign batch to the current participant**

```json
{ "competitionId": "...", "currentBatchNumber": 3, "status": "judging" }
```

Requires an existing active participant. Validates the batch exists in the active group and writes it to the participant.

3. **Reset everything**

```json
{ "competitionId": "...", "reset": true }
```

Returns `{ state, judgeCount, participant }`.

Batch assignment on this endpoint does not require the batch to be unused; use the public endpoint or UI to enforce availability.

---

## Judge

### `GET /api/judge/competitions`

Judge. Lists non-archived competitions with an active assignment, including group/participant/question counts.

### `GET /api/judge/workspace?competitionId=...&groupId=...`

Judge (active assignment). Returns:

- `competition` with normalized criteria, points mode, visibility, organization name, groups;
- `judgeCount` (active judges);
- `participants` (non-rejected) with `submittedCount`, `complete`, `average` (only when complete), and `myScore` (the caller's score only);
- `batches` grouped by group with `isUsed`;
- `liveState`;
- `judges` (id, username, displayName) of active assignments;
- `updatedAt`.

### `POST /api/judge/score`

Judge (active assignment). Body:

```json
{
  "competitionId": "...",
  "participantId": "...",
  "batchNumber": 2,
  "criteria": { "tajweed": 27, "memorization": 65 },
  "notes": "Optional"
}
```

- `criteria` values must cover every configured criterion, be ≥ 0, ≤ `max` in `FIXED` mode or ≤ 100 in `PERCENT` mode.
- `batchNumber` defaults to the participant's assigned batch.
- Rejected participants return `409`.

Response:

```json
{
  "score": { "id": "...", "points": 92, "criteria": { "tajweed": 27, "memorization": 65 }, "...": "..." },
  "progress": { "submittedCount": 2, "judgeCount": 2, "complete": true },
  "completedNow": true,
  "maxPoints": 100,
  "average": 88.5
}
```

### `POST /api/judge/participants`

Judge (active assignment). Creates an `APPROVED` participant. Accepts `competitionId`, `name`, `identifier`, `age`, `country`, `city`, `phone`, `groupId`, `batchNumber`.

### `PUT /api/judge/participants`

Judge (active assignment of the participant's competition). Accepts `id` plus `name`, `identifier`, `age`, `country`, `city`, `phone`, `groupId`, `batchNumber`. Status changes are not allowed here.

### `DELETE /api/judge/participants?id=...`

Judge (active assignment of the participant's competition). Deletes the participant and their scores.

---

## Public

### `GET /api/public/competitions`

Public. Lists non-archived competitions belonging to active organizations, with organization name and group/participant counts.

### `GET /api/public/competitions/[slug]`

Public. Competition details and groups; organization limited to name/city/country. `404` if the competition or organization is inactive.

### `POST /api/public/competitions/[slug]/register`

Public. Body:

```json
{
  "name": "Participant",
  "age": 15,
  "country": "...",
  "city": "...",
  "phone": "optional",
  "desiredGroupIds": ["..."]
}
```

Requires `publicRegistration`, `registrationOpen`, non-closed status, and at least one valid desired group. Creates a `PENDING` participant. Response `201`:

```json
{
  "participant": { "id": "...", "name": "...", "registrationCode": "OM-XXXXXXXX", "status": "PENDING" },
  "competition": { "name": "...", "slug": "..." },
  "message": "Registration received. Keep your reference code."
}
```

### `GET /api/public/competitions/[slug]/leaderboard`

Public unless visibility is `PRIVATE`.

```json
{
  "competition": { "id": "...", "name": "...", "slug": "...", "status": "ACTIVE", "leaderboardVisibility": "PUBLIC", "organizationName": "..." },
  "rows": [
    {
      "id": "...", "name": "...", "registrationCode": "OM-XXXXXXXX", "groupName": "...",
      "status": "APPROVED", "submittedCount": 2, "judgeCount": 2,
      "complete": true, "average": 91.5, "pointsVisible": true, "rank": 1
    }
  ],
  "judgeCount": 2,
  "updatedAt": "..."
}
```

In `HIDDEN_POINTS` mode, `average` and `rank` are `null`, `pointsVisible` is false, and rows are ordered by group/name. In `PRIVATE` mode, anonymous requests get `401`, disallowed sessions get `403`.

### `GET /api/public/competitions/[slug]/live`

Public. Returns competition summary, live participant/group/batch, `submittedCount`, `judgeCount`, `complete`, and batches with `isUsed`. No scores.

### `POST /api/public/competitions/[slug]/live`

Public. Body: `{ "batchNumber": 3 }`. Allowed only when the live state is `waiting_batch` with an active participant, the competition is not completed/archived, and the batch exists and is unused in the participant's group. Sets the participant's `batchNumber` and live status `batch_selected`.

---

## Superadmin

### `GET /api/superadmin/organizations`

Superadmin. Lists organizations with admins, user counts, and competition counts.

### `POST /api/superadmin/organizations`

Superadmin. Body:

```json
{
  "organizationName": "...",
  "organizationEmail": "...",
  "organizationPhone": "optional",
  "country": "optional",
  "city": "optional",
  "address": "optional",
  "displayName": "Admin name",
  "username": "optional",
  "password": "Password123"
}
```

Creates the organization and first admin in a transaction. Response `201`: `{ organization, admin: { id, username, displayName } }`.

### `PUT /api/superadmin/organizations/[id]`

Superadmin. Body `{ "isActive": false }`. Disabling increments `sessionVersion` for every user in the organization, revoking their sessions.

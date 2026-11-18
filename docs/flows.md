# Product Flows

## 1. Organization onboarding

**Actor:** new organization admin

1. Visitor opens `/signup`.
2. Form collects organization name, email, phone, country, city, address, admin display name, username (optional), password, and confirmation.
3. `POST /api/auth/register-organization`:
   - validates fields and password policy,
   - ensures organization email and username are unique,
   - creates the organization and its `ADMIN` user in one transaction,
   - starts a session and returns `redirectTo: /admin`.
4. The admin lands in the dashboard with no competitions and is prompted to create one.

**Superadmin alternative:** `/superadmin` can create an organization with its first admin using `POST /api/superadmin/organizations`. This does not sign the superadmin out or create a session for the new admin.

## 2. Competition setup

**Actor:** organization admin (`/admin`)

1. **Create competition** — name, optional slug and description. A unique slug is generated if omitted. Default scoring criteria are Tajweed 30/30 and Memorization 70/70, `FIXED` mode, `PUBLIC` leaderboard, registration disabled.
2. **Setup tab** — edit name, slug, description, status (`DRAFT`/`ACTIVE`/`COMPLETED`/`ARCHIVED`), leaderboard visibility, public registration and registration-open switches, points mode, theme color, logo URL, and scoring criteria.
   - `FIXED`: each criterion has a maximum; the total maximum is the sum.
   - `PERCENT`: each criterion has a weight; totals are normalized to 100.
   - Criteria keys must be lowercase `[a-z0-9_]`, labels are required, caps/weights positive.
3. **Groups tab** — create groups (unique name per competition) with optional description. A group with participants or questions cannot be deleted.
4. **Questions tab** — select a group, then add ayah ranges with batch number, difficulty, surah (loaded from `quranapi.pages.dev`, with a manual fallback), and start/end ayah. Rows sharing a batch number form one batch. Batches show Used/Available.
5. **Judges tab** — create judges (see flow 3) and assign them to the current competition.
6. **Participants tab** — add participants directly (name, identifier, age, country, city, phone, group, batch, status), approve/reject public registrations, edit, or delete.
7. **Live stage tab** — set the active participant and batch, watch judge progress, and copy public links.

Changes to visibility, points mode, and criteria apply immediately. Scores already stored keep their stored `points`; changing criteria does not retroactively recalculate them.

## 3. Judge management

**Actor:** organization admin

### Create

1. Admin opens **Judges**, enters display name and optionally username, password, email, phone, and "assign to this competition".
2. If username is omitted, one is derived from email/display name and made unique.
3. If password is omitted, a 14-character password is generated.
4. The response includes the username and `generatedPassword`; the UI shows a credentials card to copy. The generated password is shown **once**.

### Reset password

1. Admin clicks **Reset password** on a judge.
2. Leaving the field blank generates a new password; entering a value uses it (password policy applies).
3. The server returns the new generated password (if generated) and increments `sessionVersion`, signing the judge out everywhere.

### Disable / enable

- Disabling sets `isActive = false` and increments `sessionVersion`; the judge is signed out and cannot log in.
- A disabled judge is excluded from `activeJudgeCount`, so turn completion uses only active judges.
- Assignments remain in place and become effective again when re-enabled.

### Assign / unassign

- Assigning creates or reactivates `JudgeAssignment`.
- Unassigning deletes the assignment. The judge immediately loses access and stops counting toward completion for future turns. Existing scores remain.

## 4. Public registration

**Actor:** public participant

1. Admin enables `publicRegistration` and `registrationOpen`.
2. Visitor opens `/results`, selects **Register**, or navigates directly to `/register/[slug]`.
3. Form requires name, age (3–120), country, city, at least one desired group, and optional phone.
4. `POST /api/public/competitions/[slug]/register` re-checks organization activity, registration flags, competition status, and that desired groups belong to the competition.
5. A `PENDING` participant is created with source `PUBLIC_FORM`, a unique `OM-XXXXXXXX` reference code, and the desired group IDs. The first desired group is stored as the provisional `groupId`.
6. The page displays the reference code with a copy button.
7. Admin reviews the participant in the **Participants** tab:
   - **Approve** sets `APPROVED`; the participant becomes eligible for scoring and leaderboards.
   - **Reject** sets `REJECTED`; the participant disappears from leaderboards and cannot be scored.
   - Editing can correct group, batch, and contact details.

Public-form participants are not auto-assigned a batch; admin/judge assigns one before the turn.

## 5. Running a turn (live stage)

**Actors:** admin or assigned judge; public participant at `/live/[slug]`

1. **Activate participant** — admin/judge selects an approved participant and hits **Set active**. API sets `currentParticipantId`, `currentGroupId`, and `status = waiting_batch`.
2. **Batch selection** — two paths:
   - **Public stage:** `/live/[slug]` polls every 3 s. While `waiting_batch`, it shows unused batches for the active participant's group. The participant taps one; the API validates `waiting_batch`, batch existence, and `isUsed`, then sets `participant.batchNumber`, `currentBatchNumber`, and `status = batch_selected`.
   - **Admin/judge:** choose a batch in the live control and assign it; the API sets `status = judging`.
3. **Display** — the public stage shows the active participant, group, batch, and `submittedCount/judgeCount` (no scores). The admin live tab shows the same plus per-judge progress count and the average only when complete.
4. **Scoring** — see flow 6.
5. **Completion** — when the last active assigned judge submits, the API:
   - marks all questions in the participant's group/batch `isUsed = true`,
   - sets the live state to `completed` if this participant is still active,
   - returns `completedNow: true` and the final average.
6. **Next participant** — admin/judge activates the next participant. The previous state is overwritten. **Reset stage** clears the active participant and batch and returns to `inactive`.

Judges can delete participants; deleting the active participant clears the live state. Deleting a participant also deletes their scores.

## 6. Independent judge scoring

**Actor:** judge (`/judge`)

1. The judge selects an assigned competition and optional group.
2. The console polls `GET /api/judge/workspace` every 4 s and shows:
   - participants (non-rejected) with group, batch, submission count, completion, and the judge's own score,
   - active judges and the live state,
   - batches for each group.
3. The judge chooses a participant and enters one value per configured criterion. A live total is shown for convenience; the server recalculates it.
4. On submit, `POST /api/judge/score`:
   - verifies active assignment and participant eligibility,
   - validates values against criteria and points mode,
   - upserts the caller's `JudgeScore`,
   - counts active judges and submissions,
   - marks the batch used and completes the turn when everyone has submitted,
   - returns `{ score, progress, completedNow, maxPoints, average }`.
5. Resubmitting before completion updates only that judge's row. After completion, resubmission is still allowed by the API and updates the judge's points; the stored leaderboard average changes accordingly, but the batch remains used and the live state remains `completed`.
6. The judge never sees other judges' points, notes, or criteria breakdowns. After completion, the aggregate average is returned to staff surfaces.

### Judge participant management

Judges with an active assignment can:

- add participants to the competition (created `APPROVED`, source `ADMIN`),
- edit contact/group/batch fields (status cannot be changed),
- delete participants,
- assign batches inline in the participant list.

Judges cannot create groups, questions, competitions, or judge accounts.

## 7. Leaderboard

**Actor:** public viewer or staff

1. `/results` lists non-archived competitions from active organizations.
2. `/leaderboard/[slug]` fetches the leaderboard immediately and every 5 s.
3. Behavior depends on visibility:
   - `PUBLIC` — ranked completed participants with averages.
   - `HIDDEN_POINTS` — participants grouped by group/name; shows Judged / In progress / Not yet, no rank or points.
   - `PRIVATE` — anonymous visitors get a sign-in prompt; staff with access see the normal ranked board.

Only `APPROVED` participants appear. Participants with no scores appear as **Not yet**; incomplete participants have no average and no rank.

## 8. Organization suspension (superadmin)

1. Superadmin opens `/superadmin`.
2. **Disable** sets `isActive = false` and increments `sessionVersion` for every user in the organization.
3. Public competition endpoints treat the organization as inactive (`404`); its users are signed out on their next request.
4. **Enable** restores access; users must sign in again.

## 9. Judge client experience limits

- The judge console lists only competitions with an active assignment that are not archived.
- If no competition is assigned, the console shows an empty state.
- Judges have no admin navigation; only the competition/group selectors, turn control, participant tools, and scoring form.

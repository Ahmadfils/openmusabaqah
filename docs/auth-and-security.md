# Authentication and Security

## Password storage

- Passwords are hashed with Node's built-in `crypto.scryptSync` (N=16384 default, 64-byte key, 16-byte random salt).
- Stored format: `scrypt$<saltHex>$<hashHex>`.
- Verification re-derives the hash and compares with `crypto.timingSafeEqual`.
- Password policy: 8–128 characters, at least one letter and one digit.

## Sessions

There is no external auth library and no JWT dependency.

1. `POST /api/auth/login` verifies the password and calls `startSession`.
2. The token is `base64url(JSON payload) + "." + HMAC-SHA256(payload, AUTH_SECRET)`.
3. Payload: `{ uid, sv, exp }` where `sv` is the user's `sessionVersion` and `exp` is 7 days from issue.
4. The token is stored in the `om_session` cookie:
   - `httpOnly`
   - `sameSite=lax`
   - `secure` in production
   - `path=/`
   - `maxAge=604800`
5. `getSession` re-reads the user from the database on every request and rejects the session when:
   - the signature or expiry is invalid,
   - the user no longer exists or `isActive` is false,
   - `sessionVersion` no longer matches the token,
   - the user belongs to a disabled or missing organization (except superadmin).

`AUTH_SECRET` must be at least 16 characters. A development fallback exists, but production throws if the variable is missing or too short.

## Revocation

| Event | Effect |
| --- | --- |
| Admin resets a judge password (generated or supplied) | `sessionVersion += 1` |
| Admin disables a judge | `sessionVersion += 1`, `isActive = false` |
| Superadmin disables an organization | All users in that organization get `sessionVersion += 1` |
| Logout | Cookie is cleared; other devices remain valid until expiry |

Incrementing `sessionVersion` invalidates every existing token for that user on the next request.

## Login rate limiting

`src/lib/login-rate-limit.ts` keeps an in-memory map of failures keyed by `clientIp:username`.

- Window: 15 minutes.
- Maximum: 10 failed attempts.
- Successful login clears the counter.
- Client IP comes from `x-forwarded-for` (first value) or `x-real-ip`.

Limitations: the counter is per process, so a multi-instance deployment effectively multiplies the limit. Replace with a shared store (Redis) if stricter protection is required.

## Authorization guards

| Guard | Who passes |
| --- | --- |
| `requireUser` | Any valid session |
| `requireRole(...roles)` | Session with one of the roles |
| `requireOrganizationAdmin` | `ADMIN` with an `organizationId` |
| `requireCompetitionAccess` | `SUPERADMIN`; `ADMIN` of the owning org; `JUDGE` with an active assignment |
| `requireCompetitionManager` | `SUPERADMIN`; owning-org `ADMIN` only |
| `requireScoringJudge` | `JUDGE` with an active assignment for the competition |
| `requireOrganizationJudge` | Admin of the judge's organization |

Routes derive the tenant from the session. The only endpoint that accepts an explicit organization is superadmin competition creation.

Judge-scoped reads intentionally exclude other judges' scores: `GET /api/judge/workspace` selects only the caller's `myScore` and aggregate progress.

## Page guards

- `/admin`: server component; requires `ADMIN` (superadmin is redirected to `/superadmin`, judges to `/judge`).
- `/judge`: server component; requires `JUDGE`.
- `/superadmin`: server component; requires `SUPERADMIN`.
- Public pages have no session requirement except for `PRIVATE` leaderboards.

## Leaderboard privacy

| Visibility | Who can load | Points/ranks | Ordering |
| --- | --- | --- | --- |
| `PUBLIC` | Anyone | Visible | Complete participants by average desc, then name |
| `HIDDEN_POINTS` | Anyone | Hidden (average `null`, rank `null`) | Group name, then participant name; participation status still shown |
| `PRIVATE` | Superadmin, owning-org admin, actively assigned judge | Visible | Same as `PUBLIC` |

`GET /api/public/competitions/[slug]/leaderboard` returns `401` for anonymous visitors and `403` for authenticated users without access. Hidden mode never computes a rank, so ordering does not leak standings.

## Public data exposure

Public endpoints are allowlists:

- `/api/public/competitions` — name, slug, description, status, visibility, registration flags, theme metadata, organization name, counts.
- `/api/public/competitions/[slug]` — competition details and groups; organization `isActive` is stripped from the response.
- `/register` response — participant name, reference code, status; no contacts are returned.
- Live stage — participant name, identifier, group name, batch number, aggregate judge submission count. No scores.
- Leaderboard rows — participant name, registration code, group name, status, submission counts, and average only when points are visible.

Registration codes are visible on the public leaderboard by design (they are the participant's public reference). They are not authentication secrets.

## Transport and CSRF

- Cookies are `SameSite=Lax`, which blocks cross-site POST cookies in modern browsers.
- Mutating requests are JSON-only (`Content-Type: application/json`), so simple cross-site form submissions cannot hit them.
- There is no separate CSRF token. If the app is embedded cross-site or the SameSite policy is relaxed, add an origin check or CSRF token.
- Always deploy behind HTTPS; `secure` cookies are enabled automatically in production.

## Known limitations

1. No self-service password reset or email verification (no mail provider).
2. No per-organization custom domains; competitions use a global slug.
3. Rate limiting is in-memory and per instance.
4. Sessions are stateless tokens plus a DB lookup; there is no server-side session table.
5. Judge accounts are organization-scoped; a judge cannot be shared across organizations.

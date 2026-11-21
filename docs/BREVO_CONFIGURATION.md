# Brevo Configuration

OpenMusabaqah uses Brevo for transactional email (organization verification, judge invitations) and for newsletter contacts. The sender domain must be authenticated in Brevo before production email will be delivered reliably.

## Implementation map

| File | Responsibility |
| --- | --- |
| `src/lib/brevo.ts` | Server-only Brevo API client: transactional send, contact upsert, list removal, timeouts and retries. |
| `src/lib/email.ts` | Existing mail layer. Provider selection (`resend`, `brevo`, `smtp`, `console`), templates, `EmailLog` writes. Verification emails reuse this path. |
| `src/lib/newsletter.ts` | Subscribe/unsubscribe rules, `ACTIVE`/`UNSUBSCRIBED` transitions, signed unsubscribe tokens, Brevo sync. |
| `src/app/api/newsletter/route.ts` | `POST /api/newsletter` – requires consent, saves the subscriber, then syncs to Brevo. |
| `src/app/api/newsletter/unsubscribe/route.ts` | `POST /api/newsletter/unsubscribe` – unsubscribes and removes the contact from the Brevo list. |
| `src/app/unsubscribe/` | Public unsubscribe page. |
| `scripts/sync-brevo-newsletter.js` | Retries contact sync for subscribers saved while Brevo was unreachable. |

The API key is never sent to the browser. `brevo.ts` and `newsletter.ts` are server-only modules.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `BREVO_API_KEY` | Yes | Brevo v3 API key. Server side only. |
| `BREVO_SENDER_EMAIL` | Yes | Sender address authenticated in Brevo. |
| `BREVO_SENDER_NAME` | Recommended | Display name, e.g. `OpenMusabaqa`. |
| `BREVO_NEWSLETTER_LIST_ID` | Yes for newsletter | Numeric Brevo list ID. `BREVO_LIST_ID` is still accepted as a fallback. |
| `APP_URL` | Yes in production | Absolute URL used in emails and unsubscribe links. Falls back to `NEXT_PUBLIC_APP_URL`. |
| `AUTH_SECRET` | Yes | Also signs unsubscribe tokens. Keep it stable. |
| `EMAIL_PROVIDER` | Recommended | Set to `brevo` to force Brevo for transactional email. Without it, provider auto-detection applies. |
| `EMAIL_FROM` | Optional | Fallback sender for Resend/SMTP/console when `BREVO_SENDER_*` are not set. |

Add these to `.env` locally and to the Vercel project environment. Never commit `.env`.

## 1. Create the Brevo API key

1. Sign in to [Brevo](https://app.brevo.com).
2. Open **SMTP & API → API keys** (or **Settings → SMTP & API**).
3. Create a **v3** API key and copy it to `BREVO_API_KEY`.

An invalid or missing key is reported as `401` by Brevo. The app then keeps the newsletter subscription in the database with `syncedBrevo = false` instead of losing it.

## 2. Authenticate the sender domain

1. In Brevo, open **Senders, Domains & Dedicated IPs → Domains**.
2. Add your root domain (for example `openmusabaqa.org`).
3. Add the DNS records Brevo shows. Do not invent values — copy them from the dashboard.

### SPF

Add one TXT record on the root domain (or update the existing SPF record). A typical Brevo value is:

```txt
v=spf1 include:spf.sendinblue.com ~all
```

Brevo may display `include:spf.brevo.com` for newer accounts; use the exact include in the dashboard. Only one SPF record may exist per domain — merge includes into a single record.

### DKIM

Brevo shows one or more CNAME records (for example `brevo1._domainkey` and `brevo2._domainkey`). Add every record exactly as shown. DKIM lets receiving servers verify that the message was authorized by your domain.

### DMARC

Add a TXT record at `_dmarc.yourdomain.org`:

```txt
v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.org; adkim=r; aspf=r
```

Start with `p=none` to collect reports, then move to `p=quarantine` and eventually `p=reject` once SPF and DKIM pass consistently.

### Verify

Wait for DNS propagation (up to 48 hours), then click **Verify** in Brevo. Useful checks:

```bash
dig TXT openmusabaqa.org
dig TXT brevo1._domainkey.openmusabaqa.org
dig TXT _dmarc.openmusabaqa.org
```

Set the authenticated address in `BREVO_SENDER_EMAIL`. Sending from an unverified sender returns a `400` error.

## 3. Create the newsletter list

1. In Brevo, open **Contacts → Lists** and create a list such as `Newsletter`.
2. Copy its numeric ID into `BREVO_NEWSLETTER_LIST_ID`.

Subscribers are added to this list immediately. Unsubscribing removes them from it, so Brevo campaigns targeting the list skip them automatically.

## Transactional email behavior

Account verification and judge invitations continue to use the existing functions in `src/lib/email.ts`:

- `sendVerificationEmail()` for organization email verification and resends.
- `sendJudgeInviteEmail()` for judge credentials.
- `sendTransactionalEmail()` / `sendBulkEmail()` for other messages.

When `BREVO_API_KEY` is present and `EMAIL_PROVIDER=brevo`, those messages go through `POST https://api.brevo.com/v3/smtp/email` using `BREVO_SENDER_EMAIL` and `BREVO_SENDER_NAME`. Deliveries are recorded in `EmailLog` (`SENT`, `FAILED`, `SKIPPED`).

Brevo attempts are not retried automatically to avoid duplicate verification emails; resend from the app when needed.

## Newsletter behavior

- Subscription is **immediate**: no double opt-in, no confirmation email, no verification token.
- `POST /api/newsletter` requires `consent: true`, a valid email and is rate limited per IP.
- The subscriber is written to Supabase first with `status = ACTIVE` and `consentedAt`.
- The contact is then upserted into Brevo (`updateEnabled` + list membership). The operation is idempotent.
- If Brevo fails, the subscription stays `ACTIVE` with `syncedBrevo = false`; the API still returns success so the visitor is not asked to retry.
- Submitting the same email again keeps it `ACTIVE`, refreshes consent and retries the Brevo sync.
- Registering an organization or judge does **not** subscribe that user to the newsletter.

Retry failed contact syncs:

```bash
npm run brevo:sync-newsletter          # ACTIVE subscribers with syncedBrevo=false
npm run brevo:sync-newsletter -- --all # re-sync every ACTIVE subscriber
```

## Unsubscribe behavior

- Every email and the landing page link to `/unsubscribe`.
- `POST /api/newsletter/unsubscribe` accepts `{ email, token? }`.
- The token is an HMAC of the email signed with `AUTH_SECRET`; generate links with `unsubscribeUrl(email)` from `src/lib/newsletter.ts` (use it in campaign footers).
- Unsubscribing sets `status = UNSUBSCRIBED` and `unsubscribedAt`, then removes the contact from the Brevo list.
- Transactional emails (verification, judge invitations) are not affected.
- A signed link bypasses the email-only rate limit; the plain email form is rate limited per IP.

## Campaigns

Send newsletter campaigns to the Brevo list configured in `BREVO_NEWSLETTER_LIST_ID`. Unsubscribed contacts are removed from that list, so they receive no further campaigns.

For campaigns sent from the application and not through the Brevo UI, read recipients from `listActiveNewsletterEmails()` in `src/lib/newsletter.ts`; never send to `UNSUBSCRIBED` rows.

## Vercel

1. Add `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `BREVO_NEWSLETTER_LIST_ID`, `APP_URL`, and `AUTH_SECRET` to the project environment.
2. Redeploy after changing environment variables.
3. The build command runs `prisma migrate deploy && next build`; the newsletter migration is applied automatically.
4. The newsletter rate limiter is in-memory and per instance, like the login limiter. It is not a distributed quota.

## Local testing

Without a Brevo key the app falls back to the console provider:

```bash
EMAIL_PROVIDER="console"
```

Subscriptions are still stored, `syncedBrevo` remains `false`, and no email is sent. To test end to end:

```bash
npm run dev
# POST /api/newsletter with { "email": "...", "consent": true }
# GET  /unsubscribe
# POST /api/newsletter/unsubscribe with { "email": "..." }
```

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `401 Unauthorized` / key not found | Check `BREVO_API_KEY` and remove surrounding whitespace. |
| `400 Sender not valid` | Verify the domain/sender in Brevo and use the authenticated address. |
| `429 Too many requests` | Brevo rate limit; the contact sync retries once. Re-run `brevo:sync-newsletter` later. |
| Emails land in spam | Complete SPF, DKIM, and DMARC; use an authenticated subdomain for sending. |
| Unsubscribe link returns `invalid` | `AUTH_SECRET` changed after the link was generated. Regenerate the link. |
| Subscribers missing in Brevo | Run `npm run brevo:sync-newsletter`; rows with `syncedBrevo=false` are retried. |

## Security notes

- The Brevo key is read only in server-only modules and is never exposed through `NEXT_PUBLIC_*`.
- Error details stored in `EmailLog`/warnings are truncated and never include the API key.
- Emails are normalized to lowercase before storage and API calls.
- Newsletter consent and the unsubscribe state are stored in Supabase, independently of Brevo.

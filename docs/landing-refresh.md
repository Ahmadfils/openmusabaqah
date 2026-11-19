# Landing page refresh — 2026-11-18

Branch: `feat/landing-page`

## What changed

- **Arabic labels removed** from the public landing page (header tagline, hero badge, footer blessing). The header now shows the English tagline "Quran competition platform".
- **Brand mark** now uses `public/icons/openMusabaqa-logo.svg` in the landing header, footer, `/login` and `/signup`.
- **Organization registration removed from the home page.** The form lives at `/signup`, sign-in at `/login`. Every former `#register` link and CMS-stored value now points to `/signup`. The `registration` CMS section key was removed.
- **Section order is CMS-driven.** The superadmin Landing page CMS stores each section's order; the home page renders sections in that order and hides disabled sections.
- **Hero has two buttons only**: Start Musabaqa (`/signup`) and WhatsApp. The WhatsApp link is stored in `CmsHero.whatsappUrl` and edited in Superadmin → Landing page CMS → Hero. It is currently set to the temporary `https://wa.me/` placeholder.
- **Hero preview icons**: floating trophy, verified, judging and community badges sit around the screenshot carousel, with Verified / Live suite chips on top of the images.
- **Social links**: the footer includes LinkedIn, Facebook, TikTok and Instagram icons. They currently point to the platform homepages and should be replaced with the official profile URLs.
- **Public live stage is configurable per competition** (`Competition.publicLiveStage`). The admin settings tab toggles it; when disabled the Live stage button is hidden on the landing and results cards and the public live API returns 404.
- **Hero portals replaced** with an auto-rotating showcase of `public/gallery/Capture-musabaq-1.PNG`, `-2.PNG`, `-4.PNG` (cross-fade, dot controls, pauses on hover, skips auto-play under `prefers-reduced-motion`).
- **Back-to-top** floating button appears after ~480px of scroll.
- **Team portraits** are stored in the `CmsTeamMember` table: Hassan BUKURU (Executive Director, `ceo.jpeg`), Ahmad Abbas (Head of Products, `cto.jpeg`), Hussein BUTOYI (Head of Operations, `coo.png`). Portraits render full card width (4:5) above the role and bio. The fallback uses the same portrait files.

## Context / caveats

- `getLandingContent()` prefers database rows over the defaults. Team, hero and section order were written to the database on 2026-11-18. If the rows are removed, the code fallbacks in `src/lib/cms.ts` apply.
- Existing CMS hero/CTA rows that still contain `#register` are normalized to `/signup` during landing content loading.
- The superadmin console is plain request/response — no WebSocket or real-time channel is used.
- The superadmin CMS changes are included via the merge of `feat/admin-console` (`cf2abf2`).

## 2026-11-19 follow-up

- Removed the Admin console and Platform console links from the footer.
- Detached the hero icons from the screenshots and condensed them into a separate three-icon strip (Independent judging, Verified results, Live rankings) with a caption.
- `/signup` now has a “Back to home” link and a Burundian phone placeholder (`+257 79 123 456`).
- Removed provider-specific copy from the public site (newsletter and signup messages no longer mention Brevo, Resend, SMTP or API keys).
- Verification flow: double submissions are idempotent, the verify page only submits once, and `/login?verified=1` shows a confirmation. Unverified users get a resend link on the login page.
- Judge invitations now send the existing invite email when an email address is provided; the admin UI reports whether delivery succeeded.

## Verification

- `npx tsc --noEmit` passes.
- ESLint passes for all changed files.
- `next build` passes on the admin-console branch.
- Dev server (`next dev`, port 3123) returned HTTP 200; rendered order confirmed as hero → competitions → leaderboards → vision; no Arabic labels; carousel images, logo, team portraits and back-to-top present.

# Landing page refresh — 2026-11-18

Branch: `feat/landing-page`

## What changed

- **Arabic labels removed** from the public landing page (header tagline, hero badge, footer blessing). The header now shows the English tagline "Quran competition platform".
- **Brand mark** now uses `public/icons/openMusabaqa-logo.svg` in the landing header, footer, `/login` and `/signup`.
- **Organization registration removed from the home page.** The form lives at `/signup`, sign-in at `/login`. Every former `#register` link and CMS-stored value now points to `/signup`. The `registration` CMS section key was removed.
- **Section order** is now: Hero → Public competitions → Public leaderboards → Vision → Stats → Testimonials → Team → Gallery → Partners → CTA → Newsletter.
- **Hero portals replaced** with an auto-rotating showcase of `public/gallery/Capture-musabaq-1.PNG`, `-2.PNG`, `-4.PNG` (cross-fade, dot controls, pauses on hover, skips auto-play under `prefers-reduced-motion`).
- **Back-to-top** floating button appears after ~480px of scroll.
- **Team portraits**: Hassan BUKURU (CEO, `ceo.jpeg`), Ahmad Abbas (CTO, `cto.jpeg`), Hussein BUTOYI (COO, `coo.jpg`). Portraits render full card width (4:5) above the role and bio.

## Context / caveats

- `getLandingContent()` prefers database rows over the defaults. If `CmsTeamMember` rows exist, update their `avatarUrl` in the superadmin CMS editor; otherwise the defaults in `src/lib/cms.ts` are used.
- Existing CMS hero/CTA rows that still contain `#register` are normalized to `/signup` during landing content loading.
- Pre-existing admin-console work (`SuperAdminConsole.tsx`, `src/lib/email.ts`, `CmsEditor.tsx`, `src/app/api/superadmin/cms/`, `next-env.d.ts`) is intentionally left uncommitted and is not part of the landing commit.

## Verification

- `npx tsc --noEmit` passes.
- ESLint passes for all changed files.
- Dev server (`next dev`, port 3123) returned HTTP 200; rendered order confirmed as hero → competitions → leaderboards → vision; no Arabic labels; carousel images, logo, team portraits and back-to-top present.

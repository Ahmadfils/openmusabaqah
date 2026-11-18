# Landing page refresh — 2026-11-18

Branch: `feat/landing-page`

## What changed

- **Arabic labels removed** from the public landing page (header tagline, hero badge, footer blessing). The header now shows the English tagline "Quran competition platform".
- **Brand mark** now uses `public/icons/openMusabaqa-logo.svg` in the landing header, footer, `/login` and `/signup`.
- **Organization registration removed from the home page.** The form lives at `/signup`, sign-in at `/login`. Every former `#register` link and CMS-stored value now points to `/signup`. The `registration` CMS section key was removed.
- **Section order is CMS-driven.** The superadmin Landing page CMS stores each section's order; the home page renders sections in that order and hides disabled sections.
- **Hero has two buttons only**: registration (`/signup`) and WhatsApp. The WhatsApp link is stored in `CmsHero.whatsappUrl` and edited in Superadmin → Landing page CMS → Hero. It is currently set to the temporary `https://wa.me/` placeholder.
- **Hero portals replaced** with an auto-rotating showcase of `public/gallery/Capture-musabaq-1.PNG`, `-2.PNG`, `-4.PNG` (cross-fade, dot controls, pauses on hover, skips auto-play under `prefers-reduced-motion`).
- **Back-to-top** floating button appears after ~480px of scroll.
- **Team portraits** are stored in the `CmsTeamMember` table: Hassan BUKURU (CEO, `ceo.jpeg`), Ahmad Abbas (CTO, `cto.jpeg`), Hussein BUTOYI (COO, `coo.png`). Portraits render full card width (4:5) above the role and bio. The code fallback was left untouched.

## Context / caveats

- `getLandingContent()` prefers database rows over the defaults. Team, hero and section order were written to the database on 2026-11-18. If the rows are removed, the code fallbacks in `src/lib/cms.ts` apply.
- Existing CMS hero/CTA rows that still contain `#register` are normalized to `/signup` during landing content loading.
- The superadmin console is plain request/response — no WebSocket or real-time channel is used.
- The superadmin CMS changes are committed on `feat/admin-console` (`cf2abf2`); this landing branch is based on the earlier landing commit and does not yet contain the console merge.

## Verification

- `npx tsc --noEmit` passes.
- ESLint passes for all changed files.
- `next build` passes on the admin-console branch.
- Dev server (`next dev`, port 3123) returned HTTP 200; rendered order confirmed as hero → competitions → leaderboards → vision; no Arabic labels; carousel images, logo, team portraits and back-to-top present.

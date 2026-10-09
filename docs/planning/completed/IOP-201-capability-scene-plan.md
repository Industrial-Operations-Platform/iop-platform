# IOP-201 — Graphical capability scene and platform mark

Completed on 2026-10-09. Authorized by the owner's foreground-only refinement request.
[Scope](../items/IOP-201-platform-landing.md). Retain
`feature/IOP-201-platform-landing`, originally created from `develop` at `d469824`;
the current presentation is local commit `110515c`. No integration is authorized.

## Changes and steps

1. Replace only the foreground of host `IntroScene.tsx` and its `landing.css`
   arrangements. Use a balanced, front-facing SVG composition of six unnamed
   capability symbols and a central platform mark instead of the cube and tilted
   module cards. Preserve the approved background CSS, palette, movement and home
   copy/navigation/access/About composition.
2. Map decorative capabilities to module selection: Analysis illuminates signals,
   distribution and history; Maintenance illuminates equipment, planning and
   history; Workforce illuminates people, planning and history. These are
   illustrative presentation associations, not business rules, live metrics or
   permission changes. Smoothly illuminate the relevant glyphs and connecting paths.
3. Refresh `public/iop-mark.svg` as a compact connected-platform symbol using the
   existing palette. Keep `PlatformMark`/favicon reuse and inspect small sizes.
   Update its comment, the visual identity and web README to describe the result.
4. Retain optional subtle pointer parallax, pause and reduced motion. Keep all
   decorative geometry aria-hidden; the existing labelled module buttons own
   accessible selection. Adapt `e2e/platform-landing.spec.ts` only where necessary
   to verify feature illumination, upright unnamed graphics, icon loading and
   movement behavior. Do not add a renderer or dependency.
5. Run relevant web tests/build/design guards, boundary checks and the scoped
   presentation/startup/administrator browser regression suite. Inspect EN/DE
   desktop/mobile renders and 16/28/32px marks; validate documentation links/statuses,
   finish this slice and create a local commit.

Ownership: root handles scene/CSS, docs and review; bounded delegates may design
the single SVG mark and update the scene browser assertions. Shared icon consumers
receive the requested asset update; their layout and behavior are unchanged.
Domain/application/HTTP/authentication/storage boundaries are unchanged under
Accepted ADR-0032/0035. No Spanish dependency story was read.

## Validation and evidence

- `npm test --workspace @iop/web`: 29 suites, 149 tests passed.
- `npm run build --workspace @iop/web`: design guard (3 checks), TypeScript and
  production build passed. The existing bundle-size advisory remains.
- `npm test --workspace @iop/api -- --testPathPatterns=hexagonal-boundaries`:
  all 16 architecture checks passed; no API implementation changed.
- `npm run test:e2e --workspace @iop/web -- platform-landing.spec.ts
  workspace-startup.spec.ts administrator-workspace.spec.ts`: all 16 browser
  scenarios passed. Each module lights the planned subset of glyphs and paths;
  six unnamed graphics replace the cards/cube. Pause, reduced motion, keyboard
  selection, existing access, dialog focus, session restoration, required password
  change, demo mode and connection recovery remain covered.
- Inspected actual EN/DE renders at 1440/1024/375px, with no foreground clipping,
  overlap or horizontal overflow. Local captures: `/tmp/iop-201-capabilities-1440.png`,
  `-1024.png`, `-375.png` and `/tmp/iop-201-capabilities-de-1440.png`, `-1024.png`,
  `-375.png`. Inspected the shared symbol at 16/28/32px in
  `/tmp/iop-platform-mark-preview.png`.
- Independent read-only review found no blocking scene, mapping, motion or scope
  issues. The background, home composition, module controls and access components
  were preserved. All 225 relative documentation links resolve; completion statuses
  and whitespace checks passed. `npm run check:secrets` passed for 945 indexed files.

Commands used Node 24.21.0. Browser access responses are fixtures; the startup
scenario uses the real local health/context proxy. These checks are local and do
not establish production identity or deployment readiness.

## Closure

All refinement criteria passed; item and backlog are Completed. Earlier completed
evidence is preserved. Changes remain on the story branch for the owner's review.
Merge, push and deployment remain unauthorized.

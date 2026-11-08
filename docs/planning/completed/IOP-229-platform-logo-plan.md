# IOP-229 — Platform logo execution plan

Completed. Authorized by the owner's supplied-image replacement request on
2026-11-08. Story branch: `feature/IOP-229-platform-logo`, created from clean
`develop`. [Permanent scope](../items/IOP-229-platform-logo.md).

## Changes and steps

1. Generate a transparent PNG based on the supplied logo with built-in image generation,
   as explicitly clarified by the owner during implementation. Preserve the navy
   IOP gear and turquoise pulse composition; remove the white canvas and white gaps.
   Save the selected output into `apps/web/public/iop-logo.png`; replace
   the previous mark references in `PlatformMark.tsx`, `index.html`, `IntroScene.tsx`
   and the nginx cache-revalidation rule. Remove the unused previous SVG.
2. Adapt the shared logo sizing and host lockups in `components.css`,
   `WorkspaceApp.tsx`, `LandingPage.tsx` and `landing.css` to the 3:1 artwork.
   Use a genuinely transparent background in both appearances, avoid repeated IOP
   text and keep the supporting name on desktop. Verify alpha and legibility in
   light/dark appearance; shared invert/hue-rotation styling lifts the lettering
   and keeps a cyan pulse on dark surfaces without adding a background tile.
3. Update existing branding/landing browser assertions for the selected asset and
   responsive lockup. Synchronize the visual identity, component/web READMEs and backlog.

Ownership is shared design and host presentation under Accepted ADR-0032/0010;
there is no domain/application, API, schema, dependency or architectural change.
Read dependency IOP-216 is already English; no story translations are required.

## Validation and evidence

Node 24.21.0/npm 10.9.2, using `npm.cmd` on Windows:

| Check | Result |
| --- | --- |
| `npm test --workspace @iop/api` | 54 suites / 560 tests passed, including architecture boundaries |
| `npm test --workspace @iop/web` | 49 suites / 319 tests passed |
| `npm run build --workspace @iop/web` | Design guards 4/4, TypeScript and production bundle passed after final artwork/styles |
| Shell-branding, platform-landing and appearance Playwright specs | 28 passed in 31.3s; final runner exit 0 |
| PNG inspection | 2172×724, 32-bit ARGB, real transparent pixels and no opaque white samples |
| Changed Markdown links and `git diff --check` | 263 local link targets resolved; no whitespace errors |

The first browser run encountered eight screenshot-write failures at absolute
`/tmp` paths on Windows (`EPERM`); the relevant captures now use Playwright's
per-test output paths. The final run exercised Start navigation, appearance,
desktop/narrow layouts, localized lockups, sign-in, keyboard behavior and module
selection. Inspected actual desktop light/dark, mobile dark and mobile introduction
screenshots under ignored `apps/web/test-results/`. The supplied source was not
modified. The final generated recreation preserves the IOP/gear/pulse composition;
it is not a pixel-identical background extraction. Rejected extraction/recoloring
variants remain outside the repository.

The standard Windows browser command completed all scenario assertions but hung
during managed web-server teardown and was interrupted. A final fixture-only run
uses an ignored temporary config with externally managed Vite preview and no
managed API/web servers and exited successfully; fixtures continued to intercept
API requests. No shared test-server configuration is changed. The temporary
config was removed and the preview server stopped after validation.

Selected asset SHA-256:
`DAB6AD736FB0BB6155C8B39A572F4D9F8AE8791E6934B2103342F1CC6C556F0C`.
The build retains its existing large-chunk warning. No provider/database change,
hosted activation or deployment is claimed.

## Image-generation prompt

Built-in `image_gen`, transparent background enabled; selected output is
[`apps/web/public/iop-logo.png`](../../../apps/web/public/iop-logo.png).

> Generate a clean professional flat vector-style IOP platform wordmark PNG on true transparent alpha background. Wide 3:1 canvas. Design: large bold forward-slanted italic capital I on left, a large 8-tooth industrial cog gear in center replacing the letter O with a large circular transparent center, and a large bold forward-slanted italic capital P on right with transparent counter. The three shapes form exactly IOP. Letter I is a simple thick slanted rectangular bar, no serifs. Navy #06294e letters and gear. A vivid turquoise #00beb9 ECG pulse line crosses horizontally across the wordmark near center: long horizontal segment from inside I to center gear, one tall narrow upward triangular spike inside gear, one downward trough immediately after it, then returns to horizontal continuing halfway into P. Rounded line ends and rounded joins. There is a narrow transparent separation/clearance between the pulse and navy letters/gear where they cross. Bold geometric recognizable shapes. Absolutely pristine smooth contours and consistent solid fills. No texture, gradients, decoration, noise, speckles, distressing, outlines, shadows, glow, checkerboard or background tile. All negative space actual alpha. Complete centered logo, modest transparent padding. Exactly the letters IOP and no other text.

## Closure

Acceptance and item/backlog are synchronized. Retain this record under completed
and commit locally for review. Publication of the story and develop to origin,
including the story merge into develop, still requires owner approval.

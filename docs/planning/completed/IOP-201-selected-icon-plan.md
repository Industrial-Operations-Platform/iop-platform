# IOP-201 — Selected Unified Record platform icon

Completed on 2026-10-09. The owner selected round-two option 10, Unified Record, and requested
it as the new application icon. [Scope](../items/IOP-201-platform-landing.md).
Retain `feature/IOP-201-platform-landing`, originally created from `develop` at
`d469824`; the latest local refinement is `a3b898f`. Publication is unauthorized.

## Scope and steps

1. Reproduce the selected image as a compact deterministic SVG in
   `apps/web/public/iop-mark.svg`: navy rounded-square tile, two nested white
   rounded-square loops, blue outer lower/right section, and rounded white ends.
   Preserve its silhouette and proportions while removing the preview's surrounding
   whitespace and using the shared flat navy/white/blue colors. Retain the generated
   PNG as review provenance in `docs/design/references/IOP-201-unified-record.png`.
2. Keep the single shared asset URL, 32px `PlatformMark` dimensions, favicon and
   homepage scene reuse. Update only its explanatory comment, the visual-identity
   mark description, the web README and the IOP-201 item/evidence. Preserve all
   scene geometry, module illumination, layout, motion and sign-in behavior.
3. Inspect comparison with the selected image, small-size 16/28/32px legibility,
   and actual homepage/workspace desktop and mobile renders. Run the web build
   (including design guard) and existing scoped homepage/administrator browser
   checks. Use existing tests; no new tests for a static reversible asset change.
4. Check documentation links/statuses, whitespace and staged secret hygiene;
   finish this slice and create a local commit. No merge, push or deployment.

This is shared presentation-asset replacement, not an architecture change. No
domain, API, authentication, storage or permission changes; no new dependencies.
Root owns SVG integration, docs and validation; a delegate may review geometry
and renders without editing. No Spanish dependency story was read.

## Evidence

The owner's selected preview is preserved unchanged in the
[reference image](../../design/references/IOP-201-unified-record.png).
The SVG matches its two nested loops, rounded white ends and blue continuation;
slightly regularized radii, flat palette and removed surrounding whitespace adapt
the generated preview to the existing shared application asset.

- `npm run build --workspace @iop/web`: design guard (3 checks), TypeScript and
  production build passed using Node 24.21.0. The existing bundle-size advisory
  remains; CSS and JavaScript bundles are unchanged by this asset replacement.
- `npm run test:e2e --workspace @iop/web -- platform-landing.spec.ts
  administrator-workspace.spec.ts`: all 13 existing browser scenarios passed,
  covering desktop/mobile presentation, localization, module illumination,
  motion preferences, sign-in, sessions and administrator workspace behavior.
  API responses are fixtures; no API implementation changed.
- Actual homepage EN/DE desktop/mobile and workspace desktop/mobile captures were
  inspected. Selected-icon captures: `/tmp/iop-201-selected-icon-home-1440.png`,
  `-375.png`, `/tmp/iop-201-selected-icon-home-de-375.png` and
  `/tmp/iop-201-selected-icon-workspace-1440.png`, `-375.png`.
- Reference/SVG comparison and 16/28/32px inspection passed in
  `/tmp/iop-201-selected-mark-preview.png`; independent read-only review found no
  blocking fidelity or small-size legibility issues.
- The built public SVG matches the source byte-for-byte; the favicon references
  that same asset. Scene/layout/motion/access source files were unchanged.

All 228 relative documentation links and completion statuses passed validation;
whitespace and staged secret hygiene (947 indexed files) passed. Previous IOP-201
evidence remains intact. All
criteria are met; item/backlog are Completed. Merge, push and deployment require
the owner's publication approval.

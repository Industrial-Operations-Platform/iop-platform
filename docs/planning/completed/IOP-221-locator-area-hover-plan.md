# IOP-221 — Area hover label execution plan

Completed and published. Authorized by the owner's 2026-10-20 hover request.
Story branch: `feature/IOP-221-locator-area-hover`, created from clean `develop`
at `b41e395`. [Permanent scope](../items/IOP-221-locator-area-hover.md).

## Changes and steps

1. Extend `apps/web/src/features/asset-locator/adapters/three/renderer.ts` with an
   optional hover callback using the existing scene identity raycast against tile
   surfaces, avoiding thumbnail complexity and decorative border tolerance in gaps.
   Clear hover during camera/pointer interaction and remove listeners on disposal.
2. Compose the configured name as a bounded pointer-transparent overlay in
   `adapters/react/PlantOverview.tsx` and `locator.css`, using shared identity tokens
   and lifecycle guards. Ownership stays in the existing Locator presentation
   adapters; no domain/application rules, APIs or persistence change.
3. Extend existing `apps/web/test/locator-view-state.spec.tsx` and
   `apps/web/e2e/locator-resources.spec.ts` coverage for lifecycle and real pointer
   behavior. Verify desktop/narrow light/dark rendering, scene entry, clearing,
   existing fallback/cards and absence of reference requests.
4. Record results, synchronize this item/backlog, archive the plan and commit the
   bounded increment locally. Publication remains subject to owner approval.

The workflow, ADR-0007/0008/0032/0037, visual identity, architecture, glossary and
related IOP-206/211/219 contexts were reviewed. Read stories are already English;
no translation edits are needed. IOP-219 private model activation remains separate.

## Validation and evidence

- `npm test --workspace @iop/web -- --testPathPatterns='(locator|identity|design-boundaries)'`:
  4 suites / 53 tests passed, including two new lifecycle regressions. Verified
  configured names, renderer stability and ignored callbacks after replacement.
- `npm run build --workspace @iop/web`: passed, including TypeScript and all four
  design guards. The existing bundle-size advisory remains.
- `npm test --workspace @iop/api -- --testPathPatterns=hexagonal-boundaries`:
  all 26 architecture checks passed. No API implementation changed.
- `locator-resources.spec.ts`: all 11 Playwright scenarios passed against the
  production preview, including four new real WebGL hover scenarios at 1440px and
  390px in light/dark appearance. Checked adjacent names, gaps, empty background,
  pointer exit/cancel, wheel/drag clearing, label containment and click navigation;
  no browser errors or private-reference requests occurred in hover scenarios.
  Existing Administrator/editor/fallback privacy regressions also passed.
- Inspected all four hover screenshots under ignored `apps/web/test-results/`;
  shared-token labels remain readable and inside the viewer in both appearances.
- `git diff --check` and changed-document links/IDs/status consistency passed.

Checks used Node 24.21.0. The default browser configuration could not start its
configured local API. A temporary preview-only Playwright configuration used the
existing browser API fixtures and a loopback server; it was removed after success.
No source images, durable scenes, permissions or running installation were changed.

## Closure

All acceptance criteria are complete. The item/backlog are synchronized and this
plan is archived under `completed/`. Implementation `c74e65d` is committed on the
recorded story branch. The owner subsequently approved merging it into develop and
pushing both to origin; see the [verified publication](IOP-221-publication-plan.md).
Service activation was not requested. The separate IOP-219 activation plan stays open.

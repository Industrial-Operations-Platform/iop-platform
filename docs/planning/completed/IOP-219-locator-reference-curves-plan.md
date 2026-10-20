# IOP-219 — Execution plan

Completed independent software/private-preparation increment. Authorized by the
owner's 2026-10-20 request; the parent remains blocked on dependency authorization.
Story branch: `fix/IOP-219-locator-reference-curves`, created from clean `develop`.
[Permanent scope](../items/IOP-219-locator-reference-curves.md).

## Changes and steps

1. Asset Locator application owns private reference admission and a viewer-safe
   reference catalog containing only id/width/height without original filenames,
   paths or separate provenance fields. Reuse PostgreSQL's current Administrator plus management-grant rule.
   Expected files: API Locator application, host contracts/OpenAPI and related tests.
2. React/Three.js adapters own reference visibility and geometry. Require explicit
   Administrator configuration for image textures and fallback previews. Preserve
   dimension metadata for operational model rendering. Expected files: Locator
   workspace, viewport, renderer, browser models/localization and related tests.
3. Correct reusable curved conveyor geometry and add an S-curve template to the
   existing component-kind contract: two imported bends have opposing turns that
   a quarter-turn template cannot represent. Reuse the current template pattern;
   expected files also include API component kinds/catalog and generated schemas.
   Inspect supplied private reference/traces and joins without committing customer
   data. Record any necessary coordinate adjustments before applying them.
   Source review identified ten legacy bends across three supplied views: seven
   quarter turns, two S-curves and one square corner. Correct their bounding-box centers, extents and
   rotations against the source pixels; keep the other 70 components, original
   images, provisional status and unknown elevations unchanged. Back up the private
   traces and retain exact before/after coordinates and pixel evidence in ignored
   `.local-platform/locator-inspection/` before writing corrected traces. Prepare
   conflict-checked scene revisions without replacing unrelated saved edits.
   The square corner uses two joined straight components, increasing private
   traces from 80 to 81 components. Scale their conveyor rails/support widths to
   the deck so fixed-width decorations do not obscure the narrow corner footprint.
4. Synchronize `docs/development/asset-locator.md`, this plan, item and backlog.
   No new architectural pattern or story translation has been identified.

## Discovered dependency

The running installation has 72 scenes and 10,684 components, including Motor and
Photoelectric sensor kinds supplied by the unmerged
`feature/IOP-211-locator-models-and-access`. The owner has been asked to authorize
merging that branch into this correction branch; no merge is implied or performed.
Independent privacy/geometry work continues. Durable model revision application
must retain IOP-211's generated components and waits for compatible integration.
The scoped read-only snapshot is retained privately under
`.local-platform/locator-inspection/IOP-219-existing-scenes.json`.

## Validation and evidence

Run relevant API tests (`npm test --workspace @iop/api`), web Locator/geometry,
architecture/design/localization checks, type checks, web build and generated
contract checks. Inspect actual desktop/mobile viewer and Administrator editor
rendering, plus a supplied-model curve comparison. Check documentation links,
statuses and the final diff. Record results and material limits here.

## Closure

The software and private source preparation increment is complete. The item and
backlog remain Blocked for the [subsequent integration](IOP-219-locator-integration-plan.md).
No dependency merge, remote publication, service activation or durable scene edit
is implied by this completed increment.


## Recorded evidence

- Node 24.21.0: full API suite passed, 50 suites / 534 tests, including authorization
  and architecture checks. API/web type checks and API/web builds passed.
- Web Locator, geometry, workspace readiness, design and localization: 5 suites /
  46 tests passed. Generated OpenAPI/browser contract matches; secret hygiene and
  `git diff --check` passed. The web build retains its existing chunk-size warning.
- Playwright Locator privacy/resource cases: 7 passed on desktop (1440px) and mobile
  (390px). Actual screenshots show geometry-only viewing, Administrator-only source
  planes and private-image-free viewer fallback, with retained selection contexts.
  Artifacts are under ignored `apps/web/test-results/locator-resources-*`.
- Geometry raycasts verify continuous quarter/S surfaces and open quarter interiors;
  bounds cover cardinal rotations, independent width/depth and narrow corner rails.
  The private actual-mesh/source montage was visually inspected for all ten bends.
- Private `IOP-219-curve-corrections.json`, `IOP-219-traces-before.json` and
  `IOP-219-curve-preview.png/html` are retained under ignored
  `.local-platform/locator-inspection/`. The source `traces.json` changes 10 legacy
  components and adds one square-corner segment; the other 70 remain identical.
- Private `IOP-219-scene-revisions.json` prepares three optimistic-revision saves,
  432 to 433 components. Every replaced component exactly matched the retained
  live snapshot; 422 other affected-scene components and 69 other scenes are
  preserved. These payloads have not been applied: IOP-211 supplies component kinds
  absent from develop, and its integration/activation needs owner authorization.

The owner subsequently authorized local develop integration; see the linked
integration record. The blocking state above describes this increment at its original closure.

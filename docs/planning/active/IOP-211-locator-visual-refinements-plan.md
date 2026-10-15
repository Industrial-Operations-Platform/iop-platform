# IOP-211 — Locator navigation and visual refinements

Status: In progress. Continue the existing unmerged story branch
`feature/IOP-211-locator-models-and-access`, originally created from develop
`e9bd49d`; starting tip `f6d55ae`. This is an explicit owner review follow-up to
[IOP-211](../items/IOP-211-locator-models-and-access.md), not a new dependent story.
Retain the completed initial execution and its evidence. Publication remains pending.

## Scope, files and steps

1. Tracking filters: reuse the existing compact DepartmentScope presentation for
   Actions status/owner/search as appropriate, preserving native labels, selection,
   server query/cursor behavior, keyboard use and mobile sizing. Own Improvement
   Tracking React/styles/tests plus a shared generic compact-control extraction
   only if needed; keep DepartmentScope behavior compatible.
2. Model/navigation mode: default to geometry-only normal navigation in area tiles,
   cards, scene viewport and read-only details/fallback. Administrator explicitly
   enters Edit model; guide images are available only there. Keep authorization,
   source bytes, persisted geometry and canonical links unchanged. Root owns
   LocatorWorkspace, SceneViewport, PlantOverview, local styles and resources.
3. Camera continuity: preserve orbit orientation and zoom across overview/area
   navigation and preserve the entire camera on ordinary component selection.
   Explicit focus and exact source-placement entry remain deliberate centering
   actions. Extend the renderer's existing camera snapshot/callback contract;
   keep state in presentation adapters, not API/domain persistence. Root owns
   React lifecycle/composition; renderer camera edits follow the geometry handoff.
4. Geometry: assign photoelectric components a distinct existing application accent
   with a visible legend, preserving selected/reported-evidence emphasis and both
   appearances. Make conveyor lateral thickness proportional to belt dimensions,
   avoiding fixed-size rails wider than narrow source belts. Geometry slice owns
   renderer geometry/color helpers and geometry tests until handoff to root.
5. Validation: independent regression slice owns a new camera/view lifecycle suite,
   coordinated with root's public props. Verify top view into an area, zoom/orbit
   across selection and redraw, explicit focus, hidden normal reference requests,
   administrator-only authoring/guide controls and no-WebGL behavior. Run focused
   and complete web/type/design/contract checks and actual desktop/narrow light/dark
   browser inspection. API tests are needed only if API source changes.
6. Rebuild the local browser after validation, preserve database/private models,
   reconcile current operator/identity guidance, update item/backlog and move this
   finished plan to completed. Create logical local commits; do not infer merge or
   push permission from this development follow-up.

Read Accepted ADR-0032/0037 and the visual identity. This extends existing adapter
patterns and shared semantic tokens; no new architectural decision is needed.

## Parallel ownership

Tracking owns its React adapter/styles/tests and an optional shared compact select.
Geometry owns renderer geometry/color and owning tests until root handoff. Root owns
Locator React composition, camera persistence contract, localization and integration.
A third slice owns isolated lifecycle tests and read-only review; it does not edit
implementation. Do not start shared builds/preview servers without root coordination.
Never overwrite another slice's temporary QA scripts; use distinct filenames.

### Geometry execution refinement recorded before edits

Use existing `chartTeal` for the normal photoelectric-sensor body and simplified
overview instance; preserve focus and reported-evidence overrides. Keep shared
identity tokens and source component records unchanged. Bound conveyor rails and
support cross-sections to a small fraction of the smaller belt dimension, place
rail/support extents inside the belt footprint and remove their fixed 0.7-unit
horizontal overhang on narrow bands. Add geometry regressions across light/dark,
selection/attention states and minimum normalized belt dimensions. Own only
`renderer.ts` geometry/color and `locator-geometry.spec.ts` until handing the
renderer back to root for camera work; run no shared build.

## Validation evidence

Geometry/color slice: focused `locator-geometry` passes nine tests and
`git diff --check` passes. Normal photoelectric bodies and instanced thumbnails
share `chartTeal` through one renderer-owned color helper; both appearances retain
independent focus and reported-evidence overrides. Rails use six percent of the
smaller belt dimension and stay inside its footprint; supports shrink only when
their former 0.7-unit width would exceed twelve percent of that dimension. Two
minimum-dimension regressions verify body/rail/support extents. Component positions,
source geometry/data, camera/lifecycle contracts and shared identity are unchanged.
Renderer ownership is handed back to root for coordinated camera refinements.
Integrated browser/lifecycle/type/build evidence remains pending.

## Independent lifecycle regression slice

Before test edits, record the isolated ownership of
`apps/web/test/locator-view-state.spec.tsx`. A fake renderer will expose captured
camera snapshots and input callbacks without WebGL, real source requests or API
changes. Verify complete position/target preservation on ordinary selection and
same-scene redraw, top/zoom orientation and distance across overview/area contexts,
explicit focus request deduplication, callback propagation and renderer disposal.
Exercise geometry-only overview/cards/detail/fallback and Administrator-only Edit
model/guide entry through the public React surfaces. A read-only review will report
concrete lifecycle issues to root; root alone edits implementation and contracts.
Focused Jest checks are allowed, with no shared build or preview server.

The new independent suite passed **8 tests in 7.179 seconds**. It covers complete
off-center state on ordinary selection/revision redraw, current parent callbacks
and ignored disposed callbacks, a reused viewport switching areas with preserved
orbit offset, explicit focus visit deduplication, guarded guide/no-WebGL rendering,
geometry-only overview filtering/appearance redraw and actual read-only workspace
Top/zoom/area/overview continuity. Root separately owns Edit model/guide-control
authorization tests. Read-only review of the updated React lifecycle found no
additional blocker. This slice changed only its new test and this plan; no API,
implementation, shared build, server or shared-root commit was changed.

### Installed Locator browser review preparation

Prepare a unique private runner at
`/private/tmp/iop-211-visual-review/locator-camera.cjs` (directory `0700`, script and
screenshots `0600`) and execute only after root confirms the final installed web
container is healthy. Reuse the existing private Administrator session without
printing credentials. Block all domain mutation routes, including Locator save,
bootstrap and model application. No draft is saved and no installation/build/server
operation belongs to this slice.

Instrument browser WebGL view-matrix uploads at page initialization rather than
adding product debug APIs. Compare actual camera matrices across top/zoom overview
entry, ordinary component selection after orbit/pan and explicit focus. Verify zero
normal reference requests/images, Administrator-only Edit model/guide presentation,
reader preview, teal photoelectric legend, proportional rails and desktop/narrow
light/dark overflow. Retain private screenshots and a sanitized evidence report;
an expired session or concrete failure is reported to root without logging secrets.

### Tracking control composition refinement

Extract CompactSelect from the existing DepartmentScope surface; preserve that
wrapper's defaults and native semantics. Status/Owner reuse it and SearchControl
opts into a compact divided caption. Actions uses an opt-in plain FilterForm
variant so the wrapping toolbar follows the canonical compact-control contract;
other forms retain their existing default surface. Tracking owns these shared
presentation files/tests and README, with no policy or query change.

# IOP-211 — Locator navigation and visual refinements

Status: Completed locally. Owner publication approval remains pending.
Continue `feature/IOP-211-locator-models-and-access`, originally created from
develop `e9bd49d`, with this follow-up starting at `f6d55ae`. The explicit owner
review belongs to [IOP-211](../items/IOP-211-locator-models-and-access.md).
The [initial execution](IOP-211-locator-models-and-access-plan.md) retains its
separate model-generation, access and persistence evidence. The pre-edit plan was
committed as `93e8d88`; this record consolidates execution without changing scope.

## Scope, files and execution

1. Align Actions filters with Department/Halle. Extract shared `CompactSelect`,
   retain the compatible DepartmentScope wrapper and opt into compact search and
   a plain FilterForm toolbar. Preserve native selection, keyboard submission,
   opaque pagination and combined server queries. Files: design controls, shared
   control stylesheet/README, Improvement Tracking React and owning tests.
2. Make normal Locator geometry-only. In LocatorWorkspace, SceneViewport and
   PlantOverview remove normal reference images/requests, including cards,
   details and no-WebGL fallback. Administrator explicitly enters Edit model and
   can toggle Show guide image. Editing, mapping and asset lookup stay confined
   to that mode; new scenes enter it automatically. Save retains editing mode.
3. Preserve camera state in presentation adapters. Extend the existing renderer
   snapshot/callback contract and add a React camera recenter helper. Carry the
   most recent orientation and distance between overview/area contexts, centered
   on the new context. Preserve full position/target, including pan, on ordinary
   selection and same-scene redraw. Only explicit Focus or an exact linked
   source-placement entry requests centering. Ignore disposed callbacks.
4. Use existing `chartTeal` for photoelectric bodies and instanced thumbnails,
   with a visible labeled legend. Preserve selection/reported-evidence priority.
   Make conveyor rails six percent of the smaller belt dimension, inset within
   the footprint; shrink support width only when its former 0.7 units exceed
   twelve percent. No component coordinates or source records change.
5. Add independent camera/lifecycle tests and focused geometry, authoring,
   fallback and filter regressions. Complete web/build/type/design/contract and
   browser gates; inspect the actual installed model at desktop/narrow sizes in
   both appearances. Rebuild only local web, preserving database/private models.
6. Synchronize operator/identity guidance, item/backlog and this execution.
   Create logical local commits; no merge, push or hosted deployment is inferred.

Read ARCHITECTURE, the shared workflow, Accepted ADR-0032/0037, ADR-0008 and the
visual identity. This extends existing adapters and semantic tokens, with no new
architectural pattern. Tracking owned its shared controls; geometry owned renderer
geometry/color until root handoff; root owned Locator composition/camera integration
and localization. An independent slice owned the new lifecycle suite and read-only
installed review. Shared builds and temporary filenames were coordinated.

## Validation

Use Node `24.21.0` through its installed PATH prefix.

| Gate | Evidence |
| --- | --- |
| `npm test --workspace @iop/web` | 41 suites, 231 tests passed. |
| `npm run test:e2e --workspace @iop/web` | All 61 tests passed; includes four new desktop/narrow light/dark Actions query/pagination cases. |
| `npm run build --workspace @iop/web` | Four design checks, TypeScript and production Vite build passed. |
| `npm run typecheck --workspace @iop/web` | Passed independently. |
| `npm run contract:check --workspace @iop/web` | Browser contract matches the API artifact. |
| Geometry regressions | Nine tests cover both palettes, emphasis precedence, narrow/minimum footprints and existing rotated thumbnail matrices. |
| Independent lifecycle suite | Eight tests cover full off-center snapshots, redraw/context transitions, current callbacks, disposal, explicit focus deduplication, guide fallback and read-only workspace navigation. |
| Actions visual inspection | Reviewed all four screenshots at 1440/390 widths in light/dark. Native Enter/Escape, combined queries and opaque load-more/reset behavior passed. |
| Installed Locator | 30 checks and eight screenshots passed on the final healthy Docker web at port 8080. |
| Repository closure | Whitespace and relative Markdown links checked; API/domain/database source was unchanged, so API/database suites were not repeated for this visual follow-up. |
| `npm run check:secrets` | Reports an existing `credential-url` rejection fixture in `apps/api/test/integration-readiness.spec.ts`; its blob is identical on HEAD and origin/develop (`9a99b78f`). No newly introduced credential finding was reported. |

Actual installed WebGL view matrices were identical for overview Top plus two zoom
steps into BV, and for BV wheel zoom/right-drag pan followed by ordinary selection
(maximum delta `0`, tolerance `0.0001`). Explicit Focus changed the matrix. The
private browser runner recovered the view from the unique GridHelper model-view
upload and removed its known model translation because the direct view uniform was
optimized out. No product debug API or implementation instrumentation was added.

Normal overview/area navigation produced zero reference HTTP attempts and zero
guide images. Only authorized Edit model toggles fetched references. Team Leader
and Task Force layout previews hid editing/guide controls and fetched no references;
these are presentation checks, with existing account/API authority unchanged.
Desktop `1440 × 1000` and narrow `390 × 844` light/dark views had no horizontal
overflow. Inspected screenshots confirm the teal legend and thin conveyor rails.
There were zero runtime errors, failed API responses or domain mutation attempts.
The runner denied unlisted non-GET API routes; no draft was saved. This UI review
did not repeat persisted source-data hashes/counts from the initial execution.

Private evidence: `/private/tmp/iop-211-visual-review/run-2026-10-15T01-02-22-795Z/`
contains `report.json` and eight screenshots; its directories use mode `0700` and
files use `0600`. Actions screenshots are ignored local test artifacts under
`apps/web/test-results/IOP-211-actions-filters-*`. No private source images, sessions
or derived plant data enter Git or the public bundle.

## Outcome and limits

All six explicit visual/navigation requests are complete in the local browser.
Implementation commits are `6399967` (Actions controls) and `27a406f` (Locator).
Current guides document editing/guide controls, camera continuity, color meaning
and filter behavior. Measured common plant registration, exact surveyed sensor
positions and unknown canonical links remain the manual inputs from the original
item. The follow-up neither invents them nor changes persisted source geometry.
Review branch and develop publication require the owner's explicit approval.
The existing secret-hygiene fixture finding remains outside this visual follow-up.

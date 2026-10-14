# IOP-206 — 3D Asset Locator execution

## Branch and scope

Completed module implementation slice on `feature/IOP-206-3d-asset-locator`, isolated worktree
`/private/tmp/iop-206`, from develop `24b6269`.
See [item](../items/IOP-206-3d-asset-locator.md) and owner-delegated
[ADR-0037](../../architecture/adr/ADR-0037-operational-completion.md).
Root integration owns shared host composition/navigation, permission catalogs,
package manifests, generated bindings, backlog and architecture summaries.

## Files and steps

1. Create inward-dependent Locator domain/application, PostgreSQL and private file
   adapters, migration, inbound controller/contracts and source-owned Assets lookups.
2. Add safe offline ZIP import into ignored private local storage, preserving original
   filenames and hashes; create reference scene metadata through authorized bootstrap.
3. Add browser use cases/HTTP adapter, Three.js adapter and editable React workspace,
   with dedicated German resources in `apps/web/src/localization/locator-de.ts`.
   Preserve semantic identity tokens and accessible camera/component controls.
4. Verify authorization, scope, optimistic revisions, references, search/unplaced,
   schema RLS and component validation; run focused API/web tests and type checks.
5. Record evidence and commit only owned files. Exact plant surveying remains pending.

## Validation

API `npm test` (focused Locator and architecture tests), API/web typecheck,
web identity guard, meaningful scene/search tests, and actual PostgreSQL migration/
RLS checks where the local database is available. Root performs full integrated
suite/build and browser rendering after wiring. Third-party APIs checked against
[Three.js renderer documentation](https://threejs.org/docs/pages/WebGLRenderer.html)
and [OrbitControls](https://threejs.org/docs/pages/OrbitControls.html).

## Source inspection

ZIP has 72 PNGs: 71 equipment schematics and a legend; one additional entry is an
empty directory. Halle B Sky 20, Hallle A T1 12, T2 17 and T3 22 equipment views.
Mixed drawings contain independent cross sections; no automatic physical scale,
height, global layout or live equipment state is inferred. Source files stay private.
All dependency stories read are already English; no translation-only edits needed.

## Implemented private reference increment

Safe import copied all 72 PNGs into root ignored local storage. Private trace data
contains 80 provisional components across three visually reviewed schematics
(Anbindung Bin-Interface, Bereich B8701, BV), including five labelled scanner
references. No canonical asset, surveyed elevation, global transform or live state
is inferred. Source-specific trace geometry is never committed.

## Evidence — 2026-10-14

- API complete `npm test --workspace @iop/api`: 434 tests / 33 suites passed.
  The first sandboxed attempt denied temporary HTTP sockets; the permitted rerun
  passed. Focused Locator plus architecture: 32 tests / 4 suites passed.
- API/web type checks passed. Web Locator, geometry, design and localization:
  11 tests / 4 suites passed. Shared German dictionary composition was temporary
  for validation and restored; root integration adds the committed spread.
- Real PostgreSQL suite: 4 tests passed using an isolated disposable container.
  Verified current role/grant denial, forced RLS, immutable revision/placement
  history, concurrent conflict handling and foreign asset rejection/atomicity.
  Root permission/provision source files were copied temporarily for this test
  and restored before the module commit.
- Secret hygiene passed; source images and trace geometry remain ignored.
- Three.js dependency/version, root composition, generated contracts and real
  desktop/narrow visual QA remain root-owned integration. No hosted publication,
  merge or push occurred in this module slice.

## Delivered behavior and limits

True 3D area/reference rendering, 3D uncalibrated area tiles, reusable primitives,
raycast selection/placement, two-endpoint conveyor tracing, accessible controls
and list fallback, explicit asset links, current-source evidence, bounded searches
and unplaced states are implemented. Scenes use optimistic revisions; private
files are scope/hash validated and never served publicly. Version changes cannot
silently reuse old geometry on another reference. The item remains In progress
until shared host integration and actual browser verification finish; parent
plant survey work remains open after that implementation increment.

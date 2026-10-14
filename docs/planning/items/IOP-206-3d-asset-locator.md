# IOP-206 — Reusable 3D Asset Locator

## Status

Completed local software increment — shared host integration and actual browser
verification passed. Exact plant calibration and sensor identity/position inputs
remain open under the original operational placement outcomes.

## Scope

Deliver a usable scoped 3D locator with reusable conveyor/sensor components,
versioned editable scenes, explicit canonical asset links, authorized reported
problem references, private source diagrams, search and unplaced results.
The owner delegates architectural decisions under [ADR-0037](../../architecture/adr/ADR-0037-operational-completion.md).
Administrator, Team Leader and Task Force have explicit Locator access; current
profile and grants are checked independently. Synthetic demonstration geometry
and schematic source geometry remain visibly provisional.

## Acceptance

- [x] Durable scenes and revisions support conflict-safe component editing.
- [x] Real 3D rendering supports camera controls, selection and an accessible list fallback.
- [x] Private PNG references are imported with scope/provenance and require current authorization.
- [x] Canonical links, source-authorized problem references, search and unplaced states are explicit.
- [x] Reusable generic components and source schematic readiness remain distinct from surveyed positions.
- [x] Tests and operational instructions record actual evidence.

## Pending plant information

Metric dimensions, floor/elevation references, global alignment, canonical identity
mapping and exact surveyed sensor positions remain pending. WinCC screenshots
are historical reference schematics and cannot establish current equipment health.
The 71 equipment diagrams and legend are private data, never repository assets.

## Dependencies

[IOP-194](IOP-194-maintenance-asset-history.md), [IOP-076](IOP-076-map-model.md),
[IOP-077](IOP-077-map-upload.md), [IOP-078](IOP-078-normalized-map-coordinates.md),
[IOP-079](IOP-079-asset-placement.md), [IOP-080](IOP-080-asset-locator-ui.md),
[IOP-081](IOP-081-locator-search.md), [IOP-082](IOP-082-ambiguous-assets.md),
[IOP-083](IOP-083-unmapped-assets.md).

## Validation and remaining integration

API suite: 434 tests passed. Focused Locator/architecture: 32 tests passed.
Web Locator/identity/localization: 11 tests passed. Real PostgreSQL Locator suite:
4 tests passed. API/web type checks passed. See the
[completed module execution](../completed/IOP-206-3d-asset-locator-plan.md) and
[operator guide](../../development/asset-locator.md).
IOP-203 integrates shared host navigation/composition, current permission migration,
dependency manifests, German resources, generated contract bindings and private
read-only reference storage. Actual local WebGL2 renders the supplied BV tracing
in light/dark appearance; 390px shows no horizontal overflow or page errors.
See the completed plan for exact integration evidence. Exact plant surveying and
canonical source-to-sensor identification remain open under IOP-079/081.

# IOP-211 — Locator equipment models and administrator-owned editing

## Status and request

Completed locally. Owner publication approval remains pending. The owner requests broader provisional 3D modelling from the supplied
private Bereich schematics, correct motor/photoelectric-sensor identities, stricter
administrator-owned Assets/editing, reader-only operational navigation, aligned
area controls and a clear integrated Handover entry point. This supersedes the
broader editing grants delivered by IOP-203/206/209, without changing their history.

The supplied illustration identifies green/black circles as motors and bars
between conveyor motors as photoelectric sensors (Lichtschranken). Alarm text such
as `Lichtschranke zu lange belegt` is classification evidence, not physical identity
or a surveyed coordinate. Existing identities must be reused where explicitly
linked; do not create duplicate registry assets from image symbols or alarm words.

## Acceptance

- [x] Advance all safely interpretable private area scenes, retain source/evidence
  and give motors, sensors and conveyors independent stable component identities
  that the administrator can label and explicitly link to registered equipment.
- [x] Keep generated geometry, unknown labels/links, scale/elevation and uncertain
  symbols visibly provisional. Preserve manual scene edits and original images.
- [x] Only Administrator can open Assets/Asset management or create/change registry,
  models, mapping decisions and Locator scenes/placements. Direct APIs must enforce
  the current profile even with stale/forged grants.
- [x] Administrator, Team Leader and Task Force can locate reported faults and
  navigate exact linked components. The latter two have no editing controls or
  mutation authority; Technician/maintenance expansion remains out of scope.
- [x] An administrator can add an equipment identifier for a new installation and
  place/link it in Locator; existing installations retain their registered IDs.
- [x] Add safe source-backed photoelectric-sensor classification support without
  automatic physical mapping or overwriting operator classifications.
- [x] Match Area/location to the existing Department/Halle compact control style.
  Present formal shift records within Shift Handover and explain the difference
  between current journal issues and immutable transfer/acknowledgement evidence.
- [x] Verify current role denial, scoped read-only references, persistence, actual
  source geometry, desktop/narrow presentation and relevant regression behavior.

## Boundaries and evidence

[Execution](../completed/IOP-211-locator-models-and-access-plan.md). Reuse Accepted
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md),
[ADR-0037](../../architecture/adr/ADR-0037-operational-completion.md) and
[ADR-0039](../../architecture/adr/ADR-0039-asset-domain-enrichment.md) with the owner's
explicit access refinement. Source diagrams and derived traces remain private.
No measured plant registration, live provider feed, technician rollout, production
reset or remote publication is authorized by this development request.

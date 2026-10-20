# IOP-219 — Private editing references and accurate Locator curves

## Status and goal

In progress. Local integration is authorized; the independent increment is validated.
The owner's 2026-10-20 request restricts WinCC reference images to
Administrator model editing and improves the curved geometry in existing 3D models.

## Scope and acceptance

- [x] Operational scene viewing displays only 3D geometry, including for an
  Administrator outside configuration and when WebGL is unavailable.
- [x] Private reference image delivery and provenance require a current
  Administrator with the scoped management grant; existing authorized users retain
  model viewing with the correct scene proportions.
- [x] Curved conveyor geometry respects component dimensions, placement and
  rotation, with smooth bends and verified joins against the supplied private models.
- [x] Verify API denial, viewer/editor transitions, fallback privacy and geometry;
  record evidence, update the operator guide and commit the bounded increment.
- [ ] Resolve the unmerged IOP-211 dependency and apply the prepared corrections
  to compatible durable scene revisions without losing generated components.

Reuse [IOP-206](IOP-206-3d-asset-locator.md), the Administrator restrictions from
[IOP-215](IOP-215-operational-refinements.md) and
[IOP-217](IOP-217-admin-configuration-demos.md), and Accepted ADR-0032/0037.
Reference images and customer trace coordinates remain private. No surveyed
dimensions, new roles, provider access, publication or deployment are implied.

## Evidence

[Validated increment](../completed/IOP-219-locator-reference-curves-plan.md).
[Pending integration](../active/IOP-219-locator-integration-plan.md).

The active installation contains Motor/Photoelectric sensor components from
`feature/IOP-211-locator-models-and-access`. The owner authorized local integration
of the pending work into develop on 2026-10-20. Push and service activation remain
outside that request. Three
conflict-checked revision payloads are retained privately, preserving all 422
other components in the affected scenes and all 69 other scenes.

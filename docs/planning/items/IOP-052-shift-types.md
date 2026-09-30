# IOP-052 — Shift type configuration

## Status

Completed — implemented and validated through IOP-184.

## Scope and authorization

M6 — Workforce & Shift Management. Expected outcome: Shift names configurable by site.
The owner authorized the full M6 implementation on 2026-09-30 through
[IOP-184](IOP-184-m6-workforce.md), including local commits without intermediate
confirmation. This replaces the earlier documentation-only proposal.

## Delivered behavior

Administrators configure stable shift IDs, names, local start/end times and active weekdays. The initial early, late and middle shifts use the owner’s supplied times.

Teams, shifts and assignment rules remain generic. Current Halle names and
Springer wording belong to site configuration/presentation, outside the core.
See the canonical [product contract](../../product/workforce.md) and
[implementation/import guide](../../development/workforce.md).

## Acceptance and evidence

- [x] Shift names configurable by site.
- [x] Scoped server authorization, site-time semantics and relevant conflicts are implemented.
- [x] Final validation and synchronized documentation are recorded in the
  [M6 execution plan](../completed/IOP-184-m6-workforce-plan.md).

## Dependencies and boundaries

[IOP-026](IOP-026-site-model.md), [IOP-008](IOP-008-time-and-timezone-model.md)

This delivery uses existing scoped identities and Accepted ADR-0014, ADR-0016,
ADR-0032 and ADR-0036 patterns; it does not accept Proposed decisions or complete
broader dependency stories by inference. Corporate connectivity, payroll,
automatic roster optimization and inference of partial absences remain outside
this increment. Owner acceptance of the operational product remains a review step.

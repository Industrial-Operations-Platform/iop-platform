# IOP-128 — Demo reset

## Status

Completed — selected local POC slice, delivered and verified under IOP-147 on
2026-09-27. Broader deferred platform capabilities are not included.

## Delivered outcome

Offline exact-target reset is implemented with a private installation marker, current schema checks, exclusive maintenance access, no runtime connections, forced scoped policies and atomic quota reconciliation. Real tests cover wrong targets, active/reconnecting hosts, rollback at each cleanup stage, lost commit acknowledgement, foreign-data preservation and real reimport.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Reset only a verified demo environment and explicit scoped dataset. Include a refusal
  check outside that target. No workforce, maintenance or physical asset fixtures are
  prerequisites.

## Acceptance criteria

- [x] Recreate only the dedicated analytical demo dataset.
- [x] Validate the slice-specific outcomes and limitations in Requirements.
- [x] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Scope, dependencies and constraints

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this selected slice. Preserve generic module ownership, configured source
labels, exact aggregate grain, current permissions and forced scoped RLS. No live
industrial writes, customer-specific core logic or production/shared-use claim.

Required contracts/slices: [IOP-123](IOP-123-demo-organization.md), [IOP-125](IOP-125-demo-events.md).

Canonical specifications:

- [scope-poc](../../product/scope-poc.md)
- [ADR-0029-scoped-demo-reset](../../architecture/adr/ADR-0029-scoped-demo-reset.md)

## Validation and traceability

[IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) records actual commands, results and limitations.
The [operator guide](../../development/running-poc.md) describes the delivered flow.

Prior design, internal or preview evidence (historical):

- [IOP-128-demo-reset-plan](../completed/IOP-128-demo-reset-plan.md)

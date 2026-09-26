# IOP-049 — Source aliases/mappings

## Status

Completed — selected local POC slice, delivered and verified under IOP-147 on
2026-09-27. Broader deferred platform capabilities are not included.

## Delivered outcome

The configured mapping snapshot is frozen into facts. Unknown areas remain included as unclassified. A real persisted two-revision scenario proves that changed mappings affect only future imports; prior owner membership reconciliation remains in its original record.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Preserve the evidenced area-to-sector classification, unclassified records and mapping
  revision. No physical asset alias dependency. IOP-037 is relevant only to a future
  surveyed-asset mapping slice.
- Keep sector names and area assignments editable in scoped local configuration;
  retain stable sector keys and use a new revision for changes to future imports.

## Acceptance criteria

- [x] Map source area and sector labels through scoped configuration (pure internal stage).
- [x] Validate the slice-specific outcomes and limitations in Requirements, including
  reconciliation against the actual owner lists and persisted import handoff.
- [x] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Scope, dependencies and constraints

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this selected slice. Preserve generic module ownership, configured source
labels, exact aggregate grain, current permissions and forced scoped RLS. No live
industrial writes, customer-specific core logic or production/shared-use claim.

Required contracts/slices: [IOP-012](IOP-012-source-integration-contract.md), [IOP-043](IOP-043-canonical-event-model.md).

Canonical specifications:

- [scope-poc](../../product/scope-poc.md)
- [csv-and-reporting-reference](../../product/csv-and-reporting-reference.md)

## Validation and traceability

[IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) records actual commands, results and limitations.
The [operator guide](../../development/running-poc.md) describes the delivered flow.

Prior design, internal or preview evidence (historical):

- [IOP-049-source-mappings-plan](../completed/IOP-049-source-mappings-plan.md)
- [IOP-049-editable-mappings-plan](../completed/IOP-049-editable-mappings-plan.md)

# IOP-089 — Analytics query layer

## Status

Completed — selected local POC slice, delivered and verified under IOP-147 on
2026-09-27. Broader deferred platform capabilities are not included.

## Delivered outcome

OIP owns immutable publications/facts and one-statement analytical snapshots. Scoped dimension references, source revisions, validated cursors, exact totals, bounded groups/options and contributing records are implemented behind current permission checks.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Use the aggregate and configured-label slices. Share metric/filter semantics between
  overview and detail; preserve scope before aggregation. No generic analytics engine,
  materialized projection platform or physical asset dependency.

## Acceptance criteria

- [x] Query verified frequency and duration independently of UI.
- [x] Validate the slice-specific outcomes and limitations in Requirements.
- [x] Record design evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Scope, dependencies and constraints

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this selected slice. Preserve generic module ownership, configured source
labels, exact aggregate grain, current permissions and forced scoped RLS. No live
industrial writes, customer-specific core logic or production/shared-use claim.

Required contracts/slices: [IOP-043](IOP-043-canonical-event-model.md), [IOP-048](IOP-048-data-reconciliation.md), [IOP-049](IOP-049-source-mappings.md).

Canonical specifications:

- [scope-poc](../../product/scope-poc.md)
- [analytics-query-poc](../../architecture/analytics-query-poc.md)
- [ADR-0028-poc-analytics-query-consistency](../../architecture/adr/ADR-0028-poc-analytics-query-consistency.md)

## Validation and traceability

[IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) records actual commands, results and limitations.
The [operator guide](../../development/running-poc.md) describes the delivered flow.

Prior design, internal or preview evidence (historical):

- [IOP-089-analytics-query-layer-plan](../completed/IOP-089-analytics-query-layer-plan.md)

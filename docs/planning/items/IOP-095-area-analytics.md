# IOP-095 — Area analytics

## Status

Completed — selected local POC slice, delivered and verified under IOP-147 on
2026-09-27. Broader deferred platform capabilities are not included.

## Delivered outcome

Exact source-area and frozen sector partitions reconcile to both measures. Actual unclassified records remain distinct from a mapped sector literally named Unclassified; historical mapping changes preserve original classification and source-area identity.

## Requirements

- Deliver only the POC comparison defined in the [specification](../../product/area-analytics-poc.md).
- Partition by exact scoped source area and frozen configured sector membership;
  retain unclassified areas, repeated lines and matching zero measures.
- Preserve canonical selection, admitted revision, units and coverage between
  overview, groups and contributing records; never sum a page as the full result.
- OIP is an IOP module; metrics remain decoupled from the UI and WinCC schemas.

## Acceptance criteria

- [x] Runtime area/sector groups and contributing records reconcile to both measures.
- [x] Shared filters, drill-down/return, coverage, zero/empty states and relevant
  access denial are validated through the delivered path.
- [x] The plan documents scenarios and necessary decisions without expanding scope.
- [x] Specification evidence exists and documentation is synchronized; runtime
  acceptance is recorded under IOP-147.

## Scope, dependencies and constraints

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this selected slice. Preserve generic module ownership, configured source
labels, exact aggregate grain, current permissions and forced scoped RLS. No live
industrial writes, customer-specific core logic or production/shared-use claim.

Required contracts/slices: [IOP-090](IOP-090-event-frequency.md), [IOP-091](IOP-091-downtime.md), [IOP-026](IOP-026-site-model.md), [IOP-089](IOP-089-analytics-query-layer.md).

Canonical specifications:

- [area-analytics-poc](../../product/area-analytics-poc.md)
- [scope-poc](../../product/scope-poc.md)
- [csv-and-reporting-reference](../../product/csv-and-reporting-reference.md)

## Validation and traceability

[IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) records actual commands, results and limitations.
The [operator guide](../../development/running-poc.md) describes the delivered flow.

Prior design, internal or preview evidence (historical):

- [IOP-095-area-analytics-plan](../completed/IOP-095-area-analytics-plan.md)

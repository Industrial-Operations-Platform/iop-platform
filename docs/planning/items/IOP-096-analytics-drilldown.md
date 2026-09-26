# IOP-096 — Analytical drill-down

## Status

Completed — selected local POC slice, delivered and verified under IOP-147 on
2026-09-27. Broader deferred platform capabilities are not included.

## Delivered outcome

Connected overview/detail navigation drills through sector, area, equipment and message while preserving restrictions; return restores the prior selection. Detail exposes import/RAW/physical-line provenance and paged contributing records.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Retain filters through sector, area, source equipment and message/detail navigation.
  Show scope, date/coverage and provenance. KPI-to-physical-asset navigation is
  deferred; aggregate rows are not individual occurrences.

## Acceptance criteria

- [x] Drill down from overview to contributing aggregate records.
- [x] Validate the slice-specific outcomes and limitations in Requirements.
- [x] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Scope, dependencies and constraints

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this selected slice. Preserve generic module ownership, configured source
labels, exact aggregate grain, current permissions and forced scoped RLS. No live
industrial writes, customer-specific core logic or production/shared-use claim.

Required contracts/slices: [IOP-094](IOP-094-asset-analytics.md), [IOP-095](IOP-095-area-analytics.md), [IOP-097](IOP-097-analytics-filters.md).

Canonical specifications:

- [scope-poc](../../product/scope-poc.md)
- [csv-and-reporting-reference](../../product/csv-and-reporting-reference.md)

## Validation and traceability

[IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) records actual commands, results and limitations.
The [operator guide](../../development/running-poc.md) describes the delivered flow.

Prior design, internal or preview evidence (historical):

- [IOP-096-fixture-drilldown-plan](../completed/IOP-096-fixture-drilldown-plan.md)
- [IOP-096-analytics-drilldown-plan](../completed/IOP-096-analytics-drilldown-plan.md)

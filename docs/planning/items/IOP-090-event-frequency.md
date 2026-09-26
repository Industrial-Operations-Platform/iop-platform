# IOP-090 — Event frequency KPI

## Status

Completed — selected local POC slice, delivered and verified under IOP-147 on
2026-09-27. Broader deferred platform capabilities are not included.

## Delivered outcome

Runtime frequency totals reconcile to the independent oracle and every contributing page. Actual zero records, no imports, incompatible filters, duplicate rejection, revision changes and the safe-integer boundary are exercised.

## Acceptance criteria

- [x] Runtime frequency totals and contributing records reconcile against the independent oracle.
- [x] Overview and detail preserve shared filters, coverage and revision; access denial,
  zero/empty states, duplicates and exact integer boundaries are validated.
- [x] The plan documents scenarios and required decisions without expanding scope.
- [x] Specification validation evidence and documentation are synchronized; runtime
  evidence is recorded under IOP-147.

## Scope, dependencies and constraints

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this selected slice. Preserve generic module ownership, configured source
labels, exact aggregate grain, current permissions and forced scoped RLS. No live
industrial writes, customer-specific core logic or production/shared-use claim.

Required contracts/slices: [IOP-089](IOP-089-analytics-query-layer.md).

Canonical specifications:

- [scope-poc](../../product/scope-poc.md)
- [event-frequency-poc](../../product/event-frequency-poc.md)
- [analytics-query-poc](../../architecture/analytics-query-poc.md)
- [csv-and-reporting-reference](../../product/csv-and-reporting-reference.md)

## Validation and traceability

[IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) records actual commands, results and limitations.
The [operator guide](../../development/running-poc.md) describes the delivered flow.

Prior design, internal or preview evidence (historical):

- [IOP-090-event-frequency-plan](../completed/IOP-090-event-frequency-plan.md)

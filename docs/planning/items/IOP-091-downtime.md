# IOP-091 — Accumulated alarm duration (POC)

## Status

Completed — selected local POC slice, delivered and verified under IOP-147 on
2026-09-27. Broader deferred platform capabilities are not included.

## Delivered outcome

Runtime duration uses exact accumulated seconds, reconciled to the source and both views. Unknown windows and missing reporting dates remain explicit. Interval-based plant downtime remains unavailable and outside this selected slice.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- For the supplied aggregate CSV, downtime is unavailable. Verify duration parsing/units
  and reconcile totals. Interval-based downtime is future work requiring source
  evidence; it is not a POC acceptance condition.

## Acceptance criteria

- [x] Report reconciled accumulated alarm duration.
- [x] Validate the slice-specific outcomes and limitations in Requirements.
- [x] Record specification evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Scope, dependencies and constraints

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this selected slice. Preserve generic module ownership, configured source
labels, exact aggregate grain, current permissions and forced scoped RLS. No live
industrial writes, customer-specific core logic or production/shared-use claim.

Required contracts/slices: [IOP-089](IOP-089-analytics-query-layer.md).

Canonical specifications:

- [scope-poc](../../product/scope-poc.md)
- [alarm-duration-poc](../../product/alarm-duration-poc.md)
- [csv-and-reporting-reference](../../product/csv-and-reporting-reference.md)

## Validation and traceability

[IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) records actual commands, results and limitations.
The [operator guide](../../development/running-poc.md) describes the delivered flow.

Prior design, internal or preview evidence (historical):

- [IOP-091-alarm-duration-plan](../completed/IOP-091-alarm-duration-plan.md)

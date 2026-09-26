# IOP-097 — Date/filter model

## Status

Completed — selected local POC slice, delivered and verified under IOP-147 on
2026-09-27. Broader deferred platform capabilities are not included.

## Delivered outcome

Both views consume one shared applied selection and the same backend result. Reporting dates, dimension sets, exclusions, coverage, revisions and pagination are validated against stored facts; browser keyboard filtering and drill-down/return are exercised.

## Requirements

- Preserve one explicit organization/site/source and the applied reporting-date,
  sector, area, source-equipment and message filters across overview and detail.
- Expose message inclusion/exclusion and drill-down restrictions consistently in
  totals, rankings and contributing records; no screenshot-derived default exclusions.
- Keep filename dates as reporting labels with unknown source windows. Do not
  infer occurrences, shifts, 24-hour coverage or downtime from accumulated duration.
- Keep unclassified records in unrestricted totals and distinguish missing imports
  from no matching records. Show metric definitions, units, grain and limitations;
  correlation is not a proven root cause.
- OIP owns analytical semantics independently of the UI and WinCC schemas. Keep
  customer labels and source normalization in scoped configuration/adapters.
- Validate scope, permissions and references before reads. No secrets, plant drawings
  or production data in the repository; industrial integrations remain read-only.
  Record material changes where applicable.

The detailed selection and navigation behavior in ADR-0023 is Accepted.

## Acceptance criteria

- [x] Date/filter contract accepted, including boundaries, empty/invalid selections,
  unclassified values, exclusions and overview/detail navigation.
- [x] Both analytical views apply and display identical filters; full frequency and
  accumulated-duration totals reconcile with contributing records on the same data.
- [x] Executable validation covers expected behavior, errors, coverage and relevant
  access denial without expanding the POC.
- [x] Plan documents scenarios, dependencies and required decisions within scope.
- [x] Design review evidence and story/backlog status synchronized; runtime evidence
  is recorded under IOP-147.

## Scope, dependencies and constraints

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this selected slice. Preserve generic module ownership, configured source
labels, exact aggregate grain, current permissions and forced scoped RLS. No live
industrial writes, customer-specific core logic or production/shared-use claim.

Required contracts/slices: [IOP-008](IOP-008-time-and-timezone-model.md), [IOP-089](IOP-089-analytics-query-layer.md).

Canonical specifications:

- [ADR-0023-poc-analytics-filters](../../architecture/adr/ADR-0023-poc-analytics-filters.md)
- [scope-poc](../../product/scope-poc.md)
- [ADR-0016-time-and-timezone-model](../../architecture/adr/ADR-0016-time-and-timezone-model.md)
- [analytics-query-poc](../../architecture/analytics-query-poc.md)
- [ADR-0018-local-poc-execution-context](../../architecture/adr/ADR-0018-local-poc-execution-context.md)
- [ADR-0011-api-contract-strategy](../../architecture/adr/ADR-0011-api-contract-strategy.md)
- [csv-and-reporting-reference](../../product/csv-and-reporting-reference.md)

## Validation and traceability

[IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) records actual commands, results and limitations.
The [operator guide](../../development/running-poc.md) describes the delivered flow.

Prior design, internal or preview evidence (historical):

- [IOP-097-fixture-filters-plan](../completed/IOP-097-fixture-filters-plan.md)
- [IOP-097-analytics-filters-plan](../completed/IOP-097-analytics-filters-plan.md)

# IOP-097 — Date/filter model

## Status

Blocked — the shared fixture filter preview is implemented; end-to-end delivery
still requires IOP-089's production queries and validated ADR-0018 host activation.
[ADR-0023](../../architecture/adr/ADR-0023-poc-analytics-filters.md) and
IOP-089's ADR-0028/query design are Accepted. See the
[fixture execution record](../completed/IOP-097-fixture-filters-plan.md).

## Milestone and goal

M11 — OIP / Operational Intelligence. Deliver consistent filters for the local
analytical [POC](../../product/scope-poc.md), following the
[delivery map](../poc-delivery.md). Operations staff and accountable leaders need
explainable metrics to prioritize problems.

## Context and current state

The original outline requested consistent date/filter behavior; backlog inclusion
alone did not authorize implementation. The owner now requests this story strictly
within the POC. The web host provides navigation, state previews and an opt-in
fictional shared-filter preview. IOP-089 has accepted design but remains Blocked on production storage and
host activation. IOP-008 supplies accepted temporal design.
See [modules](../../architecture/modules.md) and the [workflow](../workflow.md).

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
- [ ] Both analytical views apply and display identical filters; full frequency and
  accumulated-duration totals reconcile with contributing records on the same data.
- [ ] Executable validation covers expected behavior, errors, coverage and relevant
  access denial without expanding the POC.
- [x] Plan documents scenarios, dependencies and required decisions within scope.
- [x] Design review evidence and story/backlog status synchronized; runtime evidence
  remains required by the unchecked criteria.

## Dependencies and constraints

- [IOP-008](IOP-008-time-and-timezone-model.md): Completed design;
  Accepted [ADR-0016](../../architecture/adr/ADR-0016-time-and-timezone-model.md).
  Source reporting hours remain unknown; this does not block label filtering.
- [IOP-089](IOP-089-analytics-query-layer.md): Blocked with Accepted ADR-0028 and
  [query design](../../architecture/analytics-query-poc.md), including canonical
  references, bounds and coverage/revision metadata. IOP-043 supplies aggregate
  design, IOP-048 internal reconciliation evidence and IOP-049 pure classification;
  production storage and queries remain pending. Broader future scope is not a gate.
- Runtime business access waits for implementation and validation of
  [ADR-0018](../../architecture/adr/ADR-0018-local-poc-execution-context.md), accepted on 2026-09-26.
  Independent fixture-backed UI work need not wait for real business access.

Retain [ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md),
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md) and
[ADR-0011](../../architecture/adr/ADR-0011-api-contract-strategy.md).
Dependencies describe required contracts/capabilities, not numerical execution order.
Proposed decisions are never accepted by inference.

## Non-goals

Adjacent-story implementation, a generic filter/formula engine, saved reports,
exports, physical asset/sensor registry, multi-site analysis, login, live connections
or expansion to the whole milestone. No customer names in core logic.

## Validation and documentation

The [completed documentation plan](../completed/IOP-097-analytics-filters-plan.md) records scope, branch,
files and actual documentation checks. The
[fixture record](../completed/IOP-097-fixture-filters-plan.md) supplies executable
UI evidence for selection, navigation, coverage and fictional totals. Production
query, revision/pagination and negative access cases remain pending; fixture checks
do not establish them.
Update this item, [backlog](../backlog.md) and plan together. Change contracts,
models, guides or other ADRs only when this story changes their content.

## Owner-supplied CSV and reporting context

The screenshots show period, hall/sector, area, equipment and message inclusion/
exclusion filters. Preserve and display active filters consistently across overview,
rankings and drill-down. Date origin is confirmed as `Hitliste-YYYYMMDD.csv`;
customer mappings and exact reporting-window semantics require their owning
contracts. Screenshot exclusions are examples, not generic defaults.

See the [shared evidence](../../product/csv-and-reporting-reference.md), captured
under IOP-002 at the owner's request. It supplies context, not acceptance of metric
formulas. The accepted contract supports reporting-label filtering while keeping
exact source windows unresolved.

## Delivered fixture increment

Both analytical pages offer **Try shared filters with fictional data**. One
page-session selection preserves inclusive reporting dates, dimension sets and
message exclusions, including trips through Import CSV. Apply validates the draft
atomically; Reset restores the latest fixed fixture date. Area drill-down narrows
selection and return restores it. Unclassified records, repeated equipment labels,
missing dates and zero measures remain distinguishable. The five fictional rows
are a UI illustration, independent of imported data and IOP-048's oracle.

This completes the independent fixture UI increment, not the unchecked delivered
analytical/access criteria. No analytical endpoint or production filter engine was
added; API bindings must derive from the future reviewed OpenAPI contract.

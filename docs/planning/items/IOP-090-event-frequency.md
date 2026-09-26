# IOP-090 — Event frequency KPI

## Status

Blocked — the POC metric specification is complete; executable IOP-089 queries,
production OIP storage and ADR-0018 host activation remain pending.

## Milestone

M11 — OIP / Operational Intelligence. Bounded POC delivery slice.

## Goal

Deliver reconciled event frequency totals for the local analytical POC.

## User / business value

Operations staff and accountable leaders need explainable metrics to prioritize problems.

## Context and current state

OIP is an IOP module; metrics remain independent of UI and WinCC schemas.
The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this slice. The [frequency specification](../../product/event-frequency-poc.md)
refines the accepted [query contract](../../architecture/analytics-query-poc.md).
No production frequency query or endpoint is implemented. See the
[specification execution record](../completed/IOP-090-event-frequency-plan.md).

## Desired state and requirements

- Deliver only IOP-090's reconciled frequency measure: exact sum of reported
  occurrences, separate from contributing record count.
- Retain repeated source lines and unclassified records; apply only explicit
  shared filters/exclusions and preserve scope before aggregation.
- Overview and detail reconcile with all contributing records under the same
  selection and admitted data revision, independently of pagination.
- Show units, unknown source windows and missing imports. A rate needs a separately
  defined denominator; overlapping source aggregates do not prove distinct incidents.
- Reject invalid measures and fail overflow explicitly, without rounded or partial totals.

## Acceptance criteria

- [ ] Runtime frequency totals and contributing records reconcile against the independent oracle.
- [ ] Overview and detail preserve shared filters, coverage and revision; access denial,
  zero/empty states, duplicates and exact integer boundaries are validated.
- [x] The plan documents scenarios and required decisions without expanding scope.
- [x] Specification validation evidence and documentation are synchronized; runtime
  evidence remains pending and the story stays open.

## Architecture and security constraints

Follow [ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to take the decision.
Accepted ADR-0023/0028 supply the filter and query semantics; no new architecture
is introduced. See [modules](../../architecture/modules.md) and the
[planning workflow](../workflow.md).

Verify permission and organization/site scope for relevant operations/references.
Keep source schemas and customer labels in adapters/configuration, secrets and
production data outside this change, and industrial integrations read-only.
Record material changes where applicable. Preserve forced RLS and current grants.

## Data, API and UI considerations

Define grain, coverage, units and reporting labels; accumulated alarm duration is
not automatically downtime. Queries retain verified scope and traceability to
contributing records. Show metric definitions and limits; correlation is not
root cause. Use existing query contracts rather than a parallel KPI endpoint.

## Dependencies

[IOP-089](IOP-089-analytics-query-layer.md): design is accepted under ADR-0028,
but queries are not implemented. Its production OIP storage and local runtime
access prerequisites remain pending. Dependency contracts/capabilities, not numeric
story order, gate delivery. Do not implement adjacent stories implicitly.

## Non-goals

Additional metrics, failure rates, targets, ranking engines, formula editors,
login, live integrations, physical assets or broader milestone delivery. Do not
infer acceptance of open decisions or introduce customer names in the core.

## Validation and documentation impact

Use the [frequency matrix](../../product/event-frequency-poc.md) and accepted
query scenarios: expected results, invalid inputs and relevant denial paths.
Record actual commands/results in the plan; specification checks do not prove
runtime behavior. Update this item, its [backlog](../backlog.md) status and plan;
change contracts/models/guides/ADRs only when this slice changes their content.

## Open questions and delivery gates

No new formula decision is needed: ADR-0028 already accepts the exact frequency
sum. Executable query/storage and host delivery block runtime reconciliation.
Unknown reporting windows prohibit rates and full-window claims, not observed sums.

## Owner-supplied CSV and reporting context

Use reported occurrence frequencies rather than counting aggregate rows. Define
source grain, duplicate handling, exclusions and reporting coverage before
reconciling rankings and totals. A failure-rate label requires a separately defined
denominator. See the [shared evidence](../../product/csv-and-reporting-reference.md),
captured under IOP-002. Historical screenshot labels do not add accepted formulas;
this slice follows the subsequently accepted query contract.

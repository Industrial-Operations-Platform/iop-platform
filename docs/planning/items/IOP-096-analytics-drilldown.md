# IOP-096 — Analytical drill-down

## Status

Blocked

The POC dependency review is recorded in the
[execution plan](../active/IOP-096-analytics-drilldown-plan.md). IOP-094/095
contracts are unavailable; IOP-097's filter contract is accepted in ADR-0023,
but analytical filter implementation remains pending.
Runtime access awaits implementation and validation of Accepted ADR-0018.
No drill-down implementation or executed acceptance evidence is claimed.

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M11 — OIP / Operational Intelligence. Proposed delivery slice.

## Goal

Drill down from overview to contributing aggregate records.

## User / business value

Operations staff and managers need explainable metrics to prioritize problems.

## Context

Scope: Operational Intelligence (OIP). See [modules](../../architecture/modules.md) and
the [planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; inclusion in the backlog does not authorize implementation.

## Current state

The web host has overview/detail navigation placeholders. Analytical drill-down
is not implemented. The shared filter design is accepted in
[ADR-0023](../../architecture/adr/ADR-0023-poc-analytics-filters.md); implementation remains pending.

## Desired state

Drill down from overview to contributing aggregate records.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Retain filters through sector, area, source equipment and message/detail navigation.
  Show scope, date/coverage and provenance. KPI-to-physical-asset navigation is
  deferred; aggregate rows are not individual occurrences.

## Acceptance criteria

- [ ] Drill down from overview to contributing aggregate records.
- [ ] Validate the slice-specific outcomes and limitations in Requirements.
- [ ] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Domain considerations

OIP is an IOP module; metrics remain decoupled from the UI and WinCC schemas.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt the decision.

## Security considerations

Verify permissions and customer/site scope for relevant operations and references.
Do not include secrets, plant drawings or production data in the repository. Keep
industrial integrations read-only; record material changes where applicable.

## Data considerations

Define grain, coverage, units and periods; accumulated alarm duration does not automatically equal downtime.

## API considerations

Queries require verified scope filters and traceability to contributing records.

## UI considerations

Show metric definitions and limitations; do not present correlation as root cause.

## Dependencies

[IOP-094](IOP-094-asset-analytics.md), [IOP-095](IOP-095-area-analytics.md), [IOP-097](IOP-097-analytics-filters.md).

Dependencies require only their relevant POC contracts/slices, not completion of
all future parent capabilities. Runtime business access also requires implementation and validation of the local
execution-context mechanism accepted in ADR-0018 on 2026-09-26.

## Non-goals

Implementing adjacent tasks, inferring acceptance of open decisions or expanding delivery to the entire milestone. Do not introduce customer names into the core.

## Validation

The plan must specify executable commands and scenarios for the acceptance criteria using the accepted tooling. Include the expected path, errors and relevant access denial; record actual results, not fictional tests.

### Bounded POC acceptance scenarios

These scenarios refine the existing requirements alongside the accepted IOP-097 contract.
They are expected evidence for implementation, not results of executed tests.

| Scenario | Required evidence |
| --- | --- |
| Overview → configured sector → area → source equipment → message/detail | Every step shows the active scope, reporting dates and filters, with contributing aggregate records at the end. |
| Navigate with a message exclusion or existing dimension restriction | Dates and applicable filters remain visible and consistent; no silent broadening. Exact state transitions follow the accepted IOP-097 contract. |
| Return to overview/detail | Verify selection behavior against IOP-097 and reconcile both measures for the same selection and admitted data. |
| Inspect contributors | Trace aggregate records to source/import and original row provenance; show reported frequency and accumulated alarm duration with units. Do not expand them into individual occurrences. |
| Unclassified sector or repeated equipment designation | Unclassified records remain in all-data reconciliation; source-scoped labels do not imply a unique physical asset or sensor. |
| Missing reporting date versus a filtered result with no matches | Display coverage and empty states distinctly. Do not turn a missing import into zero faults or infer a full-day source window. |
| Paginated contributors | Reconcile across all contributing pages; displayed subsets must not redefine the analytical total. |
| Loading, failed read or changed selection | Do not present stale records/totals as evidence for a new selection; preserve visible context and provide a recoverable state. |
| Missing/foreign scope, source or record reference; absent permission | Reject access without broadening the query or revealing foreign records; verify application checks and RLS when runtime access is delivered. |

Physical maps, surveyed assets, verified sensor discovery, root-cause claims,
exports, login and extra metric formulas remain outside this POC slice.

## Documentation impact

Update this item, its [backlog](../backlog.md) status and the execution plan.
Update contracts, models, guides or ADRs only if this task changes their content.

## Open questions

Confirm the approved contract, edge cases and exact evidence for this slice before starting implementation.

## Owner-supplied CSV and reporting context

The requested path is overview → configured hall/sector → area → equipment → fault message or verified sensor identity. Retain scope, period and filters and expose contributing aggregate records. A collective fault is not a proven root cause. Physical maps, coordinates, plant surveying and 3D remain deferred.

See the [shared evidence](../../product/csv-and-reporting-reference.md), captured
under IOP-002 at the owner's request. This is context for future planning; this
item remains unimplemented and no metric formula is accepted by this evidence.

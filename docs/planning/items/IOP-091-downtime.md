# IOP-091 — Accumulated alarm duration (POC)

## Status

Blocked — duration specification complete; executable IOP-089 queries, production
OIP receiving storage and ADR-0018 host activation remain pending.

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M11 — OIP / Operational Intelligence. Bounded POC duration slice.

## Goal

Report reconciled accumulated alarm duration.

## User / business value

Operations staff and accountable leaders need explainable metrics to prioritize problems.

## Context

Scope: Operational Intelligence (OIP). See [modules](../../architecture/modules.md) and
the [planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; inclusion in the backlog does not authorize implementation.

## Current state

The [duration definition and reconciliation matrix](../../product/alarm-duration-poc.md)
specialize the accepted IOP-089 query and aggregate contracts. The specification
slice is complete; no executable duration query or persisted overview/detail
reconciliation is delivered. See the [execution record](../completed/IOP-091-alarm-duration-plan.md).

## Desired state

Report reconciled accumulated alarm duration.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- For the supplied aggregate CSV, downtime is unavailable. Verify duration parsing/units
  and reconcile totals. Interval-based downtime is future work requiring source
  evidence; it is not a POC acceptance condition.

## Acceptance criteria

- [ ] Report reconciled accumulated alarm duration.
- [ ] Validate the slice-specific outcomes and limitations in Requirements.
- [x] Record specification evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Domain considerations

OIP is an IOP module; metrics remain independent of the UI and WinCC schemas.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to make the decision.

## Security considerations

Verify permission and customer/site scope for relevant operations and references.
Do not include secrets, plant drawings or production data in the repository. Keep
industrial integrations read-only; record material changes where applicable.

## Data considerations

Define grain, coverage, units and periods; accumulated alarm duration does not automatically equal downtime.

## API considerations

Queries use verified scope filters and traceability to contributing records.

## UI considerations

Show metric definitions and limitations; do not present correlation as root cause.

## Dependencies

[IOP-089](IOP-089-analytics-query-layer.md).

Dependencies require only their relevant POC contracts/slices, not completion of
all future parent capabilities. IOP-089 has an accepted query contract under
ADR-0028 but no executable queries; production receiving storage remains pending.
ADR-0018 is Accepted as of 2026-09-26; its implementation and validation still
independently gate runtime business access.

## Non-goals

Implementing adjacent tasks, inferring acceptance of open decisions or extending delivery to the entire milestone. Do not introduce customer names into the core.

## Validation

The plan must specify executable commands and scenarios using accepted tooling. Include the expected path, errors and relevant access denial; record actual results, not fictitious tests.

## Documentation impact

Update this item, its [backlog](../backlog.md) status and the execution plan.
Update contracts, models, guides or ADRs only if this task changes their content.

## Open questions

The formula and units follow the accepted source/aggregate/query contracts.
Runtime delivery waits for executable IOP-089, production OIP receiving storage
and ADR-0018 host activation. Interval-based downtime needs separate source
evidence and remains outside this POC.

## Owner-supplied CSV and reporting context

The current export supplies accumulated duration without individual event intervals. Separate accumulated alarm duration from elapsed plant downtime; overlapping alarms cannot be deduplicated into downtime from this excerpt alone. Verify duration units and parsing, and label charts honestly.

See the [shared evidence](../../product/csv-and-reporting-reference.md), captured
under IOP-002 at the owner's request. The current definition follows accepted
contracts; the retained CSV does not establish individual intervals or downtime.
No runtime metric implementation is claimed.

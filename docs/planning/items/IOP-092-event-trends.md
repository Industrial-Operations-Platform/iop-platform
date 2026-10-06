# IOP-092 — Trend analysis

## Status

Completed — day/week/month reporting delivered under IOP-148, reconciled on 2026-10-06.

## Milestone

M11 — OIP / Operational Intelligence. Delivered local slice.

## Goal

Trend analysis. Expected outcome: Day/week/month.

## User / business value

Operations staff and decision makers need explainable metrics to prioritize problems.

## Context

Scope: Operational Intelligence (OIP). See [modules](../../architecture/modules.md)
and the [planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; backlog presence does not authorize implementation.

## Current state

IOP-148 delivers validated day/week/month selection, server-owned exact period
aggregation and connected charts. IOP-153/160/161 add monthly comparison and
interactive trend controls. Source dates remain reporting labels with unknown windows.

## Desired state

Day/week/month.

## Requirements

- Deliver only the outcome described for IOP-092.
- OIP is an IOP module; metrics remain independent of UI and WinCC source schemas.

## Acceptance criteria

- [x] Day/week/month.
- [x] The plan records necessary scenarios and decisions without expanding scope.
- [x] Validation evidence and synchronized documentation exist.

## Domain considerations

OIP is an IOP module; metrics remain independent of UI and WinCC source schemas.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to make the decision.

## Security considerations

Verify customer/site permissions and scope for relevant operations and references.
Do not commit secrets, floor plans or production data. Keep industrial integrations
read-only; record material changes where applicable.

## Data considerations

Define grain, coverage, units and periods; accumulated alarm duration does not
automatically represent downtime.

## API considerations

Queries need verified scope filters and traceability to contributing records.

## UI considerations

Show metric definitions and limitations; do not present correlation as root cause.

## Dependencies

[IOP-089](IOP-089-analytics-query-layer.md), [IOP-008](IOP-008-time-and-timezone-model.md)

Dependencies identify required contracts/capabilities, not numerical implementation
order. Refine them in the plan before editing code.

## Non-goals

Do not implement adjacent tasks, infer acceptance of open decisions or extend
delivery to the whole milestone. Do not introduce customer names into the core.

## Validation

The plan must specify executable commands and scenarios using accepted tooling.
Cover expected behavior, errors and relevant access denials. Record actual results,
not invented tests.

## Documentation impact

Update this item, its [backlog](../backlog.md) status and execution plan. Update
contracts, model, guides or ADRs only when their content changes for this task.

## Open questions

None for the delivered original outcome. Broader parent capabilities remain
separately scoped and require an explicit selection before implementation.

## Owner-supplied CSV and reporting context

The screenshots show daily trends and month comparisons, but the supplied CSV has no
date field. The loader obtains a date from `Hitliste-YYYYMMDD.csv` and assigns it to all
rows. Resolve the represented reporting window and comparable coverage before
implementing trend calculations. Missing imports must not appear as zero incidents;
targets and improvement formulas remain unvalidated.

See the [shared evidence](../../product/csv-and-reporting-reference.md), captured
under IOP-002 at the owner's request. This preserves original research context; the
selected reporting-label grain
contract and implementation are delivered under IOP-148.

## Current coverage — 2026-10-06

- Validated `day`/`week`/`month` request values and PostgreSQL `date_trunc` grouping
  provide full matching frequency/duration totals with the analysis calendar.
- Browser period controls, weekly/monthly axes and chart/calendar tests exist.
- [IOP-148 execution evidence](../completed/IOP-148-analytical-workspace-plan.md)
  records connected reporting validation; later comparison/chart refinements are
  linked in the [delivery map](../poc-delivery.md).

No remaining implementation for the original day/week/month outcome. This closure
is source-aggregate trend delivery, not occurrence reconstruction, downtime
measurement or whole-platform release acceptance.

# IOP-097 — Date/filter model

## Status

Proposed

## Milestone

M11 — OIP / Operational Intelligence. Proposed delivery slice.

## Goal

Date/filter model. Expected outcome: Consistent filters

## User / business value

Operations staff and managers need explainable metrics to prioritize problems.

## Context

Scope: Operational Intelligence (OIP). See [modules](../../architecture/modules.md) and
the [planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; inclusion in the backlog does not authorize implementation.

## Current state

Only the documentation baseline exists. This capability is not implemented and its detailed design has not been accepted.

## Desired state

Consistent filters

## Requirements

- Deliver only the outcome described for IOP-097.
- OIP is an IOP module; metrics remain decoupled from the UI and WinCC schemas.

## Acceptance criteria

- [ ] Consistent filters
- [ ] The plan documents scenarios and necessary decisions without expanding scope.
- [ ] Validation evidence exists and documentation is synchronized.

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

[IOP-089](IOP-089-analytics-query-layer.md), [IOP-008](IOP-008-time-and-timezone-model.md)

Dependencies identify required contracts/capabilities, not numerical implementation
order. Refine them in the plan before changing code.

## Non-goals

Implementing adjacent tasks, inferring acceptance of open decisions or expanding delivery to the entire milestone. Do not introduce customer names into the core.

## Validation

The plan must specify executable commands and scenarios for the acceptance criteria using the accepted tooling. Include the expected path, errors and relevant access denial; record actual results, not fictional tests.

## Documentation impact

Update this item, its [backlog](../backlog.md) status and the execution plan.
Update contracts, models, guides or ADRs only if this task changes their content.

## Open questions

Confirm the approved contract, edge cases and exact evidence for this slice before starting implementation.

## Owner-supplied CSV and reporting context

The screenshots show period, hall/sector, area, equipment and message inclusion/exclusion filters. Preserve and display active filters consistently across overview, rankings and drill-down. Date origin is confirmed as `Hitliste-YYYYMMDD.csv`; resolve reporting-window semantics and customer mappings first; screenshot exclusions are examples, not generic defaults.

See the [shared evidence](../../product/csv-and-reporting-reference.md), captured
under IOP-002 at the owner's request. This is context for future planning; this
item remains Proposed and no implementation or metric formula is accepted here.

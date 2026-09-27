# IOP-093 — Pareto analysis

## Status

Proposed

## Milestone

M11 — OIP / Operational Intelligence. Proposed delivery slice.

## Goal

Pareto analysis. Expected outcome: Area/Asset/Event.

## User / business value

Operations staff and decision makers need explainable metrics to prioritize problems.

## Context

Scope: Operational Intelligence (OIP). See [modules](../../architecture/modules.md)
and the [planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; backlog presence does not authorize implementation.

## Current state

The original planning baseline was documentation-only, with this capability and its
detailed design not implemented or accepted. The separately authorized
[IOP-148 reporting slice](IOP-148-analytical-workspace.md) tracks current implementation
and validation; this broader item is not closed by translating its context.

## Desired state

Area/Asset/Event.

## Requirements

- Deliver only the outcome described for IOP-093.
- OIP is an IOP module; metrics remain independent of UI and WinCC source schemas.

## Acceptance criteria

- [ ] Area/Asset/Event.
- [ ] The plan records necessary scenarios and decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation exist.

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

[IOP-090](IOP-090-event-frequency.md)

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

Confirm the accepted contract, edge cases and exact evidence for this slice before
activating its implementation.

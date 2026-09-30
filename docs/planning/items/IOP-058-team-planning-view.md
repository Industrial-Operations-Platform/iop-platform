# IOP-058 — Team Leader planning view

## Status

Proposed

## Milestone

M6 — Workforce & Shift Management. Proposed delivery slice.

## Goal

Team Leader planning view. Expected outcome: Team Leaders can see the complete shift

## User / business value

Technicians and leaders need to know who works where and when.

## Context

Scope: Workforce and Shift Management. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; inclusion in the backlog does not authorize implementation.

## Current state

Only the documentation baseline exists. This capability is not implemented and its detailed design is not accepted.

## Desired state

Team Leaders can see the complete shift

## Requirements

- Deliver only the outcome described for IOP-058.
- Teams, shifts and assignments are generic; Springer and local names are labels/configuration.

## Acceptance criteria

- [ ] Team Leaders can see the complete shift
- [ ] The plan documents required scenarios and decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation exist.

## Domain considerations

Teams, shifts and assignments are generic; Springer and local names are labels/configuration.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to make the decision.

## Security considerations

Verify permissions and customer/site scope for relevant operations and references.
Do not include secrets, drawings or production data in the repository. Keep industrial
integrations read-only; record material changes where applicable.

## Data considerations

Separate workforce profiles from authenticated users; handle the site time zone, midnight and daylight-saving changes.

## API considerations

Validate planning permissions and personal access; define conflicts without assuming universal exclusivity.

## UI considerations

Show clear intervals and site context; do not implement automatic optimization or payroll.

## Dependencies

[IOP-055](IOP-055-shift-assignments.md), [IOP-029](IOP-029-rbac-enforcement.md)

Dependencies indicate required contracts/capabilities, not numerical implementation
order. Refine them in the plan before changing code.

## Non-goals

Implementing adjacent tasks, accepting open decisions by inference or extending delivery to the entire milestone. Do not introduce customer names into the core.

## Validation

The plan must define executable commands and scenarios for the criteria below using accepted tooling. Include the expected path, errors and relevant access denial; record actual results, not fictional tests.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, models, guides or ADRs only if this task changes their content.

## Open questions

Confirm the approved contract, edge cases and exact evidence for this slice before starting implementation.

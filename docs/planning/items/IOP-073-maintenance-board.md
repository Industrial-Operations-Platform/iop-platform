# IOP-073 — Maintenance Board

## Status

Proposed

## Milestone

M8 — Maintenance Management. Proposed delivery slice.

## Goal

Maintenance Board. Expected outcome: Board by site/hall/area

## User / business value

Technicians and responsible staff need to track work, priorities and outcomes for assets.

## Context

Scope: Maintenance Management. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

Only the documentation baseline exists for this capability. It is not implemented, and its detailed design has not been accepted.

## Desired state

Board by site/hall/area

## Requirements

- Deliver only the outcome described for IOP-073.
- Statuses and priority require explicit rules; the board uses configurable locations, not fixed local levels.

## Acceptance criteria

- [ ] Board by site/hall/area
- [ ] The plan documents scenarios and required decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation exist.

## Domain considerations

Statuses and priority require explicit rules; the board uses configurable locations, not fixed local levels.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to make the decision.

## Security considerations

Verify permissions and customer/site scope for relevant operations and references.
Do not include secrets, blueprints or production data in the repository. Keep
industrial integrations read-only; record material changes where applicable.

## Data considerations

Preserve the responsible person, asset and transitions with auditing; do not duplicate the canonical asset registry.

## API considerations

Validate transitions, scope membership and edit permissions; external references pass through Integrations.

## UI considerations

Show status, priority, location and responsible person with authorized filters; do not replace a full CMMS.

## Dependencies

[IOP-069](IOP-069-maintenance-status.md), [IOP-070](IOP-070-maintenance-priority.md), [IOP-071](IOP-071-maintenance-ownership.md), [IOP-072](IOP-072-maintenance-asset-link.md)

Dependencies indicate required contracts/capabilities, not numerical implementation
order. Refine them in the plan before changing code.

## Non-goals

Implementing adjacent tasks, inferring acceptance of open decisions or extending delivery to the entire milestone. Do not introduce customer names into the core.

## Validation

The plan must define executable commands and scenarios for the acceptance criteria using accepted tooling. Include the expected path, errors and relevant access denial; record actual results, not fictitious tests.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, model, guides or ADRs only if this task changes their content.

## Open questions

Confirm the approved contract, edge cases and exact evidence for this slice before activating implementation.

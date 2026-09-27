# IOP-117 — Role-aware home

## Status

Proposed

## Milestone

M15 — UX & Operational Experience. Proposed delivery slice.

## Goal

Role-aware home. Expected outcome: Home tailored to the user role

## User / business value

Technicians, team leaders and administrators need consistent, accessible workflows.

## Context

Scope: Cross-module user experience. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; backlog inclusion does not authorize implementation.

## Current state

Only the documentation baseline exists. This capability is not implemented and its detailed design is not accepted.

## Desired state

Home tailored to the user role

## Requirements

- Deliver only the outcome described for IOP-117.
- Compose existing modules according to role; visible navigation does not grant server permissions.

## Acceptance criteria

- [ ] Home tailored to the user role
- [ ] The plan documents scenarios and necessary decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation are available.

## Domain considerations

Compose existing modules according to role; visible navigation does not grant server permissions.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt a decision.

## Security considerations

Verify permission and customer/site scope in relevant operations and references.
Do not include secrets, floor plans or production data in the repository. Keep
industrial integrations read-only; record material changes when applicable.

## Data considerations

Views consume authorized contracts and do not create divergent copies of entities.

## API considerations

Reuse search/read contracts; define pagination and limits only for the selected scope.

## UI considerations

Evaluate keyboard access, labels, contrast and empty/error/loading states on laptop and tablet; agree on verifiable targets.

## Dependencies

[IOP-116](IOP-116-navigation.md), [IOP-029](IOP-029-rbac-enforcement.md)

Dependencies identify required contracts/capabilities, not numerical implementation
order. Refine them in the plan before changing code.

## Non-goals

Implementing adjacent tasks, inferring acceptance of open decisions or expanding delivery to the whole milestone. Do not introduce customer names into the core.

## Validation

The plan must specify executable commands and scenarios for the criteria using accepted tooling. Include the expected path, errors and relevant access denial; record actual results, not fictional tests.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, model, guides or ADRs only if this task changes their content.

## Open questions

Confirm the approved contract, edge cases and exact evidence for this slice before activating implementation.

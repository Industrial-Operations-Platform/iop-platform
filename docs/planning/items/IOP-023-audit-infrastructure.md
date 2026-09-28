# IOP-023 — Audit infrastructure

## Status

Proposed

## Milestone

M2 — Development Platform Foundation. Proposed delivery slice.

## Goal

Audit infrastructure. Expected outcome: Material changes generate audit records

## User / business value

Developers need a reproducible environment and executable validation.

## Context

Scope: Development infrastructure and application hosts. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; inclusion in the backlog does not authorize implementation.

## Current state

Only the documentation baseline exists. This capability is not implemented and its detailed design is not accepted.

## Desired state

Material changes generate audit records

## Requirements

- Deliver only the outcome described for IOP-023.
- Apply only the accepted stack and contracts; hosts are not business microservices.

## Acceptance criteria

- [ ] Material changes generate audit records
- [ ] The plan documents required scenarios and decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation exist.

## Domain considerations

Apply only the accepted stack and contracts; hosts are not business microservices.

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

PostgreSQL is the reference; keep test configuration and synthetic data separate.

## API considerations

Apply accepted health/error contracts without adding business functionality.

## UI considerations

Only what is needed to verify the host or environment; do not create business screens.

## Dependencies

[IOP-009](IOP-009-audit-model.md), [IOP-019](IOP-019-database-bootstrap.md)

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

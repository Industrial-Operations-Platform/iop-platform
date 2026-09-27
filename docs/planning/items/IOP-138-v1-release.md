# IOP-138 — v1 release

## Status

Proposed

## Milestone

M17 — v1 Validation & Release. Proposed delivery slice.

## Goal

v1 release. Expected outcome: Tag/release notes/version

## User / business value

Users and administrators need a demonstrable, operable and documented release.

## Context

Scope: Validation and release readiness. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; backlog inclusion does not authorize implementation.

## Current state

Only the documentation baseline exists. This capability is not implemented and its detailed design is not accepted.

## Desired state

Tag/release notes/version

## Requirements

- Deliver only the outcome described for IOP-138.
- Verify the agreed v1 scope without requiring every future backlog idea.
- Create a tag/release only when execution of this task is authorized and its gates are approved. Record the version, notes, limitations and evidence; the backlog does not authorize publication now.

## Acceptance criteria

- [ ] Tag/release notes/version
- [ ] The plan documents scenarios and necessary decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation are available.

## Domain considerations

Verify the agreed v1 scope without requiring every future backlog idea.

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

Reconcile evidence and test recovery with authorized or synthetic data.

## API considerations

Validate published contracts and documented compatibility; do not introduce features during release closure.

## UI considerations

Validate the agreed workflow and documentation by persona; record known limitations.

## Dependencies

[IOP-130](IOP-130-pilot-metrics.md), [IOP-131](IOP-131-permission-validation.md), [IOP-132](IOP-132-final-reconciliation.md), [IOP-133](IOP-133-performance-acceptance.md), [IOP-134](IOP-134-deployment-guide.md), [IOP-135](IOP-135-admin-guide.md), [IOP-136](IOP-136-user-guide.md), [IOP-137](IOP-137-architecture-review.md)

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

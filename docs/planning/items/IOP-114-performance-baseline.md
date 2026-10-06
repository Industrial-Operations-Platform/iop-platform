# IOP-114 — Performance baseline

## Status

Proposed

## Milestone

M14 — Security & Reliability. Proposed delivery slice.

## Goal

Performance baseline. Expected outcome: Measured targets

## User / business value

Customers and operators need verifiable isolation and reproducible recovery.

## Context

Scope: Security and operational reliability. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

Plans record bounded import/query budgets and some local observations. Remaining: agreed
workload/environment, repeatable baseline measurements and explicit performance targets.

## Desired state

Measured targets

## Requirements

- Deliver only the outcome described for IOP-114.
- Apply controls in each vertical slice; this milestone verifies and hardens them rather than postponing security until the end.

## Acceptance criteria

- [ ] Measured targets
- [ ] The plan documents scenarios and necessary decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation exist.

## Domain considerations

Apply controls in each vertical slice; this milestone verifies and hardens them rather
than postponing security until the end.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to make the decision.

## Security considerations

Verify permissions and customer/site scope in relevant operations and references.
Do not include secrets, floor plans or production data in the repository. Keep
industrial integrations read-only; record material changes where applicable.

## Data considerations

Retention, restoration and sensitive data follow agreed decisions; do not copy
production data into the repository.

## API considerations

Test the authorization, input, error and recovery boundaries relevant to the task.

## UI considerations

Where a UI exists, check useful errors without sensitive data and with correct scope context.

## Dependencies

[IOP-001](IOP-001-v1-personas-and-pilot-workflow.md), [IOP-013](IOP-013-observability-baseline.md), [IOP-089](IOP-089-analytics-query-layer.md)

Dependencies indicate required contracts/capabilities, not numerical implementation
order. Refine them in the plan before changing code.

## Non-goals

Implementing adjacent tasks, accepting open decisions by inference or extending delivery
to the entire milestone. Do not introduce customer names into the core.

## Validation

The plan must define executable commands and scenarios for the criteria below using
accepted tooling. Include the expected path, errors and relevant access denial; record
actual results, not fictional tests.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, models, guides or ADRs only if this task changes their content.

## Open questions

Confirm the approved contract, edge cases and exact evidence for this slice before
starting implementation.

## Current coverage and remaining work — 2026-10-06

Plans record bounded import/query budgets and some local observations. Remaining: agreed
workload/environment, repeatable baseline measurements and explicit performance targets.

See the [delivery map](../poc-delivery.md) for implemented slices and evidence.
This update does not authorize the remaining work or accept a Proposed decision.

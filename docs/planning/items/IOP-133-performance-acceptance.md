# IOP-133 — Performance acceptance

## Status

Proposed

## Milestone

M17 — v1 Validation & Release. Proposed delivery slice.

## Goal

Performance acceptance. Expected outcome: v1 targets met

## User / business value

Users and administrators need a demonstrable, operable and documented version.

## Context

Scope: Validation and release readiness. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

Local implementation validation and some timings exist. Remaining: explicitly agreed v1
performance targets and evidence they are met, following IOP-114; ordinary test success
does not close this gate.

## Desired state

v1 targets met

## Requirements

- Deliver only the outcome described for IOP-133.
- Verify the agreed v1 scope without requiring every future backlog idea.

## Acceptance criteria

- [ ] v1 targets met
- [ ] The plan documents scenarios and necessary decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation exist.

## Domain considerations

Verify the agreed v1 scope without requiring every future backlog idea.

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

Reconcile evidence and test recovery with authorized or synthetic data.

## API considerations

Validar contratos publicados y compatibilidad documentada; no introducir features
durante cierre de release.

## UI considerations

Validate the agreed workflow and documentation for each persona; record known limitations.

## Dependencies

[IOP-114](IOP-114-performance-baseline.md), [IOP-129](IOP-129-end-to-end-scenario.md)

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

Local implementation validation and some timings exist. Remaining: explicitly agreed v1
performance targets and evidence they are met, following IOP-114; ordinary test success
does not close this gate.

See the [delivery map](../poc-delivery.md) for implemented slices and evidence.
This update does not authorize the remaining work or accept a Proposed decision.

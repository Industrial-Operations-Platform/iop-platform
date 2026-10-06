# IOP-134 — Deployment documentation

## Status

Proposed

## Milestone

M17 — v1 Validation & Release. Proposed delivery slice.

## Goal

Deployment documentation. Expected outcome: IOP can be deployed in another environment

## User / business value

Users and administrators need a demonstrable, operable and documented version.

## Context

Scope: Validation and release readiness. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

Docker startup/rebuild/stop, private configuration and operator troubleshooting are
documented. Remaining: another authorized deployment environment,
operating/security/backup/restore prerequisites and reproducibility evidence; remote
hosting is not delivered.

## Desired state

IOP can be deployed in another environment

## Requirements

- Deliver only the outcome described for IOP-134.
- Verify the agreed v1 scope without requiring every future backlog idea.

## Acceptance criteria

- [ ] IOP can be deployed in another environment
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

[IOP-015](IOP-015-local-development-environment.md), [IOP-021](IOP-021-ci-baseline.md), [IOP-113](IOP-113-restore.md)

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

Docker startup/rebuild/stop, private configuration and operator troubleshooting are
documented. Remaining: another authorized deployment environment,
operating/security/backup/restore prerequisites and reproducibility evidence; remote
hosting is not delivered.

See the [delivery map](../poc-delivery.md) for implemented slices and evidence.
This update does not authorize the remaining work or accept a Proposed decision.

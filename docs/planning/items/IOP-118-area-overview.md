# IOP-118 — Area overview

## Status

Proposed

## Milestone

M15 — UX & Operational Experience. Proposed delivery slice.

## Goal

Area overview. Expected outcome: Quick access to what happened here

## User / business value

Technicians, owners and administrators need coherent, accessible workflows.

## Context

Scope: Cross-module user experience. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

Handover department matrices/meeting views, analytical area drill-down and
location-filtered Maintenance exist. Remaining: the proposed unified area overview
across these sources with explicit role/coverage semantics.

## Desired state

Quick access to what happened here

## Requirements

- Deliver only the outcome described for IOP-118.
- Compose existing modules according to role; visible navigation does not grant server permissions.

## Acceptance criteria

- [ ] Quick access to what happened here
- [ ] The plan documents scenarios and necessary decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation exist.

## Domain considerations

Compose existing modules according to role; visible navigation does not grant server permissions.

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

Las vistas consumen contratos autorizados y no crean copias divergentes de entidades.

## API considerations

Reuse search/read contracts; define pagination and limits only for the selected scope.

## UI considerations

Assess keyboard use, labels, contrast and empty/error/loading states on laptop and
tablet; agree on verifiable targets.

## Dependencies

[IOP-067](IOP-067-previous-shift-overview.md), [IOP-073](IOP-073-maintenance-board.md), [IOP-095](IOP-095-area-analytics.md)

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

Handover department matrices/meeting views, analytical area drill-down and
location-filtered Maintenance exist. Remaining: the proposed unified area overview
across these sources with explicit role/coverage semantics.

See the [delivery map](../poc-delivery.md) for implemented slices and evidence.
This update does not authorize the remaining work or accept a Proposed decision.

# IOP-098 — Improvement action

## Status

Proposed

## Milestone

M12 — Improvement Tracking. Proposed delivery slice.

## Goal

Improvement action. Expected outcome: An action can be linked to an issue/asset

## User / business value

Owners want to assess improvement actions with before/after evidence.

## Context

Scope: Improvement tracking — proposed extension. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

No Improvement Tracking module is delivered. Remaining: decide module ownership/v1
inclusion and implement an action linked to an issue/asset; Maintenance work is a
separate record type.

## Desired state

An action can be linked to an issue/asset

## Requirements

- Deliver only the outcome described for IOP-098.
- Ownership of improvement actions and their inclusion in v1 are undecided; document them before implementation.

## Acceptance criteria

- [ ] An action can be linked to an issue/asset
- [ ] The plan documents scenarios and necessary decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation exist.

## Domain considerations

Ownership of improvement actions and their inclusion in v1 are undecided; document them
before implementation.

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

Preserve authorship, targets, evidence and comparable periods; do not attribute
causality without justification.

## API considerations

Define contracts with Maintenance/OIP without duplicating their domains; do not assume a
new service.

## UI considerations

Distinguish targets, observed results and hypotheses; review pilot inclusion with IOP-001.

## Dependencies

[IOP-001](IOP-001-v1-personas-and-pilot-workflow.md), [IOP-068](IOP-068-maintenance-record.md), [IOP-089](IOP-089-analytics-query-layer.md)

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
starting implementation. Confirm v1 inclusion and the owning module before writing code.

## Current coverage and remaining work — 2026-10-06

No Improvement Tracking module is delivered. Remaining: decide module ownership/v1
inclusion and implement an action linked to an issue/asset; Maintenance work is a
separate record type.

See the [delivery map](../poc-delivery.md) for implemented slices and evidence.
This update does not authorize the remaining work or accept a Proposed decision.

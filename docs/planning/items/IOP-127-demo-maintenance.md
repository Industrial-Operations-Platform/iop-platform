# IOP-127 — Synthetic maintenance

## Status

Deferred

Deferred beyond the analytical POC under the owner-approved
[scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md), which
explicitly defer maintenance and IOP-126–127 fixtures. The 2026-09-26 review
introduces no issues/tasks dataset or runtime behavior.

Execution evidence: [POC disposition plan](../completed/IOP-127-poc-disposition-plan.md).

## Milestone

M16 — Demo / Pilot Dataset. Proposed delivery slice.

## Goal

Synthetic maintenance. Expected outcome: Issues/tasks

## User / business value

The team needs to demonstrate IOP without enterprise infrastructure or information.

## Context

Scope: Synthetic demo and pilot fixtures. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

Only the documentation baseline exists for this capability. It is not implemented, and its detailed design has not been accepted.

## Desired state

Issues/tasks

## Requirements

- Deliver only the outcome described for IOP-127.
- Use fictional organizations, names, assets and relationships; fixtures do not define rigid domain levels.

## Acceptance criteria

- [ ] Issues/tasks
- [x] The plan documents scenarios and required decisions without expanding scope.
- [x] Validation evidence and synchronized documentation exist.

The checked criteria cover the POC disposition review only. Issues/tasks remain
unimplemented; this story is not Completed.

## Domain considerations

Use fictional organizations, names, assets and relationships; fixtures do not define rigid domain levels.

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

Use reproducible data with explicit scope and provenance; include useful invalid/ambiguous cases without secrets.

## API considerations

Use agreed loading mechanisms; prevent demo reset from affecting production.

## UI considerations

The user must distinguish demo data from real data; scope does not include designing new screens.

## Dependencies

[IOP-124](IOP-124-demo-assets.md), [IOP-073](IOP-073-maintenance-board.md)

Dependencies indicate required contracts/capabilities, not numerical implementation
order. Refine them in the plan before changing code.

For the POC, both direct dependencies are deferred capabilities: IOP-124 supplies
physical asset fixtures; IOP-073 supplies the maintenance board. Neither is a POC
gate. Revisit their contracts only when maintenance work is explicitly activated
beyond the POC.

## Non-goals

Implementing adjacent tasks, inferring acceptance of open decisions or extending delivery to the entire milestone. Do not introduce customer names into the core.

## Validation

The plan must define executable commands and scenarios for the acceptance criteria using accepted tooling. Include the expected path, errors and relevant access denial; record actual results, not fictitious tests.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, model, guides or ADRs only if this task changes their content.

## Open questions

No decision is needed to apply the existing POC deferral. Before future maintenance
implementation, confirm the approved contract, edge cases and exact evidence.

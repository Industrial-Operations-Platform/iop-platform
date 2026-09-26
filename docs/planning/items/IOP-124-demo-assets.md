# IOP-124 — Synthetic asset structure

## Status

Proposed

## Milestone

M16 — Demo / Pilot Dataset. Proposed delivery slice.

## Goal

Synthetic asset structure. Expected outcome: Realistic hall/area/assets

## User / business value

The team needs to demonstrate IOP without enterprise infrastructure or information.

## Context

Scope: Synthetic demo and pilot fixtures. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

Only the documentation baseline exists for this capability. It is not implemented, and its detailed design has not been accepted.

## Desired state

Realistic hall/area/assets

## Requirements

- Deliver only the outcome described for IOP-124.
- Use fictional organizations, names, assets and relationships; fixtures do not define rigid domain levels.

## Acceptance criteria

- [ ] Realistic hall/area/assets
- [ ] The plan documents scenarios and required decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation exist.

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

[IOP-123](IOP-123-demo-organization.md), [IOP-039](IOP-039-asset-survey.md)

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

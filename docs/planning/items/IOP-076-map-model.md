# IOP-076 — Map model

## Status

Deferred — M9 explicitly postponed by the owner, confirmed on 2026-10-06.

## Milestone

M9 — Asset Locator. Documentation/design only.

## Goal

Map model. Expected outcome: Scope-specific versioned maps

## User / business value

Technicians need to find a validated asset on the correct map.

## Context

Scope: Asset Locator. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

M9 maps, spatial placement and locator search are not implemented. IOP-194
provides a non-spatial asset registry, exact aliases and manual within-area metadata.

## Desired state

Scope-specific versioned maps

## Requirements

- Deliver only the outcome described for IOP-076.
- A versioned map and placement are separate from the canonical asset and its functional hierarchy.

## Acceptance criteria

- [ ] Scope-specific versioned maps
- [ ] The plan documents scenarios and necessary decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation exist.

## Domain considerations

A versioned map and placement are separate from the canonical asset and its functional hierarchy.

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

Coordinates in [0,1] are bound to a map version; define origin and orientation before
implementation.

## API considerations

Resolve assets/aliases within scope; map-file access also requires authorization.

## UI considerations

Show multiple matches and assets without placement; do not invent coordinates or select
an ambiguous match.

## Dependencies

[IOP-011](IOP-011-file-storage-model.md), [IOP-026](IOP-026-site-model.md)

Dependencies indicate required contracts/capabilities, not numerical implementation
order. Refine them in the plan before changing code.

## Non-goals

Implementing applications, migrations, endpoints or infrastructure. Do not introduce
customer names into the core.

## Validation

Review consistency, links, scenarios and decisions; do not invent commands or write code
to validate this design task.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, models, guides or ADRs only if this task changes their content.

## Open questions

Resolve this task’s concrete design decisions with options, a recommendation and an ADR
when architecture is affected.

## Remaining work — 2026-10-06

The original locator outcome and its acceptance criteria remain unfulfilled.
The owner explicitly deferred M9 while allowing IOP-194 catalog/manual grouping
work; see [IOP-194](IOP-194-maintenance-asset-history.md). Existing assets and
source-alias search do not implement versioned maps, coordinates or placement.

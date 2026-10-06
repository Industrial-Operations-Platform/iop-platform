# IOP-080 — Locator UI

## Status

Deferred — M9 explicitly postponed by the owner, confirmed on 2026-10-06.

## Milestone

M9 — Asset Locator. Proposed delivery slice.

## Goal

Locator UI. Expected outcome: Interactive map

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

Interactive map

## Requirements

- Deliver only the outcome described for IOP-080.
- A versioned map and placement are separate from the canonical asset and its functional hierarchy.

## Acceptance criteria

- [ ] Interactive map
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

[IOP-079](IOP-079-asset-placement.md), [IOP-017](IOP-017-frontend-bootstrap.md)

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

## Remaining work — 2026-10-06

The original locator outcome and its acceptance criteria remain unfulfilled.
The owner explicitly deferred M9 while allowing IOP-194 catalog/manual grouping
work; see [IOP-194](IOP-194-maintenance-asset-history.md). Existing assets and
source-alias search do not implement versioned maps, coordinates or placement.

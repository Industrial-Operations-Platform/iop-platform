# IOP-079 — Asset placement

## Status

In progress — placement software complete; real asset/sensor survey inputs pending.

## Milestone

M9 — Asset Locator. Local software delivery under IOP-206.

## Goal

Asset placement. Expected outcome: An asset can be placed

## User / business value

Technicians need to find a validated asset on the correct map.

## Context

Scope: Asset Locator. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

Registered canonical assets can be explicitly linked to reusable 3D components on a particular scene revision. Edits preserve prior placement evidence and require current source authorization. The supplied traced components are provisional and have no inferred canonical links or physical positions; exact sensor mapping remains pending input.

## Desired state

An asset can be placed

## Requirements

- Deliver only the outcome described for IOP-079.
- A versioned map and placement are separate from the canonical asset and its functional hierarchy.

## Acceptance criteria

- [x] An asset can be placed
- [x] The plan documents scenarios and necessary decisions without expanding scope.
- [x] Validation evidence and synchronized documentation exist.

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

Image-local coordinates in [0,1] are bound to a scene revision. The origin is
top-left, X points right and Y points down. Surveyed scale, elevation and global
alignment remain separate explicit input; scene extrusions do not prove height.

## API considerations

Resolve assets/aliases within scope; map-file access also requires authorization.

## UI considerations

Show multiple matches and assets without placement; do not invent coordinates or select
an ambiguous match.

## Dependencies

[IOP-077](IOP-077-map-upload.md), [IOP-078](IOP-078-normalized-map-coordinates.md), [IOP-039](IOP-039-asset-survey.md)

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

## Authorized delivery and remaining inputs — 2026-10-14

The owner's [IOP-203](IOP-203-platform-completion.md) request explicitly reopened
M9 and superseded the 2026-10-06 deferral. [IOP-206](IOP-206-3d-asset-locator.md),
its [completed execution](../completed/IOP-206-3d-asset-locator-plan.md) and the
[operator guide](../../development/asset-locator.md) record the implemented scope
and executed API/web/real PostgreSQL evidence. Accepted
[ADR-0037](../../architecture/adr/ADR-0037-operational-completion.md) records the
owner-delegated decisions.

The completed plan records actual WebGL2, private supplied-source tracing, both
themes and 390px review alongside module/storage tests. Exact plant dimensions,
elevations, global alignment, canonical identities and surveyed sensor positions
remain pending input. These limits do not imply live equipment health.

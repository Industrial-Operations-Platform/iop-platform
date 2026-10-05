# IOP-040 — Asset search

## Status

Proposed

## Milestone

M4 — Asset Domain. Proposed delivery slice.

## Goal

Asset search. Expected outcome: Search by code, alias and metadata

## User / business value

Technicians need to identify and maintain reliable assets independently of customer vocabulary.

## Context

Scope: Asset Management. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

Only the documentation baseline exists. This capability is not implemented and its detailed design is not accepted.

## Desired state

Search by code, alias and metadata

## Requirements

- Deliver only the outcome described for IOP-040.
- Separate composition, physical location, controller relationships and external identifiers; do not fix Hall/Area levels.

## Acceptance criteria

- [ ] Search by code, alias and metadata
- [ ] The plan documents scenarios and required decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation exist.

## Domain considerations

Separate composition, physical location, controller relationships and external identifiers; do not fix Hall/Area levels.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to make the decision.

## Security considerations

Verify permissions and customer/site scope for relevant operations and references.
Do not include secrets, drawings or production data in the repository. Keep
industrial integrations read-only; record material changes where applicable.

## Data considerations

Keep canonical identity and references in the same scope; preserve validation evidence and handle ambiguous aliases.

## API considerations

Expose asset-module contracts, not internal tables or provider models.

## UI considerations

Show validation, ambiguity and missing data explicitly; maps belong to Asset Locator.

## Dependencies

[IOP-035](IOP-035-asset-parent-relations.md), [IOP-037](IOP-037-asset-aliases.md), [IOP-038](IOP-038-asset-metadata.md), [IOP-039](IOP-039-asset-survey.md)

Dependencies indicate required contracts/capabilities, not numerical implementation
order. Refine them in the plan before changing code.

## Non-goals

Implementing adjacent tasks, accepting open decisions by inference or extending delivery to the entire milestone. Do not introduce customer names in the core.

## Validation

The plan must define executable commands and scenarios for the criteria below using accepted tooling. Include the expected path, errors and relevant access denial; record actual results, not fictional tests.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, models, guides or ADRs only if this task changes their content.

## Open questions

Confirm the approved contract, edge cases and exact evidence for this slice before starting implementation.

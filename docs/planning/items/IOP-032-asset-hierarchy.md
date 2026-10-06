# IOP-032 — Asset hierarchy model

## Status

Proposed

## Milestone

M4 — Asset Domain. Documentation/design only.

## Goal

Asset hierarchy model. Expected outcome: Configurable hierarchy without hard-coded levels

## User / business value

Technicians need to identify and maintain reliable assets independently of customer vocabulary.

## Context

Scope: Asset Management. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

IOP-194 supplies stable assets and manual within-area grouping; configured locations
have their own hierarchy. Remaining: an actual configurable asset composition hierarchy;
location/group text is not an asset parent graph.

## Desired state

Configurable hierarchy without hard-coded levels

## Requirements

- Deliver only the outcome described for IOP-032.
- Separate composition, physical location, controller relationships and external identifiers; do not fix Hall/Area levels.

## Acceptance criteria

- [ ] Configurable hierarchy without hard-coded levels
- [ ] The plan documents scenarios and required decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation exist.

## Domain considerations

Separate composition, physical location, controller relationships and external
identifiers; do not fix Hall/Area levels.

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

Keep canonical identity and references in the same scope; preserve validation evidence
and handle ambiguous aliases.

## API considerations

Expose asset-module contracts, not internal tables or provider models.

## UI considerations

Show validation, ambiguity and missing data explicitly; maps belong to Asset Locator.

## Dependencies

[IOP-004](IOP-004-platform-scope-model.md), [IOP-026](IOP-026-site-model.md)

Dependencies indicate required contracts/capabilities, not numerical implementation
order. Refine them in the plan before changing code.

## Non-goals

Implementing applications, migrations, endpoints or infrastructure. Do not introduce
customer names in the core.

## Validation

Review consistency, links, scenarios and decisions; do not invent commands or write code
to validate this design task.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, models, guides or ADRs only if this task changes their content.

## Open questions

Resolve concrete design decisions for this task with options, a recommendation and an
ADR when architecture is affected.

## Current coverage and remaining work — 2026-10-06

IOP-194 supplies stable assets and manual within-area grouping; configured locations
have their own hierarchy. Remaining: an actual configurable asset composition hierarchy;
location/group text is not an asset parent graph.

See the [delivery map](../poc-delivery.md) for implemented slices and evidence.
This update does not authorize the remaining work or accept a Proposed decision.

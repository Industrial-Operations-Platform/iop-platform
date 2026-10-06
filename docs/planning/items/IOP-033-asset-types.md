# IOP-033 — Asset type model

## Status

Proposed

## Milestone

M4 — Asset Domain. Proposed delivery slice.

## Goal

Asset type model. Expected outcome: Configurable sensor, motor, conveyor, PLC and other types

## User / business value

Technicians need to identify and maintain reliable assets independently of customer vocabulary.

## Context

Scope: Asset Management. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

IOP-194 permits manual asset component/type text. Remaining: a managed extensible type
catalog with validation; free text is not the proposed configurable asset-type model.

## Desired state

Configurable sensor, motor, conveyor, PLC and other types

## Requirements

- Deliver only the outcome described for IOP-033.
- Separate composition, physical location, controller relationships and external identifiers; do not fix Hall/Area levels.

## Acceptance criteria

- [ ] Configurable sensor, motor, conveyor, PLC and other types
- [ ] The plan documents scenarios and necessary decisions without expanding scope.
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

Verify permissions and customer/site scope in relevant operations and references.
Do not include secrets, floor plans or production data in the repository. Keep
industrial integrations read-only; record material changes where applicable.

## Data considerations

Keep canonical identity and references in the same scope; preserve validation evidence
and handle ambiguous aliases.

## API considerations

Expose asset-module contracts, not internal tables or provider models.

## UI considerations

Show validation, ambiguity and missing data explicitly; maps belong to Asset Locator.

## Dependencies

[IOP-032](IOP-032-asset-hierarchy.md)

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

IOP-194 permits manual asset component/type text. Remaining: a managed extensible type
catalog with validation; free text is not the proposed configurable asset-type model.

See the [delivery map](../poc-delivery.md) for implemented slices and evidence.
This update does not authorize the remaining work or accept a Proposed decision.

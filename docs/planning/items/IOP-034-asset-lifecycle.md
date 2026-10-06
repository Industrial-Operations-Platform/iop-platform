# IOP-034 — Asset lifecycle

## Status

Completed — original outcome delivered in later owner-authorized local increments;
reconciled on 2026-10-06.

## Milestone

M4 — Asset Domain. Delivered local slice.

## Goal

Asset lifecycle. Expected outcome: Create/update/archive/validation

## User / business value

Technicians need to identify and maintain reliable assets independently of customer vocabulary.

## Context

Scope: Asset Management. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; inclusion in the backlog does not authorize implementation.

## Current state

IOP-194 delivers stable asset creation/update, Unverified/Validated/Retired lifecycle,
validation evidence, logical retirement and immutable revisions. Physical surveying is
the separate IOP-039 story.

## Desired state

Create/update/archive/validation

## Requirements

- Deliver only the outcome described for IOP-034.
- Separate composition, physical location, controller relationships and external identifiers; do not fix Hall/Area levels.

## Acceptance criteria

- [x] Create/update/archive/validation
- [x] The plan documents required scenarios and decisions without expanding scope.
- [x] Validation evidence and synchronized documentation exist.

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
Do not include secrets, drawings or production data in the repository. Keep industrial
integrations read-only; record material changes where applicable.

## Data considerations

Keep canonical identity and references within the same scope; preserve validation
evidence and handle ambiguous aliases.

## API considerations

Expose asset-module contracts, not internal tables or provider models.

## UI considerations

Show validation, ambiguity and missing data explicitly; maps belong to Asset Locator.

## Dependencies

[IOP-032](IOP-032-asset-hierarchy.md), [IOP-033](IOP-033-asset-types.md), [IOP-029](IOP-029-rbac-enforcement.md)

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

None for the delivered original outcome. Broader parent capabilities remain
separately scoped and require an explicit selection before implementation.

## Current coverage — 2026-10-06

IOP-194 delivers stable asset creation/update, Unverified/Validated/Retired lifecycle,
validation evidence, logical retirement and immutable revisions. Physical surveying is
the separate IOP-039 story.

Implementation and validation: [execution evidence](../completed/IOP-194-maintenance-asset-history-plan.md).
No remaining implementation for this story’s original outcome; broader scope remains
in the explicitly linked parent stories. Closure does not imply platform release
or final owner product acceptance.

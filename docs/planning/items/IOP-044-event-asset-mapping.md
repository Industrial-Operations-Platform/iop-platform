# IOP-044 — Event-to-asset mapping

## Status

Proposed

## Milestone

M5 — Industrial Data Foundation. Proposed delivery slice.

## Goal

Event-to-asset mapping. Expected outcome: Events can be linked to assets

## User / business value

Operations needs traceable imported data and reconcilable metrics.

## Context

Scope: Integrations and Operational Intelligence. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; backlog inclusion does not authorize implementation.

## Current state

The Digital Asset Record can read analytical evidence through exact explicit aliases.
Remaining: ingestion-time canonical event-to-asset mapping with unresolved/ambiguous
handling; existing RAW/aggregate facts are not rewritten or automatically assigned.

## Desired state

Events can be linked to assets

## Requirements

- Deliver only the outcome described for IOP-044.
- RAW → validation → normalization; the receiving module validates invariants. Do not infer a physical asset from text alone.

## Acceptance criteria

- [ ] Events can be linked to assets
- [ ] The plan documents scenarios and required decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation exist.

## Domain considerations

RAW → validation → normalization; the receiving module validates invariants. Do not
infer a physical asset from text alone.

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

Preserve provenance and grain; distinguish occurrences from aggregates. Rejections and
corrections must remain visible.

## API considerations

Use ingestion contracts; external credentials and column names remain in adapters/configuration.

## UI considerations

Expose import states, errors and results only when requested by this task; do not create
a full dashboard.

## Dependencies

[IOP-043](IOP-043-canonical-event-model.md), [IOP-037](IOP-037-asset-aliases.md), [IOP-039](IOP-039-asset-survey.md)

Dependencies indicate required contracts/capabilities, not numerical implementation
order. Refine them in the plan before changing code.

## Non-goals

Implementing adjacent tasks, accepting open decisions by inference or extending delivery
to the entire milestone. Do not introduce customer names in the core.

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

The Digital Asset Record can read analytical evidence through exact explicit aliases.
Remaining: ingestion-time canonical event-to-asset mapping with unresolved/ambiguous
handling; existing RAW/aggregate facts are not rewritten or automatically assigned.

See the [delivery map](../poc-delivery.md) for implemented slices and evidence.
This update does not authorize the remaining work or accept a Proposed decision.

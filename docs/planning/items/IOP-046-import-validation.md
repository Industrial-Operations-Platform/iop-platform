# IOP-046 — Data validation

## Status

Proposed

## Milestone

M5 — Industrial Data Foundation. Proposed delivery slice.

## Goal

Data validation. Expected result: Visible invalid records

## User / business value

Operations needs traceable imported data and reconcilable metrics.

## Context

Scope: Integrations and Operational Intelligence. See [modules](../../architecture/modules.md) and
the [planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; backlog membership alone does not authorize implementation.

## Current state

Only the documentation baseline exists. This capability is not implemented and its detailed design is not accepted.

## Desired state

Visible invalid records

## Requirements

- Deliver only the result described for IOP-046.
- RAW → validation → normalization; the receiving module validates invariants. Do not infer a physical asset from text alone.

## Acceptance criteria

- [ ] Visible invalid records
- [ ] The plan documents scenarios and necessary decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation exist.

## Domain considerations

RAW → validation → normalization; the receiving module validates invariants. Do not infer a physical asset from text alone.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt their decisions.

## Security considerations

Verify permission and customer/site scope for relevant operations and references.
Do not include secrets, floor plans or production data in the repository. Keep
industrial integrations read-only; record material changes where applicable.

## Data considerations

Preserve provenance and grain; distinguish occurrences from aggregates. Rejections and corrections must remain visible.

## API considerations

Use ingestion contracts; credentials and external column names remain in adapters/configuration.

## UI considerations

Expose import states, errors and results only if requested by this task; do not create a full dashboard.

## Dependencies

[IOP-045](IOP-045-csv-adapter.md)

Dependencies indicate required contracts/capabilities, not numerical implementation
order. Refine them in the plan before changing code.

## Non-goals

Implementing adjacent stories, accepting open decisions by inference or extending delivery to the whole milestone. Do not introduce customer names into the core.

## Validation

The plan must define commands and executable scenarios for the criteria using accepted tooling. Include expected paths, errors and relevant access denials; record actual results, not fictional tests.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, model, guides or ADRs only when this task changes their content.

## Open questions

Confirm the approved contract, edge cases and exact evidence for this slice before activating implementation.

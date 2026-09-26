# IOP-046 — Data validation

## Status

In progress — bounded POC validation reporting is implemented. Persisted importer
and user-visible review composition remain pending.

## Milestone

M5 — Industrial Data Foundation. Local analytical POC only.

## Goal

Data validation. Expected result: Visible invalid records

## User / business value

Operations needs traceable imported data and reconcilable metrics.

## Context

Scope: Integrations and Operational Intelligence. See [modules](../../architecture/modules.md) and
the [planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; the owner authorized this POC slice on 2026-09-26.
Follow the [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).

## Current state

`validateCsv` now shares IOP-045's pure parser and returns a bounded, value-free
inspection report: one diagnostic per invalid value row, physical line/neutral
field, exact inspected counts and explicit unknown remainder on interruption.
Valid input retains the full preparation result; invalid input exposes no partial
dataset. This internal report does not persist attempts or enable an upload/review
endpoint. See the [execution record](../completed/IOP-046-import-validation-plan.md).

## Desired state

Visible invalid records

## Requirements

- Deliver only the result described for IOP-046.
- RAW → validation → normalization; the receiving module validates invariants. Do not infer a physical asset from text alone.

## Acceptance criteria

- [x] Internal POC report identifies invalid rows with bounded safe diagnostics,
  complete/unknown counts and all-or-nothing preparation.
- [ ] Visible invalid records through the delivered importer/review path.
- [x] The plan documents scenarios and necessary decisions without expanding scope.
- [x] Validation evidence and synchronized documentation exist.

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

[IOP-045](IOP-045-csv-adapter.md) is completed and integrated on develop.
[IOP-012](IOP-012-source-integration-contract.md) defines source rules;
[IOP-042](IOP-042-import-batches.md) provides the existing inspection vocabulary
and internal storage. No new architectural mechanism is required.

Remaining composition needs immutable scoped receipt, IOP-049 classification,
production OIP receiver validation/publication and ADR-0018 host activation.
The caller supplies mapping counts separately; missing classification is not zero.
Review requires current `imports.review`, submission requires `imports.submit`.
These dependencies are not activated by this story.

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

No new decision blocks pure validation. The remaining delivery gate is the
importer/host/receiver composition above. Do not mark the story complete from unit
reports alone or infer user-visible persistence, scoped access evidence or POC
completion. Full rejection counts are assigned only by the settled batch lifecycle.

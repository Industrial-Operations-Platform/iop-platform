# IOP-042 — Import batch model

## Status

In progress — the accepted POC batch storage/lifecycle is implemented and tested
as an internal module. Production parser/OIP composition and delivered importer
verification remain pending in the owning delivery slices; no end-to-end import
completion is claimed.

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). The current increment implements only the
batch-owned recording and coordination boundary, not the entire importer.

## Milestone

M5 — Industrial Data Foundation. Proposed delivery slice.

## Goal

Record a bounded direct import and its outcome.

## User / business value

Operations needs traceable imported data and reconcilable metrics.

## Context

Scope: Integrations and Operational Intelligence. See [modules](../../architecture/modules.md) and
the [planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; backlog membership alone does not authorize implementation.

## Current state

The [batch model](../../architecture/import-batches-poc.md) and
[Accepted ADR-0027](../../architecture/adr/ADR-0027-poc-import-publication.md)
govern the implemented API-internal Integrations service and seventh database
migration. Complete receipts/quota, immutable provenance, statuses/counts, scoped
successful date claims and synchronous recovery are persisted under forced RLS.
OIP publication is an injected owner contract on the same transaction. Tests use
a disposable receiver to verify coordination; the production receiver and CSV
parser are not implemented by this story. See the [storage execution record](../completed/IOP-042-import-batch-storage-plan.md).

## Desired state

Record a bounded direct import and its outcome.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Track original input, configured scope, reporting date, status and accepted/rejected
  counts. No worker/job dependency. Define atomic admission and failure/retry behavior
  with the importer: a failed attempt must not silently publish partial analytical facts
  or block a valid retry forever.

## Acceptance criteria

- [x] Record a bounded direct import and its outcome through the internal batch contract.
- [ ] Validate the slice-specific outcomes and limitations in Requirements.
- [x] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Domain considerations

RAW → validation → normalization; the receiving module validates invariants. Do not infer a physical asset from text alone.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt their decisions. Accepted
ADR-0022 governs preservation; ADR-0026 supplies the pinned authorization handoff.
ADR-0027 is Accepted for the bounded quota/publication/recovery mechanics.

## Security considerations

Verify permission and organization/site scope for relevant operations and references.
Do not include secrets, floor plans or production data in the repository. Keep
industrial integrations read-only; record material changes where applicable.

## Data considerations

Preserve provenance and grain; distinguish occurrences from aggregates. Rejections and corrections must remain visible.

## API considerations

Use ingestion contracts; credentials and external column names remain in adapters/configuration.

## UI considerations

Expose import states, errors and results only when requested by this task; do not create a full dashboard.

## Dependencies

[IOP-041](IOP-041-raw-ingestion-model.md): completed logical RAW design, integrated
on develop. Its CSV-specific preservation/source contracts are available; IOP-042
now supplies the batch-owned physical RAW receipt.

Dependencies require only their relevant POC contracts/slices, not completion of
all future parent capabilities. Runtime business access also requires an accepted
local execution-context mechanism. ADR-0018 is Accepted, but host activation and
validation remain pending. ADR-0026 authorization lookup is implemented; it does
not independently activate business endpoints.

## Non-goals

Implementing adjacent stories, accepting open decisions by inference or extending
delivery to the whole milestone. Do not introduce customer names into the core.

## Validation

The plan must define commands and executable scenarios for the criteria using
accepted tooling. Include expected paths, errors and relevant access denials; record
actual results, not fictional tests. The storage execution record contains real-role
receipt, quota, publication-coordination, recovery and isolation tests. Full importer
validation with the production parser/OIP receiver and host remains pending.

## Documentation impact

Update this item, its [backlog](../backlog.md) status and the
[design execution record](../completed/IOP-042-import-batches-plan.md). Update contracts, model,
guides or ADRs only when this task changes their content.

## Open questions

No architectural decision remains open for the delivered batch slice. The owning
parser/OIP/host slices must supply the documented contracts and verify the complete
journey before the remaining integration criterion closes. No adjacent story is
automatically activated by this increment.

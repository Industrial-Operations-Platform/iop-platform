# IOP-041 — RAW ingestion model

## Status

Completed — bounded POC logical design, 2026-09-26. No RAW persistence,
importer, endpoint or runtime validation is claimed.

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15, and explicit request to work on IOP-041 on 2026-09-26. See
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
The selected POC slice controls acceptance; broader platform capabilities are
future context, not additional gates.

## Milestone and goal

M5 — Industrial Data Foundation. Documentation/design only.
Define preservation of scoped original CSV input and import provenance so that
operations can trace imported data and reconcile metrics.

## Context and original slice state

Scope: Integrations and Operational Intelligence. See
[modules](../../architecture/modules.md) and [planning workflow](../workflow.md).
The original context came from the owner-requested outline; backlog membership
alone did not authorize implementation. Minimal hosts, database and scoped site
bootstrap now exist; RAW persistence remains unimplemented.

The [RAW model](../../architecture/raw-ingestion-poc.md) defines receipt identity,
immutable provenance, contributing physical-line references, availability/outcome
semantics and delivery handoffs. It specializes the existing source/preservation
contracts without introducing a new architectural mechanism.

## Desired state and requirements

- Preserve scoped original CSV input and import provenance under the accepted
  storage contract, with original values available for reconciliation.
- Consume only the CSV-specific storage/contract slices. No map/attachment
  platform or external provider registry is required.
- Retain source/site identity through RAW, validation and normalization; the
  receiving module validates invariants. Never infer a physical asset from text.
- Preserve provenance and grain; distinguish occurrences from aggregates and
  expose rejections/corrections rather than silently changing evidence.

## Acceptance criteria

- [x] Define preservation of scoped original CSV input and import provenance.
- [x] Validate the slice-specific outcomes and limitations through documented
  scenarios, without claiming executable storage or ingestion evidence.
- [x] Record evidence and synchronize the story/plan; no broader unfinished
  capability is closed by this bounded design.

## Architecture and security constraints

Follow [ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Accepted [ADR-0022](../../architecture/adr/ADR-0022-poc-csv-preservation.md)
and its linked preservation contract govern storage; Proposed ADRs do not grant
permission to adopt their decisions.

Verify permissions and organization/site scope on relevant operations/references.
Do not include secrets, floor plans or production data in the repository. Keep
industrial integrations read-only; record material changes where applicable.
`imports.review` governs original-input retrieval separately from analytics access.

## API and UI considerations

Use ingestion contracts; credentials and external column names belong in adapters
or configuration. Expose import states/errors/results only when requested by the
owning delivery story; do not create a full dashboard here.

## Dependencies

- [IOP-011](IOP-011-file-storage-model.md): completed accepted CSV preservation design.
- [IOP-012](IOP-012-source-integration-contract.md): completed CSV source contract.
- [IOP-019](IOP-019-database-bootstrap.md): implemented local migration foundation.
- [IOP-026](IOP-026-site-model.md): implemented POC site persistence/seed; broader
  parent remains Deferred.

These relevant slices are integrated on develop; completion of future parent
capabilities is not required. [ADR-0018](../../architecture/adr/ADR-0018-local-poc-execution-context.md)
is Accepted; implementation and validation of the host execution context still
independently gate runtime business access, not this logical design.

## Non-goals

Implementing applications, migrations, endpoints or infrastructure. No customer
names in the generic core. No provider registry, asset model, retention platform,
workers or cross-module publication/recovery mechanism is selected here.

## Validation and documentation impact

The [completed plan](../completed/IOP-041-raw-ingestion-model-plan.md) records
consistency/link/status checks and scenario review. No code was written or runtime
tests invented to validate this design. The item, backlog, delivery map and
conceptual data-model link are synchronized. The entire original story's Spanish
prose is translated into English; direct dependency stories were already English.

## Remaining delivery questions

No new architectural decision blocks this logical model. IOP-042/047 must resolve
and verify atomic analytical publication, quota/date-claim concurrency and uncertain
commit recovery through module contracts. Document new architectural mechanisms
as Proposed ADRs with options and a recommendation before dependent implementation.
RAW schemas, retrieval, source configuration and executable reconciliation remain
future delivery, not evidence supplied by design closure.

## Current delivery — 2026-10-06

This story retains its original design/bootstrap evidence. Later IOP-147/148/165
and operational increments through IOP-194 deliver connected business paths,
scoped persistence and local accounts. ADR-0018 and ADR-0035 are Accepted; the
original runtime handoffs above are historical, not current blockers. See the
[delivery map](../poc-delivery.md) for implementation and remaining scope.

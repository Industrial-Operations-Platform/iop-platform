# IOP-045 — CSV source adapter

## Status

Completed — bounded POC source adapter, 2026-09-26. Pure preparation is implemented;
end-to-end import, classification and analytical publication remain separate delivery.

## Milestone and goal

M5 — Industrial Data Foundation. Deliver a CSV source adapter and a test dataset
that can be prepared for import within the [POC scope](../../product/scope-poc.md)
and [delivery map](../poc-delivery.md).

## User / business value

Operations needs traceable imported data and reconcilable metrics.

## Context and current state

Scope: Integrations and Operational Intelligence. See
[modules](../../architecture/modules.md) and the [planning workflow](../workflow.md).
The original context came from the owner-requested outline; backlog membership
alone did not authorize implementation. The owner explicitly requested this POC
slice on 2026-09-26.

The API-internal pure adapter implements the existing
[CSV source contract](../../architecture/csv-source-contract-poc.md): strict bounded
UTF-16 LE/CSV parsing, filename reporting date, exact frequency/seconds, physical
line provenance, original duration, required opaque dimensions, repeated-tuple
warnings and complete-file totals. A fictional import fixture is executable.
No browser or HTTP import, database composition or OIP receiver is delivered here.

## Requirements and acceptance

- [x] Provide an import-preparation dataset and executable source adapter for the
  supported seven-column profile; preserve original bytes and physical lines.
- [x] Validate grammar, required cells, exact measures/sums and approved parser
  budgets. Reject invalid preparation without returning partial records.
- [x] Document scenarios and necessary decisions without expanding scope.
- [x] Record validation evidence and synchronize documentation.

RAW → validation → normalization remains the ingestion flow; the receiver validates
its invariants independently. Never infer a physical asset from text. Preparation
is not successful analytical admission: receipt, scoped mapping, publication and
host activation are still required in the owning slices.

## Architecture and security constraints

Follow [ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt their decisions.
The implementation specializes accepted source/temporal/preservation rules and
reuses existing Integrations placement without introducing an architectural pattern.

Verify permission and organization/site scope for relevant operations/references.
This pure adapter has no resource access or authority; it neither selects scope nor
bypasses authorization. Future composition must pass the immutable scoped receipt.
Do not add secrets, floor plans or production rows. Existing owner-authorized CSVs
are read-only verification input; test fixtures are fictional. Keep industrial
integrations read-only and record material changes where applicable.

## Data, API and UI considerations

Preserve provenance and grain; distinguish aggregate records from occurrences.
Rejections and corrections must remain visible. Source columns remain inside the
adapter; customer classification belongs in scoped configuration. Runtime ingestion
uses owning-module contracts. Expose states/errors/results when delivered by their
owning story; no dashboard or upload endpoint is created here.

## Dependencies and handoff

- [IOP-041](IOP-041-raw-ingestion-model.md): integrated logical RAW/line provenance.
- [IOP-042](IOP-042-import-batches.md): integrated internal receipt/lifecycle;
  production parser/receiver composition remains unfinished.
- [IOP-043](IOP-043-canonical-event-model.md): integrated canonical aggregate design;
  runtime receiver/storage remains unfinished.
- [IOP-012](IOP-012-source-integration-contract.md): integrated syntax and normalization.

These contracts suffice for independent pure preparation, not runtime ingestion.
IOP-046 owns further validation/reporting composition, IOP-049 scoped classification,
and runtime host access still requires ADR-0018 implementation. No adjacent story
is activated or closed. Dependency capability matters, not numerical order.

## Non-goals

Implementing adjacent stories, inferring acceptance of open decisions or expanding
to the whole milestone. No customer names in core, integration registry, asset
inference, live connections, UI, receiver storage or automatic replacement.

## Validation and documentation impact

See the [execution record](../completed/IOP-045-csv-adapter-plan.md) for executable
normal/error/budget scenarios and actual results. The item, backlog, source-contract
handoff, API guide and delivery map are synchronized. The original Spanish prose
is translated into English; the read IOP-046 context receives translation only.

## Owner-supplied CSV and reporting context

The source has seven semicolon-delimited columns. Equipment designations remain
opaque text. The legacy loader reads UTF-16 and assigns the date parsed from
`Hitliste-YYYYMMDD.csv`; its repository rejects dates already present. That legacy
check alone does not establish concurrency-safe uniqueness. Reporting-window
coverage and future scoped retry/correction semantics must not be invented.
See the [shared evidence](../../product/csv-and-reporting-reference.md).

The TypeScript adapter implements the explicit IOP-012 grammar and exact seconds.
The missing Python `dauer_to_minutes` helper prevents a claim of legacy parity;
reconciliation on identical input remains pending before replacing that process.
The adapter does not infer source windows or introduce metric formulas. Existing
reference files establish format compatibility only, not end-to-end admission.

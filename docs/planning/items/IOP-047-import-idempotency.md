# IOP-047 — Deduplication/idempotency

## Status

In progress — internal POC date-admission verification is delivered. The production
OIP receiver and delivered import journey remain pending; no end-to-end completion
is claimed.

## Milestone and goal

M5 — Industrial Data Foundation. Reimport must not duplicate facts, limited to the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Operations needs traceable imported data and reconcilable metrics.

## Context and current state

Scope: Integrations and Operational Intelligence. See the
[modules](../../architecture/modules.md) and [planning workflow](../workflow.md).
The initial context came from the owner-requested outline; backlog membership alone
was not implementation authorization. The owner requested this POC story on 2026-09-26.

IOP-042 already supplies scoped successful-date uniqueness and atomic publication;
IOP-045 supplies pure CSV preparation. This increment verifies their composition
with retained synthetic CSV and a disposable receiver preserving physical lines
and exact measures. It does not introduce a second deduplication mechanism.
See the [execution record](../completed/IOP-047-import-idempotency-plan.md).

## Requirements and acceptance

- [x] Verify internal reimport rejection by `(organizationId, siteId, sourceId,
  reportingDate)` for identical and changed bytes, without changing admitted facts.
- [x] Verify concurrent publication admits at most one complete dataset; failed or
  invalid attempts do not permanently reserve a date, and uncertain success is
  reconciled without replay.
- [x] Preserve legitimate repeated source rows and their measures. Independent
  scopes/dates retain separate namespaces; a checksum is not the admission key.
- [ ] Verify that reimport does not duplicate production OIP facts through the
  delivered CSV import/review path, including visible conflict outcomes.
- [x] Document scenarios and necessary decisions without expanding scope, with
  validation evidence and synchronized documentation.

Only the described outcome is authorized. RAW → validation → normalization remains
the flow; the receiving module validates its invariants. Never infer a physical
asset from text alone. No automatic replacement, append or correction of an
already successful reporting date.

## Architecture and security constraints

Follow [ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
[Accepted ADR-0027](../../architecture/adr/ADR-0027-poc-import-publication.md)
and the [batch model](../../architecture/import-batches-poc.md) govern publication,
scoped date claims and recovery. Proposed ADRs do not authorize implementation.

Verify permission and organization/site scope for operations and references. Do
not include secrets, floor plans or production data. Keep industrial integrations
read-only; record material changes where applicable. Host activation remains gated
by ADR-0018 implementation and validation; internal tests do not open endpoints.

## Data, API and UI considerations

Preserve provenance and grain; distinguish occurrences from aggregates. Rejections
and corrections must remain visible. Use ingestion contracts; credentials and
external source columns belong in adapters/configuration. Expose import states,
errors and results only within this task's delivered path; no full dashboard.

The supported filename has one spelling per reporting date. Renaming bytes onto
an occupied date is rejected. Renaming identical bytes to a different free valid
date changes the label and remains admissible under the
[source contract](../../architecture/csv-source-contract-poc.md); byte equality
cannot prove a false reporting date. This is a review limitation, not a new global
hash-based deduplication rule. Repeated tuples inside a file remain separate facts.

## Dependencies and remaining handoff

- [IOP-042](IOP-042-import-batches.md): internal batch lifecycle and uniqueness are
  integrated on develop; production receiver composition remains pending.
- [IOP-045](IOP-045-csv-adapter.md): integrated bounded parser and exact normalization.
- Production OIP receiving storage, scoped classification and host activation must
  exist before the remaining delivered-path criterion can be verified. They are
  separate delivery prerequisites, not authorization to start adjacent stories.

Dependencies describe required capabilities rather than numerical execution order.
No new architectural decision is needed for the verified internal slice.

## Non-goals

Adjacent stories, implicit acceptance of open decisions or delivery of the entire
milestone. No customer names in core, background jobs, live integrations, automatic
replacement or cross-date hash rejection.

## Validation and documentation impact

The execution record defines commands and actual results for normal, error,
concurrency and access-denial scenarios using accepted tooling. The probe verifies
coordination and retained measures, not production analytical storage or the UI.
Update this item, its [backlog](../backlog.md) status and the plan; change contracts,
model, guides or ADRs only when their content changes. The original story is fully
translated into English with its goal, constraints and outstanding acceptance
preserved.

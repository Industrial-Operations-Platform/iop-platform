# IOP-048 — Reconciliation

## Status

In progress — internal POC reconciliation verification is delivered. Production
OIP facts and the delivered import/review path remain pending.

## Milestone and goal

M5 — Industrial Data Foundation. Reconcile RAW and normalized data, limited to the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Operations needs traceable imported data and reconcilable metrics.

## Context and current state

Scope: Integrations and Operational Intelligence. See the
[modules](../../architecture/modules.md) and [planning workflow](../workflow.md).
The original context came from the owner-requested outline; backlog membership
alone did not authorize implementation. The owner requested this POC story on
2026-09-26.

Internal receipt, parsing, validation, classification and date-admission contracts
are integrated on develop. This increment compares their composition through a
disposable PostgreSQL receiver against IOP-125's independent literal oracle.
See the [execution record](../completed/IOP-048-data-reconciliation-plan.md).
The probe is not production OIP storage or an analytical query implementation.

## Requirements and acceptance

- [x] Verify retained synthetic RAW against normalized physical lines, exact
  frequency/seconds, source dimensions and classification; reconcile per-file,
  combined and sector totals, including unclassified, repeated and zero-valued rows.
- [x] Verify settled counts satisfy data = admitted + rejected when fully counted;
  incomplete inspection retains unknown totals. Rejection, duplicate admission and
  receiver rollback must not add analytical measures.
- [ ] Reconcile RAW and production OIP facts through the delivered import/review
  path with actual scope/permission enforcement and visible discrepancies.
- [x] Document scenarios and necessary decisions without expanding scope, with
  actual validation evidence and synchronized documentation.

RAW → validation → normalization remains the flow. The receiving module validates
its invariants; never infer a physical asset from text alone. Preserve provenance
and aggregate grain. Header/blank lines are not data records; repeated tuples
remain distinct source lines. Warning counts can overlap and do not exclude rows.
Frequency is not record count; accumulated alarm seconds are not plant downtime.
Unknown reporting windows remain explicit. Rejections and corrections stay visible.

## Architecture and security constraints

Follow [ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
[Accepted ADR-0027](../../architecture/adr/ADR-0027-poc-import-publication.md)
and the [batch model](../../architecture/import-batches-poc.md) govern atomic
publication, counts and recovery. Proposed ADRs do not authorize implementation.

Verify permission and organization/site scope on operations and references. Keep
forced RLS and non-owner runtime access. Status/RAW review needs `imports.review`,
publication/recovery needs `imports.submit`, analytical reads need `analytics.read`.
No secrets, floor plans or production data are introduced. Industrial integrations
remain read-only; record material changes where applicable. ADR-0018 host activation
and validation remain independent runtime gates.

## Data, API and UI considerations

Use ingestion contracts; credentials and external source columns stay in adapters
or scoped configuration, outside the generic core. Expose import states, errors
and results only within the delivered task; no full dashboard is authorized here.
This increment supplies executable reconciliation evidence without a new endpoint,
reporting service, metric definition, schema or recovery mechanism.

Batch `reconcile` resolves uncertain publication outcomes from claim/count agreement;
it does not recalculate source frequency/duration or detect all measure corruption.
The independent oracle comparisons provide that measure evidence for the internal
test path only. They do not prove legacy Python/DAX parity or overview/detail parity.

## Dependencies and remaining handoff

- [IOP-046](IOP-046-import-validation.md) and
  [IOP-047](IOP-047-import-idempotency.md): relevant internal slices are integrated;
  delivered-path criteria remain open.
- [IOP-042](IOP-042-import-batches.md), [IOP-045](IOP-045-csv-adapter.md) and
  [IOP-049](IOP-049-source-mappings.md): available internal receipt, parser and
  pure scoped classification. Test composition is not production receiver delivery.
- [IOP-012](IOP-012-source-integration-contract.md) and
  [IOP-043](IOP-043-canonical-event-model.md): accepted source/aggregate rules;
  [IOP-125](IOP-125-demo-events.md): independent synthetic expected outputs.

Dependencies describe required capabilities, not numerical execution order.
Production OIP receiving storage and importer/host composition are required before
closing delivered reconciliation. These are separate prerequisites, not authorization
to start adjacent stories. No new architectural decision blocks internal verification.

## Non-goals

Adjacent stories, implicit acceptance of open decisions or delivery of the whole
milestone. No customer names in core, physical assets, workers, live integrations,
automatic repair/replacement, full dashboard or broader v1 functionality.

## Validation and documentation impact

The execution plan defines commands and expected-path, error and relevant access
rejection scenarios using accepted tooling. Record actual results rather than
fictional tests. Update this item, its [backlog](../backlog.md) status, the plan and
delivery map; change contracts, model, guides or ADRs only if their content changes.
The entire original Spanish context is translated into English, retaining its
goal, constraints and outstanding acceptance. Read dependencies were already English.

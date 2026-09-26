# IOP-048 — Reconciliation

## Status

Completed — selected local POC slice, delivered and verified under IOP-147 on
2026-09-27. Broader deferred platform capabilities are not included.

## Delivered outcome

The real importer and retained RAW reconcile against every physical line in the independent IOP-125 oracle. Full, per-file, sector, area, equipment and message results reconcile through actual PostgreSQL and HTTP.

## Requirements and acceptance

- [x] Verify retained synthetic RAW against normalized physical lines, exact
  frequency/seconds, source dimensions and classification; reconcile per-file,
  combined and sector totals, including unclassified, repeated and zero-valued rows.
- [x] Verify settled counts satisfy data = admitted + rejected when fully counted;
  incomplete inspection retains unknown totals. Rejection, duplicate admission and
  receiver rollback must not add analytical measures.
- [x] Reconcile RAW and production OIP facts through the delivered import/review
  path with actual scope/permission enforcement and visible discrepancies.
- [x] Document scenarios and necessary decisions without expanding scope, with
  actual validation evidence and synchronized documentation.

RAW → validation → normalization remains the flow. The receiving module validates
its invariants; never infer a physical asset from text alone. Preserve provenance
and aggregate grain. Header/blank lines are not data records; repeated tuples
remain distinct source lines. Warning counts can overlap and do not exclude rows.
Frequency is not record count; accumulated alarm seconds are not plant downtime.
Unknown reporting windows remain explicit. Rejections and corrections stay visible.

## Scope, dependencies and constraints

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this selected slice. Preserve generic module ownership, configured source
labels, exact aggregate grain, current permissions and forced scoped RLS. No live
industrial writes, customer-specific core logic or production/shared-use claim.

Required contracts/slices: [IOP-046](IOP-046-import-validation.md), [IOP-047](IOP-047-import-idempotency.md), [IOP-042](IOP-042-import-batches.md), [IOP-045](IOP-045-csv-adapter.md), [IOP-049](IOP-049-source-mappings.md), [IOP-012](IOP-012-source-integration-contract.md), [IOP-043](IOP-043-canonical-event-model.md), [IOP-125](IOP-125-demo-events.md).

Canonical specifications:

- [scope-poc](../../product/scope-poc.md)
- [ADR-0027-poc-import-publication](../../architecture/adr/ADR-0027-poc-import-publication.md)
- [import-batches-poc](../../architecture/import-batches-poc.md)

## Validation and traceability

[IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) records actual commands, results and limitations.
The [operator guide](../../development/running-poc.md) describes the delivered flow.

Prior design, internal or preview evidence (historical):

- [IOP-048-data-reconciliation-plan](../completed/IOP-048-data-reconciliation-plan.md)

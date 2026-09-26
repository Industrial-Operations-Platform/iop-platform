# IOP-047 — Deduplication/idempotency

## Status

Completed — selected local POC slice, delivered and verified under IOP-147 on
2026-09-27. Broader deferred platform capabilities are not included.

## Delivered outcome

Reimporting changed bytes on an admitted date visibly rejects the new attempt and preserves the original facts and revision. Legitimate repeated source lines remain distinct. The existing transaction/date-claim concurrency and recovery tests remain applicable.

## Requirements and acceptance

- [x] Verify internal reimport rejection by `(organizationId, siteId, sourceId,
  reportingDate)` for identical and changed bytes, without changing admitted facts.
- [x] Verify concurrent publication admits at most one complete dataset; failed or
  invalid attempts do not permanently reserve a date, and uncertain success is
  reconciled without replay.
- [x] Preserve legitimate repeated source rows and their measures. Independent
  scopes/dates retain separate namespaces; a checksum is not the admission key.
- [x] Verify that reimport does not duplicate production OIP facts through the
  delivered CSV import/review path, including visible conflict outcomes.
- [x] Document scenarios and necessary decisions without expanding scope, with
  validation evidence and synchronized documentation.

Only the described outcome is authorized. RAW → validation → normalization remains
the flow; the receiving module validates its invariants. Never infer a physical
asset from text alone. No automatic replacement, append or correction of an
already successful reporting date.

## Scope, dependencies and constraints

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this selected slice. Preserve generic module ownership, configured source
labels, exact aggregate grain, current permissions and forced scoped RLS. No live
industrial writes, customer-specific core logic or production/shared-use claim.

Required contracts/slices: [IOP-042](IOP-042-import-batches.md), [IOP-045](IOP-045-csv-adapter.md).

Canonical specifications:

- [scope-poc](../../product/scope-poc.md)
- [ADR-0027-poc-import-publication](../../architecture/adr/ADR-0027-poc-import-publication.md)
- [import-batches-poc](../../architecture/import-batches-poc.md)
- [csv-source-contract-poc](../../architecture/csv-source-contract-poc.md)

## Validation and traceability

[IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) records actual commands, results and limitations.
The [operator guide](../../development/running-poc.md) describes the delivered flow.

Prior design, internal or preview evidence (historical):

- [IOP-047-import-idempotency-plan](../completed/IOP-047-import-idempotency-plan.md)

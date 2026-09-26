# IOP-042 — Import batch model

## Status

Completed — selected local POC slice, delivered and verified under IOP-147 on
2026-09-27. Broader deferred platform capabilities are not included.

## Delivered outcome

Persistent receipts, original bytes, outcomes and bounded inspection counts now compose with the real parser, mapping stage and OIP receiver. Atomic date admission and explicit recovery preserve all-or-nothing publication.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Track original input, configured scope, reporting date, status and accepted/rejected
  counts. No worker/job dependency. Define atomic admission and failure/retry behavior
  with the importer: a failed attempt must not silently publish partial analytical facts
  or block a valid retry forever.

## Acceptance criteria

- [x] Record a bounded direct import and its outcome through the internal batch contract.
- [x] Validate the slice-specific outcomes and limitations in Requirements.
- [x] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Scope, dependencies and constraints

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this selected slice. Preserve generic module ownership, configured source
labels, exact aggregate grain, current permissions and forced scoped RLS. No live
industrial writes, customer-specific core logic or production/shared-use claim.

Required contracts/slices: [IOP-041](IOP-041-raw-ingestion-model.md).

Canonical specifications:

- [scope-poc](../../product/scope-poc.md)
- [import-batches-poc](../../architecture/import-batches-poc.md)
- [ADR-0027-poc-import-publication](../../architecture/adr/ADR-0027-poc-import-publication.md)

## Validation and traceability

[IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) records actual commands, results and limitations.
The [operator guide](../../development/running-poc.md) describes the delivered flow.

Prior design, internal or preview evidence (historical):

- [IOP-042-import-batch-storage-plan](../completed/IOP-042-import-batch-storage-plan.md)
- [IOP-042-import-batches-plan](../completed/IOP-042-import-batches-plan.md)

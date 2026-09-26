# IOP-046 — Data validation

## Status

Completed — selected local POC slice, delivered and verified under IOP-147 on
2026-09-27. Broader deferred platform capabilities are not included.

## Delivered outcome

The delivered upload/review path presents persisted line/field diagnostics and complete versus interrupted inspection counts. Invalid CSV contributes no analytical facts.

## Requirements

- Deliver only the result described for IOP-046.
- RAW → validation → normalization; the receiving module validates invariants. Do not infer a physical asset from text alone.

## Acceptance criteria

- [x] Internal POC report identifies invalid rows with bounded safe diagnostics,
  complete/unknown counts and all-or-nothing preparation.
- [x] Visible invalid records through the delivered importer/review path.
- [x] The plan documents scenarios and necessary decisions without expanding scope.
- [x] Validation evidence and synchronized documentation exist.

## Scope, dependencies and constraints

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this selected slice. Preserve generic module ownership, configured source
labels, exact aggregate grain, current permissions and forced scoped RLS. No live
industrial writes, customer-specific core logic or production/shared-use claim.

Required contracts/slices: [IOP-045](IOP-045-csv-adapter.md), [IOP-012](IOP-012-source-integration-contract.md), [IOP-042](IOP-042-import-batches.md).

Canonical specifications:

- [scope-poc](../../product/scope-poc.md)

## Validation and traceability

[IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) records actual commands, results and limitations.
The [operator guide](../../development/running-poc.md) describes the delivered flow.

Prior design, internal or preview evidence (historical):

- [IOP-046-import-validation-plan](../completed/IOP-046-import-validation-plan.md)

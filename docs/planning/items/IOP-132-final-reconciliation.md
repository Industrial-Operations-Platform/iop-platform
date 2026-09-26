# IOP-132 — Data reconciliation

## Status

Completed — selected local POC slice, delivered and verified under IOP-147 on
2026-09-27. Broader deferred platform capabilities are not included.

## Delivered outcome

The independent baseline reconciles 9 source facts, frequency 19 and 97,775 seconds across file/history, grouped results and both views. Rejected and duplicate input preserves totals; unclassified/zero/repeated rows remain accounted for. Legacy Python/Power BI execution parity is not claimed.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Compare independently calculated frequency/duration with both views under identical
  filters, accounting for rejected and unresolved input. No login or cross-module
  workflow is required for numerical reconciliation; shared-use access validation
  remains separate.

## Acceptance criteria

- [x] Verify source-to-report totals for the analytical POC.
- [x] Validate the slice-specific outcomes and limitations in Requirements.
- [x] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Scope, dependencies and constraints

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this selected slice. Preserve generic module ownership, configured source
labels, exact aggregate grain, current permissions and forced scoped RLS. No live
industrial writes, customer-specific core logic or production/shared-use claim.

Required contracts/slices: [IOP-048](IOP-048-data-reconciliation.md), [IOP-096](IOP-096-analytics-drilldown.md), [IOP-129](IOP-129-end-to-end-scenario.md).

Canonical specifications:

- [scope-poc](../../product/scope-poc.md)
- [ADR-0018-local-poc-execution-context](../../architecture/adr/ADR-0018-local-poc-execution-context.md)

## Validation and traceability

[IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) records actual commands, results and limitations.
The [operator guide](../../development/running-poc.md) describes the delivered flow.

Prior design, internal or preview evidence (historical):

- [IOP-132-final-reconciliation-plan](../completed/IOP-132-final-reconciliation-plan.md)

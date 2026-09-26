# IOP-129 — POC end-to-end demonstration

## Status

Completed — selected local POC slice, delivered and verified under IOP-147 on
2026-09-27. Broader deferred platform capabilities are not included.

## Delivered outcome

The complete local journey is demonstrated through real PostgreSQL/API/Chromium and the operator commands: enter, upload, review errors/duplicates, analyze file/history, drill/return, switch user, reload and safely recreate. No owner usability opinion is inferred.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Import a known fixture, inspect errors/duplicates, verify overview/detail filters and
  totals, and present from IOP. Login, memberships UI, surveys, maps, shifts and
  maintenance are not gates. Validate the accepted local context mechanism separately
  before runtime access; completion is POC evidence, not shared-use release acceptance.

## Acceptance criteria

- [x] Demonstrate the local CSV-to-presentation POC.
- [x] Validate the slice-specific outcomes and limitations in Requirements.
- [x] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Scope, dependencies and constraints

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this selected slice. Preserve generic module ownership, configured source
labels, exact aggregate grain, current permissions and forced scoped RLS. No live
industrial writes, customer-specific core logic or production/shared-use claim.

Required contracts/slices: [IOP-001](IOP-001-v1-personas-and-pilot-workflow.md), [IOP-048](IOP-048-data-reconciliation.md), [IOP-096](IOP-096-analytics-drilldown.md), [IOP-103](IOP-103-csv-integration.md), [IOP-128](IOP-128-demo-reset.md).

Canonical specifications:

- [scope-poc](../../product/scope-poc.md)
- [ADR-0018-local-poc-execution-context](../../architecture/adr/ADR-0018-local-poc-execution-context.md)

## Validation and traceability

[IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) records actual commands, results and limitations.
The [operator guide](../../development/running-poc.md) describes the delivered flow.

Prior design, internal or preview evidence (historical):

- [IOP-129-end-to-end-scenario-plan](../completed/IOP-129-end-to-end-scenario-plan.md)

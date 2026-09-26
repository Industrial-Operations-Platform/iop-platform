# IOP-094 — Source equipment analytics (POC)

## Status

Completed — selected local POC slice, delivered and verified under IOP-147 on
2026-09-27. Broader deferred platform capabilities are not included.

## Delivered outcome

Source-scoped area/equipment pairs and text/type/group message tuples are grouped by the backend, with complete totals and provenance. Tests cover independent equipment totals, identical designations across areas, distinct message types and historical classifications without creating physical assets.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Group the two measures by source-scoped equipment designation and retain contributing
  messages. Do not create surveyed assets from text. IOP-044 becomes relevant only when
  physical asset linkage is separately delivered.
- Equipment identity is the exact source-scoped area/equipment pair. Preserve
  message text/type/group tuples, repeated lines, zero measures and unclassified
  facts; both measures and record count reconcile across the complete selection.
- Reuse shared filters, data revision, coverage and contributing-record provenance
  between overview and detail; no totals derived from a single record page.

## Acceptance criteria

- [x] Runtime source-equipment groups and contributing messages reconcile without a physical asset registry.
- [x] Validate shared navigation, filters, coverage, zero/empty states and relevant
  access denial through the delivered path.
- [x] Record specification evidence and synchronize the story/plan; runtime
  acceptance is recorded under IOP-147.

## Scope, dependencies and constraints

The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this selected slice. Preserve generic module ownership, configured source
labels, exact aggregate grain, current permissions and forced scoped RLS. No live
industrial writes, customer-specific core logic or production/shared-use claim.

Required contracts/slices: [IOP-090](IOP-090-event-frequency.md), [IOP-091](IOP-091-downtime.md), [IOP-089](IOP-089-analytics-query-layer.md).

Canonical specifications:

- [scope-poc](../../product/scope-poc.md)
- [source-equipment-analytics-poc](../../product/source-equipment-analytics-poc.md)

## Validation and traceability

[IOP-147 execution evidence](../completed/IOP-147-working-analytical-poc-plan.md) records actual commands, results and limitations.
The [operator guide](../../development/running-poc.md) describes the delivered flow.

Prior design, internal or preview evidence (historical):

- [IOP-094-source-equipment-analytics-plan](../completed/IOP-094-source-equipment-analytics-plan.md)

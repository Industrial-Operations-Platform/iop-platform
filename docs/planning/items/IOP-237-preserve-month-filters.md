# IOP-237 — Preserve analytical filters when months change

Status: Completed. Publication to origin approved on 2026-11-13. The owner reports that adding/removing comparison months
clears the analytical criteria and requests keeping the current selection.

## Acceptance

- [x] Adding/removing months preserves applied and unsaved dimension/numeric
  filters, search, grouping, measure and period until explicit Apply.
- [x] Refresh compatible choices for the new months without silently clearing
  retained values. Empty matches remain a valid empty selection; retained fields
  can still be cleared individually. Ignore old responses and keep retry behavior.
- [x] Preserve the empty-month guard, explicit Clear filters reset and existing
  downward cascade when a dimension changes. Verify UI behavior and relevant
  browser/contract/design checks, document and commit the change locally.

Reuses [IOP-162](IOP-162-shared-month-filters.md) and Accepted
[ADR-0023](../../architecture/adr/ADR-0023-poc-analytics-filters.md)/ADR-0032.
The implementation was prepared independently from develop. The owner approved
integrating both filter corrections into develop and publishing their review
branches and develop to origin, with a clean working tree.

[Execution evidence](../completed/IOP-237-preserve-month-filters-plan.md).

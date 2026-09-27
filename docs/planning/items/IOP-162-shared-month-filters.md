# IOP-162 — Consistent month filters in the running analytical workspace

Status: Completed

The owner reports that analysis still exposes date ranges, cannot compare multiple
months or clear collapsed filters, and requires selected months to constrain all
subsequent detail views. The running local web image predates IOP-160.

## Acceptance

- [x] Every investigation view (Halle through Daily/monthly) exposes multiple-month
  selection, including direct entry from Executive Overview. Keep the executive
  overview's existing single-month KPI scope.
- [x] Preserve applied months through navigation/drill-down and identify restricted
  month selection as an active filter. Clear remains visible outside the disclosure
  and resets months/dimension filters together.
- [x] Refresh the local web/API application and verify the actual 8080 workspace
  against retained history, without modifying database volumes or importing data.

Reuses [IOP-160](IOP-160-month-comparison.md) contracts and existing boundaries.
Plan: [execution](../completed/IOP-162-shared-month-filters-plan.md).

# IOP-160 — Monthly Halle comparison and accessible filter reset

Status: Completed

The owner requests month selection instead of date inputs in Halle analysis,
distinct month colors in the comparison legend, and clearing active filters while
their panel is collapsed.

## Acceptance

- [x] Select one or multiple complete months, including nonconsecutive months;
  server totals, rankings, records and charts include only those months.
- [x] Show each compared month with a distinct color and a visible legend.
- [x] Clear applied filters without expanding the panel; month comparison resets
  to all available months and drill-down retains selected months.
- [x] Verify validation, database aggregation, UI interactions and responsive layout.

Existing [ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md)
and [ADR-0033](../../architecture/adr/ADR-0033-relational-hitliste-analytics.md)
boundaries apply. No new architectural pattern or database schema is required.
Plan: [execution](../completed/IOP-160-month-comparison-plan.md).

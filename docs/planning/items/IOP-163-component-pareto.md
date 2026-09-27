# IOP-163 — Selected-month component totals and Pareto charts

Status: Completed

The owner requests overlaid monthly comparison, component totals across selected
months in supporting charts, distinct scatter colors, frequency and duration top
10 Pareto charts, and highest-frequency components first in the period heatmap.

## Acceptance

- [x] Preserve distinct overlaid monthly series and sum only selected months for
  supporting frequency/duration rankings and scatter points.
- [x] Show independent frequency and minutes top 10 with cumulative percentages
  against full matching totals and an 80% reference, including the crossing group.
  Explain when the top 10 does not reach 80% and handle zero totals.
- [x] Distinguish scatter components by color and retain names and drill-down.
- [x] Show the frequency leaders at the top of the period heatmap, descending,
  including when the comparison measure is duration.
- [x] Verify aggregation, chart options, browser rendering and responsive behavior.

Extends [IOP-160](IOP-160-month-comparison.md) and
[IOP-162](IOP-162-shared-month-filters.md) within existing
[ADR-0010](../../architecture/adr/ADR-0010-frontend-charting-testing.md) and
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md).
Plan: [execution](../completed/IOP-163-component-pareto-plan.md).

Local refresh and approved publication: [execution](../completed/IOP-163-local-publication-plan.md).

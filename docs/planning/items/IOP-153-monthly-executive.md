# IOP-153 — Monthly Executive Overview and comparative KPIs

Status: Completed

The owner requests a monthly Executive Overview matching the supplied layout: area
frequency ranking, a daily area heatmap ordered highest-first, overlaid frequency
and alarm-minute trends, and lower-is-better KPIs compared with an explicit goal
or the global historical average. Reusable components are the default; preserve
existing visual identity, extending only semantic positive/negative tokens.

## Acceptance

- [x] Select a month; all executive charts and KPIs use that month.
- [x] Rank areas by frequency and show a daily matrix highest-first, with missing
  dates distinct from imported zero values and full totals independent of display limits.
- [x] Compare monthly and global averages consistently, with persisted optional
  goals, red above reference and green below; explain denominator and equality.
- [x] Use reusable month/KPI/chart components within existing hexagonal boundaries.
- [x] Verify exact backend results, permissions, UI interactions and desktop/mobile
  rendering; retain independent investigation templates and historical data.

The owner confirmed administrator-selected Meldetext KPIs with optional goals.
Use and label daily averages over imported dates for the month and all history;
include the selected month in history and exclude missing imports. Do not infer
goals from the screenshot. Settings preserve their configured order.
Plan: [execution](../completed/IOP-153-monthly-executive-plan.md).

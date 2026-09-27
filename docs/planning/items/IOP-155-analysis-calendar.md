# IOP-155 — Exclude Sundays from analysis

Status: Completed

The owner excludes Sundays from all analyses. Use the CSV reporting date, not
server time. Keep Sunday imports, original bytes and administrator file browsing.

## Acceptance

- [x] Exclude Sundays from report totals, rankings, filter options, period series,
  legacy analytics and available analytical dates.
- [x] Exclude Sunday dates from monthly and historical KPI denominators and totals.
  Preserve eligible imported zero days and gaps for missing eligible dates.
- [x] Omit Sundays from daily chart axes and show eligible monthly coverage and
  the calendar policy without changing shared visual identity.
- [x] Keep all Sunday source evidence and administrator file access unchanged.
- [x] Validate domain rules, SQL integration, chart output and the local seeded stack.

Use Accepted ADR-0031/0032/0033 boundaries: source configuration at composition,
framework-free calendar rules, SQL aggregation in outbound adapters.
Plan: [execution](../completed/IOP-155-analysis-calendar-plan.md).

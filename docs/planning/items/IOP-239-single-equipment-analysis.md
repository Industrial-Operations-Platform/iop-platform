# IOP-239 — Focused analysis for one selected equipment identifier

Status: Completed locally; publication pending owner approval

The owner requests useful sensor-specific totals and analysis on the final Data
Analysis page instead of a group comparison when one sensor is selected.

## Scope and acceptance

- [x] On Daily / monthly, recognize one explicitly selected equipment identifier
  and show its identity, selected reporting scope and full matching totals.
- [x] Show frequency, accumulated alarm time, daily averages, weighted alarm time
  per occurrence and relevant daily activity/peak observations. Replace the group
  heatmap/ranking presentation in this case; preserve multi-equipment analysis.
- [x] Respect selected months, other filters, excluded weekdays/values, imported
  zero-activity dates and missing imports. Totals come from the server snapshot,
  never paginated source rows or bounded chart groups. Do not infer physical sensor
  identity, individual incident duration, uptime or plant downtime.
- [x] Reuse shared identity/components, supply English/German presentation and
  verify calculations, navigation, empty results and desktop/narrow rendering.

Uses existing report contracts and Accepted
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md).
No API, persistence, authorization or architectural pattern change is required.

Execution and validation: [plan](../completed/IOP-239-single-equipment-analysis-plan.md).

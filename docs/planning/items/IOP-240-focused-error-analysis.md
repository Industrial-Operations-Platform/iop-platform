# IOP-240 — Focused analysis for one or two errors

Status: Completed; published through develop and verified on Railway

The owner requests useful event information in Error analysis when only a few
error types match. The explicit correction sets the threshold to one or two,
not three. Duration versus frequency is the only chart needed in that case.

## Scope and acceptance

- [x] In Error analysis grouped by message, show a focused summary and per-error
  information for exactly one or two matching error types. Keep only the duration
  versus frequency chart; omit monthly comparison and Pareto charts in this case.
- [x] Keep the existing comparison/Pareto presentation for three or more errors,
  other grouping dimensions and other report views. Preserve empty results and
  drill-down to the existing single-equipment daily view.
- [x] Show full filtered totals, daily averages over eligible imported dates,
  aggregate alarm minutes per occurrence and relevant per-error contributions.
  Respect selected months/exclusions; never infer individual incidents or downtime.
- [x] Hovering any duration-versus-frequency point shows its name, frequency and
  accumulated alarm duration in minutes, regardless of the selected measure.
- [x] Verify the 0/1/2/3 boundary, tooltips in English/German, desktop/mobile,
  zero denominators and existing single-equipment/navigation behavior.

Uses existing report snapshots and Accepted
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md).
No API, persistence or new architectural pattern is required.

Execution and validation: [plan](../completed/IOP-240-focused-error-analysis-plan.md).
The owner approved publication and Railway verification on 2026-11-20.
[Publication evidence](../completed/IOP-240-publication-plan.md) records complete
CI, exact live release `333508c`, hosted desktop/mobile fixture checks and unchanged
remote table/import counts.

# IOP-241 — Scalable selection of months across years

Status: Completed; publication and Railway verification authorized

The owner requests a compact filter for choosing one or several months from the
same or different years, remaining manageable when history exceeds twenty months.

## Scope and acceptance

- [x] Replace the flat month-checkbox list with a compact shared month selector:
  year navigation, a bounded twelve-month grid, imported-month availability and
  selection that survives year changes. Support arbitrary nonconsecutive months.
- [x] Offer selecting/clearing the displayed year and all-month/clear-selection
  actions so choosing one month does not require unchecking a long history.
- [x] Show compact selection counts/year coverage for large selections instead of
  listing every selected month in the collapsed filter. Keep the full selection
  inspectable through the year/month control.
- [x] Preserve explicit Apply, the empty-month guard, other draft/applied filters,
  navigation/drill-down and Clear filters semantics from IOP-237/162. Preserve the
  executive overview's deliberate single-month scope and existing query budgets.
- [x] Verify more than twenty months spanning years, keyboard/Escape/focus behavior,
  English/German and narrow/desktop light/dark presentation.

Uses the existing shared Popover/native controls and Accepted
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md).
No API, persistence, authorization or new architectural pattern is required.

Execution and validation: [plan](../completed/IOP-241-scalable-month-picker-plan.md).
The owner approved publication and Railway verification on 2026-11-20.
[Publication plan](../active/IOP-241-publication-plan.md).

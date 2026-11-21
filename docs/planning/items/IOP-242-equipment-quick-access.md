# IOP-242 — Equipment analysis quick access

Status: Completed; published through develop and verified on Railway

The owner requests a complementary entry from Data Analysis that finds a sensor
by equipment code without manually changing the report filters. The owner suggests
a search dialog that opens the existing Daily / monthly behavior analysis.

## Scope and acceptance

- [x] Add a clearly labelled quick action in Data Analysis, without another report
  screen or navigation tab. Closing search leaves the current analysis unchanged.
- [x] Search imported equipment codes with debounced, bounded autocomplete; do not
  fetch a sensor report until a suggestion is explicitly selected. Show loading,
  empty and retry states, support keyboard selection and ignore stale responses.
- [x] Distinguish repeated codes by their exact sector/area context. Search the
  authorized source history independently of current dimension/date restrictions.
- [x] Open the existing focused Daily / monthly view for the chosen code/context,
  retaining selected months, replacing unrelated dimension filters and resetting
  paging/search/revision. Normal report filters remain available afterwards.
- [x] Reuse the shared identity/dialog/controls, provide English/German text and
  verify selection rules, authorized bounded reads, desktop/mobile and regressions.

OIP owns imported identifier lookup under `analytics.read`; this does not register
physical sensors or use Assets permissions. Reuses Accepted
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md)
and [IOP-239](IOP-239-single-equipment-analysis.md).
The owner authorized publication through develop to origin and Railway verification
on 2026-11-21.

Execution and local validation: [plan](../completed/IOP-242-equipment-quick-access-plan.md).
[Publication evidence](../completed/IOP-242-publication-plan.md) records complete
Linux validation, including the real PostgreSQL lookup cases, exact live revision
`15f954d`, hosted desktop/mobile checks and unchanged table/import counts.

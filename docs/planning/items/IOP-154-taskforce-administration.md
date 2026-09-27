# IOP-154 — Taskforce view and file administration

Status: Completed

The owner requests whole-field dropdowns for months and database-backed Meldetext
KPI choices, without already-selected messages. Source rows belong in a dedicated
administrator file section, with column-header sorting cycling ascending, descending
and off for sector, area, equipment, message, type and message group. Add an empty
Start page, readable context labels and a default Taskforce presentation with an
explicit administrator-mode toggle for authorized users.

## Acceptance

- [x] Select imported months and available KPI messages from scrollable dropdowns.
- [x] Keep source rows out of every analytical template; browse them per file in
  administration with stable server-side, three-state column sorting across pages.
- [x] Default to Taskforce presentation; only authorized users can expose import,
  preparation, KPI settings and file tools using the administration toggle.
- [x] Provide a blank Start page and friendly page context, retaining shared identity.
- [x] Verify authorization, sorting, complete message choices, navigation and responsive
  browser behavior. Preserve the existing historical data and hexagonal boundaries.

Dependencies: [IOP-153](IOP-153-monthly-executive.md), Accepted ADR-0031/0032/0033.
Plan: [execution](../completed/IOP-154-taskforce-administration-plan.md).

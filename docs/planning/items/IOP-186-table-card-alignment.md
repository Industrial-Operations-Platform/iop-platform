# IOP-186 — Table headings and operational card alignment

Status: Completed

## Authorized request

Owner request of 2026-10-01: correct table/header alignment and the operational
card layout regressions shown in Weekly plan and Shift Handover.

## Acceptance

- Center shared column/group headers horizontally and vertically, including Weekly plan
  day/shift groups and Department matrix. Preserve appropriate body alignment.
- Improve Personal schedules body presentation, particularly person-name emphasis,
  using the established Workforce typography and shared identity.
- Keep Journal, My entries, Needs attention and Open reports card contents aligned
  to the left edge of their padded surface, with readable wrapping on narrow screens.
- Center My day shift-leader group headings horizontally and vertically.
- Preserve card/detail navigation, table scrolling and existing data behavior;
  verify desktop/mobile rendering and relevant frontend checks.

References: [IOP-185](IOP-185-administration-workforce-ui.md),
[visual identity](../../design/visual-identity.md),
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md).

[Execution evidence](../completed/IOP-186-table-card-alignment-plan.md)

## Approved publication and activation

On 2026-10-01 the owner approved merging the story into `develop`, publishing
both branches to `origin` and updating the local Docker application.
Both branches are published, and Docker serves the validated UI at
`http://127.0.0.1:8080`. All services are healthy; the existing API and database
containers and persistent data were retained.
[Publication and activation evidence](../completed/IOP-186-publication-activation-plan.md).

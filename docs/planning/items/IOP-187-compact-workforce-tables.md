# IOP-187 — Compact Workforce matrices and shared table alignment

Status: Completed

## Authorized request and acceptance

Owner request of 2026-10-01:

- Show compact person names in Weekly plan, without repeated hours or zones; show
  only a small phone icon for assignments with a phone. Keep details accessible.
- Render Other zones as a zone-by-shift matrix using the same compact summaries.
- Center every table header horizontally and vertically, including the first.
  Body cells center vertically; the first column stays left aligned and the
  remaining columns center horizontally unless explicitly specified otherwise.
  Apply consistently across the project,
  including Personal schedules and Users; reduce the User-to-Profile spacing.
- Remove the darker top stripe from My entries and every use of that card style.
- Reduce shared highlighted-label padding so text aligns more closely with nearby
  content, including assignment shift badges.
- Preserve details, localization, keyboard access and bounded mobile scrolling;
  verify desktop/mobile rendering and relevant checks.

References: [IOP-186](IOP-186-table-card-alignment.md),
[visual identity](../../design/visual-identity.md),
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md).

[Execution evidence](../completed/IOP-187-compact-workforce-tables-plan.md).
The initial increment is implemented and validated locally.
Publication and activation of the running Docker application remain pending owner
approval.

## Owner refinement before publication — 2026-10-01

- Apply justified alignment to table prose exceeding two rendered lines. In
  Department matrix, left-align the What? title button, retain centered supporting
  metadata and stack status badges vertically.
- Daily shift leaders show only person names under their shift headings. Floating
  support/maintenance summaries show the person and shift without repeated hours.
- Emphasize the responsible person's name and entry date in My entries. Give
  category labels colored badges (including Successes, Problems, Safety and
  Information), consistently across the corresponding summaries/matrix/details.

[Refinement evidence](../completed/IOP-187-table-content-refinement-plan.md).
The refinement is implemented and validated locally; publication and Docker
activation still await the owner's explicit approval.

# IOP-187 — Compact Workforce matrices and shared table alignment

Status: Completed

## Authorized request and acceptance

Owner request of 2026-10-01:

- Show compact person names in Weekly plan, without repeated hours or zones; show
  only a small phone icon for assignments with a phone. Keep details accessible.
- Render Other zones as a zone-by-shift matrix using the same compact summaries.
- Center all table columns horizontally and vertically except the first column,
  which stays left aligned. Apply consistently to headers and body content,
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
All requested presentation changes are implemented and validated locally.
Publication and activation of the running Docker application remain pending owner
approval.

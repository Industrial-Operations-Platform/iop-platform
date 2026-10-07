# IOP-198 — Start assignment layout and operational presentation

Status: Completed

Owner request of 2026-10-06, with screenshots: improve assigned-maintenance
readability, compact Meeting preparation headers and notifications, and organize
operator Start around a shared day/week assignment selection below Profile.

## Scope and acceptance

- [x] Place Your assignment below Profile; keep Day/Week and date controls together.
  Update the assignment content without clearing it during period loading, and
  preserve Your department at a glance in both views.
- [x] Present assigned maintenance inside Start's assignment area, with two readable
  cards per desktop row and stacked metadata; use one column on narrow screens.
  Operators access assigned work from Start/notices without a Maintenance sidebar
  entry. Coordinating profiles retain the Maintenance workspace entry.
- [x] Connect the selected assignment period to shifts and assigned maintenance.
  Select date-only due dates in the period, retaining overdue/undated work. Keep
  the current department summary visible across both views.
- [x] Put Meeting preparation category counts beside their labels, keep add actions
  at the right and remove excessive empty-card spacing.
- [x] Provide a compact notification header and distinct bounded, scrollable feed
  content, with readable titles/metadata, keyboard access and existing read actions.
- [x] Validate behavior, desktop/narrow rendering, shared identity and architecture;
  synchronize documentation and commit locally for owner review.

Dependencies: [IOP-196](IOP-196-personal-operational-workflows.md),
[IOP-194](IOP-194-maintenance-asset-history.md),
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md),
[ADR-0036](../../architecture/adr/ADR-0036-shift-handover.md),
[visual identity](../../design/visual-identity.md).
No API/schema or permission change is included. Deployment remains outside scope.
Execution: [plan](../completed/IOP-198-start-assignment-layout-plan.md).
Implemented and validated locally. On 2026-10-07 the owner approved integration
into develop and publication of the story branch and develop to origin. Merge
`e76477d` completed without conflicts and both remote refs were independently
verified after the atomic push. See [publication evidence](../completed/IOP-198-publication-plan.md).
Owner product review remains separate from publication.

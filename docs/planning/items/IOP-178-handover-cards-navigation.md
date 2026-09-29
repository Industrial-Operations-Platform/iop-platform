# IOP-178 — Consistent journal cards and contextual detail navigation

Status: Completed locally. Owner screenshot feedback, 2026-09-29.

## Scope and acceptance

- Journal previews use the same bordered, navy-title and muted-department cards
  as Meeting preparation, sharing their implementation. Keep category creation,
  preview limits, counts and history actions available.
- The heading identifies the current view: Journal, Department matrix, Meeting
  preparation (or Daily overview) and My entries.
- Detail adds Details to that path. Selecting the preceding view returns to that
  exact tab with its existing department, date, filters and loaded pages intact.
  Selecting the module root or sidebar still explicitly returns to Journal home.
- Verify card consistency and navigation across tabs, filtered history, desktop
  and mobile under the [canonical identity](../../design/visual-identity.md).

React presentation changes only, within Accepted ADR-0032/0036. No domain/API,
permission or persistence changes. This refines IOP-175's home-only breadcrumb.

Execution: [plan](../completed/IOP-178-handover-cards-navigation-plan.md).

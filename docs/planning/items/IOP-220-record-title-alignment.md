# IOP-220 — Align record titles with their supporting content

## Status and goal

Completed. Owner request of 2026-10-20: improve the title/content hierarchy shown
in Current pending Handover issues, Shift records and Improvement Tracking Actions,
starting from `develop`. Blue record titles currently appear level with or slightly
to the right of their supporting content, especially in Improvement Tracking.

## Scope and acceptance

- [x] Start blue record titles at the existing padded content edge and inset their
  descriptions/location/status metadata slightly (8px), making grouping clear.
- [x] Remove excess inherited inline padding on the affected title buttons while
  preserving the platform link token, typography, focus and usable targets.
- [x] Apply the hierarchy to the three requested collections, retaining other card
  layouts, navigation, wrapping, table scrolling and mobile containment.
- [x] Validate desktop/narrow rendering in light/dark appearances, relevant web
  regressions and shared identity/boundary checks; commit locally on a story branch.

Follow the [visual identity](../../design/visual-identity.md),
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md) and
[story workflow](../workflow.md). This is a presentation refinement only.

## Evidence and remaining work

[Execution evidence](../completed/IOP-220-record-title-alignment-plan.md).

# IOP-228 - Bound card collections with internal scrolling

## Status and goal

Completed locally. The owner's 2026-11-08 request asks for a maximum card-panel height
throughout the platform, including Maintenance and Shift Handover, following Area
Overview's existing internally scrolling collections.

## Scope and acceptance

- [x] Reuse a shared 26rem maximum for growing card collections, reduced on short
  viewports; short and empty collections retain natural height.
- [x] Keep panel headings, totals and collection actions outside the scrolling body.
- [x] Apply the shared rule to Maintenance boards/assignments/related reports,
  Handover summary/formal collections, Area Overview, Workforce card collections
  and Digital Asset Record timeline cards.
  Preserve existing bounded tables, dialogs and Locator lists.
- [x] Preserve responsive grids, aligned category panels, keyboard access, visible
  focus and access to the last record without horizontal page overflow.
- [x] Validate desktop/mobile rendering and existing workflows; commit on a story branch.

Presentation only: shared design CSS/tokens and React adapters own the change.
No API, domain or persistence changes. Follow the [visual identity](../../design/visual-identity.md)
and [workflow](../workflow.md). See the [execution record](../completed/IOP-228-bounded-card-collections-plan.md).

The web build, 319 web unit tests, 26 architecture checks and all 115 browser tests
passed. Publication and hosted activation await the owner's separate authorization.

# IOP-227 — Consistent native dropdown contrast

## Status and goal

Completed. The owner requested that every dropdown remain readable when opened,
matching the working month selector. Supplied Windows screenshots show pale text
on white option menus in dark appearance for location, department and appearance.

## Scope and acceptance

- [x] Shared native select options use the selected identity's opaque surface and
  readable ink, including compact filters and account-menu controls.
- [x] Light, Dark and System appearance retain native selection, keyboard focus
  and bounded desktop/mobile layout; the month selector remains consistent.
- [x] Audit native select ownership and validate the fix with browser regression
  coverage, the web build, design/architecture guards and visual review.

Presentation-only correction under the existing [visual identity](../../design/visual-identity.md)
and Accepted [ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md).
No API, business rules or customer data changes.

## Evidence and remaining work

Execution and validation: [completed plan](../completed/IOP-227-dropdown-contrast-plan.md).
Shared option colors cover every native select; 319 web tests, 9 browser scenarios
and the web build passed. Implementation commit: `d9ab839`. On 2026-11-08 the owner
approved merging the story into `develop` and pushing both branches to `origin`;
the completed plan records the publication procedure.

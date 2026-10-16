# IOP-214 — Execution plan

In progress. Authorized by the owner's 2026-10-15 instruction to implement the
review findings without additional decision approvals.
Branch: `fix/IOP-214-desktop-consistency`, from `develop` `905f398`.
[Permanent scope](../items/IOP-214-desktop-consistency.md).

## Changes and steps

1. Repair browser adapter lifecycle/pagination in Formal Handover, Area overview
   and Improvements; add regression tests for delayed, failed and stale requests.
2. Extend shared presentation layout/facts/table roles in `apps/web/src/design/`;
   make desktop navigation scroll within the viewport and native controls inherit
   appearance. Apply approved semantic alignment without feature-specific palettes.
3. Harmonize Improvements, Integrations and Asset Management collections, details,
   forms, filter/reset states and localized labels; reuse existing shared components.
4. Compact Workforce weekly planning without hiding assignment details or changing
   scheduling policy. Preserve bounded narrow-screen overflow and sticky context.
5. Correct Locator card typography and defer analytical rendering through the
   existing React adapter/composition boundaries; measure production bundle changes.
6. Update browser checks, including the stale connection status assertion, cover
   short desktop navigation/new module presentation, inspect screenshots, synchronize
   visual/component docs, finish the item/backlog and commit logical increments.

Ownership stays in presentation/HTTP adapters and the host composition root.
Application/domain contracts, authorization and persisted business data are unchanged.
Existing Accepted ADRs cover these refinements; no new architectural pattern is
required. Read dependencies IOP-202, IOP-212 and IOP-187 are already English;
no translation-only edits are required.

## Validation and evidence

Use Node 24.21.0/npm 10.9.2. Run web/API tests, type checks, design/architecture
guards, generated contract check and production build. Exercise desktop widths
1366/1440/1920, a 768px-high viewport, both appearances and a narrow regression.
Browser fixtures must be identified as such; do not claim real plant acceptance or
database migration verification from UI fixtures. Record actual results here.

- Formal Handover/Area overview: 12 focused tests passed, including three new
  regressions that failed against the original implementation.
- API: 48 suites / 509 tests passed with temporary loopback HTTP listeners.
- Full repository typecheck, generated browser contract check and 25 secret-hygiene
  tool tests passed. Final visual/presentation verification remains in progress.

## Closure

Complete acceptance and visual/code review, update backlog/item, move this plan to
`completed/`, and record commit hashes/working-tree status. Remote publication remains
subject to the repository's explicit branch publication convention.

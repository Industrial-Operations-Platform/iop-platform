# IOP-228 - Bounded card collections execution plan

Completed. Authorized by the owner's 2026-11-08 scrolling request.
Branch: `fix/IOP-228-bounded-card-collections`, created from `develop`.
[Scope and acceptance](../items/IOP-228-bounded-card-collections.md).

## Changes and steps

1. Add a shared collection height token and scrolling CSS utility in
   `apps/web/src/design/{identity.ts,components/components.css}`; document the
   usage in the component README and `docs/design/visual-identity.md`.
2. Apply the utility with keyboard focus to card-list bodies in Maintenance,
   Shift Handover, Area Overview and Workforce React adapters. Keep headings,
   pagination and drag/drop owners outside the scrolling body; avoid nesting
   independently bounded card collections. Preserve existing Locator/table/dialog
   limits. Include Digital Asset Record timeline cards if an unbounded body needs
   a wrapper. Update this plan before dependent changes if the inventory changes.
3. Add browser regression coverage for overflowing/short/empty lists, keyboard
   scrolling, last-record access, independent columns, fixed headings and responsive
   widths. Reuse intercepted synthetic fixtures. No architectural boundary changes
   or new ADR is needed: this extends existing shared presentation roles.

## Validation and evidence

- `npm run build --workspace @iop/web`: passed TypeScript, all four design guards
  and the production build. Vite retains its existing large-chunk advisory.
- `npm test --workspace @iop/web`: all 319 tests in 49 suites passed.
- `npm test --workspace @iop/api -- --testPathPatterns=hexagonal-boundaries`:
  all 26 architecture checks passed. Presentation adapters remain the only changed
  feature boundary; shared styles/tokens have no business dependencies.
- `npm run test:e2e --workspace @iop/web`: all 115 Chromium tests passed. The
  three new overflowing-list cases cover 1440x1000, 820x650 and 375x667, including
  dark appearance, keyboard scrolling, last-record access, no card compression or
  overlap, fixed headings, independent columns, empty/short bodies and no horizontal
  page overflow. Existing tests also verify responsive category alignment, drag/drop,
  related reports, Start, Workforce, Area Overview and Digital Asset Record flows.
- Inspected generated desktop/mobile and dark screenshots under the ignored web
  test-results directory. Browser data is synthetic intercepted fixture data.
  Visual review found compressed Handover grid rows; `grid-auto-rows: max-content`
  preserves complete cards, and the new geometry checks protect that behavior.
- The initial sandbox browser run could not write legacy absolute screenshot
  destinations. Re-running with the required filesystem access passed; no unrelated
  browser tests or screenshot paths were changed.
- Documentation checks resolved all 253 relative links in the changed documents;
  item/backlog IDs and statuses match. `git diff --check` passed.

## Closure

Completed the item/backlog and moved this record to completed. No scope deviations,
new ADRs or story translations were required. Implementation commit: `7f95441`.

## Approved publication - 2026-11-08

The owner explicitly approved merging `fix/IOP-228-bounded-card-collections` into
`develop` and pushing both branches to `origin` under ADR-0008. Record that approval
on the story branch, verify current remote refs, merge the validated story without
rewriting history, push both refs and verify their remote hashes and a clean tree.
Preserve the story branch. Hosted activation is reported only after separate
deployment evidence; no manual Railway deployment is included in this approval.

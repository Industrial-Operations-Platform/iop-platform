# IOP-241 — Scalable month picker execution

Status: Completed locally. Authorized by the owner's multi-year month-filter request on
2026-11-20. Branch: `feature/IOP-241-scalable-month-picker`, created from clean
develop `23663dd` before edits. [Scope](../items/IOP-241-scalable-month-picker.md).

## Changes and steps

1. Add this plan, item and backlog row. Read IOP-237/162 and their governing
   filter/hexagonal contracts; all story prose read is already English.
2. Extend shared `MonthMultiPicker.tsx` using the existing Popover, native year
   select and month checkboxes. Display at most twelve months, disable unavailable
   months and retain selections across years. Add a mixed-state year checkbox,
   select-all/clear actions and a concise selection-label helper exported through
   the component barrel. Keep caller-owned values and explicit Apply semantics.
   Extend `Popover.tsx` with optional start alignment for this left-side filter;
   preserve end alignment as the default for existing account/KPI consumers.
3. Use the compact label in analysis `ReportFilters.tsx`. Update shared component
   CSS, its README, German resources and the visual-identity/product guide for
   the revised existing control. Do not restyle compact date/department controls.
4. Add focused component coverage; adapt checkbox use in `report-filters` and
   `workspace-readiness` unit tests and `analysis-drilldown`/`month-comparison`
   browser journeys to open the selector. Add a multi-year browser
   scenario with 36 imported months, selected-month preservation and keyboard use.
5. Run relevant web/build/design/architecture and browser checks, inspect actual
   desktop/narrow renders, synchronize statuses and archive this plan; commit locally.

## Validation and evidence

- `npm.cmd test --workspace @iop/web -- --runTestsByPath
  test/month-multi-picker.spec.tsx test/report-filters.spec.tsx
  test/workspace-readiness.spec.tsx test/localization.spec.ts
  test/design-boundaries.spec.ts`: 5 suites, 38 tests passed. Includes 0/1/36 months,
  year retention/mixed state, scoped/global bulk actions, disabled/retained values,
  concise localized summaries, focus restoration, empty Apply guard and IOP-237's
  pending/retry/stale-response and other-filter preservation behavior.
- `npm.cmd run build --workspace @iop/web`: design guard (4 checks), TypeScript and
  Vite passed. Explicit web typecheck also passed. Existing large-chunk advisory
  remains; no dependency change. A missing parenthesis in the new browser fixture
  was corrected before the successful final build.
- `npm.cmd test --workspace @iop/api -- --testPathPatterns=hexagonal-boundaries`:
  26 checks passed. No API code or contract changed; existing 120-month/3660-day
  budgets were inspected and preserved.
- `npm.cmd run test:e2e --workspace @iop/web -- month-picker-years.spec.ts
  analysis-drilldown.spec.ts month-comparison.spec.ts`: final run 9 passed (42.3s),
  exit 0. Covers a 36-month history and nonconsecutive May 2024/November 2025/
  January 2026 selection, retained equipment criteria, Apply/reset, subsequent
  Error/Daily views, keyboard selection and Escape/focus. Existing comparisons
  pass desktop/mobile in both appearances.
- `npm.cmd run test:e2e --workspace @iop/web -- month-picker-years.spec.ts
  --repeat-each=2`: 6 passed (24.8s), exit 0. Inspected compact screenshots at
  1440px English/light, 375px German/dark and 320px English/light. The twelve-month
  panel fits the viewport, aligns with its desktop trigger and has no horizontal
  page overflow or runtime errors. Artifacts remain ignored under test-results.
- Initial new browser cases used an incorrect hard-coded German filter suffix
  and sent Escape to a native year select. Tests now reuse the actual localized
  suffix and exercise Escape from a month checkbox, preserving native year-popup
  behavior. Visual review also motivated optional start alignment on viewport
  Popovers; existing end alignment remains the default. Final runs above passed.
- Reviewed boundaries: shared calendar state is presentation-only, values remain
  caller-owned and existing analysis/query semantics are unchanged. Documentation,
  identifiers/statuses, links and whitespace are checked before the local commit.

## Closure

All acceptance criteria are met; item/backlog, component contract and product guide
are synchronized. No server, storage, query-budget, KPI-scope or dependency change
was added. Publication follows the existing story/develop approval convention.

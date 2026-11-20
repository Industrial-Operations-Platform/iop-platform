# IOP-240 — Focused error analysis execution

Status: Completed locally. Authorized by the owner's Error analysis request and explicit
one-or-two-error correction on 2026-11-20.
Branch: `feature/IOP-240-focused-error-analysis`, created from clean develop
`80060ee` before edits. [Scope](../items/IOP-240-focused-error-analysis.md).

## Changes and steps

1. Add the item/backlog and this bounded plan. Reuse IOP-239's existing report
   contracts, shared identity and imported-date semantics; its story is English.
2. In the analysis domain, extract common aggregate statistics from
   `single-equipment.ts` into `report-summary.ts`, preserving existing behavior.
   Add `error-analysis.ts` to recognize a complete server-provided set of one or
   two message groups and derive summary/per-error figures from full aggregates.
3. Compose `FocusedErrorAnalysis.tsx` from shared metrics, facts and panels.
   Update `Workspace.tsx`, `workspace.css` and German localization. Apply only to
   Error analysis grouped by message; retain its scatter and existing data tables.
4. Update the ECharts scatter tooltip with explicit labelled frequency and minutes,
   preserving names, colors, selection and theme. Add focused domain/chart tests
   and browser scenarios under `apps/web/test/` and `e2e/`.
5. Synchronize `docs/product/analysis-settings.md`; verify, record evidence, close
   item/backlog, archive the plan and commit locally.

## Validation and evidence

- `npm.cmd test --workspace @iop/web -- --runTestsByPath
  test/focused-error-analysis.spec.ts test/single-equipment-analysis.spec.ts
  test/analysis-charts.spec.ts test/localization.spec.ts
  test/design-boundaries.spec.ts`: 5 suites, 36 tests passed. Covers the exact
  0/1/2/3 threshold, other dimensions, truncated lists, complete totals, selected
  months/coverage, exclusions, zero ratios/shares and unchanged equipment statistics.
  Scatter dimensions explicitly encode both coordinates with localized labels;
  numeric zero remains visible while empty header values remain blank.
- `npm.cmd run build --workspace @iop/web`: passed design guard (4 checks),
  TypeScript and Vite. Existing large-chunk advisory remains; no new dependency.
  A subsequent explicit web typecheck passed with the browser tests included.
- `npm.cmd test --workspace @iop/api -- --testPathPatterns=hexagonal-boundaries`:
  26 checks passed; no API implementation or persistence change.
- `npm.cmd run test:e2e --workspace @iop/web -- focused-error-analysis.spec.ts
  single-equipment-analysis.spec.ts analysis-drilldown.spec.ts analysis-cache.spec.ts`:
  final run 9 passed (42.2s), exit 0. Real mouse hover verifies name, frequency and
  minutes in English/light at 1440px and German/dark at 375px. It checks both points,
  literal `<input>` source text, no generated input, absence of the empty-header
  zero, one/two versus three charts, empty results and error-to-equipment drill-down.
- Initial mobile hover verification failed because the test moved the mouse to a
  chart below the viewport. Scrolling the chart into view corrected the test; both
  layouts then passed two repetitions (4/4). Visual inspection subsequently found
  a blank tooltip header converted to zero by the number formatter. Preserving
  blank header values fixed that display; the final tests above passed afterward.
- Inspected ignored `apps/web/test-results/focused-error-analysis-*/focused-2-errors.png`
  and tooltip captures: per-error facts wrap on mobile, the scatter shows both
  labelled measures without the extra header value, and the existing identity is
  preserved. Browser assertions found no horizontal overflow or runtime errors.
  Fixed shell controls can overlay full-page captures after scrolling; no shell
  styles were changed. Source text is rendered as text by React/ECharts rich text.
- Reviewed source boundaries and existing selection behavior: domain functions own
  ratios/presentation selection, React composes shared components and ECharts owns
  display encoding. All figures use the server snapshot and existing date rules.

## Closure

No API/schema/authorization change, new dependency or adjacent cleanup was added.
All criteria are met. Item/backlog and the product guide are synchronized; changed
links, IDs/statuses and whitespace are checked before the authorized local commit.
Publication remains subject to the repository's story/develop approval convention.

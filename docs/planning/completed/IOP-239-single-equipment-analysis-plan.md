# IOP-239 — Single-equipment analysis execution

Status: Completed locally. Authorized by the owner's sensor-detail request on 2026-11-20.
Story branch: `feature/IOP-239-single-equipment-analysis`, created from clean
`develop` at `3afbd71` before implementation. The initial branch command was denied
by the filesystem sandbox; only the planning scaffold had been written when it
succeeded with the authorized Git permission. No commit was made on develop.
Scope: [permanent item](../items/IOP-239-single-equipment-analysis.md).

## Changes and steps

1. Add this item/backlog entry and record the bounded implementation plan.
2. In `apps/web/src/features/analysis/domain/`, add framework-free presentation
   derivation from the server's full totals, eligible imported dates and daily
   timeline. Extend `application/workspace.ts` to obtain a revision-pinned daily
   snapshot for a selected equipment identifier at non-daily resolution, reusing
   the existing cache/read pattern. Extract `report-days.ts` from
   `monthly-averages.ts` to share the existing coverage semantics without duplicate
   rules. Keep aggregation authority in OIP/API.
3. Compose `adapters/react/SingleEquipmentAnalysis.tsx` from shared metrics,
   facts, panels, tables and the existing trend chart. Update `Workspace.tsx`
   and `workspace.css` to replace group charts/tables only on the last view with
   exactly one explicit equipment filter. Add German localization in `de.ts`.
   In `adapters/echarts/charts.ts`, show zero for covered periods without matching
   activity on single-equipment trends; preserve gaps for missing imports.
4. Add targeted domain/application and browser regressions under `apps/web/test/`
   and `e2e/`; inspect desktop and narrow screenshots. Synchronize
   `docs/product/analysis-settings.md` with the resulting behavior.

No new architecture, schema, server metric or dependency was added. No Spanish
story prose was encountered in the story/dependency contexts read for this work.

## Validation and evidence

- `npm.cmd test --workspace @iop/web -- --runTestsByPath
  test/single-equipment-analysis.spec.ts test/analysis-cache.spec.ts
  test/analysis-charts.spec.ts test/localization.spec.ts
  test/design-boundaries.spec.ts`: 5 suites, 39 tests passed. Covers full totals
  despite bounded rows/groups, weighted ratios, imported zeros/missing dates,
  excluded Sundays, disjoint months, ties, daily/weekly/monthly resolution, zero
  denominators, duration-only activity and revision-pinned cache reuse.
- Initial complete web run: 51 suites passed, one localization assertion failed
  because the new interpolated key included leading whitespace. Corrected that
  dictionary key; the final focused run above passed the localization suite and
  every changed behavior. A new chart fixture's TypeScript shape was also corrected
  before the successful final build.
- `npm.cmd run build --workspace @iop/web`: passed design guard (4 tests),
  TypeScript and Vite. Existing large-chunk advisory remains; no dependency change.
- `npm.cmd test --workspace @iop/api -- --testPathPatterns=hexagonal-boundaries`:
  26 checks passed. API/schema/persistence were unchanged.
- `npm.cmd run test:e2e --workspace @iop/web --
  single-equipment-analysis.spec.ts analysis-cache.spec.ts
  analysis-drilldown.spec.ts analysis-filter-ancestors.spec.ts`: 9 passed (36.8s),
  exit 0. Existing filter/drill/navigation/cache flows and single-equipment empty,
  reset, daily table and weekly/monthly behavior passed. The sandboxed run completed
  the scenarios but hung during Windows subprocess cleanup; rerunning with the
  authorized process permission completed normally.
- Inspected test-owned `apps/web/test-results/single-equipment-analysis--*/equipment-detail.png`:
  1440px English/light, 375px German/dark and 320px English/light. Shared metrics,
  chart/insight stacking, long labels and disclosure fit; browser assertions found
  no horizontal page overflow or runtime errors. Screenshots are ignored artifacts.
- Reviewed inward boundaries and the shared identity: no feature-specific palette,
  typography, physical-identity inference or client reconstruction of server totals.

## Closure

All item criteria are satisfied; item/backlog and the product guide are synchronized.
The plan is retained here as completed evidence. Local commit is authorized;
publication, merge and deployment remain pending the owner's explicit instruction.

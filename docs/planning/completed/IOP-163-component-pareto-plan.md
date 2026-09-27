# IOP-163 — Execution plan

Status: Completed. Authorized by the owner's chart correction request.
Branch: `feature/IOP-163-component-pareto`, from `develop`.
Scope: [item](../items/IOP-163-component-pareto.md).

## Changes and steps

- Extend the existing report domain/host/browser contracts with independent
  frequency ranking; regenerate OpenAPI and browser bindings. Update the PostgreSQL
  report adapter to supply frequency leaders for period series while retaining
  selected-measure leaders for month comparison. No schema or boundary change.
- Update the ECharts adapter, Plot and Workspace: horizontal top 10 Pareto charts
  with a cumulative axis, 80% marker and readable coverage; distinct component
  colors/tooltips; descending frequency heatmap; overlaid monthly comparison.
- Extend chart, browser and real database tests and affected report fixtures.
  Keep existing selected-month aggregation and drill-down semantics.
- Run relevant API/web tests, builds, contract drift, disposable database checks
  and desktop/mobile browser checks. Review rendered screenshots.
- Validate documentation links/statuses and diff, close the item/plan and create
  a local commit. Publication requires the owner's separate authorization.

No dependency-story translation is needed. Local runtime deployment is outside
this implementation slice unless subsequently requested.

## Validation and evidence

- API/web/database builds, workspace/database TypeScript checks and generated
  contract drift check passed on Node 24.21.0. Existing Vite chunk-size warning
  remains; no bundle restructuring is included.
- `npm test` passed secret checks (18), builds, contract drift and web tests
  (17 suites / 73 tests). Its API tests initially hit sandbox listener restrictions;
  rerunning `npm test --workspace @iop/api` with loopback access passed all
  18 suites / 288 tests. `npm run db:test:unit` passed 77 tests separately.
- Disposable PostgreSQL reporting suite: 15 tests passed, including nonconsecutive
  month totals and 105 components with opposite frequency/duration leaders. The
  frequency ranking retains its true leaders beyond the duration top 100, and
  period series use the frequency top 10. Full totals include all 105 components.
- Final chart suite: 9 tests passed after switching duration cumulative percentages
  to exact seconds. Covers full-total denominators, crossing/exact 80%, zero/empty
  totals, 100 distinct scatter colors, month overlays and frequency heatmap order.
- Final Playwright month-comparison scenario: 2 tests passed at 1440px and 375px.
  Twelve synthetic components have opposing frequency/duration rankings; both
  charts display ten leaders, highlight seven reaching 80.77%, and render the
  cumulative axis/reference. The populated heatmap starts with the frequency
  leader while duration is selected. Month propagation/reset remains covered.
- Visually reviewed screenshots under `apps/web/test-results/`, especially
  `pareto-frequency-375.png`, `pareto-duration-1440.png` and `heatmap-375.png`.
  Test artifacts are ignored. The existing local Compose installation was not
  rebuilt; API and web must be refreshed together to expose the new report field.
- Documentation relative links, mirrored statuses and `git diff --check` passed.
  Item/backlog completed and this plan moved to completed. Local commit only;
  merging/pushing remains subject to the owner's publication approval.

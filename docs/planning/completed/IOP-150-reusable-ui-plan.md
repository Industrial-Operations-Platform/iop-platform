# IOP-150 execution plan

Status: Completed
Branch: `feature/IOP-150-reusable-ui`, from develop `dc8b81c`.

## Scope

Extract the existing UI into reusable presentation components. Keep the accepted
React adapter architecture and canonical identity tokens. This implements the
explicit component request within ADR-0032; no new framework, package or domain
boundary is introduced. Leave the optional legacy fixture preview unchanged.

## Files and steps

1. Add `apps/web/src/design/components/` with a public barrel and scoped shared CSS:
   identity root, controls/fields, panels/disclosure/metrics, tables, application
   shell, headings and view navigation. Preserve native semantics and typed props.
2. Adopt those components in the active React analysis adapter; move feature-neutral
   styles out of `workspace.css`. Extract report filter and chart presentation into
   focused feature components, keeping state and business policy in their current layers.
3. Document usage in the visual identity guide and frontend README. Shared components
   cannot import analysis models, HTTP contracts, application policies or charts.
4. Validate types/build, component accessibility/interaction, import/report browser
   integration and desktop/mobile appearance with the historical Docker installation.

## Validation and closure

Run frontend tests, the existing dependency checks and analytical database/browser
suite. Rebuild the web container for visual inspection; preserve the database and
seed. Check documentation links and staged secrets, record evidence, complete the
item and commit locally. Ask separately before publishing the new story branch.


## Delivered

- Added a typed public presentation library with identity root, application shell,
  headings, actions, native controls/fields, panels, disclosures, metric cards,
  tables and controlled view navigation. It imports only React, sibling presentation
  components and canonical identity tokens.
- Migrated active import, preparation, history and analysis to those components.
  Executive and import metrics share `MetricCard`; ordinary actions and form submits
  use explicit shared button semantics. Feature-owned `ReportFilters`, `Plot` and
  source labels now have focused adapter files.
- Moved common appearance from the analysis stylesheet into scoped `iop-*` component
  styles. Feature CSS retains arrangements and chart sizes. Palette, card dimensions,
  typography and responsive treatments were preserved. The existing divided-summary
  color was promoted from legacy CSS into a named identity token without changing it.
- Added a usage/variant/accessibility guide and documented reuse as the rule for
  future React adapters. No new dependency, backend contract, dataset or framework.

## Validation

- `npm run typecheck`: passed API, frontend and database type checks.
- `npm run build --workspace @iop/web`: passed. Existing chart bundle size advisory
  remains; this presentation refactor does not introduce a new chart dependency.
- `npm test --workspace @iop/web`: 31/31 passed, including an independent example
  feature using the shared library, refs/labels/disabled controls, explicit submit
  behavior, disclosure/table semantics and controlled navigation.
- API `hexagonal-boundaries` checks: 3/3 passed. New frontend dependency/style check
  rejects feature/transport imports and analysis-specific selectors or literal colors
  in shared component styles.
- Actual PostgreSQL `analytical-poc` suite: 9/9 passed, including browser upload,
  duplicate/review behavior, all report templates, progressive filters, grouping,
  responsive overflow, user switching and reload.
- Rebuilt only the Docker web service. Live browser verified all 42,220 historical
  rows and exact totals unchanged, desktop/mobile layouts, no JavaScript errors,
  shared import/overview metric treatment, native Enter-operated disclosures and
  existing card/profile colors. Reviewed screenshots locally for both workflows.
- No private source data or generated screenshots added to Git. Database/API and
  optional legacy preview behavior were not modified. Documentation links, patch
  whitespace and staged secret checks completed before commit.

## Handoff

Use `apps/web/src/design/components` for new presentation work; use its README for
examples and variants. Keep feature policy and business composites outside the
library. Owner publication approval is separate from this completed local increment.

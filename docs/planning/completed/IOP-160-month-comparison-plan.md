# IOP-160 — Execution plan

Status: Completed. Authorized by the owner's month comparison and collapsed
filter reset request. Branch: `feature/IOP-160-month-comparison`, from `develop`.
Scope: [permanent item](../items/IOP-160-month-comparison.md).

## Changes and steps

1. Extend the existing report request with optional validated calendar months;
   apply their parameterized predicate before all server aggregations. Files:
   OIP domain/report, PostgreSQL reports adapter, host contracts, generated OpenAPI
   and browser schema, frontend analysis models/application.
2. Add reusable multiple-month controls; use them in Halle and its drill-down
   selections. Keep Clear filters outside the collapsed disclosure and synchronize
   draft/applied selections. Files: design/components, ReportFilters, Workspace,
   analysis CSS and ECharts adapter.
3. Add focused API, PostgreSQL, selection, chart and component regression coverage;
   verify browser layout at desktop/mobile sizes. Update this record and backlog.

## Validation and evidence

- `npm test` passed on Node 24.21.0: 18 secret-tooling tests, 288 API tests,
  61 web tests and 77 database configuration tests, including build and generated
  contract checks. The shell's Node 20 could not load the project's ESM dependencies;
  validation used the available Node 24 binary. npm 10.8.2 ran the installed
  dependencies without modifying the lockfile.
- PostgreSQL `reporting-workspace` integration suite: 14 tests passed in disposable
  containers. The new scenario verifies May/July exclude June and Sundays from
  totals, both rankings, monthly/daily series, records and paginated totals.
- Playwright `month-comparison.spec.ts`: 2 checks passed at 1440px and 375px using
  intercepted API fixtures. Screenshots in `apps/web/test-results/` were visually
  reviewed: distinct month legends, expanded checkbox controls and collapsed reset;
  no horizontal overflow. Database tests separately exercise the real backend.
- Added a final chart regression for omitted months and crossing calendar weeks;
  targeted chart tests and repository type checking passed.
- Existing invalid-date UI coverage now uses Bereich analysis, which retains date
  inputs when opened without a month comparison. Generated transport artifacts
  remain synchronized. No new ADR, database migration or dependency was needed.
- Documentation relative links and `git diff --check` passed.

## Closure

All item criteria are complete; item/backlog synchronized and plan moved to
completed. Changes are retained on the story branch for review. No merge, push,
deployment or changes to the running local stack are included.

# IOP-233 — Schedule preview execution plan

Status: Completed. [Authorized scope](../items/IOP-233-schedule-preview.md).
Branch: `feature/IOP-233-schedule-preview`, from clean `develop` at `6dfc5f7`.

## Changes and steps

1. Add this item and backlog entry before implementation. Existing editor only
   retains one person's week and immediately saves it; board contains eight days,
   so it cannot supply historical workload totals.
2. API Workforce domain/application: reuse weekly preparation in one existing
   scoped transaction for a bounded multi-person proposal. Add a no-write preview
   with server-owned saved/proposed workload aggregates over up to 93 days;
   commit all people atomically. Domain owns measures, application owns ports and
   validation, existing PostgreSQL adapter owns locking/RLS/audit. No new pattern.
3. Add controller/DTO contracts and regenerate OpenAPI/browser bindings. Keep the
   single-person weekly route compatible. Browser application/HTTP ports expose
   preview and commit, React retains per-person drafts and renders preview,
   comparison and explicit save. Configured shift IDs/labels determine columns.
4. Update English/German resources, Workforce guides, focused API/web tests and
   relevant PostgreSQL transaction coverage. No dependency story translation is
   needed: IOP-184 and IOP-218 are already English.

## Validation and evidence

- `npm.cmd run typecheck`: passed for both workspaces and database tooling.
- Root `npm.cmd test`: secrets 99 passed/4 skipped; all builds and generated
  contract check passed; API 55 suites/564 tests passed; web 48 suites passed,
  319 tests passed and one failed. That failure is the unchanged Data Analysis
  lazy-loading assertion in `workspace-readiness.spec.tsx:281`. Repeated in
  isolation and on an archived clean develop `6dfc5f7`: the same one failure and
  13 passes. No adjacent test/product change was made.
- Focused final API Workforce/HTTP: 2 suites/18 tests passed. Final web weekly,
  localization and design-boundary checks: 3 suites/9 tests passed. Coverage
  includes draft retention across people/board reloads, original revisions,
  no-write preview, explicit save, failed save retention and preview invalidation.
  API coverage additionally checks complete historical periods, custom hours,
  weekend start dates, absence, DST overnight duration, duties without double
  counting, bounds, permissions and atomic multi-person stale conflict rejection.
- `npm.cmd run db:test:unit`: 78 tests passed. Added a PostgreSQL proposal fixture;
  its targeted execution could not start because Testcontainers found no working
  container runtime. Actual database rollback/RLS execution remains unverified
  here; existing transaction adapter is reused without schema changes.
- Playwright `administration-workforce-ui.spec.ts`: both 1440px and 375px scenarios
  passed, with no browser errors or page-wide overflow; inspected proposal PNGs
  under ignored `apps/web/test-results/`. Its pre-existing `/tmp` screenshot path
  first failed with EPERM on Windows and was changed to `testInfo.outputPath`.
  The runner was interrupted after both passing scenarios because Windows
  web-server teardown remained running; no live application data was used.
- Final web production build passed with existing bundle-size advisories.
  Reviewed inward dependencies, customer-configured labels and reuse of scoped
  locking/revisions/audit. No architecture decision or boundary exception added.
- Relative links resolve in all five changed planning/product guides; IOP-233
  identity/status references agree and `git diff --check` passed.

## Closure

Item/backlog and Workforce guides synchronized; plan moved to completed. Check
documentation links and staged diff, then commit the coherent local increment.
Publication requires explicit owner approval under AGENTS.md/ADR-0008. No merge,
push or deployment is authorized by this implementation request.

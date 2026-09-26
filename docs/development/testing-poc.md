# Local POC testing

IOP-020 consolidates the existing test layers selected by
[ADR-0010](../architecture/adr/ADR-0010-frontend-charting-testing.md).
The [POC scope](../product/scope-poc.md) requires tests for delivered behavior,
not an upfront platform-wide suite. Passing this foundation does not complete
the CSV-to-analysis journey or establish shared-user security.

## Run from the repository root

Use Node 24.21.0 (`.nvmrc`) and npm 10.9.2 (`packageManager`). Start a local Docker
daemon, allow disposable containers and loopback listeners, and leave ports 3000
and 4173 free. Then:

```sh
npm ci
npx playwright install chromium
npm run test:poc
```

Installation needs registry/browser access; PostgreSQL integration may need to
pull `postgres:17.6-bookworm`. Tests use the installed lockfile versions. Do not
substitute the default shell's older Node. On a checkout already prepared with
these prerequisites, only the last command is needed.

`test:poc` runs type checking, `npm test`, database integration and Playwright in
sequence, stopping with a nonzero exit at the first failed command. Missing Docker,
Chromium, occupied browser-test ports or missing dependencies are failures, not
skipped checks. Fix the reported prerequisite or failing test and rerun the affected
command; only report the complete run as passing when every layer passes.
The component commands retain their own builds so they also work independently.

| Command | Existing layer and evidence | Boundary |
| --- | --- | --- |
| `npm run typecheck` | API, web and database TypeScript checks | Type safety does not replace runtime tests. |
| `npm test` | Builds; browser binding drift; API Jest/Supertest/process tests; web Jest/RTL; database configuration/CLI unit checks | Requires local listeners, but no Docker/browser. Includes real Nest injection, sanitized failures and OpenAPI drift. |
| `npm run test:database` | Jest with disposable Testcontainers PostgreSQL; migrations, failed DDL rollback, reruns/concurrency, real-role denials and organization/site seed isolation | Bootstrap/seed RLS evidence, not the pending business runtime adapter or grants. |
| `npm run test:e2e` | Playwright Chromium against built web and API through the same-origin preview proxy; safe error recovery, navigation, responsive and accessible UI states | Health is the real backend path; analytical/import screens still use fixtures. Not a Compose/Nginx or full import journey test. |

## Test placement and data isolation

- API unit/configuration, HTTP contract and compiled startup cases:
  `apps/api/test/*.spec.ts`, with a Node Jest environment.
- Web behavior and client parsing: `apps/web/test/*.spec.ts(x)`, with Jest/RTL and
  an independent DOM/TSX configuration. Vite is not the Jest transform pipeline.
- Database configuration and real PostgreSQL checks:
  `infra/database/test/*.spec.cjs`. Suites create their own containers, synthetic
  credentials and temporary fixtures, then stop containers and clean temporary
  files. No operator `.env`, persistent Compose volume or existing database is
  the test target. Destructive reproduction cases run only inside test-owned clusters.
- Built-browser journeys: `apps/web/e2e/*.spec.ts`. Playwright starts its own
  servers, refuses to reuse existing servers and supplies the fictional checked-in
  `config/poc.example.json` to the API. It does not start a business database.

Use synthetic fixtures and separately stated expected outcomes. Never commit
private CSVs, credentials, local configuration or captured production diagnostics.
Browser screenshots/reports in `test-results/` and `playwright-report/`, build
output and coverage are ignored. Do not point a test at the dedicated operator demo
dataset to save container startup time. Inspect test-owned leftovers after an
interrupted run; never use broad volume deletion as test cleanup.

## Add evidence with each delivered slice

| Future POC delivery | Required verification when implemented |
| --- | --- |
| CSV receipt and normalization | Known synthetic frequency/duration totals; exact budgets and one above; malformed/rejected input; renamed duplicate dates; no partial publication; bounded diagnostics and provenance. |
| Local execution and persistence | Explicit grants/scope; missing and foreign access denied; real non-owner credentials; forced RLS, rollback/connection reuse and browser-origin rejection. Seed tests do not substitute for these. |
| Overview and detail | Independent reconciled totals, shared filters and contributing rows; missing coverage and unknown reporting windows visible; unclassified records retained. |
| Demonstration | Real import → overview → detail, duplicate/failure paths and separately guarded reset of the dedicated demo dataset. Record fixture size and observed timing without inventing a target. |

Extend the nearest owning suite and keep expected, error and relevant denied-access
cases together. HTTP tests use real application composition; database isolation
checks use real roles; browser fixtures must be identified as such. No arbitrary
coverage percentage, performance SLA, full login suite, worker tests, new testing
framework or CI/hook implementation is introduced. IOP-021 owns future CI.

See the [API guide](../../apps/api/README.md),
[web guide](../../apps/web/README.md) and
[database guide](../../infra/database/README.md) for component details.
Actual IOP-020 results belong in its execution plan, not inferred from this guide.

See [POC secrets hygiene](secrets-poc.md) for staged-index checks and private credential handling.

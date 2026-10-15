# IOP-213 — Validation fixture secret hygiene

Status: Completed locally on 2026-10-15; publication pending. Owner request: investigate and fix the validation failure
shown for IOP-200 on 2026-10-15.
Branch: `fix/IOP-213-validation-fixture`, from develop `25db723`.
Scope: [item](../items/IOP-213-validation-fixture.md).

## Changes and steps

1. Reproduce the indexed secret check and inspect the workflow and failed snapshot.
2. In `apps/api/test/integration-readiness.spec.ts`, assemble the synthetic embedded
   credential URL at runtime, following `scripts/check-secrets.spec.cjs`. Preserve
   the exact input and rejection assertion. Integrations owns the tested domain
   validation; no production boundary, scanner rule, API or runtime change.
3. Update this plan, item and backlog with evidence; commit the isolated fix.

## Validation and evidence

Baseline `npm run check:secrets` exits 1 with the sole finding
`apps/api/test/integration-readiness.spec.ts: credential-url`. The same fixture is
present at the screenshot's `2ef014d`; the workflow runs this check before platform
tests. Remote job logs are unavailable locally, so exact remote step attribution
remains unverified.

Use installed Node 24.21.0; run scanner tests, the complete API test suite (`npm
test --workspace @iop/api`), staged `npm run check:secrets` and `git diff --check`.
Check planning links/status consistency. No database, container or browser changes
are required for this fixture-only correction.

## Outcome

- Preserved the exact synthetic invalid URL and all rejection assertions by
  assembling its components at runtime. No scanner exclusion or production edit.
- Node 24.21.0: scanner tests passed, 5 suites / 25 tests, using direct
  `node node_modules/jest/bin/jest.js --config scripts/jest.config.cjs --runInBand
  --watchman=false` after the npm executable launcher stalled.
- `npm test --workspace @iop/api -- --watchman=false`: 48 suites / 509 tests
  passed. The initial sandbox run could not open Supertest sockets; the successful
  rerun used elevated local execution. Log: `/private/tmp/iop-213-api-tests.log`.
- Staged `npm run check:secrets`: passed for all 1,179 indexed files.
  `git diff --check` and planning relative-link/status checks passed.
- Remote logs and a new GitHub workflow run were not verified. Full database/browser
  platform checks were not rerun for this test-fixture-only change. Owner approval
  is required before merging into develop and pushing both branches to origin.

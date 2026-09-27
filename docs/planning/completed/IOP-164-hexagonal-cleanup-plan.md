# IOP-164 — Execution plan

Completed. Authorized by the owner's API/web structure and artifact cleanup
request. Branch: `fix/IOP-164-hexagonal-cleanup`, created from clean `develop`.
[Permanent context](../items/IOP-164-hexagonal-cleanup.md).

## Changes and steps

1. Inspect source dependencies, runtime references and local installations.
2. Consolidate API bootstrap/configuration/HTTP infrastructure under `src/host`,
   keeping executable entry points in `src`. Place concrete module persistence/CSV
   adapters in `adapters`; separate pure analytical values and authorization rules
   from provider code. Preserve the ADR-0026 pinned transaction helper location.
3. Keep only the connected web composition in `src/host`; remove superseded fixture
   preview files and exclusive unit/browser tests. Retain shared CSS resets needed
   by the active interface and replace preview browser coverage with active startup
   and recovery checks. Keep transport bindings at the feature HTTP boundary.
4. Update imports, native/setup scripts, Docker build inputs, contract generation,
   current READMEs/architecture and boundary tests to match source moves.
5. Clean compiler output before API/database builds; explicitly retain Vite output
   cleaning. Verify stale marker removal and source/output parity.
6. Inspect `.local-*`: the active container stack uses `.local-platform`; existing
   `iop-poc-data` and `iop-analysis-data` volumes still have associated credentials
   in `.local-demo` and `.local-analysis`. Preserve all three and the volumes;
   deleting credentials alone would orphan retained installations.

## Validation and evidence

Validated with Node 24.21.0/npm 10.9.2 from the existing `/tmp/iop-147-bin`
runtime. The initial default-shell Node 20 test attempt failed on ESM compatibility;
no compatibility changes were made to accommodate an unsupported runtime.

- `npm run typecheck`: passed for API, web and database tooling.
- `npm test`: passed (18 secrets tests, 293 API tests, 51 web tests, 77 database
  configuration tests), including OpenAPI/browser-contract drift checks. Final
  inward-import refinements were rechecked with the 293-test API suite.
- `npm run test:database`: 11 suites passed; the analytical suite exposed the stale
  browser flow described below. After updating that test, the complete analytical
  suite passed all 9 cases. Combined evidence covers all 12 suites/178 tests.
  The browser case requires preceding fixture/reset cases; its isolated-name run
  was not valid and was replaced by a complete suite run.
- `npm run test:e2e --workspace @iop/web` against built output: all 5 Chromium
  scenarios passed, including 1440/375px monthly charts and connection recovery.
- Real database/browser journey passed imports, duplicate prevention, rejected
  input review, persisted KPI/preparation, all report views, source-row sorting,
  user switching, reload, transient API failure recovery and responsive widths.
  Reviewed generated desktop/mobile screenshots; no horizontal page overflow.
- Build removed deliberate stale markers from all three `dist` directories.
  API output exactly matches its 48 source files; database output exactly matches
  its 9 source files. Web output is only HTML and current hashed JS/CSS assets.
  Retired API `demo/` and `bootstrap-error.filter.js` are gone.
- Native/setup script syntax and compiled import paths checked. Dockerfiles already
  recursively copy source and invoke the same build scripts; no Docker input
  change was needed. The live container stack was not rebuilt or deployed.
- Edited documentation links, IOP-164 ID/status consistency and `git diff --check`
  passed. `npm run check:secrets` passed for all 570 indexed files.
  Vite retains its existing large-bundle advisory; splitting bundles is
  outside this cleanup.

Initial evidence: API `dist/demo/` and `dist/bootstrap-error.filter.js` have no
current sources. No repository-root `dist/` exists. All three local installation
directories correspond to retained Docker volumes; the platform containers are
running. No dependency story translation is needed.

Validation refinement: the retained database-backed browser journey still assumes
the pre-IOP-158 UI (no reporting-date confirmation, removed navigation actions and
old filter controls). Update that scenario to the current import confirmation,
administration tabs and monthly analytical workspace while preserving real import,
review, persisted KPI, user-switch, reload, error recovery and responsive checks.
No production behavior changes are needed for this stale-test correction.

## Closure

Acceptance is complete. Item/backlog are synchronized and this plan is archived.
All `.local-*` configuration and existing database volumes are retained because
those installations still exist. Publication/query transaction adapters and public
compatibility routes remain intentionally supported under ADR-0026/0032; moving
files is not presented as a rewrite of all persistence orchestration. Local commit
and owner-approved publication follow ADR-0008.

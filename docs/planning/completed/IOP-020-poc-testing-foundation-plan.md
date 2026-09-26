# IOP-020 — POC testing foundation plan

Status: Completed. Authorized by the owner's 2026-09-26 request within the
[POC scope](../../product/scope-poc.md).
Branch: `feature/IOP-020-poc-testing-foundation`, from clean `develop`.
Item: [IOP-020](../items/IOP-020-testing-foundation.md).

## Changes and steps

1. Dependencies IOP-016 and IOP-019 are Completed and integrated. Both story files
   are English; no dependency translations are required. Existing API/web Jest,
   HTTP/process tests, Playwright and disposable PostgreSQL suites already implement
   the Accepted ADR-0010 layers. ADR-0018 runtime access remains unimplemented;
   current tests must not be described as business authorization evidence.
2. Add a fail-fast `test:poc` script to root `package.json`, composing type checking,
   `npm test`, database integration and browser suites. Reuse their standalone
   commands and accepted tooling; no new dependency, generic runner or architecture.
3. Add `docs/development/testing-poc.md` with reproducible prerequisites, layer/file
   mapping, test-data isolation, failure behavior and delivery handoffs. Link it
   from root README and the POC delivery map.
4. Translate the entire IOP-020 item into English and refine its existing criteria
   to the requested POC boundary; synchronize backlog and record actual results.
5. Run the composed command using the required Node/npm, Docker and Chromium.
   Fix only issues necessary for this foundation and record refinements before
   edits. Check Markdown targets and `git diff --check`; commit validated work.

## Validation and evidence

Verify real existing tests rather than adding tests that merely mirror a script.
The composed command must stop on a failing layer; individual commands remain
available for diagnosis. Check API DI/health/errors/contract, UI behavior and real
proxy recovery, migrations/rollback/privilege denial and organization/site seed RLS.
No operator database/volume reset, CI, hooks, workers, login, import or analytics
implementation. Fixture UI tests are not end-to-end analytical evidence.

Initial environment inspection: default shell Node 20 is unsupported; a prior
temporary runtime is available for inspection. Docker socket access requires
sandbox escalation. These are execution prerequisites, not reasons to skip suites.

Executed on 2026-09-26 with Node 24.21.0 and npm 10.9.2, using the existing
installed dependencies, Chromium and Docker. The first temporary runtime launcher
failed before npm could start because its shell wrapper resolved the wrong npm
prefix; temporary CLI symlinks corrected the environment without repository changes.
The subsequent `npm run test:poc` exited 0:

| Check | Actual result |
| --- | --- |
| Type checking, builds and browser contract drift | Passed. |
| API Jest/HTTP/process | 5 suites, 79 tests passed. |
| Web Jest/RTL | 4 suites, 15 tests passed. |
| Database configuration quick checks | 1 suite, 62 tests passed. |
| Full disposable PostgreSQL layer | 4 suites, 84 tests passed, including the same 62 configuration checks. |
| Chromium built-browser journeys | 12 passed, 35.0 seconds reported by Playwright. |

Only the existing VM-module and color-environment warnings appeared. No runtime
code, test cases or dependency versions changed. The command uses shell `&&` to
propagate failures and stop subsequent layers; no skip/fallback path was added.
Markdown targets, mirrored status and `git diff --check` were verified at closure.
A fresh `npm ci` was not repeated; this run verifies the existing pinned installation.

## Closure

All three POC foundation criteria are satisfied. IOP-020 and its backlog row are
Completed; this plan is moved to completed. The entire story is now English;
dependency files remain unchanged. Future delivery-specific tests stay with their
owning stories. Fixture UI, bootstrap/seed RLS and health tests do not certify the
pending CSV/analytics journey or business runtime authorization.

Commit delivery: automatic approval review rejected the Git staging/commit command
because the session usage limit was reached; that attempt created no commit or
publication. The owner subsequently authorized completing the commit, merging
`feature/IOP-020-poc-testing-foundation` into `develop` and pushing both to `origin`.

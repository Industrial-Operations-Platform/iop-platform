# IOP-146 — POC readiness review

Status: Completed. Authorized by the owner's 2026-09-26 request to check POC
coverage and help close blocked stories. Branch: `docs/IOP-146-poc-readiness-review`,
created from clean `develop` at `52e803b` before edits.
Item: [IOP-146](../items/IOP-146-poc-readiness-review.md).

## Scope and steps

1. Compare the accepted [scope](../../product/scope-poc.md) and
   [delivery map](../poc-delivery.md) with implemented code, tests, all 15 Blocked
   story contexts, relevant active/completed plans and unmerged review branches.
2. Record requirement coverage, missing implementation ownership and an ordered
   closure checklist in the readiness report (originally `docs/planning/poc-readiness.md`,
   archived beside this plan under IOP-151). Distinguish internal,
   fixture, design, runtime and owner-observation evidence. Retain honest statuses.
3. Add this permanent item and backlog entry; link the review from the delivery
   map and correct the backlog summary of ADR-0018 acceptance. No application/schema/ADR
   changes, implicit merges or bulk story closure.
   No Spanish prose was found in the consulted story files; translations are not
   required. Review-branch content remains on its original branch.
4. Run the existing POC checks when environment permits; inspect generated paths,
   migrations and UI composition. Check changed Markdown targets, unique IDs,
   item/backlog status consistency and whitespace. Record exact results and limits.
5. Complete this review item and move its plan to completed; commit locally.
   Implementation of missing capabilities requires its own story branch and plan.

## Validation and evidence

The default shell uses unsupported Node 20; validation uses the existing temporary
Node 24.21.0/npm 10.9.2 installation. The first Git branch creation was denied by
sandbox filesystem permissions; the elevated retry succeeded before any edits.
An initial test launcher failed before npm started; use the installation's `.bin`
CLI links instead. No product change was made to work around either condition.


Baseline checks on 2026-09-26 use the installed lockfile dependencies, without
reinstalling them. `PATH=/private/tmp/iop-017-runtime/node_modules/.bin:$PATH`
selects Node 24.21.0/npm 10.9.2 for each command.

- `npm run test:poc`: type checking, builds, secrets and contract drift checks
  passed; HTTP/process tests failed with sandbox `listen EPERM`. The command
  exited 1 before database/browser execution. This is not a passing aggregate run.
- Reran `npm test` with listener access: 9 secrets tests, 247 API tests across
  10 suites, 22 web tests across 6 suites and 77 database configuration unit tests
  passed. Builds and generated browser contract comparison passed.
- `npm run test:database` with disposable-container access: 9 suites, 149 tests
  passed (including the same 77 configuration tests), 62.855 seconds reported.
- `npm run test:e2e`: 18 Chromium tests passed, 47.7 seconds reported.
  Health/proxy and fixture preview paths were exercised; no real CSV journey exists.

No business endpoint, OIP receiver or reset was added. API/OpenAPI inspection
confirms `/health` is the only exposed operation; seven migrations contain no
production OIP receiving storage. The web import page is explicitly disconnected.
The review covers all 15 Blocked items and keeps their statuses unchanged.

## Closure

All review criteria are satisfied. The coverage report identifies three missing
implementation owners, a five-step delivery sequence and closure evidence for
all 15 blocked stories. No existing blocked story is marked Completed.
IOP-146 alone is completed; its item, backlog, delivery-map link and plan agree.
The unmerged IOP-136/144 branches are recorded without integration or changes.
All consulted story text was English; no translation-only edits were needed.

Local Markdown targets, unique IOP-146 ID, all blocked item/backlog statuses and
report dispositions, and `git diff --check` passed. Tests required only environment
permission correction, with no application edits. The aggregate test command's
initial failure is retained above; all component layers subsequently passed.
Commit this documentation increment locally; publication awaits owner approval.

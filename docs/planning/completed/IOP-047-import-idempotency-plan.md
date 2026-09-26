# IOP-047 — POC import idempotency execution

Status: Completed (internal verification increment), 2026-09-26. Authorized by the owner's 2026-09-26 request to work on
[IOP-047](../items/IOP-047-import-idempotency.md), limited to the
[POC](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `feature/IOP-047-import-idempotency`, created from clean `develop` before edits.

## Scope and dependencies

IOP-042's internal batch storage and IOP-045's pure CSV adapter are integrated on
develop. Accepted ADR-0027 already supplies scoped date uniqueness, atomic
publication and recovery; no new architectural decision or duplicate service is
needed. Verify these contracts together using valid synthetic CSV and a disposable
receiver, including stored line identities and measures. Production OIP storage,
scoped classification and ADR-0018 host activation remain undelivered prerequisites
for the end-to-end criterion; do not implement adjacent stories or close the parent.

## Changes and steps

1. Translate the entire IOP-047 context into English and refine its POC criteria,
   dependencies and current state. The read IOP-042/045 contexts and IOP-046 execution record are already English.
2. Extend `infra/database/test/import-batches.spec.cjs` with a CSV receiver probe
   preserving physical lines and exact measures. Verify identical/changed-byte
   reimport, concurrent valid files, scope independence, repeated source rows,
   retry after rejection and lost publication acknowledgement. Distinguish renaming
   to an occupied date from the documented different-date content limitation.
3. Reuse existing database uniqueness and module contracts unchanged unless the
   scenarios expose a defect. No schema, public API, UI or new runtime pattern.
4. Synchronize the item, backlog, delivery map and this execution record. Move the
   finished verification increment to completed; leave the parent In progress.

## Validation

Run `npm test`, `npm run typecheck` and `npm run test:database`. Existing database
tests cover rollback, authorization denial, RLS and recovery; new tests must verify
facts/measures remain unchanged on conflicts, not merely returned error codes.
Check edited Markdown links, matching IDs/statuses and `git diff --check`.
Record actual evidence and limitations before a scoped local commit. Publication
requires the owner's separate approval under ADR-0008.

## Executed evidence and closure

- `npm test` passed with Node 24.21.0/npm 10.9.2 from
  `/private/tmp/iop-017-runtime/node_modules/.bin`: 220 API tests, 15 web tests,
  77 database configuration tests and 9 secrets tests. Builds and the generated
  browser-contract comparison passed. `npm run typecheck` also passed.
- `npm run test:database` passed: 9 suites, 143 tests, including all five new
  IOP-047 scenarios using real PostgreSQL runtime credentials and forced RLS.
  Stored physical lines 3/4 each retain frequency 2 and 90 seconds, including
  identical repeated tuples; conflicts leave the winning facts unchanged.
  Concurrent files publish only one complete measure set. Invalid input permits
  corrected submission; lost commit acknowledgement reconciles without replay.
- Existing database tests additionally passed permission denial/revocation,
  scoped references, partial-receiver rollback, quota races, deadline expiry,
  terminal-state protection and privilege-drift detection. The disposable probe
  now stores measures; its cleanup/provisioning test runs after all receiver tests.
- Initial `npm test` used the shell's Node 20 and failed existing ESM/startup
  checks; the sandbox also denied loopback/Docker access. Rerunning with the
  required runtime and approved local test access passed without application changes.
- `node --check infra/database/test/import-batches.spec.cjs`, `git diff --check`,
  edited-document relative-link checks and matching item/backlog statuses passed.
  No production module, schema, grants, API artifact or UI change was needed.

The internal verification increment is complete. IOP-047 remains In progress
because production OIP storage, classification and host delivery are separate
prerequisites for its end-to-end criterion. This record moves to completed; the
item/backlog and POC delivery map are synchronized. The complete Spanish story
has been translated, retaining its outstanding outcome and constraints. No
adjacent story or new architectural pattern is activated. Commit locally and
request publication approval separately under ADR-0008.

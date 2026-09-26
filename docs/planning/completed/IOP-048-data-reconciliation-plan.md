# IOP-048 — POC data reconciliation execution

Status: Completed (internal verification increment), 2026-09-26. Authorized by the owner's request to work on
[IOP-048](../items/IOP-048-data-reconciliation.md), limited to the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `feature/IOP-048-data-reconciliation`, created from clean `develop` before edits.

## Scope and dependencies

IOP-046 validation and IOP-047 internal date-admission evidence are integrated.
IOP-042 storage, IOP-045 parsing, IOP-049 pure classification and IOP-125's literal
fixture oracle provide an executable internal reconciliation slice. Reuse Accepted
ADR-0027 and the existing disposable receiver; no new architectural mechanism.
Production OIP receiving storage and ADR-0018 host activation remain prerequisites
for delivered RAW-to-fact reconciliation. Do not activate adjacent implementation.

## Changes and steps

1. Translate the entire IOP-048 item into English, preserving its goal, constraints
   and outstanding acceptance; refine the internal and delivered-path criteria.
   Read dependency contexts IOP-012/042/043/045/046/047/049/125 are already English.
2. Extend `infra/database/test/import-batches.spec.cjs` using the existing disposable
   receiver with a test-only normalized snapshot. Compare retained fixture bytes,
   exact source-line measures/dimensions/classification, per-file and combined
   totals and sector totals against unchanged `fixtures/analytical-poc/expected.json`.
   Bind fictional mappings to the existing seeded test scope explicitly.
3. Verify complete versus interrupted rejection counts, zero facts after rejected
   input or receiver rollback, duplicate stability, and relevant runtime scoped
   reads/denials. Keep original duration and unknown reporting windows visible.
   Existing tests continue to cover concurrency, recovery and permission revocation.
4. Synchronize this record, the item, backlog and POC delivery map. No production
   schema, module contract, endpoint, UI, metric definition or fixture-oracle change.

## Validation and closure

Run `npm test`, `npm run typecheck`, `npm run test:database` with the accepted Node
24/npm 10 runtime. Check test syntax, edited Markdown links, matching IDs/statuses
and `git diff --check`. Record actual evidence and limitations. Move the completed
internal verification plan to `completed/`; keep the parent In progress for real
OIP/importer reconciliation. Commit the validated increment locally and request
publication approval separately under ADR-0008.

## Executed evidence

- `npm test` passed: 247 API tests, 15 web tests, 77 database configuration tests
  and 9 secrets tests; builds and browser contract comparison passed.
- `npm run typecheck` passed. Commands used Node 24/npm 10 from
  `/private/tmp/iop-017-runtime/node_modules/.bin`.
- `npm run test:database` passed: 9 suites, 149 tests. The final targeted run
  (`node --experimental-vm-modules node_modules/jest/bin/jest.js --config
  infra/database/jest.config.cjs --runInBand --testPathPatterns import-batches`)
  passed all 21 tests, including six new IOP-048 cases after the final per-line
  assertion edit. Tests used real runtime credentials and forced RLS.
- The unchanged independent oracle matches nine stored records, frequency 19 and
  97,775 accumulated seconds. Sector totals include all three unclassified rows
  (frequency 5, 91 seconds); repeated source lines and zero measures remain present.
  Physical-line measures, decoded dimensions/classification and retained original
  bytes agree. Complete value rejection records 3 = 0 admitted + 3 rejected;
  structural/encoding interruption keeps total/rejected counts null. Header-only
  input records zero data lines. Partial publication rolls back; known failure
  records 6 = 0 + 6. Duplicate input leaves baseline measures unchanged.
- Cross-organization runtime reads expose no probe records; missing principals
  cannot read probe facts or RAW. Existing scenarios also passed concurrency,
  permission revocation, lost acknowledgement, quota and privilege-drift checks.
- The initial sandboxed database run could not access Docker. The rerun with
  approved local Docker access passed; no application change was needed.
- Test syntax, edited Markdown links, item/backlog status consistency and
  `git diff --check` passed.

The internal increment is complete; this plan moves to completed. IOP-048 remains
In progress for production OIP/importer reconciliation. The disposable snapshot is
only test evidence, not a production schema, runtime integrity report, legacy
conversion parity or analytical-view verification. No adjacent story was activated.
The full IOP-048 context is translated into English; dependency contexts required
no translation. Item, backlog and delivery map are synchronized. Publication still
requires separate owner authorization.

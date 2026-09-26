# IOP-045 — POC CSV adapter execution

Status: Completed. Authorized by the owner's request on 2026-09-26.
Branch: `feature/IOP-045-csv-adapter`, created from clean `develop` before edits.
Story: [IOP-045](../items/IOP-045-csv-adapter.md).

## Scope and dependencies

Implement the pure Integrations adapter under the existing
[source contract](../../architecture/csv-source-contract-poc.md) and
[preservation limits](../../architecture/csv-preservation-poc.md), within the
[POC](../../product/scope-poc.md). IOP-041/043 provide integrated logical contracts;
IOP-042 supplies internal storage but production composition remains pending.
IOP-012 supplies syntax, normalization and exact arithmetic. Existing API-local
Integrations placement is reused; no new architectural pattern or ADR is needed.

The adapter returns complete normalized source records with physical lines,
reporting-date label, unknown window, exact totals and repeated-tuple warnings,
or one safe failure without partial output. Classification remains IOP-049;
IOP-046 retains broader validation/reporting delivery. No persistence, HTTP/UI,
scope selection, authorization bypass, OIP receiver or live integration is added.
Legacy duration-helper parity remains unverified; do not fabricate Python evidence.

## Changes and steps

1. Add `apps/api/src/modules/integrations/csv-adapter.ts` and export its pure
   contract through the existing index. Enforce strict decoding, bounded CSV
   syntax, filename dates, required cells, integer conversion and totals.
2. Add `apps/api/test/csv-adapter.spec.ts` and a fictional UTF-16 fixture with
   independent expected outputs; cover syntax/value/overflow and budget boundaries,
   deadline failure, input preservation and repeated physical records.
3. Exercise already-authorized reference files read-only, recording only structural
   counts/timings, never copying operational rows/totals to fixtures or logs.
4. Translate all Spanish prose in IOP-045; translate the read adjacent IOP-046
   story without changing its meaning/status/links or activating it. Direct
   dependencies IOP-041/042/043/012 were already English.
5. Synchronize the story/backlog, delivery map, source-contract implementation
   handoff and API guide. Record boundaries and unfinished integration explicitly.

## Validation and closure

Run `npm run typecheck` and `npm test`; no database/HTTP behavior changes require
new database or browser tests. Check changed Markdown links, IDs, status and
`git diff --check`. Verify normal and malformed fixtures, exact/over budgets,
safe error metadata, no partial output and no modification of original bytes.
Record measured reference parsing and limitations. Move this finished plan to
completed, commit the coherent increment locally, and request publication under
ADR-0008. Do not claim end-to-end import or legacy parity from pure adapter tests.

## Actual evidence — 2026-09-26

- `npm run typecheck`: passed under Node 24.21.0/npm 10.9.2 from
  `/private/tmp/iop-017-runtime/node_modules/.bin`.
- `npm test`: passed with that runtime and authorized local sockets: 9 secrets,
  202 API (including 71 adapter), 15 web and 77 database configuration tests.
  Builds and browser/API contract comparison passed. No database or browser
  behavior changed; container/E2E suites were not rerun for this pure adapter.
- Initial shell execution used incompatible Node 20.18.3 and sandbox-denied
  loopback sockets; its general suite failed for those environment reasons.
  The full supported-runtime rerun above resolved both. An initial reference
  probe preceded build completion; it was rerun successfully after compilation.
- Adapter tests verify real UTF-16 fixture bytes, exact totals (7 / 93,964 seconds),
  source lines 2/4/5, duplicates, preserved originals, safe failures, Gregorian
  filename dates, malformed encoding/CSV and integer overflow. Field, physical
  record, row, line and byte limits each have exact/over-boundary cases. The
  deadline has below/at-boundary and mid-scan expiry coverage.
- Read-only Node 24 preparation of the existing owner-authorized references:

  | Filename | Bytes | Records / physical lines | Elapsed ms | Observed RSS delta bytes |
  | --- | --- | --- | --- | --- |
  | Hitliste-20260701.csv | 120,432 | 681 / 682 | 17.48 | 9,883,648 |
  | Hitliste-20260705.csv | 3,990 | 26 / 27 | 0.53 | 167,936 |
  | Hitliste-20260707.csv | 131,778 | 739 / 740 | 11.14 | 3,739,648 |

  All have zero skipped blanks. These single-process observations include runtime
  allocation/JIT effects; RSS deltas are not peak-memory or performance guarantees.
  No operational rows or measure totals were emitted or copied. The test fixture
  is fictional. Full Python parity and runtime importer reconciliation remain open.
- Reviewed the complete implementation and changed documentation; local Markdown
  targets, IOP-045 Completed/IOP-046 Proposed consistency and `git diff --check`
  passed before commit. IOP-046 changes are translation-only; no adjacent status
  or acceptance criterion changed.

## Outcome

The bounded adapter is complete and the story/backlog are synchronized. Preparation
returns a complete source dataset or one safe error, never an admitted import.
No source scope, classification, authorization, endpoint, schema or date-claim
behavior changed. Downstream composition must retain scope/RAW identity, map
failure metadata and reject expired work before publication. The completed record
is retained here for review; publication requires the owner's explicit approval.

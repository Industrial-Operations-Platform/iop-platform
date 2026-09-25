# POC original CSV preservation and retrieval

Accepted design under [IOP-011](../planning/items/IOP-011-file-storage-model.md)
and [ADR-0022](adr/ADR-0022-poc-csv-preservation.md), explicitly approved by the owner on 2026-09-25.
This specializes the [CSV source contract](csv-source-contract-poc.md) and
[security baseline](security-baseline-poc.md) for the [local POC](../product/scope-poc.md).
No storage, endpoint, schema or runtime security is implemented here.

## Ownership and evidence

Integrations preserves one complete original payload per retained import attempt,
owned by explicit `organizationId`, `siteId` and `sourceId`. Validate source/site
ownership and `imports.submit` before accepting content. Browser fields, source
labels and filenames cannot establish authority or redirect scope. Never retain
unscoped input in a global staging area.

Store bytes without decoding/re-encoding, newline conversion, BOM stripping,
trimming or quote replacement. Parsing uses a separate interpretation. Retain:

- Application-generated opaque `rawId` and `importId`, with scoped relationships.
- Valid original basename, actual byte length and SHA-256 of the entire payload.
  A checksum is integrity evidence, not an authorization token, source signature
  or the reporting-date duplicate key.
- Receipt instant in UTC, submitting platform principal, adapter/profile revision
  and mapping revision; freeze the applicable configuration references.
- Validated reporting-date label and configured site zone; source reporting window
  remains unknown as defined by IOP-012. Receipt time never replaces source time.
- Explicit RAW availability and attempt outcome, bounded diagnostics and known
  processing counts. Unknown/unprocessed counts stay unknown after early failure.

RAW identity, bytes, ownership and provenance are immutable in ordinary operations;
processing outcome may progress without modifying evidence. Each normalized row
references its scoped import and original physical line number under IOP-012.
Preserve original duration spelling through RAW even when normalized seconds differ.
No copy of RAW content belongs in application logs, public assets or Git.

## Finite POC budgets

Use the following fixed defaults and maxima for the first delivery; lower host
limits must be documented consistently. Increasing any maximum requires a reviewed
contract update and measurements, not an unrestricted configuration override.
These are admission choices, not benchmark results or response-time promises.

| Surface | Default and maximum | Enforcement |
| --- | --- | --- |
| Original CSV bytes | 5 MiB (5,242,880 bytes), including BOM | Count actual bytes; stop before buffering the next byte over the cap, regardless of Content-Length. |
| Total upload request | 6 MiB (6,291,456 bytes) | Bound framing/metadata as well as the single file; no multiple files or archives. |
| Data records / physical lines | 20,000 / 25,000 | Count blank lines toward physical lines; header is not a data record. |
| Columns | Exactly 7 | Enforce IOP-012's ordered header and every record's shape. |
| Decoded field / physical record | 4,096 / 32,768 UTF-16 code units | Count before normalized trimming; record cap includes delimiters/quotes, excludes line ending. |
| Filename | 21 ASCII characters | Require `Hitliste-YYYYMMDD.csv` with a real date per IOP-012; reject path components/control characters. |
| Receiving / parsing and validation | 30 seconds / 30 seconds | Separate wall-clock deadlines; stop receiving/processing and release resources on expiry. |
| Retained diagnostics per attempt | 100 entries, at most 256 characters per reason | Safe fixed codes/reasons, line and neutral field; no raw cell excerpts. Indicate truncation. |
| In-flight uploads | 1 for the local API host | Reject busy before buffering another body; no queue or worker. |
| Retained attempts / RAW bytes | 1,000 attempts / 256 MiB (268,435,456 bytes) per dedicated demo dataset | Include successful and failed receipts; atomically enforce admission. No automatic eviction. |
| Temporary file storage | 0 bytes | Bounded in-memory receipt; no disk spooling. Parser allocations need measurement and bounded processing too. |

Enforce field/record budgets incrementally, not after allocating an arbitrary cell.
The byte cap covers input buffering only, not a claim that total process memory is
5 MiB. API/proxy/parser/database timeout and cancellation behavior must agree in
implementation; expired work must not later publish analytics. Retrieval uses one
bounded payload per request and a 30-second deadline, with no bulk RAW archive.

The inspected 120,432-byte, 681-record sample fits byte/row budgets; its maximum
field lengths and processing timings have not been measured here. IOP-045/046 must
verify representative and boundary fixtures before enabling the path. Dataset quota
is a logical retention bound, not a physical disk quota. Disk-full/database failure
must fail safely even below these limits.

## Receipt, rejection and interruption

1. Validate caller, explicit scope/configuration, filename, request shape and capacity.
   Receive one bounded file. Missing/foreign scope, invalid filename, oversize,
   disconnect, receive timeout or capacity refusal creates no durable RAW copy.
   Return a bounded safe error; discard buffered bytes. Do not claim a complete
   checksum, row count or retrievable original for incomplete input.
2. Once the complete payload fits admission limits, persist original bytes and
   required provenance together in Integrations. Complete but malformed encoding,
   header or values may retain RAW for review; they never count as imported dates.
   Parse/normalize only with that stable reference. A known duplicate may be refused
   before receipt; if discovered after receipt, mark that retained attempt rejected.
3. Publish analytics only after full validation and a successful scoped reporting-date
   claim. The unique logical key remains `(organizationId, siteId, sourceId,
   reportingDate)` regardless of checksum or renamed content. An existing successful
   import and its RAW never change. Failed attempts do not reserve successful coverage.
4. Parsing timeout, invalid input or publication rollback leaves only the bounded
   original and safe failed outcome, with zero published analytical rows. If a crash
   leaves an attempt unfinished, expose it as incomplete, never successful coverage.
   IOP-042 must reconcile unfinished attempts with committed publication state before
   allowing retry; do not blindly reset successful date claims or auto-replay content.

RAW/metadata persistence failure leaves neither half as a durable success. An
uncertain database commit must be resolved by the existing opaque import identity
before repeating receipt or publication. Repeated failures consume the same finite
retention budget; once full, refuse new admission with a safe capacity message.
No automatic cleanup removes successful evidence to make room.

Retain complete rejected originals and successful originals until an explicitly
validated dedicated demo reset. Runtime import-review permission does not authorize
deletion. IOP-128 owns reset mechanics: verify dedicated target, stop imports, remove
dependent analytical/import/RAW data consistently and preserve unrelated targets.
This contract does not implement reset, secure erasure or production retention.

## Scoped retrieval

An operator with current `imports.review` may retrieve one retained original by
opaque import/RAW identity and explicit organization/site context. Recheck principal,
permission and ownership at retrieval, then use a scoped transaction and forced RLS
with actual non-owner runtime credentials. A valid ID or checksum grants no access.
Missing scope denies; a foreign/inaccessible resource follows scoped not-found
behavior without revealing existence. An authorized review can distinguish an
incomplete/non-retained attempt from a retained payload.

Return the exact bytes only after checking stored length and SHA-256. Missing bytes
or an integrity mismatch produces a safe unavailable/integrity error; do not return
a normalized reconstruction, silently repair evidence or stream unchecked bytes.
Keep the original basename as metadata; use a server-generated ASCII download name,
attachment disposition, `application/octet-stream`, `nosniff` and `Cache-Control:
no-store` at the future HTTP boundary. Never serve originals as HTML, inline preview,
a public path or an unauthenticated static resource. Rendering labels stays plain text.
Endpoint/OpenAPI details belong to delivery; original-input retrieval is scoped
quality review, not a new analytical export feature.

`analytics.read` permits contributing normalized records and provenance references,
not unrestricted CSV download. `imports.review` does not imply analytics permission,
delete, replacement or replay. No new role, public URL, storage browser or batch
export is introduced. Downloaded local copies fall under the trusted operator's
control; reset cannot revoke them. The dedicated database volume remains outside
Git with local access restricted under IOP-014.

## Design walkthroughs and executable handoff

These are reviewed expected outcomes, not executed importer or isolation tests.

| Scenario | Required outcome / future evidence |
| --- | --- |
| Valid UTF-16 LE input with BOM, quotes, CRLF and final newline | Retrieved bytes and SHA-256 match input exactly; normalized rows link to correct physical lines. |
| Exactly 5 MiB versus one byte above, false Content-Length | Exact limit may proceed if all other checks pass; larger actual input stops with no retained partial RAW. |
| Exactly each row/line/field/record/error/time/quota bound, then above it | Enforce units and caps; no partial analytics, unbounded allocation or silent truncation. |
| Invalid encoding or one bad row in a completely received file | Retained scoped original, rejected attempt and bounded diagnostics; date remains available. |
| Missing scope, foreign A2/B1 identity, reader-only principal | No RAW disclosure; verify positive A1 operator control and actual runtime RLS. |
| Same scoped date, changed name/content or concurrent submissions | At most one successful date claim; existing RAW unchanged; rejected receipts cannot add facts. |
| Connection loss, disk full, receive/parse timeout or crash after RAW receipt | No partial success; bounded resources released; unresolved attempt reconciled before retry. |
| Altered bytes or missing payload | Integrity/unavailable error, no reconstructed original. |
| Traversal/control-character filename or HTML/formula cell | Filename rejected; content never executed or used as a path. |
| Dataset quota reached; reset targets unrelated database | New receipt refused; unsafe reset refused without deleting evidence. |

IOP-041/042/047 own RAW lifecycle, quota races, publication and retry consistency;
IOP-045/046 own parser bounds; API delivery owns retrieval/permission and timeout
checks; IOP-128 owns reset evidence. Exercise connection reuse/rollback and foreign
references under ADR-0013. No adjacent story is activated here. Runtime business
access independently waits for ADR-0018 or another accepted execution mechanism.

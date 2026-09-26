# POC RAW ingestion model

[IOP-041](../planning/items/IOP-041-raw-ingestion-model.md) defines this logical
model for the [local POC](../product/scope-poc.md). It specializes the
[CSV source contract](csv-source-contract-poc.md) and Accepted
[ADR-0022 preservation contract](csv-preservation-poc.md); it adds no storage
choice or cross-module transaction mechanism. This is design, not implemented
persistence, an importer or runtime security evidence.

## Ownership and grain

Integrations owns import attempts and their original input. One retained attempt
has exactly one complete RAW payload; a RAW payload belongs to exactly one attempt.
The payload is the entire received CSV byte sequence, not one reconstructed CSV
row or a JSON representation of decoded cells. Multiple rejected attempts may
refer to the same scoped reporting date without representing imported coverage.
Do not deduplicate evidence by checksum or reuse another attempt's RAW identity.

Platform Core supplies organization/site ownership and the configured site zone.
The explicit configured source belongs to that organization/site; external column
values and filenames cannot choose it. No source registry or source administration
is required. OIP owns normalized aggregates and their analytical invariants;
consumers use owning-module contracts, not direct access to Integrations tables.

## Immutable receipt contract

All fields below are required together for a retained receipt. Their logical names
do not select SQL table names, DTOs or an ID-generation implementation.

| Fields | Meaning and invariant |
| --- | --- |
| `organizationId`, `siteId`, `sourceId` | Validated explicit ownership, identical across attempt, RAW and contributing references. Site/source cannot be null or a wildcard. |
| `importId`, `rawId` | Application-generated opaque identities; one-to-one association within the complete scope. Not derived from filename, timestamp, checksum or source labels. |
| `originalFilename`, `reportingDate` | Valid original basename and calendar label under IOP-012; validate before receipt. Neither is a filesystem path or occurrence timestamp. |
| `originalBytes`, `byteLength`, `sha256` | Complete original `bytea`, actual byte count and SHA-256 over exactly those bytes, including BOM, quotes and line endings. Required metadata and bytes become durable together. |
| `receivedAt`, `submittedBy` | UTC receipt instant under ADR-0016 and the authorized platform principal. Neither browser-provided actor nor receipt time establishes source time. |
| `adapterRevision`, `profileRevision`, `mappingRevision` | Frozen identities of the interpretation/configuration used; retain their meaning when later configuration changes. No reference to a mutable “latest” revision. |
| `siteTimeZone`, `reportingWindowStatus` | Snapshot of validated configured IANA zone; window status remains `unknown`. Source-window zone/bounds and occurrence instants remain absent. |

Identity, ownership, bytes and provenance cannot change in ordinary processing.
Only processing outcome/diagnostics progress separately. No ordinary delete,
replacement, reclassification or replay is introduced. Retain successful and
rejected originals until the separately validated dedicated demo reset.
The preservation contract remains authoritative for all numeric budgets,
permissions, retrieval headers and retention rules; this document does not raise them.

## Contributing-record reference

Each normalized aggregate carries `(organizationId, siteId, sourceId, importId,
sourceRecordNumber)` and resolves through that attempt to its RAW receipt.
`sourceRecordNumber` is the original one-based physical line number, including
header and skipped blank lines. It is not the ordinal in a filtered result.
Multiline CSV fields are unsupported under IOP-012, so one accepted record maps
to one physical line. Scoped candidate keys/foreign keys and receiving-module
validation prevent another site/source/import from being substituted.

Two identical input records on different lines remain two aggregates; their
measures both contribute and the repeated-record warning does not erase either.
Original duration spelling and all other original values remain recoverable from
the bytes even after trimming and conversion. Preserve `originalDuration` alongside
the normalized seconds as required by the source contract. No physical asset,
sensor identity or reconstructed occurrence is inferred from these references.

For example, with a header on line 1, a blank line 2 and identical records on lines
3 and 4, the two contributing references end in 3 and 4. A parser must not renumber
them 1 and 2 or deduplicate them. Aggregate inspection under `analytics.read`
exposes authorized contributing records/provenance; original CSV retrieval requires
current `imports.review` separately.

## Availability is separate from analytical outcome

These are observable semantic distinctions, not a new persisted state-machine enum.
IOP-042 owns the detailed import-run lifecycle.

| Situation | RAW evidence | Analytical meaning |
| --- | --- | --- |
| Refused before complete admitted receipt | No retained payload; do not promise a durable attempt or complete checksum. | No admitted records or imported coverage. |
| Receipt committed, processing unfinished | Complete immutable original and mandatory metadata are retained. | Incomplete; no success claim until committed publication is established. |
| Fully validated and published | Original remains retained and reviewable. | All records admitted with one successful scoped source/date claim. |
| Complete input rejected or publication rolled back | Retained original, bounded safe diagnostics and failed outcome. | Zero published rows for this attempt; no successful date reservation. |
| Commit outcome uncertain or interrupted | Availability/publication must be reconciled using the original opaque attempt identity. | Do not assert failure, replay or allow a conflicting retry before reconciliation. |
| Stored bytes missing or integrity mismatch | Unavailable/integrity error; never reconstruct or return unchecked bytes. | Do not silently modify existing admission or invent coverage; expose the evidence failure. |

Missing scope, invalid filename, excessive input, disconnect, receive timeout or
capacity refusal creates no durable RAW. A completely received payload with bad
encoding/header/values may retain evidence under the preservation contract.
Diagnostics use bounded codes/reasons, physical line and neutral field, without
raw cell excerpts. Known counts and unprocessed/unknown counts stay distinct;
truncated diagnostics are explicit. RAW availability alone never marks a date
imported, and a rejected attempt does not remove an earlier successful import.

## Persistence and runtime handoff

The accepted storage/isolation rules require atomic receipt bytes plus metadata,
scoped relational references, forced RLS, current permission checks and non-owner
runtime credentials. Enforce attempt/byte quotas atomically, including rejected
receipts; the host's single-upload limit alone is not database concurrency evidence.
Original review verifies length and checksum before returning bytes. Payloads are
not eagerly included in lists, analytics, logs or public assets.

IOP-042/047 must specify and test publication, the unique successful
`(organizationId, siteId, sourceId, reportingDate)` claim, quota races and recovery
through owning-module contracts. Receipt persistence precedes normalization;
publication must expose all validated facts or none. A checksum is never the date
claim key. Unknown commit outcomes require lookup/reconciliation, not a new receipt
or automatic replay. This model supplies invariants without choosing cross-module
SQL ownership, locking, recovery orchestration or a general transaction framework.
Any new architectural mechanism requires its own Proposed ADR before dependent work.

IOP-045/046 implement bounded parsing and diagnostics; IOP-049 supplies frozen scoped
mapping configuration; IOP-128 validates the dedicated reset. No adjacent story is
activated here. ADR-0018 is Accepted, but host activation and delivered-path
validation still gate runtime import/review access. Existing database and site
bootstrap do not by themselves open that access.

## Design review and future executable evidence

The following scenarios were reviewed against IOP-011/012; these are contract
walkthroughs, not executed database, parser, concurrency or endpoint tests.

| Scenario | Checked expectation / delivery evidence required |
| --- | --- |
| Valid BOM/CRLF input and blank lines | Exact byte/hash round trip; contributing references retain physical lines. |
| Identical records, whitespace and original duration spelling | Distinct line identities, both measures retained; original cells recoverable. |
| Valid basename but malformed encoding or a bad value | Scoped retained evidence when admitted; zero published records and bounded diagnostics. |
| Partial upload, invalid date/name or over-limit bytes | No partial RAW, no fabricated checksum or complete count. |
| Same scoped date with changed bytes/name, including concurrent attempts | At most one successful claim; existing evidence unchanged, no facts from rejected attempts. |
| Same labels/date in another configured source/site | Separate namespace; no cross-scope references or authorization inheritance. |
| Missing scope or analytics-only principal requests original | Denial; include positive authorized review and real-role RLS checks in delivery. |
| Quota exhaustion or receipt persistence failure | No half-persisted receipt or eviction; safe refusal even when parsing would succeed. |
| Crash after receipt or uncertain publication commit | Show incomplete state, reconcile by identity before retry, never claim partial success. |
| Changed/missing stored bytes | Safe unavailable/integrity result, no reconstructed download or silent repair. |

Design closure supplies the RAW model and provenance contract only. Physical
schemas, runtime source configuration, admission/recovery mechanisms and measured
limits remain delivery work; unknown source windows remain an explicit metric limit.

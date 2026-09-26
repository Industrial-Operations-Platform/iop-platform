# POC import batch model

[IOP-042](../planning/items/IOP-042-import-batches.md) defines one bounded direct
CSV attempt, without a worker or job. This is accepted design, not implemented
storage. The mechanism in [Accepted ADR-0027](adr/ADR-0027-poc-import-publication.md)
was approved by the owner on 2026-09-26. Existing requirements
come from the [RAW model](raw-ingestion-poc.md), [source contract](csv-source-contract-poc.md)
and [preservation contract](csv-preservation-poc.md).

## Identity, ownership and fields

Integrations owns the attempt and immutable receipt; OIP owns analytical facts and
their invariants. One `importId` identifies one attempt with one original `rawId`.
A corrected resubmission is a new attempt, not an update or replay of old evidence.
Reuse the complete receipt fields from IOP-041, including explicit organization,
site, source, reporting date, actor, bytes/hash, revisions and site zone. A date is
a reporting label with unknown source window, never an occurrence timestamp.

Mutable processing metadata consists of outcome, safe reason code, completion
instant when known, counts, bounded diagnostics and an explicit diagnostics-truncated
flag. System instants use ADR-0016. Payloads never appear in status/list responses
or logs. Safe correlation uses the opaque attempt identity; it confers no access.

## Lifecycle and counts

| Outcome | Meaning and permitted transition |
| --- | --- |
| No receipt | Pre-admission refusal or confirmed receipt rollback; no durable attempt, original or coverage is promised. |
| `received` | Complete immutable receipt committed; processing is unfinished. May become `succeeded`, `rejected` or `failed`. Never counts as imported coverage. |
| `succeeded` | All records, the successful date claim and final counts committed together. Terminal; no ordinary replacement or retry of this attempt. |
| `rejected` | Input invalid or date already owned; zero analytical rows from this attempt. Terminal; RAW retained. |
| `failed` | Confirmed processing failure/rollback or reconciled interruption; zero analytical rows from this attempt. Terminal; RAW retained. |

An uncertain receipt/publication commit is an observable `outcomeUnknown`, not a
blind write of `failed`. A persisted `received` row can therefore be shown as
incomplete while a commit is being resolved. Do not expose a guessed success or
failure, silently turn elapsed time into failure, or overwrite a successful result.
RAW availability/integrity is independent of these outcomes; corruption does not
erase an existing date claim or authorize replacement.

Use `admittedRecordCount` for analytically accepted records. It is zero for a
confirmed rejected/failed attempt, unknown while publication is unresolved, and
equals `dataRecordCount` on success. It is not the number of valid-looking rows.
Use `rejectedRecordCount` for the number of data records not admitted when the full
record count is known; on confirmed rejection/failure it equals `dataRecordCount`.
It is unknown when the file cannot be fully counted, and zero on success.
For a settled, fully counted attempt:
`dataRecordCount = admittedRecordCount + rejectedRecordCount`.

Separately retain inspected-valid and inspected-invalid counts, with a flag for
whether inspection completed. These are validation counts, not publication counts.
Header and skipped blank lines are excluded from data records; physical-line
references remain unchanged. Unknown totals/remainder stay unknown after decoding,
structural or processing interruption. Never report complete counts from the first
100 retained diagnostics. Unclassified and repeated-record warning counts may
overlap; they do not increase rejection counts or remove records from totals.

For example, two valid and one invalid record in a fully inspected three-record
file yield admitted 0, rejected 3, inspected-valid 2 and inspected-invalid 1.
A valid three-record file with one unmapped record yields admitted 3, rejected 0
and unclassified 1. A failure before complete decoding has admitted 0 only after
rollback is established, with total/rejected counts unknown.

## Admission and publication contract

1. Require current `imports.submit`, trusted principal and exact configured scope;
   validate ownership, frozen configuration and filename before receiving content.
   Apply all preservation budgets, including one in-flight upload, without queues.
   Incomplete/oversize/unauthorized input has no receipt. An early duplicate check
   is an optimization, never the concurrent uniqueness authority.
2. After bounded complete receipt, atomically persist RAW, required metadata and
   attempt in `received`, consuming dataset quota even if later rejected. A receipt
   failure leaves no half-record or quota charge. Resolve an uncertain commit by
   its existing identity before sending a new receipt.
3. Parse/validate outside database transactions against immutable RAW/configuration.
   A structural/value error rejects the entire file. Preserve safe diagnostics;
   unmapped areas and repeated records remain valid with warnings.
4. Reauthorize before publication. Through owner contracts on one authorized pinned
   transaction, require the attempt still be `received`, claim the unique
   `(organizationId, siteId, sourceId, reportingDate)`, validate and insert all OIP
   records, and finalize success/counts. Commit all or roll back all. No staging
   facts, prefix of records or independent success write can become visible.
5. A confirmed publication rollback may finalize a safe terminal rejection/failure
   in a fresh authorized transaction. If that write fails, retain `received` and
   reconcile later. Never infer a rollback from an ambiguous connection error.

OIP validates the neutral receiving contract; Integrations does not write its
tables. The internal import contract uses `imports.submit`; importing is not an
analytical read and must not require `analytics.read`. Subsequent analytical reads
require that permission. Status/RAW review requires current `imports.review`;
review alone does not authorize recovery mutations or replay. Each phase rechecks
permissions via ADR-0026 and uses its supplied handle. No migrator bypass or new role.

## Failure, reconciliation and retry

The accepted mechanism is in ADR-0027. Recovery is synchronous and bounded, before
a retry or through an explicitly invoked local recovery operation. It never parses
or republishes the old payload. A process restart does not automatically replay it.

First establish that the old executor can no longer start work, and serialize with
any in-flight database phase. Read current state through both owning contracts
using the same authorized scoped transaction and original `importId`:

| Established state | Result |
| --- | --- |
| Receipt absent and old receipt transaction settled | No retained attempt; a new explicit submission may proceed. |
| Success, date claim and matching OIP publication agree | Return existing success; reject a new import of that scoped date. |
| `received`, with no claim/facts for this attempt, old execution stopped | Mark failed/interrupted; a new explicit submission may proceed if the date remains free. |
| Terminal rejection/failure with no claim/facts for this attempt | Return unchanged outcome; permit new submission if no other successful attempt owns the date. |
| Database inaccessible, locks unresolved or permission lost | Outcome remains incomplete/unknown; do not assert retry safety. Recover after service/access restoration. |
| Claim, facts and attempt disagree | Safe consistency error, no automatic deletion, reset or replay; block affected-date publication pending investigation. |

A failed attempt never permanently reserves a successful date. A later successful
attempt for the same date remains authoritative when inspecting old failures.
Recovery checks ownership of the claim, not merely its presence for that date.
Authorization denial is not evidence of absence. Original metadata remains unchanged;
a recovery actor must hold current submit permission and cannot inherit the original
submitter's grant. Use bounded safe logs to correlate recovery, without introducing
a full audit subsystem.

## Review scenarios and delivery evidence

These are design walkthroughs, not executed tests.

| Scenario | Required result |
| --- | --- |
| Valid input, including unmapped/repeated rows | One success; every contributing line preserved, full frequency/duration totals. |
| One invalid record or header-only file | No coverage/facts; bounded rejection; counts follow the rules above. |
| Same date with changed bytes or another permitted filename | Scoped date claim rejects duplication, regardless of hash; no overwrite. |
| Two concurrent same-date publications | At most one success, losing transaction leaves no facts or claim. |
| Two receipts reach final quota capacity | Quota and complete receipt commit together; at most the remaining capacity is admitted. |
| Fault after inserting some OIP rows, before success commit | Entire publication rolls back; retained RAW remains reviewable. |
| Commit succeeds but response is lost | Reconciliation returns existing success; no new facts or double quota charge. |
| Crash after receipt or during parsing | Reconcile stopped execution to failure; manual corrected submission may succeed. |
| Delayed original publisher races recovery | Serialization/state guard prevents publishing a terminally failed attempt. |
| Permission revoked between receipt and publication | New phase denies; receipt remains incomplete until authorized recovery. |
| Foreign scope/reference or missing context | Deny without foreign details; test real non-owner RLS and pool reuse. |
| Different site/source, same date | Independent date namespaces; dedicated dataset quota still includes every receipt. |

IOP-042 remains open until the required recording behavior is implemented and validated. Parser, normalization and duplicate
delivery slices retain their own ownership; no adjacent story is activated here.
ADR-0018 host activation independently gates endpoints. No HTTP contract, migration,
performance result, reset implementation or runtime security proof is supplied here.

# ADR-0027: Bounded direct-import publication and recovery

## Status

Accepted — explicitly approved by the owner on 2026-09-26, under [IOP-042](../../planning/items/IOP-042-import-batches.md).
Acceptance covers this mechanism and the linked [batch model](../import-batches-poc.md).
IOP-042 implements batch storage and internal coordination; evidence is in the
[storage plan](../../planning/completed/IOP-042-import-batch-storage-plan.md).
The OIP receiver, parser and host remain separate delivery.

## Context and alternatives

Accepted [ADR-0022](ADR-0022-poc-csv-preservation.md) requires durable RAW before
normalization, atomic quota admission and no partial analytical publication.
[ADR-0026](ADR-0026-poc-authorization-lookup.md) supplies an authorized pinned
transaction but leaves cross-module publication and uncertain commits unresolved.
The [POC](../../product/scope-poc.md) has one direct bounded CSV path, no workers.

| Option | Assessment |
| --- | --- |
| Separate receipt transaction, then one coordinated publication transaction | Recommend: preserves rejected evidence and commits claim/facts/outcome together in the existing database. Requires narrow owner contracts and explicit recovery. |
| One transaction covering receipt, parsing and publication | Rejection rollback loses RAW; long parsing transaction couples evidence retention and publication. Does not meet the existing preservation contract. |
| Independent module commits plus compensation | Exposes partial publication unless additional visibility/recovery machinery is introduced. More failure states than this POC needs. |
| Outbox, worker and eventual publication | Adds deferred job/delivery infrastructure without a demonstrated POC requirement. |

These are project design judgments, not measured performance claims.

## Decision

Compose Integrations and OIP through narrow API-local exported contracts following
the placement precedent in ADR-0026. An import coordinator sequences operations;
it does not contain OIP validation or query another module's tables. Reuse the
existing site-operation transaction handle. No general transaction framework,
message bus, worker, ORM or provider registry is introduced.

### Receipt and quota

Integrations persists immutable receipt plus `received` attempt in one short
authorized transaction. Use one database-local singleton quota row owned by
Integrations, containing only retained-attempt and retained-byte counters for the
dedicated demo dataset. It is platform operational metadata, not unscoped RAW or
customer data; do not store identifiers, filenames, payloads or per-customer totals.
It is never exposed through a business read endpoint.

Lock/update this row conditionally within the receipt transaction before inserting
the attempt/RAW; enforce the unchanged ADR-0022 maxima with database constraints.
Rollback reverses both charge and receipt. Rejected receipts stay charged; no
runtime decrement/delete/reset permission. Setup initializes the row; missing or
invalid counters fail closed. Only the owning adapter accesses the narrow counter
columns after scoped submit authorization. Explicit runtime grants and provisioning
allowlist changes require tests; no broad schema/table access or privileged function.
Customer tables still require forced scope RLS. This global resource-counter
exception is explicitly accepted here, not implied by earlier isolation decisions.

The dedicated reset must later reset counters and all dependent data together with
imports stopped. Counter drift requires controlled investigation/reset, never an
unscoped runtime scan of customer receipts. This is a logical retention budget,
not a physical disk bound. One host upload slot does not replace database admission.

### Publication

Integrations owns the unique successful date claim, keyed by complete organization,
site, source and reporting date and referencing its attempt with matching scope.
Failed/received attempts do not own a committed claim. OIP owns its records and a
narrow publication-result lookup by scoped import identity, sufficient to reconcile
record count and receipt provenance without exporting analytical contents.

After parsing, obtain fresh submit authorization. Serialize the attempt, require
`received`, then reserve the date claim using database uniqueness, invoke OIP's
receiving contract on the same transaction, and set success/counts. OIP validates
scope, RAW line references and aggregate invariants and inserts all records on the
supplied handle. No nested independent commit or second pooled connection.
Commit claim, all facts and successful outcome together. Claim conflicts roll back
publication; finalize rejection separately only after rollback is established.
Carry the operation deadline/cancellation through processing and database work;
expired work must not start a later publication phase. Cancel and settle in-flight
work before claiming failure. If commit acknowledgement is uncertain, reconcile
instead of promising that cancellation rolled it back.
The importer must classify date conflict through an explicit owner result, without
leaking driver errors or changing generic authorization errors into guessed conflicts.

### Serialization and uncertain commits

Use an attempt-specific transaction advisory lock in every receipt, finalization,
publication and reconciliation transaction; publication/finalization also lock and
check the attempt row. Derive the advisory key server-side from complete scope and
opaque import identity in a reserved namespace. A collision may serialize unrelated
work but must never grant access or equate identities. Lock order is attempt, then
quota for receipt or date claim for publication. Bound lock/statement waits; hold
no database lock while receiving or parsing. Exact SQL and key encoding require
implementation tests, not a new general lock service.

On ambiguous commit, discard an unusable connection and look up the original
identity in a fresh authorized transaction. The current ADR-0026 helper intentionally
returns a generic unavailable error, so callers must conservatively reconcile errors
after a potentially submitted write; they cannot infer rollback from that error.
Do not automatically rerun the transaction callback.

Reconciliation first requires the old executor to be quiescent (stopped/cancelled
with no future phase possible, or absent after process restart), then acquires the
same attempt lock to wait for its database transaction to settle. Time elapsed or
one empty read is insufficient. If quiescence/settlement cannot be established,
return incomplete; retrying recovery after stopping the host is supported, without
replaying content or requiring a worker. A delayed publisher must recheck state
under the lock and cannot publish after recovery has finalized failure.

Resolve success/claim/OIP agreement, confirmed absence or interruption exactly as
the batch model specifies. No automatic repair of inconsistent evidence. Recovery
is a fresh authorized submit mutation, not a privilege implied by review access.
Database failure or lost permission may delay recovery but never creates a durable
failed-attempt date reservation. Status retrieval itself performs no mutation.

## Required evidence and consequences

Before implementation completion, use real runtime-role PostgreSQL tests for quota
races, same-date concurrency, scoped constraints/RLS, rollback after partial inserts,
lost commit acknowledgement, receipt ambiguity, delayed publication versus recovery,
revocation, pool reuse and safe repeated reconciliation. Check counter grants,
immutability and drift detection, with positive controls. Verify the batch-model
count examples and source-record provenance. Run `npm test` and the relevant
`npm run test:database` cases; record actual results and limits.

This introduces one bounded cross-module transaction and one global resource counter.
It assumes the accepted single database/local demo and does not provide distributed
recovery or production retention. ADR-0018 activation and import endpoint security
remain independent gates. Acceptance covers this proposal and linked lifecycle;
it does not claim implementation, activate adjacent stories or authorize publication.

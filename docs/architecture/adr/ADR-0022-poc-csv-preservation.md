# ADR-0022: Bounded original CSV storage in PostgreSQL

## Status

Accepted — explicitly approved by the owner on 2026-09-25 under
[IOP-011](../../planning/items/IOP-011-file-storage-model.md).
Acceptance covers the storage design and linked contract only. Does not accept
[ADR-0018](ADR-0018-local-poc-execution-context.md) or enable runtime access.

## Context and alternatives

The [POC](../../product/scope-poc.md) needs original CSV evidence for manual
imports, not a general file platform. The [source contract](../csv-source-contract-poc.md)
records a 120,432-byte representative input; that is format evidence, not a volume
or performance commitment. PostgreSQL and scoped RLS are already accepted.

| Option | POC assessment |
| --- | --- |
| PostgreSQL `bytea` row plus scoped metadata | Recommended for bounded CSVs: one persistence target and transactional RAW/metadata writes. Adds database size and read/write load; measure before raising limits. |
| Private local files plus database metadata | Viable for larger inputs, but needs path/symlink controls and reconciliation of filesystem writes with database outcomes. No demonstrated need for that second lifecycle here. |
| Object storage plus metadata | Additional service/configuration and access/cleanup behavior for one local operator; defer with a generic storage abstraction, maps and attachments. |

These are project fit judgments. PostgreSQL documents `bytea` as storage for raw
binary strings, independent of text encoding: [binary data types](https://www.postgresql.org/docs/17/datatype-binary.html).
Row policies require explicit configuration; owners and privileged roles need
special care: [row security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html).
Official PostgreSQL 17 references consulted on 2026-09-25.

## Decision

Integrations owns an immutable, site-scoped original CSV payload stored as `bytea`
in the existing dedicated local PostgreSQL database, with its import provenance.
Use ordinary rows, not the PostgreSQL large-object API, filesystem paths or public
URLs. Store the complete received bytes, including BOM, quotes and line endings;
never reconstruct the original from normalized values.

Apply the [preservation contract](../csv-preservation-poc.md), including fixed POC
budgets, SHA-256 integrity evidence, separate RAW review authorization and bounded
rejection handling. RAW and its mandatory metadata become durable together before
normalization is published. A RAW receipt is not successful analytical admission.
IOP-041/042/047 must define and test analytical publication, concurrent date claims
and recovery through owning-module contracts; this ADR does not select a general
cross-module transaction framework.

Use explicit organization/site/source references, scoped constraints, enabled and
forced RLS, a non-owner runtime role and validated transaction-local context under
ADR-0012/0013/0014. Separate list/status queries from payload retrieval; no eager
RAW inclusion in analytics or import lists. No additional permission or role is
introduced. `imports.review` governs original-input retrieval.

## Consequences and acceptance boundary

The decision keeps CSV evidence and metadata in the existing local data target,
with no runtime filesystem upload area. Database growth, memory use and retrieval
latency still require measurement; the logical quota does not bound WAL,
indexes, backups or physical database size. This is not production backup, retention,
cryptographic authenticity or protection from privileged local operators.

The original CSV stays until the dedicated demo reset; there is no ordinary delete,
automatic expiry, replacement or replay. Revisit storage if measured file sizes,
concurrency, operational recovery or shared hosting exceed this bounded use case.
Do not build a provider interface in anticipation of that possibility.

Acceptance selects this storage choice and the linked POC contract only.
Schemas, endpoints, importer implementation and reset commands remain separate
stories. ADR-0018 or another accepted context remains an independent runtime gate.
Required verification scenarios are in the preservation contract; none has run as
runtime evidence in IOP-011.

# ADR-0033 — Relational Hitliste analytics and sector catalog

## Status

Accepted under the owner's explicit 2026-09-27 clarification: use the normalized
backup model, add an analytical sector catalog and a sector FK on the main fact.
Implementation details follow existing scoped persistence, transaction and hexagonal
boundaries; this does not authorize restoring the backup or publishing the branch.

## Decision

OIP's PostgreSQL Hitliste adapter owns a relational reporting projection in schema
`analytics`: `fact_hitliste`, `sektor`, `bereich`, `betriebsmittel`, `meldetext`,
`meldung_typ`, `meldegruppe`. Source terminology stays inside this adapter/schema;
Platform Core does not own source catalogs. The backup's `core.*` catalogs are
therefore colocated in `analytics`, retaining their relationships, without adopting
an unscoped generic core or the initial `public.hitliste` prototype.

Each admitted source line has exactly one analytical fact keyed by scope/import/line,
with a FK to the immutable OIP source fact. Typed date, frequency, exact seconds and
original duration remain available; minutes are computed from exact seconds.
Mandatory scoped catalog FKs include `sektor_id`. Equipment references are tied to
area identity; source codes may occur in several areas. Catalog IDs are deterministic
SHA-256 value identities within scope, not physical asset identities. Unknown areas
reference an explicit unclassified sector, distinct from mapped labels.

ADR-0031's profile remains the editable normalization/classification configuration.
Its compiled rules populate the catalogs and current analytical facts. A profile save
refreshes all source history atomically. Import publication inserts the original and
its projection atomically. Source-scoped transaction locks serialize these operations;
read queries see one complete SQL snapshot and verify projection coverage/profile
version before returning results. Startup with an authorized administrator backfills
existing facts. A read-only principal cannot trigger reconstruction; incomplete or
stale projections fail rather than silently exclude facts.

Only derived dimension references/profile version may change. Original facts, CSV
bytes and source measures remain immutable. Repeated source lines are retained.
Runtime has narrow SELECT/INSERT and derived-column UPDATE grants, never DELETE or
DDL. All relations force scope RLS; foreign keys include organization/site/source.
Offline reset deletes the selected projection before its source facts and catalogs;
foreign scopes and reporting configuration survive. No privileged SQL function,
trigger, worker or separate transaction framework is introduced.

## Consequences

Reports use actual relational joins, including the stored sector reference, rather
than constructing all dimensions from JSON on each read. The original immutable
layer remains for traceability and safe reconstruction. Catalog entries from older
preparation versions may remain unused until scoped reset. The bounded local POC
refreshes synchronously; this is not a background warehouse or performance SLA.
See [reference evidence](../wincc-backup-reference.md) and
[execution plan](../../planning/completed/IOP-148-relational-hitliste-plan.md).

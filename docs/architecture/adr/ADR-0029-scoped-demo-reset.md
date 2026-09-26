# ADR-0029: Scoped local analytical demo reset

## Status

Proposed under [IOP-128](../../planning/items/IOP-128-demo-reset.md), 2026-09-26.
No reset command or deletion authority is implemented by this proposal.

## Context

The [POC](../../product/scope-poc.md) requires reproducible analytical data.
[ADR-0022](ADR-0022-poc-csv-preservation.md) retains successful and rejected RAW
until verified demo reset. [ADR-0027](ADR-0027-poc-import-publication.md) requires
imports stopped and dependent data/counters changed together. Current runtime
grants deliberately exclude deletion and quota reduction. The existing local
migrator is privileged installation tooling, not a business authorization boundary
([ADR-0019](ADR-0019-local-database-migrations.md)).

IOP-123 supplies fictional scope; IOP-125 supplies the baseline corpus. Neither
marks a database as disposable. A familiar database name, fictional label or
loopback address alone cannot establish reset authority. Production OIP storage
and real importer composition are still missing on develop.

## Proposed decision

Provide an explicit offline infrastructure command using the separate migrator
credential, never an API route or permission in an analytics role. Keep runtime
credentials unable to delete, truncate, reduce quota or alter reset metadata.
No owner/superuser runtime connection, RLS disablement or general cleanup engine.

### Verified target and quiescence

- Require explicit local mode and the existing dedicated local connection checks.
  Refuse shared/deployed configuration before mutation.
- Add a private installation marker with a generated dataset identity and one exact
  organization/site/source tuple. Register it explicitly on an empty analytical
  installation after checking scope/configuration agreement; never auto-register
  an existing populated target during reset. Keep fixture IDs in configuration.
- Require an explicit target tuple and confirmation of that dataset identity.
  Match connected database, marker, seeded ownership, source configuration and
  supported migration version. Missing/stale/mismatched information fails closed.
  The marker is an operator safeguard, not protection against a privileged attacker.
- Stop the API/import executor and establish that no receive/parse task can later
  publish. An operator flag alone is insufficient evidence. The implementation must
  verify host shutdown and absence of runtime connections, and prevent reconnects
  for the reset interval through a bounded installation maintenance mechanism.
  Specify and test that mechanism before implementing destructive statements;
  if quiescence cannot be established, refuse without deleting data.

### Atomic scoped cleanup

Use one pinned transaction and narrow module-owned cleanup operations. Serialize
competing resets and lock the affected storage with bounded waits. New migrations
provide exact-target migrator RLS policies; forced RLS stays enabled. Do not modify
old migrations or grant reset authority to runtime.

Delete only the marker's complete organization/site/source target: dependent OIP
facts/projections first, successful date claims next, then every retained attempt
and its RAW, including rejected, failed and incomplete receipts. Unknown schema
versions or dependencies fail closed; no `TRUNCATE`, schema/database drop, cascading
deletion or Docker volume removal. Preserve organization/site, users/membership/
grants, source/mapping configuration and unrelated analytical targets.

Integrations owns quota reconciliation. Before deletion, verify singleton counters
against retained receipts under a bounded installation-only metadata read; do not
export foreign content. Reduce counters by the exact deleted receipt count/bytes,
preserving charges for other targets. Never blindly zero the database-wide quota.
Missing counters or drift abort without changes. Extend the quota guard only for
this verified installation operation; runtime still permits bounded charges only.
Commit all cleanup and counter changes together; any failure rolls everything back.

### Recreate and report

After verified cleanup, restore normal connection settings before restarting the
host. Interrupted maintenance must fail closed and have a documented explicit
recovery procedure. Preserve a bounded reset result (target, counts and outcome),
without RAW, credentials or payload excerpts. An uncertain commit requires checking
the resulting target state before reporting success; do not automatically replay
the whole reset-and-import sequence.

Reimport only the two baseline valid IOP-125 CSVs through the delivered importer
and explicit scoped permissions. This is a separate phase: a failed reload leaves
an empty or partially reloaded demo, reported as incomplete, not a rolled-back
reset. Resume by inspecting successful date claims; never bypass duplicate rules.
Recreation must match nine facts, frequency 19 and 97,775 accumulated alarm seconds.
Invalid/duplicate scenarios remain separate from that baseline.

## Alternatives and boundaries

Dropping the database/volume would remove unrelated scope and installation state.
A runtime delete endpoint would expand authority beyond the POC requirement.
Direct SQL fixture inserts would skip importer validation. The proposed offline
scoped command retains existing ownership and the real CSV path at modest local
operational cost. These are project design judgments, not measured guarantees.

No production retention, backup/restore, secure erasure, workforce, maintenance,
physical assets, external integrations or reset UI. Downloaded RAW copies are
outside database reset. Acceptance does not activate adjacent stories.

## Required executable evidence

- Disposable PostgreSQL with real migrator/runtime credentials: correct target
  cleanup; missing/wrong marker, scope, source, mode and schema refuse unchanged.
- A second organization/site/source remains byte-for-byte unchanged, including
  retained quota charges; seeds, grants and configuration survive.
- Active/delayed imports and competing resets cannot interleave with deletion;
  timeout, shutdown failure and reconnect attempts fail safely.
- Failure after each cleanup stage rolls back facts, claims, RAW and counters;
  quota drift refuses; empty repeat is safe; runtime deletion/reset stays denied.
- Interrupted maintenance and ambiguous commit recovery are verified explicitly.
- Real importer reload reconciles both analytical views and contributing records
  with the IOP-125 oracle; repeated reset/reload reproduces results and normal
  duplicate rejection. Test fixtures alone cannot close this requirement.

Run `npm test` and relevant `npm run test:database` checks after implementation.
Until acceptance and delivery of OIP storage/importer/host integration, IOP-128
remains Blocked. No destructive command should be advertised as available.

# IOP-113 — Restore process

## Status

Completed

Reconciled on 2026-10-14 under the owner's delegated [IOP-203](IOP-203-platform-completion.md)
request and delivered [IOP-208](IOP-208-local-delivery-infrastructure.md).
The permanent context owns this story's remaining acceptance; software completion
is distinct from remote, operating, human and whole-platform release evidence.

## Milestone and goal

M14 — Security & Reliability. Verified reproducible local software slice completed.

Verified full local platform restore into an isolated installation.

## Current state

[IOP-208](IOP-208-local-delivery-infrastructure.md) under [IOP-203](IOP-203-platform-completion.md) implements authenticated extraction and a
fresh network-isolated PostgreSQL restore. Independent full table counts/digests,
application role properties, effective grants and exact RLS policies reconcile
before the new container is retained stopped. Private configuration/credentials,
PNG references and traces are restored without overwriting active data. The actual
root installation archive has also passed isolated restore verification.

## Requirements and delivery boundary

Restore refuses an existing destination and uses no network or published ports.
Failures remove only its newly created database; no archived SQL executes against
the running installation. A verified stopped container and private report retain
the result. Activation requires separate review of copied credentials, origins,
paths/scope and expired Audit purge through its distinct retention authority.

## Acceptance criteria

- [x] Authenticate and recover the full declared private bundle to a new directory/database only.
- [x] Verify disposable data/history/roles/grants/RLS and preserve existing targets on failure.
- [x] Verify an actual local-installation archive in a fresh isolated target under root IOP-203.
- [x] Document the verified result and remaining activation/security review without activating it.

## Validation and evidence

Real PostgreSQL full-source roundtrips include nonempty Handover revisions and
job/Audit effects, independently matched role/grant/RLS metadata and exact reference
file hashes. Crypto/overwrite failures are tested. See [local operating guide](../../development/local-operations.md),
[Accepted ADR-0038](../../architecture/adr/ADR-0038-local-operating-infrastructure.md) and the [IOP-208 plan](../completed/IOP-208-local-delivery-infrastructure-plan.md).
Root actual-installation verification passes: 170 files, 62 tables and 154,341 rows
reconcile with exact catalog/data/RLS/role and schema/table/column/function ACL
metadata. The fresh network-none container remains stopped; its mode 0700 private
review directory retains verification. No activation or active overwrite occurred,
and actual API/web restarted healthy. Root complete PostgreSQL validation passes
30 suites/316 tests.

## Dependencies

[IOP-112](IOP-112-backup.md).

Dependencies identify required contracts/capabilities, not numerical delivery order.
Their broader criteria are not closed by this bounded increment.

## Remaining work

The reproducible local software restore criterion is completed. Recovery-time
acceptance, another authorized deployment environment, operator exercise, copied
credential/origin/scope review, expired-Audit purge and activation remain separate
gates. No live replacement, production readiness or physical verification follows
from the stopped verified artifact.

## Documentation traceability

[IOP-208 completed plan](../completed/IOP-208-local-delivery-infrastructure-plan.md),
[IOP-203 execution](../completed/IOP-203-platform-completion-plan.md),
[backlog](../backlog.md) and [delivery map](../poc-delivery.md).

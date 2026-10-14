# IOP-115 — Failure handling

## Status

In progress

Reconciled on 2026-10-14 under the owner's delegated [IOP-203](IOP-203-platform-completion.md)
request and delivered [IOP-208](IOP-208-local-delivery-infrastructure.md).
The permanent context owns this story's remaining acceptance; software completion
is distinct from remote, operating, human and whole-platform release evidence.

## Milestone and goal

M14 — Security & Reliability. Local recovery paths delivered; broader operating scope pending.

Recoverable jobs/imports with explicit outcomes and safe recovery.

## Current state

Local imports retain duplicate-date protection, atomic publication, terminal
outcomes and inspection/reconciliation of uncertain acknowledgements. IOP-208 adds
durable job claims, current authority checks, savepoint effect rollback, bounded
retry/exhaustion and expired-lease recovery. Operator procedures distinguish
unconfigured handlers/transports from successful delivery.

## Requirements and delivery boundary

A job crash leaves its durable lease for recovery; an unknown database failure
rolls back effect/outcome and retains the prior claim. Missing handlers/configuration
wait without consuming attempts. Revocation prevents later execution/retrieval.
Import reconciliation resolves stored truth before another action; no automatic
replay of an uncertain publication is introduced. Audit failure rolls back material
business writes rather than reporting success.

## Acceptance criteria

- [x] Verify local bounded job retry/lease recovery and import reconciliation/idempotency without uncertain automatic replay.
- [x] Retain explicit failure/pending states and documented trusted operator procedures.
- [ ] Define and verify remaining provider/distributed failure paths, operating alerts and recovery exercises for the agreed deployment.

## Validation and evidence

Real PostgreSQL jobs/operator and site-material Audit suites verify transient
rollback, exact-once local effect, expired/exhausted claims, current permissions,
import recovery and real Audit failure rollback. Guarded native analytical reset
also preserves canonical/business/Audit data on every injected cleanup failure.
See [local operating guide](../../development/local-operations.md), [site capture](../../development/site-audit-integration.md)
and [IOP-203 evidence](../completed/IOP-203-platform-completion-plan.md).

## Dependencies

[IOP-024](IOP-024-worker-infrastructure.md), [IOP-047](IOP-047-import-idempotency.md), [IOP-107](IOP-107-integration-health.md).

Dependencies identify required contracts/capabilities, not numerical delivery order.
Their broader criteria are not closed by this bounded increment.

## Remaining work

Real provider transport/partial effects, distributed/chunk execution,
unattended scheduling/alerts and operator recovery exercises remain pending.
Reproducible local fault evidence does not establish broader service continuity
or lossless security-event collection.

## Documentation traceability

[IOP-208 completed plan](../completed/IOP-208-local-delivery-infrastructure-plan.md),
[IOP-203 execution](../completed/IOP-203-platform-completion-plan.md),
[backlog](../backlog.md) and [delivery map](../poc-delivery.md).

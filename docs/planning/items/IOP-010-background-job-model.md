# IOP-010 — Design background jobs for later delivery

## Status

Completed

Reconciled on 2026-10-14 under the owner's delegated [IOP-203](IOP-203-platform-completion.md)
request and delivered [IOP-208](IOP-208-local-delivery-infrastructure.md).
The permanent context owns this story's remaining acceptance; software completion
is distinct from remote, operating, human and whole-platform release evidence.

## Milestone and goal

M1 — Product & Architecture Definition. Completed design.

Define background execution when selected beyond the direct CSV POC.

## Current state

The direct CSV POC remains bounded and synchronous. The owner separately selected
local background infrastructure on 2026-10-14 through [IOP-208](IOP-208-local-delivery-infrastructure.md) under [IOP-203](IOP-203-platform-completion.md).
[Accepted ADR-0038](../../architecture/adr/ADR-0038-local-operating-infrastructure.md) records the accepted design and IOP-208's completed plan
records executable validation; this story closes the design contract.

## Requirements and delivery boundary

The design uses scoped PostgreSQL records, 60-second leases, five maximum attempts,
finite initiating-user ticks and atomic pinned effects/outcome/Audit. Current
Administrator `jobs.manage` and handler-specific grants are rechecked at execution
and retrieval. Unknown commit outcomes require stored-result inspection; handlers
must define safe idempotent effects. The built-in local test handler is delivered
under IOP-024/208, not claimed as a real integration workload.

## Acceptance criteria

- [x] Define site-scoped durable jobs with explicit current initiating-user authority, handler business permissions and no global RLS-bypass polling.
- [x] Specify leases, bounded attempts/backoff, idempotent request fingerprints, atomic effects/outcomes and missing-handler/configuration states.
- [x] Record accepted decisions, evidence and explicit limits; preserve direct CSV processing and broader provider/orchestration scope.

## Validation and evidence

Review the decisions in [Accepted ADR-0038](../../architecture/adr/ADR-0038-local-operating-infrastructure.md), the
[completed IOP-208 plan](../completed/IOP-208-local-delivery-infrastructure-plan.md)
and [local operating guide](../../development/local-operations.md). Actual PostgreSQL tests cover lease recovery,
retry rollback, exhaustion, idempotency, current grants and retained pending states.
No measured CSV need or automatic requeue of uncertain imports is inferred.

## Dependencies

[IOP-002](IOP-002-technology-stack.md), [IOP-009](IOP-009-audit-model.md).

Dependencies identify required contracts/capabilities, not numerical delivery order.
Their broader criteria are not closed by this bounded increment.

## Remaining work

Real provider handlers, distributed/chunk import orchestration and unattended
operating acceptance remain separate delivery work. This design completion does
not establish plant performance, remote deployment or release acceptance.

## Documentation traceability

[IOP-208 completed plan](../completed/IOP-208-local-delivery-infrastructure-plan.md),
[IOP-203 execution](../completed/IOP-203-platform-completion-plan.md),
[backlog](../backlog.md) and [delivery map](../poc-delivery.md).

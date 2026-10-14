# IOP-024 — Worker infrastructure

## Status

Completed

Reconciled on 2026-10-14 under the owner's delegated [IOP-203](IOP-203-platform-completion.md)
request and delivered [IOP-208](IOP-208-local-delivery-infrastructure.md).
The permanent context owns this story's remaining acceptance; software completion
is distinct from remote, operating, human and whole-platform release evidence.

## Milestone and goal

M2 — Development Platform Foundation. Executable local software slice completed.

Executable test job with verifiable retry and idempotency.

## Current state

[IOP-208](IOP-208-local-delivery-infrastructure.md) under [IOP-203](IOP-203-platform-completion.md) delivers durable scoped jobs, a reusable
`composeJobs` factory and trusted local submit/get/tick tooling. The built-in
`local-check` handler has one persisted idempotent effect and controlled transient
failure, providing a real executable retry/rollback exercise. Setup is still a
finite installation process; it is not used as an implicit global worker.

## Requirements and delivery boundary

Jobs require the current Administrator profile and `jobs.manage`; handlers declare
additional current business permissions, exact payload keys and validation.
Leases last 60 seconds, attempts are bounded at five, transient backoff is bounded,
and waiting for a handler/configuration does not consume attempts. Effects, final
state and Audit share the existing authorized transaction. No RLS-bypass polling,
provider send, plant command or arbitrary shell handler exists.

## Acceptance criteria

- [x] Execute a local persisted test job with bounded retries, lease recovery and idempotent admission/effects.
- [x] Recheck the current initiating-user profile/grants at submit, retrieval and execution; preserve exact site scope.
- [x] Verify effect rollback, exhausted attempts and retained missing-handler/configuration states with real PostgreSQL.
- [x] Record operating commands, accepted decisions and exact external limits.

## Validation and evidence

Six owning real PostgreSQL worker/operator cases verify transient rollback then
single effect, idempotent requests/conflicts, own-initiator access, current revocation,
expired lease recovery/exhaustion and missing configuration/handler states.
The executable CLI is packaged for trusted local operations; see [local operating guide](../../development/local-operations.md),
[Accepted ADR-0038](../../architecture/adr/ADR-0038-local-operating-infrastructure.md) and the
[completed IOP-208 plan](../completed/IOP-208-local-delivery-infrastructure-plan.md).

## Dependencies

[IOP-010](IOP-010-background-job-model.md), [IOP-016](IOP-016-backend-bootstrap.md), [IOP-018](IOP-018-configuration-management.md).

Dependencies identify required contracts/capabilities, not numerical delivery order.
Their broader criteria are not closed by this bounded increment.

## Remaining work

Real business/provider handlers, an unattended scheduler/operating service,
distributed/chunk orchestration and provider recovery remain separate scope.
Completing this executable test-job criterion does not close those broader stories.

## Documentation traceability

[IOP-208 completed plan](../completed/IOP-208-local-delivery-infrastructure-plan.md),
[IOP-203 execution](../completed/IOP-203-platform-completion-plan.md),
[backlog](../backlog.md) and [delivery map](../poc-delivery.md).

# IOP-137 — Architecture review

## Status

In progress

Reconciled on 2026-10-14 under the owner's delegated [IOP-203](IOP-203-platform-completion.md)
request and delivered [IOP-208](IOP-208-local-delivery-infrastructure.md).
The permanent context owns this story's remaining acceptance; software completion
is distinct from remote, operating, human and whole-platform release evidence.

## Milestone and goal

M17 — v1 Validation & Release. Implementation reconciliation ongoing; release review pending.

ADRs/documentation match the implementation for the agreed release scope.

## Current state

Accepted ADR-0032 boundaries and executable guards are delivered; IOP-195/197
record earlier architecture/governance reconciliation. Accepted ADR-0037/0038 and
IOP-203 now document delegated operational completion, private infrastructure,
published pinned Audit ports and exact remaining contracts. Current software gates
pass; final agreed release/deployment review is still separate.

## Requirements and delivery boundary

Explicit module owners retain domain/application boundaries and safe integration
ports. Audit uses same pinned owner transactions; optional compatibility ports are
mandatory in actual host composition. Forced RLS/exact grants remain enforced.
Proposed ADRs are not accepted by inference. Future organization/security Audit,
external file activation and provider transport remain documented exclusions.

## Acceptance criteria

- [x] Record accepted decisions and reconcile delivered local owner/module boundaries and evidence.
- [ ] Review final agreed v1 scope, deployment/security contracts and remaining exclusions against implementation.
- [ ] Record architecture/release review acceptance without treating local tests as owner sign-off.

## Validation and evidence

Root local checks pass 509 API, 192 web, 25 secret/tooling and 77 database
configuration tests, including architecture/design/contract guards. Complete
PostgreSQL validation passes 30 suites/316 tests; actual isolated restore reconciles
170 files, 62 tables and 154,341 rows. Final combined browser fixture correction
and full pipeline recheck remain explicit root gates. Evidence is recorded in the
execution plan.
See [ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md),
[Accepted ADR-0038](../../architecture/adr/ADR-0038-local-operating-infrastructure.md) and [IOP-203 evidence](../completed/IOP-203-platform-completion-plan.md).

## Dependencies

[IOP-129](IOP-129-end-to-end-scenario.md), [IOP-134](IOP-134-deployment-guide.md).

Dependencies identify required contracts/capabilities, not numerical delivery order.
Their broader criteria are not closed by this bounded increment.

## Remaining work

Finish the release-scoped documentation/implementation review after deployment,
security, human/physical and performance boundaries are agreed. A documentation
reconciliation or passing guard is not whole-platform release sign-off.

## Documentation traceability

[IOP-208 completed plan](../completed/IOP-208-local-delivery-infrastructure-plan.md),
[IOP-203 execution](../completed/IOP-203-platform-completion-plan.md),
[backlog](../backlog.md) and [delivery map](../poc-delivery.md).

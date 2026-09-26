# IOP-029 — Authorization/RBAC

## Status

Blocked — owner acceptance of [Proposed ADR-0026](../../architecture/adr/ADR-0026-poc-authorization-lookup.md)
is required before implementing the narrow runtime lookup and transaction boundary.
Dependencies are integrated. No runtime authorization is implemented by this increment.

## Authorization and POC applicability

The owner requested IOP-029 on 2026-09-26, limited to the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
M3 — Platform Core. Deliver current scoped permission checks for the seeded local
principal independently of identity-provider details. Full shared-user enforcement,
login and interactive access administration remain future parent scope.

## Context and current state

Users/RBAC owns principal, membership, assignments and permission evaluation;
Platform Core owns organization/site identity and ownership. See the
[modules](../../architecture/modules.md), [data model](../../architecture/data-model.md)
and [workflow](../workflow.md).

IOP-026/027/030 supply integrated site, active-principal and membership/site-role
storage plus explicit seeds. Runtime remains CONNECT-only. ADR-0014's lookup policy
review gate and undecided module/transaction boundaries motivate Proposed ADR-0026.
Accepted ADR-0018 permits the local mechanism; its host adapter and validation are
still pending. No allow-all guard or trusted browser actor is authorized.

## Selected requirements and acceptance criteria

- [x] Review dependencies and create a story branch and execution plan before edits.
- [x] Define the bounded lookup proposal, transaction handoff and verification cases.
- [ ] Obtain acceptance of ADR-0026 before dependent implementation.
- [ ] Evaluate current active user, organization membership, ownership and explicit
  site grants for every operation through a provider-independent contract.
- [ ] Enforce the fixed permission bundles at the exact target; deny unknown/missing
  scope, missing grants, foreign ownership and unavailable authorization state.
- [ ] Implement narrow real-role lookup RLS and transaction-local handoff without
  privileged credentials, a global directory or business access before authorization.
- [ ] Verify allowed/denied operations, revocation, rollback, pool reuse and effective
  runtime privileges; record evidence and synchronize item/backlog/plan.

A lookup-only implementation does not satisfy the host's ADR-0018 activation,
loopback/origin and foreign-target tests, or import/read endpoint evidence. Those
remain gates before opening business access; a POC slice does not complete the
broader shared-user parent.

## Dependencies and decisions

- [IOP-006](IOP-006-rbac-model.md): completed accepted fixed-role design (ADR-0014).
- [IOP-026](IOP-026-site-model.md): integrated POC site ownership/storage (ADR-0021).
- [IOP-027](IOP-027-user-model.md): integrated active-principal seed (ADR-0024).
- [IOP-030](IOP-030-membership-model.md): integrated membership and fixed site-role
  seed (ADR-0025). Its future dependency on IOP-029 is not a POC seed dependency cycle.

These require only delivered POC slices, not completion of deferred parents. No
unmerged prerequisite or IOP-007 login implementation blocks this slice.
Accepted ADR-0001/0003/0004/0005 preserve module, PostgreSQL, provider and customer
boundaries; ADR-0012/0013/0014 govern scope, RLS and permission; ADR-0018 governs the
local host. Follow ADR-0007/0008. See the [ADR directory](../../architecture/adr/).
Proposed ADR-0026 is not authority to implement until accepted.

## Boundaries and remaining parent scope

No login, sessions, user lifecycle, membership editor, role delegation, organization
admin bootstrap, wildcard policy, custom-role engine or full audit infrastructure.
No business endpoints, source integrations, customer labels/schema in the generic
core or administration UI. Keep secrets and production data out of the repository.
Industrial integrations remain read-only. Receiving modules still validate scoped
resources/references; hiding UI controls never substitutes for authorization.

Shared-use authorization, lifecycle/concurrent access administration and their full
verification remain deferred. Do not activate adjacent stories or infer acceptance
of architectural proposals from this request.

## Validation and documentation

The [active plan](../active/IOP-029-poc-authorization-plan.md) records the branch,
files, dependency findings and evidence. ADR-0026 specifies executable positive,
negative and actual-role database scenarios for implementation. This documentation
increment checks links, IDs, statuses and consistency only; no runtime evidence is
claimed. Keep item/backlog Blocked and the plan active while acceptance is pending.

# IOP-027 — User model

## Status

Deferred — the bounded POC principal storage/seed slice is implemented under
Accepted [ADR-0024](../../architecture/adr/ADR-0024-local-principal-bootstrap.md).
Full user lifecycle and provisioning remain deferred beyond the POC.

## Authorization and POC applicability

The owner requested IOP-027 on 2026-09-26, limited to the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
M3 — Platform Core. The earlier owner-approved IOP-142 scope refinement retains
full user lifecycle for later shared use; the selected slice is only the minimal
active development principal required by Accepted ADR-0018.

## Value, context and current state

Administrators and users eventually need access to authorized organizations and
sites. For the local analytical POC, a stable principal supports later explicit
membership and grant checks without human login. Identity, membership and permission
are separate responsibilities; Organization is the generic customer boundary.
See the [modules](../../architecture/modules.md), [data model](../../architecture/data-model.md)
and [glossary](../../product/glossary.md).

Organization/site persistence and insert-only bootstrap exist. IOP-027 now adds
`users_rbac.users` and the explicit `seed-user` command under ADR-0024, accepted by
the owner on 2026-09-26. ADR-0018 accepts the local execution mechanism, but its
host adapter and grant evaluation remain unimplemented. Runtime keeps CONNECT only.

## Selected requirements and acceptance criteria

- [x] Persist a stable opaque development user identity with explicit active state,
  owned by Users/RBAC, separately from organization membership and permissions.
- [x] Provide an explicitly invoked local insert-only seed, with matching reruns,
  conflict/inactive-user rejection, safe configuration and no implicit grants.
- [x] Verify constraints, concurrent seeds, rollback, exact-principal seed isolation
  and runtime access denial using actual database roles.
- [x] Review dependencies and prepare the missing bootstrap/storage decision under
  a story branch and execution plan before implementation.
- [x] Record implementation evidence and synchronize item/backlog/plan without
  completing the future parent lifecycle scope.

## Dependencies and architecture constraints

[IOP-007](IOP-007-authentication-model.md) and
[IOP-025](IOP-025-organization-model.md) remain future parent dependencies.
IOP-007 login/sessions are not a POC gate. IOP-025's POC organization seed is
integrated, but its bootstrap authority explicitly excludes users. A global identity
seed does not require organization creation; subsequent memberships require existing
organization/site ownership. No unmerged dependency branch is required for this slice.

Accepted ADR-0001/0003/0004/0005 preserve module ownership, PostgreSQL,
provider-independent identity and customer isolation. ADR-0013/0014 separate global
identity, scoped membership and permission evaluation. ADR-0018 is Accepted and
requires a current active principal plus explicit membership/site grants before
business access. ADR-0019 supplies existing migration tooling. See the
[ADR directory](../../architecture/adr/); Proposed decisions are not authority to
implement. Follow Accepted ADR-0007/0008 and the [workflow](../workflow.md).

## Security, data, API and UI boundaries

Keep the principal free of customer-specific labels/source schemas and credentials.
Do not expose a global identity directory. No runtime access is granted by the seed;
future operations must validate identity, permission and customer/site scope.
Preserve scoped reference integrity in future memberships/assignments. Hiding UI
controls never substitutes for authorization. No endpoints or administration UI
are part of this slice. Keep secrets, floor plans and production data out of the
repository; industrial integrations remain read-only. Record material changes
where applicable without adding audit infrastructure here.

## Non-goals and remaining scope

Full provisioning, login/sessions, password/recovery flows, lifecycle/admin screens,
identity-provider integration and complete shared-use user management remain deferred.
Membership/role seed and evaluation and the local host adapter are separate planned
work, not implicitly activated by this story. Do not implement adjacent tasks,
accept open decisions by inference or expand delivery to the whole milestone.

## Validation and documentation impact

The [completed plan](../completed/IOP-027-local-principal-plan.md) records the
accepted contract and actual validation evidence. Typecheck, npm tests, database
integration tests and the disposable Compose seed workflow validate this bounded
slice; they do not prove business authorization. See the
[database guide](../../../infra/database/README.md#initial-local-user-seed-iop-027)
for commands and limits. Item, backlog and plan are synchronized.

## Remaining scope

No open decision blocks this completed principal seed slice. Full user lifecycle
remains deferred. Membership/role seed, evaluation and the local host adapter still
need separately selected work before runtime business access can be enabled.

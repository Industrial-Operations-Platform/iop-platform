# ADR-0026: Narrow POC authorization lookup and transaction handoff

## Status

Proposed on 2026-09-26 under [IOP-029](../../planning/items/IOP-029-rbac-enforcement.md).
Owner acceptance is required before dependent implementation. Runtime remains
CONNECT-only; this document introduces no grants or executable authorization.

## Context

Accepted [ADR-0014](ADR-0014-scoped-rbac.md) requires current permission checks
through a narrow Users/RBAC lookup before installing business database scope.
It explicitly leaves lookup policies and schema details for implementation review.
[ADR-0018](ADR-0018-local-poc-execution-context.md) supplies the accepted local
principal mechanism, while [ADR-0024](ADR-0024-local-principal-bootstrap.md) and
[ADR-0025](ADR-0025-local-membership-bootstrap.md) supply integrated seed storage.
Those migrations grant runtime no access. Existing provisioning rejects all runtime
schema/table access, and module placement/transaction coordination remain undecided.

The [POC boundary](../../product/scope-poc.md) requires only checking the seeded
principal and explicit site roles. Login, access administration and a generic
authorization engine are excluded. This proposal resolves the lookup boundary;
it does not activate the host adapter or open business endpoints.

## Proposed decision

### Contract and ownership

Place the first bounded modules under `apps/api/src/modules/users-rbac/` and
`apps/api/src/modules/platform-core/`, with explicit exported contracts. This is
local monolith composition, not a repository-wide module reorganization or new
workspace. Keep the PostgreSQL adapter behind those contracts and the transaction
helper under `apps/api/src/persistence/`; no Nest/HTTP/provider types in the
authorization contract. Other modules must not query Users/RBAC tables directly.

Each site operation supplies a trusted principal, explicit organization/site and
a nonempty list of required permissions declared by server-owned operation code.
The client cannot choose the required permissions. Validate IDs using the existing
opaque ID contract. Return a safe allow/deny decision; lookup failures never allow
work and must not disclose SQL, credentials or foreign identifiers.

Users/RBAC owns current active-user/membership checks and the fixed role catalog.
Platform Core publishes exact site/organization ownership validation on the same
pinned connection. The receiving module retains scoped resource/reference checks.
No global directory, scope enumeration, provider claims or cached grant snapshot.

Preserve ADR-0014's exact bundles: `analytics-reader` grants `analytics.read`;
`site-operator` grants `imports.submit`, `imports.review` and
`site-configuration.manage`. A permission in the catalog does not implement its
operation. Union permissions only from assignments matching the exact actor and
target; require every requested permission. Empty requirements, unknown roles or
permissions, missing scope and unavailable state deny. Organization scope and
`access.manage` are unsupported in this POC evaluator; the accepted organization
admin role remains deferred, not converted into site access.

### Lookup authority and RLS

Use the existing non-owner `iop_runtime` role with a narrowly defined read surface,
not migrator credentials or a security-definer function. A versioned migration adds:

- USAGE on `users_rbac` and `platform_core`, without CREATE.
- Column SELECT on `users_rbac.users` (`user_id`, `is_active`),
  `organization_memberships` (`organization_id`, `user_id`, `is_active`),
  `site_role_assignments` (`organization_id`, `user_id`, `site_id`, `role_id`) and
  `platform_core.sites` (`organization_id`, `site_id`). No organization table read,
  site display/configuration fields, writes, sequences or broad table grants.
- Runtime-only SELECT policies using distinct transaction-local selectors
  `iop.lookup_user_id`, `iop.lookup_organization_id`, `iop.lookup_site_id`.
  Every policy requires all three selectors to be present and nonempty. User rows
  match principal; memberships match principal/organization; assignments match all
  three; site ownership rows match organization/site. Retain enabled/forced RLS
  and existing migrator-only seed policies. Seed selectors confer no runtime access.

Lookup context identifies the candidate actor/target; it is not authorized business
scope. Only these four read surfaces use lookup selectors. Business policies must
never use them as permission evidence. No PUBLIC policies or runtime writes,
TRUNCATE, DDL, role switching or elevated ownership are added.

Update provisioning to admit exactly these migration-installed column/schema grants
while retaining support for the pre-migration CONNECT-only database. Reject broader
table grants, additional columns/objects, PUBLIC-derived access and role elevation.
Provisioning must not create lookup grants itself or silently repair privilege drift.
Retain installation tests and revise only runtime-denial assertions intentionally
superseded by this explicitly bounded read surface.

As in ADR-0013, application-set selectors assume trusted parameterized backend code.
They do not protect against compromised runtime credentials capable of arbitrary
SQL. The future local host adapter must reject client-selected actors and foreign
targets; RLS does not establish human identity.

### Operation transaction

1. Validate the actor, exact target and server-required permission list before
   acquiring a connection. The caller supplies trusted execution identity; this
   service cannot turn browser input into one.
2. Acquire one pooled runtime connection and begin a fresh READ COMMITTED transaction.
   Require clean session defaults; clear business selectors transaction-locally and
   install the three lookup selectors using bound parameters. No business repository
   runs in this phase.
3. Resolve exact Platform Core ownership, then evaluate active user, active
   membership and matching assignments together in one current-state query snapshot.
   Missing ownership/state or insufficient permissions deny. Ownership is immutable
   in the delivered site model; no transfer/lifecycle operation is introduced.
4. Only after allow, install distinct transaction-local `iop.user_id`,
   `iop.organization_id`, `iop.site_id` for the validated business context. Invoke
   the receiving operation with an immutable actor/target and the same transaction
   handle. No repository may obtain another connection or change target mid-operation.
   The handle stays internal and does not become a reusable authorization token.
5. Commit successful work; roll back denial/failure before releasing the connection.
   Discard the connection if cleanup cannot be established. Reset/reject contaminated
   session defaults before reuse; do not use session-wide scope setters. Savepoints
   occur only after context installation; each retry performs a new authorization.

No cache survives the operation. A completed access revocation or user/membership
disablement affects subsequently started checks; already-authorized work may finish
as allowed by ADR-0014. Lifecycle mutations and their serialization remain deferred.
Tests may change fixture state through privileged setup without adding a runtime
administration path.

The helper alone grants no business table access. Future owning migrations define
their own scoped policies and grants. This slice uses disposable test-only rows to
verify the handoff; it must not create a fake production business table or endpoint.

### Host and delivery boundary

Keep the current health host unchanged. Import/read endpoints, trusted local adapter
activation, configured principal binding, loopback/origin enforcement and refusal
of shared/deployed mode remain required ADR-0018 gates before business access opens.
No automatic activation, authentication fallback or login/session work belongs here.
Lookup integration tests are not end-to-end import/read security evidence.

## Alternatives

| Option | Assessment |
| --- | --- |
| Narrow runtime column reads with exact-selector forced RLS | Recommended: reuses the runtime role and existing tables without privileged execution. |
| Security-definer lookup function or separate elevated lookup role | Adds privileged execution/credential boundaries unnecessary for this POC. |
| General runtime reads or seed/migrator credentials in the API | Reject: exposes global state or installation authority. |
| Hard-coded roles, startup-only checks or allow-all guard | Reject: cannot reflect current persisted access. |
| Full policy engine and access administration | Deferred beyond the POC. |

## Required implementation evidence

Use existing Jest and PostgreSQL Testcontainers with actual runtime credentials:

- Positive reader analytics and operator import/review/configuration checks; both
  assignments combine only at the same site. Reader cannot import/review RAW;
  operator alone cannot read analytics. Require all permissions for combined checks.
- Missing/malformed IDs, missing/inactive principal or membership, absent/either
  missing grant, unknown permission/role, empty requirements, organization/admin
  requests, sibling/foreign site and mismatched ownership deny without callback work.
- Revocation and disablement between operations take effect on the next check;
  earlier successful decisions are not reused. Database failures never invoke work.
- Real-role direct SELECT verifies exact lookup visibility, absent/partial selectors,
  foreign rows, column limits and seed-selector isolation. Runtime cannot write,
  truncate, alter, read unrelated tables or assume a privileged role. Inspect forced
  RLS and every effective grant; test provisioning before/after migration and drift.
- A test-only scoped table proves business context is absent before allow and bound
  to the authorized target afterward, even when a query omits its scope predicate.
  Denial cannot reach this table through the operation helper.
- Concurrent targets, commit/rollback, callback exceptions, cancellation/timeout,
  savepoint rollback, retry and single-connection pool reuse do not retain context.
  Cleanup failure destroys the connection; unscoped follow-up sees no protected rows.
- Internal callers use the same contract; no HTTP-only guard is the authority.
  Run `npm run typecheck`, `npm test` and `npm run test:database`, preserving seed
  behavior. Record actual results in the [plan](../../planning/active/IOP-029-poc-authorization-plan.md).

These are proposed verification cases, not executed evidence. Acceptance permits
the bounded lookup implementation only; it neither completes IOP-029's shared-use
parent nor certifies ADR-0018 host or future import/analytics behavior.

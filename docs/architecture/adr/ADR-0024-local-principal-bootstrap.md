# ADR-0024: Local development principal persistence and initial seed

## Status

Proposed on 2026-09-26 under [IOP-027](../../planning/items/IOP-027-user-model.md).
No migration, seed command or runtime access is implemented by this proposal.

## Context

Accepted [ADR-0018](ADR-0018-local-poc-execution-context.md) requires a stable active
development principal without login. It does not define its physical storage or
the authority of a privileged seed command. [ADR-0020](ADR-0020-local-organization-bootstrap.md)
and [ADR-0021](ADR-0021-local-site-bootstrap.md) authorize organization/site bootstrap
only. [ADR-0013](ADR-0013-tenancy-data-isolation.md) permits separately classified
global identity data through narrow owner contracts. User lifecycle remains outside
the [POC](../../product/scope-poc.md).

## Proposed decision

### Minimal identity storage

Users/RBAC owns `users_rbac.users`, created by a versioned migration owned by
`iop_migrator`. This schema identifies module ownership, not a general module code
layout or a customer schema. Each row is platform-global identity data, with:

- `user_id`: immutable, case-sensitive opaque text primary key matching
  `[A-Za-z0-9][A-Za-z0-9_-]{0,63}`, selected explicitly once by the local operator.
- `is_active`: non-null boolean, supplied explicitly as true by initial seed.
  Inactive identities must remain inactive on rerun; no reactivation operation.

No customer data, organization/site columns, email, password, provider subject,
display profile or permission flags belong in this minimal row. A user may later
have memberships in multiple organizations; do not duplicate its identity per site.
Future scoped memberships reference this stable key and remain separate records.

### Initial seed authority and isolation

Extend the existing explicit local infrastructure tooling with `seed-user` using
the dedicated migrator credential and existing local database/role checks. Require
`IOP_SEED_USER_ID` explicitly; no fallback/default actor or automatic startup seed.
Do not change the current runtime JSON configuration shape in this slice. Its future
adapter must explicitly select this persisted ID and reject missing/inactive users.

This proposal extends privileged installation authority solely to initial principal
creation. It does not authorize ordinary identity provisioning, arbitrary lifecycle
updates, membership/role creation or runtime business access. Keep credentials out
of API/web containers and safe error output free of input and driver details.

Enable and force RLS on the identity table as an additional exact-principal seed
restriction, even though it is not customer-owned data. Use migrator-specific
SELECT and INSERT policies matching `user_id` to transaction-local
`iop.seed_user_id`. Missing/empty/malformed selector cannot match a valid ID.
No PUBLIC/runtime policy, runtime schema/table grant, UPDATE/DELETE policy,
security-definer function or bypass role. Runtime retains CONNECT only.
The migrator remains a trusted privileged owner capable of changing DDL; RLS does
not constrain a malicious installation operator.

Use one fresh connection and one READ COMMITTED transaction. Validate input and
role, install the selector with a parameterized transaction-local setting, insert
if absent, then check the committed row using a separate statement after conflict
resolution. An existing active row succeeds unchanged; an inactive row fails
without mutation. Concurrent matching attempts converge on one active row. Roll
back failures and close the connection. No update/upsert or lifecycle restoration.

This command may run without an organization because identity is global. It must
not create an implicit membership or grant. Membership plus both explicit site
roles required by ADR-0018 remain prerequisites for any future business access.

### Runtime handoff and limits

There is deliberately no runtime user lookup grant in this slice. A later planned
Users/RBAC lookup must constrain principal and target, evaluate current active
membership and explicit assignments, and deny missing/inactive identities without
exposing a global directory. The host adapter still requires ADR-0018's startup,
origin, scope and real-role isolation checks. A successful seed proves none of those.

Login, sessions, user CRUD, account recovery, Entra, membership administration,
grant evaluation, HTTP endpoints and UI are excluded. Do not create an access-admin
assignment merely to seed a POC principal. No adjacent story is activated.

## Alternatives

| Option | Assessment |
| --- | --- |
| Minimal persisted identity with explicit insert-only local seed | Recommended: stable reference and active state without credential infrastructure; needs bounded bootstrap authority. |
| Hard-coded always-active user in the host | Reject: cannot verify a current persisted user and conflates configuration with identity state. |
| Organization-owned copies of the principal | Reject: couples global identity to membership and undermines later multi-organization identity. |
| Full provisioning/login and user administration | Defer beyond the POC. |

## Verification required after acceptance

Use the existing PostgreSQL migration/seed test tooling and actual role logins:

- Fresh migration and seed on two empty disposable databases; inspect table
  ownership, constraints and forced RLS. Run provisioning again without widening access.
- Missing, malformed and overlong IDs, absent/nonlocal database configuration and
  incorrect role fail safely. Customer labels/credentials are never stored here.
- Matching reruns and concurrent seeds preserve one identity. An inactive fixture
  created with explicit test-only owner authority fails rerun without reactivation.
- Missing/foreign seed selector denies SELECT/INSERT; constraint violations roll
  back without partial data, and transaction-local context does not survive completion.
- Ordinary seed UPDATE/DELETE cannot change rows. Runtime cannot read, write,
  truncate, alter or assume elevated roles even when it sets the seed selector.
- Typecheck, `npm test` and the database integration suite pass; native and one-shot
  Compose seed commands reproduce the documented result with safe failure output.

Record real results in the [execution plan](../../planning/active/IOP-027-local-principal-plan.md).
These are planned scenarios, not executed security evidence. Acceptance permits
only this bounded migration/seed implementation after its plan is extended; it does
not complete the broader user lifecycle story or enable local runtime access.

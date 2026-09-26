# ADR-0025: Initial local membership and site-role bootstrap

## Status

Accepted on 2026-09-26 by explicit owner approval under [IOP-030](../../planning/items/IOP-030-membership-model.md).
IOP-030 implements the bounded migration and seed. Runtime authorization remains
unimplemented; installation evidence is recorded in the completed plan below.

## Context

Accepted [ADR-0018](ADR-0018-local-poc-execution-context.md) requires an active
principal, organization membership and both explicit site roles for the local POC.
[ADR-0024](ADR-0024-local-principal-bootstrap.md) implements identity bootstrap but
explicitly excludes membership and roles. ADR-0014 leaves physical constraints and
bootstrap authority for implementation review. Existing organization/site seeds
and role separation can support a bounded installation command without an admin UI.

## Decision

### Storage and ownership

Users/RBAC owns two tables in its existing `users_rbac` schema, owned by the
migrator and created with versioned migrations:

- `organization_memberships`: non-null `organization_id`, `user_id`, `is_active`;
  composite primary key `(organization_id, user_id)`, foreign keys to existing
  organizations and users. Membership is organization-owned, never a site-access flag.
- `site_role_assignments`: non-null `organization_id`, `user_id`, `site_id`,
  `role_id`; composite primary key across all four columns; composite foreign keys
  to the membership and `(organization_id, site_id)` in Platform Core. Constrain
  `role_id` to `site-operator` or `analytics-reader`. Each row is an explicit grant;
  no hierarchy, wildcard, null site or configurable permission strings.

Use existing case-sensitive opaque text identity types. References use restrictive
deletion behavior; no cascading lifecycle is added. No organization-role table is
needed for this POC. The third accepted role remains deferred, not redefined.
Roles retain exactly ADR-0014's permissions. A grant's existence is insufficient
when its user or membership is inactive. Future removal/restoration must revoke
assignments explicitly under ADR-0014; this slice exposes no lifecycle mutations.

### Explicit installation authority

Add `seed-membership` to existing local infrastructure tooling. Require explicit
`IOP_SEED_USER_ID`, `IOP_SEED_ORGANIZATION_ID` and `IOP_SEED_SITE_ID`, with existing
ID validation, local database checks and dedicated migrator credentials. There is
no default principal, arbitrary role option, automatic startup seed or runtime
configuration change. The fixed pair of site roles is selected by invoking this
bounded command with those explicit selectors.

On one fresh connection and one transaction:

1. Verify the migrator role and install all three parameterized transaction-local
   seed selectors. Verify an existing active user and the site's organization owner.
2. Serialize competing seeds for the same organization/user before checking
   membership and grants, so concurrent identical attempts converge. Use a
   transaction advisory lock keyed by that pair; collisions may serialize unrelated
   seeds but must never change correctness. Recheck state after acquiring the lock
   with READ COMMITTED statements. This coordinates this command only, not future
   lifecycle operations or privileged manual changes.
3. If membership is absent, create one active membership and both site assignments
   atomically. If membership already exists, succeed unchanged only when active
   and both requested site assignments already exist. Reject inactive membership,
   missing grants or a new site under an existing membership without mutation.
4. Commit only the complete result; otherwise roll back and close the connection.
   Use safe errors that omit supplied values, credentials and driver details.

Do not repair partial state, reactivate membership or silently restore a removed
grant on rerun. Existing membership with incomplete grants requires separately
reviewed recovery or recreation of the dedicated demo dataset, not an upsert.
This intentionally limits the command to initial one-site bootstrap, rather than
turning it into a later grant-administration path. Other memberships/sites are
neither modified nor implicitly granted. A fully deleted membership cannot be
distinguished from a fresh installation by these minimal tables; lifecycle removal
and reseeding an operated dataset remain outside this command's supported use.

### Isolation and runtime handoff

Enable and force RLS on both tables. Migrator-only SELECT/INSERT policies match
organization and principal; assignment policies additionally match site. Reuse
existing exact-selector read policies for prerequisite users/organizations/sites.
No PUBLIC/runtime policy, schema/table grant, UPDATE/DELETE policy, security-definer
function or bypass role. Runtime retains CONNECT only. Missing selectors deny
visibility/insertion. Foreign keys and role constraints independently reject
inconsistent references. The privileged migrator remains trusted and can change DDL;
seed RLS is not protection against a malicious installation operator.

Successful installation does not authorize an API operation. IOP-029 must separately
provide current active-user/membership/grant evaluation through a narrow lookup
contract. ADR-0018's host activation, loopback/origin checks and scoped runtime
transactions still need implementation and real-role tests. No global directory,
login, admin role, delegation UI or full audit infrastructure is introduced here.

## Alternatives

| Option | Assessment |
| --- | --- |
| Atomic fixed-pair installation with strict unchanged reruns | Recommended; bounded authority and no silent restoration of removed grants. |
| Upsert membership and fill missing roles on every run | Reject; can reactivate/regrant access and becomes an administration mechanism. |
| Hard-code membership/roles in the host | Reject; bypasses current persisted access state and mixes identity with grants. |
| Full membership and role administration | Defer beyond the local POC. |

## Verification contract

- Fresh migrations and seed on two disposable databases; exact ownership, keys,
  role constraints and enabled/forced RLS; provisioning rerun does not widen access.
- Missing/malformed IDs, nonlocal configuration, wrong role, missing/inactive user,
  absent organization/site and foreign ownership reject without partial writes.
- Identical and concurrent seeds converge; inactive membership, either missing
  role and a different site under an existing membership fail unchanged.
- Real migrator connections with absent/foreign/sibling selectors cannot read or
  insert out of scope. Foreign-key, duplicate and unknown/admin-role attempts fail.
- Forced failure between inserts rolls back the entire seed; context clears after
  commit/rollback. Runtime cannot read/write/truncate/alter or assume elevated roles,
  even with seed selectors installed. Ordinary seed UPDATE/DELETE changes no rows.
- Typecheck, `npm test`, database integration tests and native/one-shot Compose
  reproduction pass with safe error output. These prove installation only.

See the [completed plan](../../planning/completed/IOP-030-local-membership-plan.md).
The bounded migration/command is implemented and verified. This does not complete
future membership administration or enable runtime business access.

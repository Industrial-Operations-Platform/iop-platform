# ADR-0020: Local organization persistence and initial seed

## Status

Proposed — prepared on 2026-09-24 under [IOP-025](../../planning/items/IOP-025-organization-model.md).
Dependent DDL and seed implementation wait for explicit acceptance. This does not
accept [ADR-0018](ADR-0018-local-poc-execution-context.md).

## Context

The [POC](../../product/scope-poc.md) requires a configured organization without
administration screens. Accepted ADR-0012 permits zero sites; ADR-0013 requires
scoped constraints and forced RLS; ADR-0019 supplies separate infrastructure roles
and migration tooling. No organization table or initial seed authority exists.
Ordinary configuration operations require actor/action/target checks, but initial
creation precedes users and grants. Reusing privileged infrastructure credentials
for this initial data creation therefore needs an explicit, bounded exception;
it cannot silently become a business configuration command.

## Proposed decision

### Organization storage

Create `platform_core.organizations` through a new ordered migration owned by
`iop_migrator`. The schema represents Platform Core ownership, not a tenant schema
or a decision about other modules' code layout. Classify rows as organization-owned:
`organization_id` is the non-null primary key and the root ownership identity.
No second tenant identifier or artificial parent organization is needed.

Use text IDs matching the existing IOP-018 configuration contract:
`[A-Za-z0-9][A-Za-z0-9_-]{0,63}`. Treat IDs as opaque, case-sensitive and immutable;
never derive them from display names. Operators generate/select an ID once and
retain it in configuration. This avoids remapping current configuration references.
Do not prescribe this encoding for future entities in other stories.

Store `display_name` as non-null text, 1–200 characters, nonblank, without leading
or trailing whitespace or control characters. Validate at both command and table
boundaries with consistent rules. Names are not unique across organizations and
are not authorization keys. No lifecycle flags, timestamps or deletion/rename
operation are needed for this insert-only slice. Later rename must preserve the ID.

The primary key is the target for future organization-owned foreign references.
Site ownership and composite site constraints belong to IOP-026; no site schema or
claim of executable site ownership validation is introduced here.

### Initial local seed authority

Add an explicit one-shot `seed-organization` infrastructure command using the
existing pg client and local database guards. Require the dedicated migrator login,
verify its role attributes, and keep its credential out of API/web containers.
Never run the seed at application startup or automatically inside schema migration.

Require explicit `IOP_SEED_ORGANIZATION_ID` and `IOP_SEED_ORGANIZATION_NAME` input.
The ID must match the operator's configured `organization.id` before later runtime
use; document this handoff, with no implicit lookup by name. Keep seed inputs
separate from the strict IOP-018 JSON shape, which currently contains references
only. Fictional combined demo data remains IOP-123. No default customer, principal,
grant or site is created by this command.

This command is privileged installation tooling, authorized by possession of the
local migrator credential and explicit local configuration. It is a narrow initial
creation exception to ordinary business-operation permission evaluation, not a
general authorization adapter or a way to modify existing organization configuration.
Do not use the bootstrap superuser, security-definer functions, disabled RLS or
`BYPASSRLS`. Acceptance does not authorize hosted/shared-user operation.

### Scope and failure behavior

Enable and force RLS. Define only migrator-specific SELECT and INSERT policies,
comparing `organization_id` to transaction-local `iop.seed_organization_id`.
Use explicit SELECT visibility and INSERT `WITH CHECK`. Missing, empty or malformed
context cannot match any valid stored ID. This seed-only setting is not the future
application transaction-context contract. No UPDATE/DELETE policy, PUBLIC policy,
runtime schema usage or runtime table privilege is added.

Use one fresh connection and transaction per invocation. After validating input,
set the single target transaction-locally with a parameterized call, insert if
absent, then verify the stored name at that ID. An identical rerun succeeds without
changing data; the same ID with a different name fails and rolls back. Another
explicit ID represents another organization, even if its name is identical.
Serialize conflicting insert attempts using the primary key and verify the committed
row after conflict resolution; do not implement an update/upsert rename. Test
concurrent equal and conflicting attempts. Close the connection after commit or
rollback; expose only safe success/error categories, without input or driver details.

RLS limits ordinary scoped statements; it does not constrain a malicious object
owner that can change DDL. Migrator credentials remain privileged. Runtime keeps
CONNECT only, including after provisioning reruns. Future runtime policies, grants,
repositories and actor verification require their own accepted context and tests.

## Alternatives

| Option | Assessment |
| --- | --- |
| Explicit migrator seed with forced RLS and scoped insert-only behavior | Recommended for initial local installation; reuses accepted tooling and keeps runtime closed, but needs explicit acceptance of this privileged bootstrap boundary. |
| Customer data embedded in migrations | Reject: couples schema history to local/customer configuration and makes configuration changes misleading migration edits. |
| Seed as database superuser or disable RLS temporarily | Reject: unnecessary bypass for ordinary seed statements. |
| Runtime organization CRUD with users/grants | Defer: exceeds the selected POC slice and depends on an accepted execution mechanism. |
| A new permanent seed role or generic seed framework | Defer: adds credentials and infrastructure for one initial record without an established need. |

## Validation required after acceptance

Use actual role logins against disposable PostgreSQL 17.6. Verify fresh migration
and seed on two empty databases, unchanged reruns, matching/differing concurrent
inputs, invalid IDs/names, failed transaction rollback and repeated provisioning.
Check table constraints, ownership, forced RLS and missing/foreign context denial.
Verify runtime denial for read/write/DDL/truncate/elevated role switching even if
it sets the seed selector. Verify ordinary migrator UPDATE/DELETE cannot mutate
rows. No pool-reuse or runtime business-authorization evidence is claimed by testing
a fresh infrastructure connection. Run repository and database suites and document
native/one-shot Compose commands with safe failure output.

## Acceptance boundary and consequences

Accepting this ADR authorizes only IOP-025's organization migration and initial
local seed implementation under its plan. It leaves ADR-0018 Proposed, business
access closed and IOP-026/123 unactivated. Organization CRUD, lifecycle and admin
screens remain future parent scope. No ORM, application repository/pool, general
module schema convention or full demo reset is selected. No code or tests have
been implemented by this proposal.

## Sources

Official PostgreSQL 17 documentation consulted on 2026-09-24:

- [Row security policies](https://www.postgresql.org/docs/17/ddl-rowsecurity.html):
  command/role-specific policies, forced RLS, default denial and owner limitations.
- [SET](https://www.postgresql.org/docs/17/sql-set.html): transaction-local setting
  lifetime and rollback behavior.

The bootstrap authority and storage contract above are project proposals, not
requirements prescribed by PostgreSQL.

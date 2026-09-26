# IOP-030 — User/site membership

## Status

Blocked — the bounded POC seed awaits acceptance of
[ADR-0025](../../architecture/adr/ADR-0025-local-membership-bootstrap.md).
Membership lifecycle and administration remain deferred beyond the POC.

## Authorization and POC applicability

The owner requested IOP-030 on 2026-09-26, limited to the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
M3 — Platform Core. The IOP-142 scope refinement selects only the explicit seeded
membership and fixed site grants required by Accepted ADR-0018; it does not require
lifecycle UI or delegation workflows.

## Value, context and current state

Administrators and users eventually need access to authorized organizations/sites.
The local POC needs organization membership and both explicit site roles for its
seeded principal. Organization is the generic customer boundary; identity,
membership and permission remain distinct. See the [modules](../../architecture/modules.md),
[data model](../../architecture/data-model.md) and [workflow](../workflow.md).

Organization/site and active principal storage/seeds are integrated. Membership and
role persistence, seed, evaluation and host adapter are not implemented. ADR-0018
accepts the local execution mechanism; ADR-0025 proposes its missing bounded
membership storage/bootstrap contract. Runtime retains CONNECT only.

## Selected requirements and acceptance criteria

- [x] Review dependencies and create a story branch and execution plan before edits.
- [x] Specify the bounded storage/bootstrap proposal and executable verification cases.
- [ ] Obtain acceptance of ADR-0025 before dependent implementation.
- [ ] Persist active organization membership and explicit `site-operator` and
  `analytics-reader` assignments at the configured site, with scoped constraints
  and forced RLS; membership alone grants no permission.
- [ ] Provide an explicit atomic local seed, unchanged matching reruns and safe
  rejection of inactive, incomplete or inconsistent state without restoring grants.
- [ ] Verify concurrent seeds, rollback, foreign/missing scope, invalid references
  and actual-role runtime denial; record evidence and synchronize item/backlog/plan.

## Dependencies and architecture constraints

[IOP-027](IOP-027-user-model.md) and [IOP-026](IOP-026-site-model.md) supply integrated
POC prerequisites. [IOP-029](IOP-029-rbac-enforcement.md) is a future parent dependency
for authorization enforcement, not a gate for this independent installation slice.
[IOP-006](IOP-006-rbac-model.md) supplies the accepted fixed-role matrix. No unmerged
prerequisite branch is required and no adjacent story is activated.

Accepted ADR-0001/0003/0004/0005 preserve module ownership, PostgreSQL,
provider-independent identity and generic customer isolation. ADR-0012/0013/0014
control scope, RLS and grants; ADR-0018 controls the local context. ADR-0024's
principal bootstrap explicitly excludes memberships/roles, motivating ADR-0025.
Follow ADR-0007/0008 and the [ADR directory](../../architecture/adr/);
Proposed is not Accepted.

## Security, data, API and UI boundaries

Keep customer labels and source schemas outside the generic core. Preserve scoped
references and define uniqueness/reruns before migrations. Runtime operations must
verify identity, permission and organization/site ownership; this privileged seed
opens no endpoint and grants no runtime database access. UI visibility never
substitutes for authorization. No secrets, floor plans or production data belong
in the repository; industrial integrations remain read-only. Material future
access mutations require appropriate traceability without adding full audit here.

## Non-goals and remaining parent scope

Membership lifecycle, interactive administration, role delegation, organization
access-admin bootstrap, login/sessions and user provisioning remain later work.
No full milestone implementation, adjacent tasks or inferred acceptance. Current
permission evaluation and the local host adapter require separately selected work.

## Validation and documentation impact

The [active plan](../active/IOP-030-local-membership-plan.md) records execution,
files and evidence. ADR-0025 defines positive, error and denial scenarios for
implementation using existing database tooling. Documentation checks links, IDs,
status and consistency; no executable membership/security evidence is claimed yet.
Update this item, backlog and plan together; update contracts/guides only when this
slice changes them. A finished POC slice does not complete the broader parent.

## Open decision

Accept or revise ADR-0025's initial bootstrap authority, two-table storage and
strict rerun behavior before implementing the migration and seed command.

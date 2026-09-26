# IOP-030 — Local membership and site grants plan

Status: Completed — bounded POC seed validated on 2026-09-26. Owner requested IOP-030 on 2026-09-26, limited to the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Story: [IOP-030](../items/IOP-030-membership-model.md).
Branch: `docs/IOP-030-local-membership`, created from clean `develop` before edits.

## Initial documentation steps

1. Review integrated IOP-027 principal and IOP-026 site seeds, IOP-029 enforcement
   dependency and IOP-006's accepted matrix. No prerequisite branch merge is needed.
2. Specify only initial organization membership and both explicit site roles under
   ADR-0018. ADR-0024 excludes membership/grant bootstrap authority; propose ADR-0025
   for that extension, storage constraints, seed isolation and rerun behavior.
   Pause dependent implementation until explicit acceptance under ADR-0007.
3. Update the IOP-030 item and backlog; link the proposal from the delivery map.
   Translate the entire IOP-029 dependency story from Spanish to English without
   changing its scope/status. Separately correct its stale ADR-0018 status and
   the same stale statements in IOP-026; activate neither dependency.
4. Check local links, IDs, mirrored statuses, English prose and scope consistency;
   commit the documentation increment. Keep this decision-pending plan active.

Expected files: this plan, `items/IOP-030-membership-model.md`,
`items/IOP-029-rbac-enforcement.md`, `items/IOP-026-site-model.md`, `backlog.md`,
`poc-delivery.md` and `docs/architecture/adr/ADR-0025-local-membership-bootstrap.md`.
No schema, API, runtime permission evaluator, host adapter or UI edits before
acceptance. Lifecycle, delegation and organization access administration are deferred.

## Validation and evidence

Review the proposed contract against ADR-0012/0013/0014/0018/0024 and existing
seed code: exact principal/organization/site, active prerequisites, atomic creation,
matching reruns, incomplete/inactive-state rejection, no restored grants, foreign
references, concurrent seeds, rollback and runtime denial. These are design cases,
not executable security evidence.

After acceptance, update this plan with implementation files and execute typecheck,
`npm test`, database integration tests and disposable native/Compose seed checks.
Do not claim runtime authorization from privileged installation tests.

## Initial documentation evidence (before acceptance)

Validated on 2026-09-26: `git diff --check` passed; a Python local-link check
resolved all 203 relative links across the seven changed documents. Item/backlog
are Blocked and ADR-0025 is Proposed. Reviewed scope, dependency readiness and
the seed scenarios above against the accepted contracts and existing seed code.
IOP-029 translation preserves its Proposed status and scope; its ADR-0018 correction
and the matching IOP-026 correction are the only dependency semantic updates.
No application/database tests ran because this increment changes documentation only.
At that point migration and seed implementation awaited ADR-0025 acceptance.
The accepted continuation and final evidence below supersede that initial gate.


## Accepted implementation continuation — 2026-09-26

The owner accepted ADR-0025 and publication of the reviewed documentation increment.
Commit `852b72f` was fast-forwarded into develop and both approved branches pushed
to origin. Implementation branch: `feature/IOP-030-local-membership`, created from
that clean develop before implementation edits. New implementation publication is
not yet authorized.

Implement the accepted two-table migration, fixed-pair `seed-membership` command
and CLI/npm/Compose entry points. Expected additional files: new membership SQL,
`infra/database/seed-membership.ts`, `cli.ts`, `test/membership.spec.cjs`, existing
configuration and migration-count tests, `package.json`, `compose.database.yaml`,
`infra/database/README.md`, `ARCHITECTURE.md` and `docs/architecture/data-model.md`.
Synchronize ADR status, item/backlog and delivery map. Existing migrations stay
immutable. Keep runtime access closed and future administration deferred.

Run `npm run typecheck`, `npm test`, `npm run test:database`; cover all ADR-0025
verification cases, including atomic failure injection and actual-role isolation.
Reproduce native commands on a second disposable database and one-shot Compose
commands on an isolated project; remove only test-owned resources. Check changed
document links and diff whitespace. Record actual outcomes before closure/commit.


## Implementation evidence and closure — 2026-09-26

Implemented the fifth migration, two Users/RBAC tables and `seed-membership` with
native/npm/Compose entry points. Existing migrations remain unchanged. Forced RLS,
scoped composite references and fixed role constraints accompany atomic creation.
Strict reruns reject inactive/incomplete state and do not add another site to an
existing membership. Runtime still has CONNECT only; no API/UI or evaluation path
was added. IOP-030/backlog are Deferred for future lifecycle/admin scope.

Validation used Node 24.21.0/npm 10.9.2 from
`/private/tmp/iop-017-runtime/node_modules/.bin` and PostgreSQL 17.6:

- `npm run typecheck`: passed for API, web and database tooling.
- `npm test`: passed; 9 secret-check tests, 105 API tests, 15 web tests and 77
  database configuration tests, plus builds and generated browser contract check.
- `npm run test:database`: 116 tests across six suites passed. Membership tests
  cover concurrent equal/different-site seeds, inactive and incomplete state,
  absent/foreign prerequisites, fixed-role and scoped FK constraints, forced RLS
  under actual migrator credentials, forged runtime selectors, denied elevated
  roles, safe CLI failures and fault-injected rollback during role insertion.
  Native CLI seeds reproduce on a second empty test-owned database. Successful and
  failed transactions clear selectors; retry after rollback proves lock release.
- Disposable Compose project `iop030-check-11bfd419af`: configuration/image build,
  provision, five migrations, prerequisite seeds and membership creation passed;
  rerun was unchanged with exactly two roles. Repeat provisioning and migration
  retained the baseline with zero migrations applied. Only this project's containers,
  volume, network and temporary tooling image were removed.
- All 249 local Markdown links in changed documents resolved. IDs, Deferred/Accepted
  statuses and `git diff --check` passed. `npm run check:secrets` passed for all
  370 indexed files.

No runtime authentication, grant evaluation, origin protection or pooled business
transaction evidence is claimed. These remain subsequent ADR-0018 delivery work.
The reviewed documentation was published separately; this implementation remains
on `feature/IOP-030-local-membership` for owner review and publication approval.

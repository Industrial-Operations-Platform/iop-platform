# IOP-030 — Local membership and site grants plan

Status: Blocked — ADR-0025 acceptance is required before implementation. Owner requested IOP-030 on 2026-09-26, limited to the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Story: [IOP-030](../items/IOP-030-membership-model.md).
Branch: `docs/IOP-030-local-membership`, created from clean `develop` before edits.

## Changes and steps

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

## Closure

Validated on 2026-09-26: `git diff --check` passed; a Python local-link check
resolved all 203 relative links across the seven changed documents. Item/backlog
are Blocked and ADR-0025 is Proposed. Reviewed scope, dependency readiness and
the seed scenarios above against the accepted contracts and existing seed code.
IOP-029 translation preserves its Proposed status and scope; its ADR-0018 correction
and the matching IOP-026 correction are the only dependency semantic updates.
No application/database tests ran because this increment changes documentation only.
Migration and seed implementation remain blocked solely on ADR-0025 acceptance.
Keep the parent open for the POC seed and future administration; move the plan to
completed only when its selected delivery and evidence are finished.

# IOP-029 — POC authorization execution plan

Status: Blocked — awaiting owner acceptance of Proposed ADR-0026 before dependent
implementation. The documentation increment is complete. Owner request on 2026-09-26, limited to the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Story: [IOP-029](../items/IOP-029-rbac-enforcement.md).
Branch: `docs/IOP-029-poc-authorization`, created from clean `develop` before edits.

## Changes and steps

1. Review IOP-006/026/027/030 and Accepted ADR-0012/0013/0014/0018/0024/0025.
   Relevant design and seeds are integrated; their deferred parent scopes do not
   block this slice. All dependency stories read are English; no translation edits.
2. Document the narrow current-permission lookup and transaction handoff in Proposed
   `docs/architecture/adr/ADR-0026-poc-authorization-lookup.md`. ADR-0014 explicitly
   leaves lookup policies for implementation review; module placement and transaction
   coordination remain undecided in ARCHITECTURE.md. Pause dependent implementation
   until the owner accepts this concrete proposal, as required by AGENTS.md rule 5.
3. Update this plan, the permanent item, its backlog row and `poc-delivery.md` with
   dependencies, proposal status, remaining runtime work and verification cases.
   No application, schema, API, UI or configuration changes in this decision increment.
4. Validate changed Markdown links, IDs, statuses, scope consistency and whitespace;
   commit the documentation increment. Keep this plan active while decision-pending.

## Implementation after acceptance

Refine this plan before code edits. Expected areas: an API-local Users/RBAC module
and Platform Core ownership contract, a pinned PostgreSQL transaction helper,
one versioned lookup migration, provisioning privilege checks, API/database tests
and relevant README documentation. Use existing pg/Nest/Jest/Testcontainers tooling.
No business endpoints, host activation, login, lifecycle/admin UI or new policy engine.
Do not enable the local host adapter by inference; its ADR-0018 checks remain a
separate runtime gate.

Validation must cover the proposal's positive/negative matrix using real runtime
credentials, current state after revocation, rollback and pool reuse, plus
`npm run typecheck`, `npm test` and `npm run test:database`. Only actual execution
results may count as runtime evidence. HTTP import/read evidence belongs to the
later delivered endpoints and host adapter.

## Validation and evidence

Dependency inspection confirms existing principal, membership and fixed-site-role
migrations, forced seed RLS and CONNECT-only runtime. The provisioning command
currently rejects every runtime schema/table grant; its allowlist must change
alongside any accepted lookup migration, without allowing arbitrary grants.

Validation on 2026-09-26: a Python relative-link check passed for all 185 local links
across the five changed documents; assertions verified matching item/backlog Blocked
status and a unique Proposed ADR-0026. `git diff --check` passed. Manual review
confirmed the fixed ADR-0014 bundles, lookup/business-context separation, retained
ADR-0018 host gate and absence of application/schema changes. No dependency story
needed translation. Runtime tests were not run for this documentation-only increment;
no runtime authorization evidence is claimed.

## Closure

Commit the validated decision increment even if implementation remains blocked.
Keep item/backlog Blocked with the specific missing acceptance; keep this plan in
active until the selected implementation is verified. Shared-user enforcement and
administration stay deferred; do not close the broader parent with POC-only evidence.

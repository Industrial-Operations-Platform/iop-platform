# IOP-029 — POC authorization execution plan

Status: Completed — the bounded lookup/transaction slice was validated on 2026-09-26.
Owner request on 2026-09-26, limited to the [POC scope](../../product/scope-poc.md)
and [delivery map](../poc-delivery.md). Story: [IOP-029](../items/IOP-029-rbac-enforcement.md).
The owner explicitly accepted [ADR-0026](../../architecture/adr/ADR-0026-poc-authorization-lookup.md)
before dependent code changes.

## Branches and dependencies

- `docs/IOP-029-poc-authorization`: created from clean develop before the plan and
  proposal. Documentation commits `a20fe2c` and `98e94a8` were merged into develop
  and both refs pushed to origin with explicit owner approval.
- `feature/IOP-029-poc-authorization`: created from the resulting develop at
  `98e94a8`, before implementation edits. Publication of this branch needs separate
  approval; the documentation approval did not publish later code.
- IOP-006/026/027/030 provide integrated fixed-role design, exact site ownership,
  active principal and membership/site-role seeds. Their deferred parent scope is
  not a POC gate. No unmerged dependency or Spanish story required further changes.

## Planned and delivered changes

1. Reviewed Accepted ADR-0012/0013/0014/0018/0024/0025. Prepared ADR-0026 for the
   previously undecided lookup policy, first module placement and transaction
   handoff. No implementation preceded its explicit acceptance.
2. Added API-local `modules/users-rbac` and `modules/platform-core` contracts plus
   `persistence/site-operation.ts`: current active state, exact ownership, fixed
   permissions, denied callbacks and one pinned READ COMMITTED transaction.
   Lookup selectors are separate from business context. Query handles expire after
   callbacks; contaminated sessions and uncertain cleanup destroy the connection.
3. Added migration `20260926020000-authorization-lookup.sql` with column SELECT and
   exact-selector runtime policies on four existing forced-RLS tables. Existing
   migrations and seeds remain unchanged. Updated provisioning to admit only the
   installed lookup grants and reject broader/PUBLIC/grant-option access.
4. Added API unit and actual-role PostgreSQL integration tests. Updated existing
   tests only for migration inventory and intentional runtime read/policy changes.
   `test:database` now builds the API boundary it exercises. Declared existing pinned
   pg/@types/pg dependencies in the API workspace/lockfile for isolated builds.
5. Synchronized API/database guides, ARCHITECTURE.md, module guidance, ADR, item,
   backlog and delivery map. No HTTP/UI/configuration or business-table changes.

The callback remains trusted module code: use only its supplied handle, await
queries and do not change scope or end the transaction. RLS does not defend against
compromised runtime credentials or arbitrary SQL. Host activation, trusted local
principal binding, loopback/origin protection and import/read endpoints remain
independent ADR-0018 gates, not evidence delivered by this lookup slice.

## Validation and evidence

Environment: Node 24.21.0/npm 10.9.2 from
`/private/tmp/iop-017-runtime/node_modules/.bin`; disposable PostgreSQL 17.6 containers.

- `npm run typecheck`: passed for API, web and database tooling.
- `npm test`: passed: 9 secret-check tests, 131 API tests, 15 web tests and 77
  database configuration tests; builds and browser contract check passed.
- `npm test --workspace @iop/api`: final 131/131 passed after connection-loss handling.
- `npm run test:database`: all 125 tests across seven suites passed, including
  9 authorization integration scenarios and all existing installation suites.
- Initial execution with the shell's Node 20 was incompatible with the pinned stack;
  reruns used Node 24. The first real-role run exposed an eager sequence privilege
  check on non-sequence relations; an explicit SQL CASE fixed it. A drift fixture
  now restores column grants after revoking its temporary broad table grant.
- Documentation checks passed for 263 relative links in nine changed Markdown
  files, matching Deferred item/backlog state, Accepted ADR and completed plan.
  `git diff --check` passed. `npm run check:secrets` passed for 380 indexed files.

Tests cover fixed bundles and all-required semantics; invalid/missing scope,
unknown roles/permissions, absent/inactive principals/memberships, exact ownership,
missing/revoked roles, no cross-site composition, runtime column limits and seed
selector isolation. A disposable business table proves scoped handoff, rollback,
savepoints, concurrent targets, cancellation/timeouts, pool reuse and no unscoped
visibility. Fault injection verifies connection destruction and unavailable-state
failure without executing work. Existing seed/CLI suites retain installation evidence.
The production migration adds no business table; OpenAPI and health behavior are unchanged.

## Closure

The selected slice is complete and this plan is in completed. Item/backlog are
Deferred for shared-user authorization and administration. The health host has no
new route or automatic activation. Publish the implementation branch only after
separate owner approval. No stage/master promotion or branch deletion is authorized.

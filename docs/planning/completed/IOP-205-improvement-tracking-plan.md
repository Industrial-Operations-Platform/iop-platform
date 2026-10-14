# IOP-205 — Improvement Tracking execution

## Scope and branch

Completed local module increment; `feature/IOP-205-improvement-tracking` from develop `24b6269` in
`/private/tmp/iop-205`. Implements the [item](../items/IOP-205-improvement-tracking.md)
using existing scoped transactions, forced RLS and hexagonal/revision patterns.
The root delivery owns backlog/shared architecture and final composition updates.

## Files and boundaries

- New `apps/api/src/modules/improvement-tracking/{domain,application,adapters}`:
  actions, lifecycle, responsibility, evidence and immutable comparison orchestration.
- Asset/Handover-owned PostgreSQL reference adapters and OIP-owned comparison adapter;
  new host composition factory/controller/contracts, with no framework imports inward.
- `infra/database/migrations/20261014020000-improvement-tracking.sql`: scoped storage,
  immutable evidence/history, forced RLS and narrow runtime privileges.
- New `apps/web/src/features/improvement-tracking/{domain,application,adapters}`:
  framework-free gateway/application and shared-identity React workspace.
- API/web/database tests, product/development guide and task/plan evidence.
- No edits to shared runtime/controller/workspace composition, role catalogs,
  generated schema or package manifests; root applies those coordinated changes.
- Real database verification temporarily copies root-owned permission catalog and
  permission migration from commit `12d34d3`; these are test dependencies only and
  are restored/excluded from this story's commits. Initial provision precedes
  migrations; the root owns the production postmigration privilege allowlist.
- New German resources live in `apps/web/src/localization/improvement-de.ts`.
  Root composes them into the shared dictionary; the isolated worktree temporarily
  adds that spread for localization/full-web tests and restores the shared file.

## Steps and validation

1. Build bounded domain and application ports/use cases; test ownership, lifecycle,
   optimistic conflicts, evidence corrections and server-owned comparisons.
2. Build RLS persistence, source-owned reference/comparison adapters and transport.
   Check HTTP errors/current actor and real PostgreSQL isolation/atomicity.
3. Build action board/details/forms/evidence/comparison UI using shared components.
   Check React workflows, inward dependencies and design guards.
4. Run typecheck/build, relevant Jest tests and required API tests; report real
   PostgreSQL availability and external-input limits. Commit validated increments.
5. Root wires shared composition/RBAC/contracts and validates complete platform.

No translation-only changes are required: stories read are English. Fair comparison
uses exact source totals and imported-date averages; unknown reporting windows,
missing dates and causal limits remain visible.

## Evidence and integration handoff — 2026-10-14

- Node 24.21.0: `npm run typecheck` passed across API/web/database tooling.
- API build passed. Full API Jest: 32 suites, 434 tests passed; final focused
  Improvement use-case/HTTP verification: 2 suites, 14 tests passed.
- Web build/design guard passed. Full web Jest: 31 suites, 162 tests passed,
  including four Improvement interface journeys and German localization coverage.
- `npm run test:secrets`: 2 suites, 18 checks passed.
- Real PostgreSQL Docker suite: 4 tests passed. Scenarios cover all three profiles,
  stale-write serialization, scoped links/foreign denial, Technician stray grants,
  current revocation and eligible-owner lookup, immutable correction/history,
  injected-history-failure rollback, forced RLS/narrow grants, real UTF-16 imports,
  exact alias totals, missing imports, zero baseline, stale analytical projection
  and independently revoked source access.
- Playwright exercised the real React source through an HTTP gateway with synthetic
  local API fixtures. Desktop board/comparison and 390px comparison/form screenshots
  were inspected in `/private/tmp/iop205-browser/`; zero page errors and no document
  overflow (390px viewport / 390px document). These previews contain no plant data.

Root `12d34d3` permission catalog/migration and an isolated localization spread were
used as test dependencies and restored before committing. Temporary preview sources
were removed and their local server stopped. Root integrates the composition roots,
role migration, privilege allowlists, dictionaries and regenerated public bindings
under IOP-203. Those shared-root checks remain the parent delivery's responsibility;
this branch introduces no merge, push, external integration or product-acceptance claim.

Source schemas and full scoped references remain with their owning modules. The new
responsibility directory adds only a scoped SELECT policy for Tracking contributor
rows after business authorization. No unrelated cleanup or story translation was
needed. Actual intervention dates, targets, plant exposure and causal evidence remain
operating-team inputs; binary attachment storage remains outside notes/results scope.

# IOP-194 — Maintenance linked to operational problems

Status: Completed 2026-10-05. Owner-requested follow-up on 2026-10-05 to
[IOP-194](../items/IOP-194-maintenance-asset-history.md).
Branch: `feature/IOP-194-maintenance-asset-history`, continuing the isolated review
story with its unmerged prerequisite. Existing branch-only origin publication
authorization remains; no merge into develop. M9/3D placement remains deferred.

## Scope and ownership

- Maintenance owns corrective (default), preventive and inspection work, a manual
  repair target/location and multiple exact scoped equipment identifiers. Equipment
  identifiers provisionally represent assets; unverified identity remains explicit.
- Shift Handover owns problem entries and their attributed resolution histories.
  Maintenance reads related entries through an owner contract and closes only
  explicitly included issues. Exclusions require reasons; unresolved/new scope
  entries must be reviewed before completing work. Reuse scoped transactions,
  optimistic revisions and existing module history, with no event broker.
- Team Leaders control assignments; workers see assignments in Start and the
  existing activity surface. Assets is available to Team Leader and Task Force.
- The operational board includes unfinished work regardless of age and Done work
  from the previous/current site calendar weeks. Historical search is explicit.
  Selected-status results hide other columns and use a responsive three-card row.
- Related entry details preserve maintenance context and selections on return.

## Steps and files

1. Synchronize item/product contract; investigate owning contracts and accepted
   ADRs. Record any explicit owner decisions without inferring Proposed acceptance.
2. Extend Maintenance domain/application/PostgreSQL/host contracts and publish
   scoped Handover read/resolution adapters. Add additive migrations preserving
   existing records, references, permissions and immutable histories.
3. Update scoped role provisioning/migration, API and integration tests.
4. Update Maintenance web domain/application/HTTP/React, Assets provisional-code
   registration and explicit aliases, Handover-to-Maintenance drafts, host navigation, Start
   and activity integration; reuse design components and localization resources.
5. Regenerate OpenAPI/browser bindings; add domain, real-database and browser
   evidence. Update placeholder tooling for the new role/scope rules as needed.
6. Update architecture/module/data/glossary and operator documents, record actual
   checks, commit logical increments and publish only the authorized story branch.

Expected paths: both Maintenance features, Shift Handover owning adapters and
application contracts, API host/runtime/role provisioning, web host, migrations,
relevant tests and canonical docs. Update legacy test migration counts and empty
assignment mocks to reflect the additive migration/feed. No unrelated cleanup or
account resets. A separate linked-demo manifest and launcher add fictional Handover
problems and multi-code repairs without replacing the retained original dataset;
only fixture-owned included issues may be resolved.

## Validation

Typecheck, API/web tests, design/architecture guards, generated contract check,
real PostgreSQL tests for atomic closure/exclusion/conflicts/permissions/rollback,
and desktop/narrow browser journeys for scope selection, detail return, focused
board and assignment visibility. Document evidence and material limitations.

## Evidence — 2026-10-05

- Node 24.21.0/npm 10.9.2; API build and generated OpenAPI/browser contract check
  passed. Typechecks passed for both applications and database tooling.
- API: 401 tests across 28 suites passed, including scoped role and owning-contract
  architecture guards. Web: 134 tests across 27 suites passed, including design
  boundaries and preservation of paginated report decisions on return.
- PostgreSQL: all 243 tests across 18 suites passed using disposable Docker databases.
  Cases cover actual Handover resolution/exclusion, stale included revisions,
  injected rollback across both owners, concurrent new-report locking, source
  permission revocation and historical completion-date backfill.
- Browser: all 32 desktop/narrow journeys passed using intercepted UI fixtures.
  A subsequent visual review identified a focused-board CSS precedence problem;
  the corrected layout passed a strengthened width check (three cards each above
  300 px at 1440 px). Reviewed linked repair forms at 1440/390 px and the corrected
  focused board. Existing real PostgreSQL/browser analytical regression passed.
- Local `npm run local:up` rebuilt hosts and applied the additive migration on the
  retained volume. Both hosts/database passed health checks; existing accounts
  remain unchanged. The previous demo manifest remains a retained historical
  dataset; its now-ineligible original author is not impersonated on replay.
- Legacy inspection before the supplement confirmed 10 assets, 30 work records,
  70 Maintenance timeline events and unchanged original Handover/analytical data.
- Linked fixture: four safety/idempotency tests passed. Actual preview wrote nothing;
  apply and repeat apply retained identical demo/original digests: two unverified
  source-code assets, four problems (one resolved, three open), four repairs (one
  in each workflow state), all three categories, three unfinished assignments and
  three assignment notices. The original 10 assets/30 work records, 63 Handover
  entries/129 revisions and 60,735 analytical facts remained unchanged.
- Secret tests: 18 passed; generated browser contract matched; whitespace and
  related documentation links/statuses checked. Private manifests and credentials
  remain ignored. Logical backend and web commits: `1062c76`, `cd78d8e`.

Limits: current selection is manual and exact; no 3D/radius or M9 placement.
Equipment identity remains provisional. Assignment notices are in-app browser
activity. Owner functional/product review remains separate from automated evidence.

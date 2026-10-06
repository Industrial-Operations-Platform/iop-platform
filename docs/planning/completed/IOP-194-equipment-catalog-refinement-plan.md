# IOP-194 — Equipment catalog and review corrections

Status: Completed. Owner-requested review corrections delivered on 2026-10-06.
Branch: `feature/IOP-194-maintenance-asset-history`; continue the authorized isolated
review story. Publication remains origin/story only; no develop merge.

## Scope

- Restore Administrator access to all delivered operational capabilities, including
  Asset Management/M10 and Maintenance coordination, through current scoped grants.
- Use one current asset per exact Asset code, with name equal to code. Put the
  reported-code chooser first, filtered by configured department/Halle and area/
  Bereich. Keep deliberate manual registration for identifiers absent from WinCC.
- Publish scoped owner equipment/source catalogs for conditioned dropdowns. Preserve
  exact source ID, sector, area and code; source selection does not validate physical
  identity. Asset status describes identity verification/lifecycle, not location.
- Support manually recorded component type and within-area grouping/location details
  (for example two buffers). Do not infer missing cassettes, rollers or hierarchy.
- Reconcile the local current registry to known source codes and existing manual codes
  through module applications. Archive superseded fictional records from the active
  directory while preserving identities referenced by immutable work/history. Keep all
  analytical facts, imports, Handover content and unrelated Maintenance intact.
- Make included/excluded reports explicit in Maintenance details; completion resolves
  all included pending reports atomically. Related context/excluded reports are not
  work membership. Preserve original observations without implying current failure.
- Clarify complementarity: analysis supplies measured evidence, Handover owns reported
  problems, Maintenance owns the intervention/outcome. Avoid copying source narratives
  into new repair drafts and show source destinations instead.
- The owner confirmed M09 spatial maps/placements remain deferred on 2026-10-06.
  Implement catalog and manual within-area grouping only; do not claim Asset Locator
  delivery or invent the physical component inventory.

## Steps and files

1. Synchronize IOP-194 scope, this plan and the review-request decisions.
2. Update Assets domain/application/owner catalog ports, PostgreSQL adapters, host
   DTOs/runtime, fixed profiles and additive grant migration; validate revisions and
   exact code uniqueness. Bound larger catalogs and paginate reads; add scoped exact-
   code/source indexes for the observed 5,643-code catalog so validation does not scan
   all source facts on each registration.
3. Update Assets browser application/HTTP/React registration and conditioned source
   selectors; adapt host permissions and Maintenance report presentation/drafts.
4. Add local-only preview/apply/inspect catalog reconciliation with a retained private
   manifest and before/after preservation evidence. No account resets or source imports.
5. Regenerate contracts and run relevant API/web/database/browser checks. Inspect
   desktop/narrow forms. Update canonical product/architecture/operator documents,
   record evidence, commit logical increments and publish the authorized story branch.

Paths: Assets API/web modules, owning OIP/Handover equipment adapters, Users/RBAC
profiles, API host, web host, Maintenance/Handover source presentation where required,
additive migration/provisioning and database operator README, local tooling,
related tests and canonical docs.
Use accepted ADR-0027/0032/0036 scoped owner ports, transactions and revision patterns;
no new general ingestion/hierarchy/spatial architecture.

## Validation

API tests (`npm test --workspace @iop/api`), typechecks, generated contract check,
web/design guards, real PostgreSQL authorization/catalog/identity/revision checks,
and desktop/narrow browser journeys. Local reconciliation must preserve source facts,
original reports, work records/revisions and existing manual asset identity. Record
actual source counts, asset counts and repeat-run evidence; owner physical verification
and missing-code survey remain manual.


## Evidence and refinements — 2026-10-06

- Actual retained catalog: 5,643 distinct codes / 5,793 source-context tuples;
  at most three contexts per code. Registry/reference limit raised to 10,000,
  keeping directory/source-choice pagination. Manual location stays unset when
  multiple source contexts cannot supply one explicit configured area.
- Additive `20261006000000-admin-operational-access.sql` restores exactly three
  Administrator operational roles for active users/site bundles and adds scoped
  identifier lookup indexes. Earlier inactive flags for those three roles have no
  provenance distinguishing the prior restriction from specific revocation; the
  owner's explicit restoration supersedes those flags. Other roles, inactive
  memberships and fully revoked site bundles remain unchanged.
- API: all 408 tests / 28 suites passed. Web: all 140 tests / 27 suites passed.
  Full build, typecheck and design guards passed; generated contracts synchronized.
- Full PostgreSQL run covered 258 tests / 20 suites. Nineteen suites passed;
  the analytical-reset fixture used an unrelated invented alias and was corrected
  to a genuine owner-catalog tuple. Its nine tests passed on targeted retry,
  completing PostgreSQL coverage including source preservation.
  Asset tests include 511 registrations, current-state/parent-location pagination,
  exact source validation and revoked Handover access with available imported codes.
- Local hosts were rebuilt on the retained volume; both application/database health
  checks passed. Catalog preview planned 5,642 registrations, one retained identity
  correction and seven retirements (five examples were already retired). No source
  or work writes occur in this preparation.
- Browser coverage: 35 journeys covered by the full run plus the corrected
  Handover draft retry. Four final desktop/narrow registration, source-choice,
  Handover-draft and included/excluded-detail regressions passed. Actual screenshots
  were inspected at 1,440px/390px. A long code selector exposed an implicit grid
  min-content overflow; a bounded parent grid fixed it without changing shared
  compact controls. The 390px screenshot and descendant-bounds assertions passed;
  the local server serves the same inspected CSS/JavaScript artifact hashes.
- Local reconciliation completed all 5,650 planned actions: 5,642 new assets, one
  retained manual-identity correction and seven archive updates. Final registry:
  5,643 current assets and 12 retired training identities (5,655 records).
  Repeat application wrote zero records and confirmed protected data unchanged:
  34 Maintenance records/82 revisions, 67 Handover entries/134 revisions,
  60,735 analytical facts/104 publications and all 21 original Asset revisions.
  All six reconciliation-planning unit tests passed. Missing physical components
  remain deliberately unregistered until surveyed.
- The exact source example was checked through the running OIP owner port:
  `=12+12.01.02-B102.6` maps to `hitliste` / `Halle A T2` / `Pick Tower 1`.
- The corrected Web image was rebuilt and activated; API, Web and database health
  checks passed on the retained local installation. Build/typecheck, design guards,
  generated contract consistency, all 18 secret-check tests and staged hygiene
  checks passed. Local manifests and browser screenshots remain ignored artifacts.

## Outcome

Administrator operational access, exact-code catalog registration, conditioned
source selectors, manual component/group metadata and explicit repair membership
are delivered. M09 remains deferred as confirmed; physical verification and the
missing-component survey remain owner tasks. The authorized publication target is
`origin/feature/IOP-194-maintenance-asset-history` only; no develop merge.

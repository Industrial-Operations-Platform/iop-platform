# IOP-209 — Asset domain completion execution

## Scope and branch

In progress: asynchronous view safety follow-up on `feature/IOP-209-asset-domain-completion` from develop `24b6269`,
worktree `/private/tmp/iop-209`. Implements the [item](../items/IOP-209-asset-domain-completion.md)
and [ADR-0039](../../architecture/adr/ADR-0039-asset-domain-enrichment.md).
Original IOP-032/033/035/036/038/039/044/093/124 and relevant dependencies were read
in English; no translation-only edits are needed. Physical plant validation stays pending.

## Files and boundaries

- New Assets domain/application sidecars and PostgreSQL catalog/enrichment/mapping
  adapters; existing registry models and fixtures remain compatible.
- OIP-owned canonical fact-link projection/Pareto adapter and publication callback.
- New host factory/controller/contracts; root integrates shared composition, privileges,
  generated contracts and translation dictionaries without mixed story edits.
- Web Assets sibling domain/application/gateway/workspace, configurable editors,
  mapping review and source/coverage views using the shared visual identity.
- Migration `20261014060000-asset-domain.sql`, synthetic structure fixtures,
  API/web/PostgreSQL tests, product guide and original story context evidence.

## Steps and validation

1. Implement type/metadata schemas, composition cycle/controller validation,
   survey review and immutable sidecar history; exercise replaceable ports.
2. Implement scoped persistence, exact source reviews and OIP projections/history
   without RAW/fact changes; verify current permission/profile and independent
   source permissions with real PostgreSQL and atomic rollback cases.
3. Implement configurable catalog, asset enrichment/survey and mapping/Pareto UI,
   reviewed HTTP contracts and dedicated German resources.
4. Build/typecheck, run required API tests, relevant frontend/design/secret checks,
   disposable PostgreSQL tests and root browser integration. Record actual evidence,
   external inputs and precise root integration APIs. Commit validated increments.

Root-owned shared files are not edited/committed. Temporary test dependencies, if
needed, are explicitly restored before commits. Root mirrors backlog/shared docs.

## Validated API increment

- Full API: 427 tests / 32 suites passed, including eight new domain/real HTTP cases.
- Disposable PostgreSQL 17.6: five cases passed. The 1,506-asset scope exercises
  bounded pagination and exact refinement; mapping tests retain original bytes/facts,
  project newly published imports, reject current permission loss and roll back
  review/history on an injected canonical-projection fault.
- Optional synthetic fixture: repeat-safe fresh identities, all survey decisions,
  parent/controller graph, ambiguity, no fabricated import and preserved user edits.
- Build/typecheck, shared design boundaries (four tests), secrets (18 tests) passed.
- Browser feature tests: four passed; shared dictionary assembly is a temporary
  unstaged test dependency owned by root and will be restored before completion.

Original context updates close delivered software criteria, keep IOP-039 physical
inspection open and record operating-team inputs. Root synchronizes shared backlog,
composition and browser acceptance; no plant acceptance is inferred.

## Validated web increment

- Full frontend suite: 162 tests / 31 suites passed after temporarily spreading
  the dedicated German resource into the root-owned dictionary. That test-only
  shared-file edit was restored; root must include the documented spread.
- Four new React journeys cover large catalog pagination/refinement, structured
  metadata/survey edits, reusable field configuration and exact tuple review.
- Complete build/typecheck and reviewed contract check passed; no generated schema
  was edited in this isolated worktree. Root registers the controller and regenerates
  the assembled contract. Parent performs integrated browser acceptance.

## Completion and handoff

Validated commits: `f029215` API/schema/projection/fixture, `a2a6cfe` web and
`4e49405` native importer publication compatibility.
Final documentation synchronizes the original story contexts, guide and narrow
[composition/provision contract](../../architecture/asset-domain-integration.md).
No shared root files or generated contract edits are included. No merge/push occurred.

Commands executed with Node 24.21.0:

```sh
npm test --workspace=@iop/api
npm test --workspace=@iop/web
node --experimental-vm-modules node_modules/jest/bin/jest.js --config infra/database/jest.config.cjs --runInBand --testPathPatterns asset-domain
npm run build
npm run typecheck
npm run contract:check --workspace=@iop/web
npm run test:secrets
```

Full API 427/427, web 162/162, real PostgreSQL 6/6, design 4/4 and secrets
18/18 passed. Markdown links/IDs/statuses and diff whitespace were checked.
Shared translation assembly was the only temporary test dependency and is restored.
The new migration grants explicit columns and forces all nine tables' RLS; root
retains post-migration provisioning validation by adding the documented allowlists.

The software module is complete; root-owned combined assembly/browser acceptance
continues under IOP-203. Physical survey/evidence and actual plant mapping/type/wiring
data remain pending operator inputs, explicitly retained in IOP-039 and the guide.

## Importer compatibility follow-up — planned before edits

Root review found that canonical publication required assets.read, although native
site-operator importers legitimately have imports.submit/analytics.read without
registry grants. Add explicit receiving-owned publication decision/projection ports
that use current imports.submit only and return no public registry data. Keep
mapping review, candidate lookup and Pareto independent Asset permissions.
Files: Assets decision adapter, OIP canonical adapter, host composition, real PG
regression, ADR0039 and composition/product guide. Validate a no-profile native
importer with site-operator/analytics-reader only, unchanged RAW provenance, automatic
reviewed mapping preparation and revocation denial. No broad grant/backfill change.

Publication ports now separate interactive analytics/Assets authorization from
receiving-owned imports.submit preparation. Full API re-run: 427/427 passed.
Six PostgreSQL cases passed with a no-profile native importer, exactly site-operator
and analytics-reader roles, zero Asset grants, mapped/unmapped preparation and
current import revocation. The final assertion also exercises the callback itself
on an independently authorized analytics transaction after imports.submit loss.
No native importer receives a registry directory/public Asset response.

The final callback revocation assertion passed; all six disposable PostgreSQL
cases passed after the receiving-owned publication fix. Full API re-run passed
427/427. Implementation and documentation are complete for this local scope.

## Async view safety follow-up — planned before edits

Root review identified late responses in the new workspace and mapping lists,
selection/history, pagination and mutation callbacks. The picker guards initial
search responses but not Load more. Audit all new React loaders and add scoped
request generations invalidated on navigation, search replacement, application
change and unmount. Detail/history must publish one coherent current selection;
late failures must not replace the current error/pending state. Mutation completion
after cancel/navigation must not reopen its prior editor. No backend/shared files.

Affected files: AssetDomainWorkspace, AssetReferencePicker, MappingReview,
CanonicalPareto and meaningful deferred/reversed-response React regressions.
Validate latest search, selected asset/history, mapping source, pagination and
unmount behavior; run web suite/typecheck/design checks. Root rebuilds for read-only
actual UI QA; actual registry/source/plant data must remain unchanged.

Async implementation validated: 12 feature tests and the complete web suite
(170 tests / 31 suites) pass, including eight new reversed/deferred-response
regressions. Web typecheck/build and four shared design-boundary checks pass.
The only temporary dependency was the documented German dictionary spread,
restored before commit. API/persistence are unchanged by this follow-up.

Detail/history now publish together for the current request generation. Search
replacement/navigation/application change/unmount invalidate late data, errors
and pending completion. Pagination uses the loaded search/cursor and cannot mix
results with a newer search. Cancelled/unmounted mapping saves cannot close another
source's editor. Pareto application replacement ignores obsolete results.
Root rebuild and actual read-only browser QA remain the next evidence step.

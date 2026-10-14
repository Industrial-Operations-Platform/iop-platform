# IOP-209 — Asset domain completion execution

## Scope, authority and branch

Completed on `feature/IOP-209-asset-domain-completion`, from develop `24b6269`,
worktree `/private/tmp/iop-209`. The [item](../items/IOP-209-asset-domain-completion.md)
and Accepted [ADR-0039](../../architecture/adr/ADR-0039-asset-domain-enrichment.md)
record the owner's delegated decisions. Relevant original stories and dependencies
were read in English; no translation-only edits were necessary.

Plans preceded implementation and each follow-up. Scope covered configurable
Assets sidecars, typed metadata/composition/controller links, survey reviews,
reviewed source mapping, OIP projection/Pareto, bounded UI, synthetic fixture and
original story evidence. Actual plant inspection/identity review/placement stays
pending; these are not inferred from imported codes or synthetic exercises.

## Boundaries and integration

Assets owns its existing registry and new catalog/model/review sidecars. OIP owns
canonical fact links/history and queries. Factory/controller/contracts expose
narrow ports; source preparation stays on the original pinned import transaction.
All nine new tables force scoped RLS and explicit column grants. Root integrated
host/navigation/current permissions/generated contracts/provision allowlists and
German resources using the [composition contract](../../architecture/asset-domain-integration.md).

The child worktree did not commit shared host/RBAC/provision/generated files.
The temporary German dictionary spread needed by isolated web tests was restored.
Root retains its shared backlog; the child index synchronizes only original
Asset rows. No merge or push occurred.

## Implemented and verified

- Versioned type capabilities/structured fields, graph cycle validation and
  controller targets reject foreign/retired/stale/incompatible references.
- Survey review attribution, notes/evidence and immutable revisions remain
  independent of registry lifecycle and actual physical inspection.
- Explicit mapping candidates/revisions preserve ambiguity and original RAW/facts;
  injected projection-history failure rolls back review/history atomically.
- Receiving-owned publication ports use imports.submit without broad Asset grants
  or a registry response; interactive Asset/source queries remain independently gated.
- Bounded inventory/source pages support large actual registries. Source tuple/count
  lookup, mapping-source/history and complete-total canonical Pareto use real SQL.
- React request generations retain current selection/history/search, ignore stale
  data/errors/pages and prevent cancelled/unmounted saves from changing another view.
- Optional local synthetic fixture creates fresh labelled identities only, exercises
  all survey decisions/relations/ambiguity, is repeat-safe and preserves user edits.

## Validation evidence

Commands ran with Node 24.21.0; API/socket/PostgreSQL tests used reviewed escalation.

```sh
npm test --workspace=@iop/api
npm test --workspace=@iop/web
npm test --workspace=@iop/web -- --testPathPatterns asset-domain
node --experimental-vm-modules node_modules/jest/bin/jest.js --config infra/database/jest.config.cjs --runInBand --testPathPatterns asset-domain
npm run build
npm run typecheck
npm run contract:check --workspace=@iop/web
npm run test:secrets
```

Full API 427/427, full web 170/170 followed by latest feature 13/13, PostgreSQL
7/7, design 4/4 and secrets 18/18 passed. The real database fixtures include
1,506 scoped identities, a native no-profile importer and 32 source tuples for
stable/refined pages. Markdown links/IDs/statuses and diff whitespace were checked.

Actual read-only UI QA found a candidate SQL 503 that the initial fixture did not
exercise. The added PostgreSQL lookup reproduced it before the fix; ordering the
grouped derived relation resolved computed alias/collation handling. Subsequent
source/history/Pareto tests and full API passed before the local rebuild.

The latest assembled installation then passed 20 read-only browser checks:
inventory/refinement, model/survey draft validation and Cancel, Digital Asset Record
navigation, type catalog, original source/mapping lookup, candidate refinement,
honest unprepared canonical coverage and inventory/type/model/mapping/Pareto views
at 390px in light and verified dark appearance. Screenshots were visually inspected;
zero page/console errors, failed HTTP responses, document overflow or attempted
Asset writes occurred. Private artifacts are under `/private/tmp/iop-209-browser-qa`,
outside Git; real catalog/model/survey/mapping data remained unchanged.

## Commits and remaining input

`f029215` API/schema/projection/fixture, `a2a6cfe` web, `4e49405` native importer,
`24e5600` documentation, `98abacd` async safety, `9a51a3d` early tab loading and
`7dd3c02` source candidate SQL/regression. Root assembled these on the authorized
IOP-203 branch and performed the combined local build.

The software scope is complete. IOP-039 physical inspection/evidence remains open;
actual type/wiring/metadata/canonical review/Locator placement require the operating
team. Synthetic fixtures and current unprepared coverage do not claim plant acceptance.

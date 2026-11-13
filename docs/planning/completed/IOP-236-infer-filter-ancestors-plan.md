# IOP-236 — Analytical ancestor completion

Status: Completed locally. Branch `fix/IOP-236-infer-filter-ancestors`, from develop
`61ba187`. [Scope](../items/IOP-236-infer-filter-ancestors.md).

## Implementation

1. OIP report result and PostgreSQL adapter: return optional `filterAncestors`
   metadata from the complete already-authorized selected facts. Include only
   missing fields preceding the deepest selected criterion, with one nonempty
   value across every matching row. Preserve selection, totals and option cascade.
2. Extend the existing report DTO/OpenAPI and browser bindings. Analysis domain
   merges only valid missing ancestors; React applies metadata only to the latest
   draft request. Refresh compatible choices for the completed draft before Apply;
   do not relabel old options as a new selection. Reuse existing ports/components.
3. Add pure/React regressions and real PostgreSQL coverage for unique and ambiguous
   ancestors beyond page/suggestion limits, empty matches, month/exclusion scope,
   preserved explicit fields and stale requests. Add a focused Chromium exercise
   at desktop/mobile widths and inspect screenshots. Update the operator guide and
   English/German explanatory text.
4. Run API npm test, relevant web tests, typecheck/build/contract/design checks,
   scoped PostgreSQL integration and browser tests. Record results, archive the
   plan, synchronize item/backlog and commit the coherent change.

No new boundary or architectural pattern is introduced. Source/customer labels
remain data. Source-file filters are outside this screenshot's report-filter scope.
Publication approval is requested only after the committed change is reviewable,
under the repository story-branch workflow.

## Evidence

- API `npm test`: 55 suites and 573 tests passed, including architecture/cache
  coverage. Full workspace/database typecheck passed.
- Reporting PostgreSQL integration: all 18 tests passed in an isolated container.
  Inference respects exact source scope, selected months, Sunday exclusions and
  current profile exclusions/cache invalidation. The new 61-row example has its
  only different parent after the first 50 records; it remains ambiguous. A choice
  beyond 200 suggestions resolves its unique parents from the complete data.
- Web pure selection, React, analysis workspace, localization and design checks:
  5 suites, 33 tests passed. Cases include explicit parents, lowest-field ancestors,
  ambiguity, no descendants, stale responses, downward resets and revalidation
  before Apply. Existing failure/retry/month regressions also pass.
- Production web build and OpenAPI/browser contract generation/check passed.
- Chromium: 4 scenarios passed for existing drill-down/cascades and new Bereich
  and equipment completion at 1440px and 375px. Inspected light desktop and dark
  mobile screenshots; shared controls fit without document overflow. Applied
  filter counts stay unchanged until the explicit Apply action.

On 2026-11-13 the owner approved publication of both filter corrections to origin
and requested a clean working tree. Integrate both review branches into develop,
resolve integration conflicts, validate their combined browser behavior and push
both review branches and develop. Check remote refs and working-tree status after
publication.

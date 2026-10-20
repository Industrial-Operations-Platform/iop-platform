# IOP-215 — Execution plan

In progress, authorized by the owner's 2026-10-20 request.
Branch: `feature/IOP-215-operational-refinements`, created from `develop` `0df0299`.
[Permanent scope](../items/IOP-215-operational-refinements.md).

## Changes and steps

1. Inspect existing Workforce, Handover, Maintenance, OIP and Locator contracts,
   relevant permanent stories and Accepted ADRs; record necessary refinements
   before dependent edits. Read story translations, if any, are tracked here.
2. Workforce owns primary leader membership and technical-level data/use cases;
   its React adapters and host Start composition own availability and weekly
   presentation. Expected files: `apps/{api,web}/src/**/workforce/`, Workforce
   transport/contracts, scoped local demo adapters and `apps/web/src/host/`.
3. Operational Overview/Handover own authorized journal reads. Shared design
   adapters own filter controls; Improvement and Maintenance React adapters own
   filter layout and drag/drop presentation, invoking existing state use cases.
4. OIP adapters own bounded analytical query reuse and invalidation. Locator's
   application/API adapters retain current authorization; React/Three.js adapters
   own view/configuration separation, rendering and resource cleanup. Pause only
   dependent work if inspection identifies a genuinely new architectural pattern.
5. Add focused regression coverage, synchronize module/design guides and API
   artifacts if affected, validate and commit coherent increments locally.

### Workforce refinement

Reuse existing `settings.teams[].leaderId` and worker `teamId` as editable primary
groups; this association never restricts another authorized leader's planning.
Add optional configured technical-level choices and an optional worker level to
the retained JSON payloads, keeping old snapshots valid. The host owns initial
site labels. My day derives availability from persisted UTC assignment intervals
and the current instant, with a separate indication for overlap with the viewer's
scheduled shift. Include the previous date in weekly board reads for overnight
leadership. Start keeps its existing single loaded-week request and renders seven
compact dated columns. Scoped local roster preparation must resolve existing
identities and preserve established memberships; it must never create people from
names, assign permissions or randomize on ordinary page loading.

## Validation and evidence

Inspection refinement: report reuse stays private to the existing PostgreSQL
report adapter, as requested by the owner, rather than adding a cache service or
changing module boundaries. Every hit first enters the current authorized scoped
operation and validates the complete publication/profile revision and projection
readiness in one statement. Misses retain the existing one-statement report. The
cache is process-local, bounded by entry count/bytes/time, and never stores grants
or failures; no browser-persisted analytical data or schema is added. ADR-0028's
snapshot/revision contract is preserved. Read dependency IOP-089 is already English.

Locator refinement: use lightweight area cards as the default overview, load only
the selected area's 3D reference, bound GPU texture resolution and retain the
renderer across component selection. Handle lost WebGL contexts through the
existing accessible fallback. Configuration is an explicit Administrator-only
mode; both current profile and grant remain mandatory on server writes, including
obsolete surviving grants. Editor-only asset searches run only in configuration.
The inspected IOP-206/080/081/089/155/214 story files contain English prose.
Node 24 focused Locator/advanced-profile API checks passed (27 tests, 5 suites).
Locator browser-unit/geometry checks passed (9 tests, 2 suites); web typecheck and
`git diff --check` passed. Runtime-role tests now exercise Administrator revision
races and reject obsolete Team Leader/Task Force management grants. Two browser
resource checks cover an unloaded 71-scene overview, explicit configuration,
single-area loading, selection context reuse and lost-context fallback; integrated
PostgreSQL/browser execution remains to be recorded below.

- Run API `npm test`, web tests, architecture/design guards, generated-contract
  consistency, typecheck and production build appropriate to changed surfaces.
- Exercise actual desktop/narrow rendering and the requested interactions through
  browser tests; inspect screenshots and authorization/cache regression evidence.
- Check changed Markdown links, item/backlog consistency and `git diff --check`.
- Record actual results, resource/performance evidence and limitations at closure.

## Closure

Update item/backlog acceptance and evidence; move this plan to `completed/` when
the authorized increment is complete. Commit only this story's changes. Report
hashes/tree status and request approval for merging this branch into `develop` and
pushing both branches to `origin`; no publication is inferred.

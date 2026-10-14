# IOP-203 — Platform completion execution

Status: In progress. Owner-authorized on 2026-10-14. Branch:
`feature/IOP-203-platform-completion`, from `develop` at `24b6269`.
[Permanent request](../items/IOP-203-platform-completion.md).

## Changes and steps

1. Inspect the supplied ZIP as reference data, existing module contracts and open
   stories. Keep original plant diagrams in ignored private local storage.
2. Record delegated architectural decisions, implement independent increments on
   separate story branches from develop, then compose their validated commits on
   this dependent review branch. The owner's explicit authority to make development
   decisions covers this integration; it does not authorize promotion or publication.
3. IOP-204: formal shift Handover and canonical asset references. IOP-205:
   Improvement Tracking. IOP-206: reusable provisional 3D Asset Locator.
4. IOP-207: provider-independent integration adapters and visible readiness.
   Advance further independent local infrastructure/assets/UX increments as
   individual story worktrees become available, documenting scope before edits.
   IOP-208 owns local delivery/operating infrastructure; IOP-209 owns independent
   Asset domain extensions; IOP-210 owns global search/unified area overview.
5. Wire host controllers/runtime, browser composition, scoped permission bundles,
   generated OpenAPI bindings, private reference import and operational guides.
6. Exercise real persistence, role denial/revocation, module behavior and desktop/
   narrow presentation. Reconcile original stories against delivered criteria;
   keep missing plant inputs, real connections and human acceptance open.

Expected files: new module/feature directories, host composition and contracts,
Users/RBAC profiles and migrations, local tooling/configuration, product/development
guides, ADRs and planning evidence. Each child plan identifies exact owned files.
Do not translate unrelated stories; translate Spanish story prose only if read.

## Validation and evidence

Use installed Node 24.21.0. Run typecheck, architecture/design checks, generated
contract checks, `npm test`, relevant real PostgreSQL suites and browser workflows.
Inspect actual 3D/editor rendering with fallback behavior and keyboard-accessible
lists. Verify every ZIP image has a private manifest entry and incomplete calibration
is visible. Validate links, story IDs/statuses and working-tree/commit scope.

Initial assembled evidence: advanced permission suites 10/10; IOP-207 API6/browser2
and real PostgreSQL4; private-copy tests2; current typecheck and generated bindings
pass. Temporary socket sandbox failures require escalated local test execution,
not changes to application behavior. New schemas receive explicit privilege
allowlists; provisioning must keep rejecting unexpected/table-level grants.

## First integrated increment — 2026-10-14

Controllers, runtime factories, current profile gates, navigation and English/German
resources now compose IOP-204–207. Generated OpenAPI browser DTOs replace temporary
transport fallbacks. Three.js loads asynchronously, retaining accessible fallback
controls. The actual local registry contains 5,655 assets: Tracking starts with
bounded initial choices and uses the Assets-owned paginated query for complete
lookup instead of rejecting a large registry.

`npm test` passed: secrets20, API472, web173, database configuration77. Real
PostgreSQL first-wave suites now cover46 passing behavioral checks after updating
the historical Handover migration/table assertions for the new formal tables. A
1,001-additional-asset regression verifies Tracking stays available and can save
an identity outside the initial catalog; its browser lookup journey also passes.
No production behavior was relaxed. Root-owned Locator evidence ports
match explicit canonical references or exact scoped aliases and retain independent
Handover/Maintenance permission coverage. Integrated visual checks remain pending.

## Closure

Record actual commands/results and unresolved input per child, retain review
branches and commit validated increments. No push, develop/stage/master promotion,
hosted deployment or claim of surveyed sensor precision is included.

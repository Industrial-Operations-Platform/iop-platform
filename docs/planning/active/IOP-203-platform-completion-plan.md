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

## Closure

Record actual commands/results and unresolved input per child, retain review
branches and commit validated increments. No push, develop/stage/master promotion,
hosted deployment or claim of surveyed sensor precision is included.

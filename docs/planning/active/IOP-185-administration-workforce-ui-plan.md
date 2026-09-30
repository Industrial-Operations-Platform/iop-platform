# IOP-185 execution plan

Status: In progress
Branch: `feature/IOP-185-administration-workforce-ui`, created from clean `develop`.
Scope: [request and acceptance](../items/IOP-185-administration-workforce-ui.md).

## Ownership and files

- Shared presentation: `apps/web/src/design/components/`, component guidance and
  visual identity documentation. Synchronize account/landing and Workforce usage
  in `docs/development/running-poc.md` and `docs/development/workforce.md`.
- Access: `apps/web/src/features/access/`, Users/RBAC application/PostgreSQL adapter,
  access controller and transport contract if required for atomic profile editing
  and persisted recent activity. Reuse existing scoped transaction/audit patterns.
- Host: `WorkspaceApp`, `AdministrationOverview`; compose authorized access and
  import information without moving feature rules into shared components.
- Workforce React adapters: weekly matrix, daily cards, configuration and weekly
  form/navigation. Domain schedule and authorization rules remain unchanged.
- English/German resources, focused tests, generated bindings if contracts change,
  item/backlog and completion evidence. Dependencies read are already English.

## Steps

1. Inspect existing ports, persisted data and reusable controls; retain accepted
   boundaries and avoid introducing an architectural pattern.
2. Implement account details and an evidence-based administrator overview.
3. Unify shared table/button styling and header ordering; refine Workforce layouts
   and cancel/back transitions.
4. Run relevant behavior, identity, architecture and API checks; build and inspect
   desktop/narrow browser views. Record limitations, synchronize docs and commit.

## Validation

- Access details save/cancel, list restrictions, deletion accessibility and overview
  loading/error/empty/data states; API scoped audit and atomic edits if extended.
- Weekly matrix day/shift grouping, leader labels and weekly cancel/navigation;
  preserve schedule save/conflict behavior.
- Web tests/typecheck/build, API `npm test`, relevant contract/architecture guards.
- Browser desktop and narrow screenshots for changed views and overflow. Update
  legacy header assertions encountered in these regressions to the accepted M6
  title-first navigation and two-line account label.
- Documentation links/status consistency, `git diff --check`, scoped local commits.

No merge, push or local stack activation is authorized by this request.

## Evidence

Validated on 2026-10-01 with Node 24.21.0:

- Shared identity/architecture guards pass in the 91-test web suite. API suite:
  340 tests pass. Typecheck, full build and generated-contract parity pass.
- Disposable PostgreSQL access suite: 11 tests pass, including real browser/HTTP
  detail saves, denied activity/detail requests, cross-organization isolation,
  rollback after a later access failure, last-admin protection and retained activity
  after logical deletion. Existing forced RLS and grants remain unchanged.
- Browser regressions: 13 pass across 1440, 820 and 375px, covering the new account,
  administrator, Workforce views plus handover, analysis and Start. The dedicated
  scenario verifies grouped headers, no inline profile selector, atomic detail
  request, cancel from new/edit-week paths, header order and German configuration.
- Manually inspected `/tmp/iop-185-{overview,users,user-details,matrix,day,weekly,configuration,configuration-de}-{1440,375}.png`.
  Fixed tight panel spacing, mobile tab collisions and mobile date-header visibility.
- Browser checks use an isolated preview on port 4175 with deterministic API fixtures.
  The pre-existing API on 3000 was preserved; the unrelated native-health startup
  browser case was excluded. Real authenticated HTTP is covered by the database suite.
- Updated stale browser assertions for the already-delivered M6 account header and
  removal of the Operations eyebrow. No architectural decision or migration needed.

Boundaries: immutable username/user ID stay read-only. Activity covers account
changes, not all modules; the latest file comes from analytical import history.
Build retains the existing large-bundle advisory. No stack activation/publication.

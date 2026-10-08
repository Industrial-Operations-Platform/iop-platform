# IOP-199 — Execution plan

Status: In progress
Authorization: owner request of 2026-10-07.
Branch: `feature/IOP-199-handover-category-workflows`, created from clean `develop`.
Scope: [permanent item](../items/IOP-199-handover-category-workflows.md).

## Changes and steps

1. Extend Handover/ Maintenance notification use cases and browser checkpoints for
   exact per-event read acknowledgments; wire successful detail opening in the host.
2. Extend scoped category configuration and Handover content validation for Safety,
   technical classification, Success references and Information display dates.
   Use existing JSON snapshots/revisions; synchronize host DTOs/OpenAPI/browser models.
3. Add receiving-owned Workforce default-location and Maintenance completion/read
   ports through host composition. Handover owns selected report resolution;
   Maintenance owns work completion and repair review on the pinned transaction.
4. Update EntryForm, MeetingCanvas, HandoverWorkspace and Start composition using
   shared controls, existing image fields, full-content expansion, personal Journal
   and existing Workforce presentation. Preserve navigation and location overrides.
5. Add meaningful domain/use-case, notification, API/database and browser scenarios;
   synchronize product/development architecture notes, item/backlog and evidence.

Expected files: owning Handover, Maintenance and Workforce application/domain and
PostgreSQL adapters; host composition/controllers/contracts; browser Handover and
notification adapters; WorkspaceApp, HandoverPeople, the Users/RBAC current-profile read and localization; relevant tests and canonical
Handover documentation. No dependency story translation is currently necessary:
the contexts read are already English. No new architectural pattern is planned. Information adds a scoped publisher-profile
restriction (Team Leader default), retaining current grants. Mutation entry points
use one coordination-before-Maintenance lease order. Draft category transitions
remain framework-free presentation use cases; source owners validate persistence.
Success outcome entries cannot become open issues; untracked entries use a neutral
Update state label to avoid confusing Safety/Success with the Information category.
Canonical setup documentation also records that the optional legacy IOP-173 demo
writer predates these validation rules. Its frozen fixtures and the operator's
installation are not rewritten or executed within this story.

## Validation and evidence

Run API `npm test`, relevant browser/database tests, typecheck/build, generated
contract consistency, architecture/design guards and desktop/narrow rendered checks.
Exercise exact notice removal/reload/later updates; assignment defaults/overrides;
Safety hidden/invalid component; technical classification; atomic authorized Success
closure/conflict rollback; Information expiry/broadcast/media/Start; personal Journal.
Record actual commands/results and limitations before closure.

## Closure

Verify criteria, update canonical docs and item/backlog, move this plan to completed,
commit logical validated increments, report hashes and tree status. Ask before merging
the story into develop and pushing both branches to origin; no deployment is implied.

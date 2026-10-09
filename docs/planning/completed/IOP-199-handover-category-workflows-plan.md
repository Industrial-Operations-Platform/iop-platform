# IOP-199 — Execution plan

Status: Completed
Authorization: owner request of 2026-10-07.
Branch: `feature/IOP-199-handover-category-workflows`, created from clean `develop`.
Completed: 2026-10-08.
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

Node validation used version 24.21.0. Build before database validation; do not delete
compiled output concurrently with a database run. Temporary test listeners,
Chromium and isolated PostgreSQL containers used authorized sandbox escalation.

| Check | Result |
| --- | --- |
| `npm test` | Passed: 18 secret-tooling tests, 418 API tests, 149 web tests and 77 database configuration tests; API/web/database builds, design guard and generated contract consistency passed. |
| `npm run typecheck` | Passed for both apps and database tooling. |
| Scoped database Jest suites | Passed: 2 suites, 42 tests using isolated PostgreSQL and the real API/browser. |
| Web Playwright: daily-handover, handover-navigation, operational-shell, personal-operational-workflows and handover-category-workflows | Passed: 12 scenarios at desktop/tablet/narrow widths. |
| `npm run check:secrets` | Passed for 928 indexed files. |
| Markdown local links and `git diff --check` | Passed; item/backlog/plan IDs and statuses checked at closure. |

Database command after build:

```sh
node --experimental-vm-modules node_modules/jest/bin/jest.js --config infra/database/jest.config.cjs --runInBand --testPathPatterns 'shift-handover|maintenance.spec'
```

Evidence covers exact notice removal and persistence while peers/later updates
remain unread; actual dated assignments, overrides and empty floating/unassigned/
unzoned defaults; Safety fields and server rejection; automatic technical
classification/tracking and current pending counts; personal Journal and shared
dated People presentation; Information broadcast, expiry, media and Start display.
Success tests cover authorization, revision conflicts, selected-only resolution,
concurrent completion and rollback after Maintenance writes, retaining repair exclusions.
Selection remains visible across searches; stale pages cannot cross reference types.

Manually inspected generated desktop/narrow renders, including
`/private/tmp/iop-199-information-1440.png`, `iop-199-safety-375.png`,
`iop-199-success-375.png` and `iop-199-personal-journal-1440.png`. Browser checks
found no horizontal overflow or runtime/page errors. Final runner logs are in
`/private/tmp/iop-199-{full-test,database-test,e2e-final,typecheck}.log`.

## Closure

All item criteria are met; canonical documents and contracts are synchronized.
Validated implementation commits: `5869a72` (API/source transactions) and `f20ea36`
(browser/workspace/documentation). This record completes the local delivery.

No operator data or private configuration was changed; no migration is required.
Read state remains browser-local. The optional legacy demo writer needs separate
authorized adaptation to the new category rules. At implementation closure no
activation or publication had occurred. The owner approved integration, both pushes
and local activation on 2026-10-09; see the [publication/activation evidence](IOP-199-publication-activation-plan.md).
No stage/master promotion or shared deployment is implied.

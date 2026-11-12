# IOP-235 — Schedule edit/preview repair

Status: Completed. Branch `fix/IOP-235-schedule-edit-preview`, from develop `735024c`.
[Authorized scope](../items/IOP-235-schedule-edit-preview.md).

## Findings

The deployed `735024c` release is current and its complete CI passed. The reported
person has a saved Tuesday late schedule/duty. Changing that draft to middle makes
`checkScheduleChange` reject the retained late duty during `prepareProposal`, so
preview never renders. The same preservation rule blocks normal saves. The editor
also hides viewing until changes exist, and its refresh intentionally retains
draft revisions without offering an explicit reload/discard recovery.

## Steps and files

1. API Workforce domain/application: add pure duty-following rules and a bounded
   in-memory proposal transaction view over the existing port. An explicit
   `replanAssignments` proposal mode prepares full-shift duty moves and removals,
   validates the final schedules/duties together, and returns issues without
   writes. Save uses the same preparation and expected dependent-duty revisions
   and writes the complete validated proposal in the existing scoped transaction.
   Keep default/legacy weekly saves and import behavior strict.
2. Extend existing proposal DTOs/OpenAPI and generated browser contracts with
   assignment revision tokens, proposed changes and actionable preview issues.
   Allow an empty changed-week list for no-write viewing only.
3. Browser Workforce domain/application/HTTP/React: enable View schedule, submit
   the explicit mode and returned revision tokens, render intended duty changes
   and blocking issues, and offer reload of saved schedules. Update English/German
   resources and relevant Workforce guides using the shared presentation system.
4. Add regressions for the screenshot's shift change, no-write and no-edit viewing,
   atomic save/removal, stale dependent duties, custom intervals, phone conflicts
   and cross-person proposals. Add actual PostgreSQL transaction coverage and
   focused browser flows, including narrow layout. Run API npm test, web/build,
   contract and architecture checks, then the complete hosted CI before release.
5. Refresh the private remote backup, commit and publish the story/develop under
   continuing authorization, wait for the Railway deployment, and verify the
   original real-person preview through the scoped application without writing
   that test proposal. Record evidence and close item/plan/backlog.

Ownership remains within Workforce. Pure rules and application preparation depend
only on owned models/ports. Existing PostgreSQL locking, current authorization,
revision/audit writes and retained historical records supply persistence behavior.

## Validation before publication

- API `npm test`: 55 suites, 572 tests passed, including final-state cross-person
  phone swaps, custom/phone issues, stale dependent revisions and retained strict saves.
- Web weekly/localization/design regression: 3 suites, 12 tests passed. Production
  web build and generated OpenAPI/browser contract check passed.
- PostgreSQL handover/Workforce integration: 27 tests passed in an isolated container;
  the extended move/training-removal test also passed after correcting its assertion
  to the existing nested history response. Planner authority and retained removal
  history are verified against actual PostgreSQL.
- Chromium: both desktop 1440px and mobile 375px scenarios passed, including viewing
  without changes, reviewed assigned-shift save and subsequent multi-person preview.
  Inspected both synthetic screenshots; tables scroll inside bounded viewports.
- Fresh private Railway backup created before publication; archive listing checked.
  Baseline: 2,812 Workforce records, 3,714 revisions, 167 analytical publications.
  Private backups, credentials, reproduction snapshots and helper scripts are ignored.

## Published and verified

- Source commit `db41eb6` was fast-forwarded into develop and both story/develop
  refs pushed to origin under the continuing online-fix authorization.
- [Complete hosted validation and deployment](https://github.com/Industrial-Operations-Platform/iop-platform/actions/runs/43298322961)
  succeeded: 573 API tests, 323 web tests, 339 PostgreSQL tests, 115 Chromium
  scenarios, script/secret/design/contract checks and all four container builds.
  The Railway image also passed its synthetic migration/authentication exercise.
- Railway deployment `466b7cae-3b51-4fcd-be39-3a0ae7476024` reports SUCCESS.
  The public revision is `db41eb61c1ef3511925c8a828ecae659c98036c0`.
  HTTPS web/API, password authentication and anonymous-business-access denial
  passed. Served JavaScript contains View schedule, assignment changes and the
  explicit replanning request mode.
- Reproduced the reported November 10 late-to-middle draft using the running
  Workforce application and current scoped Administrator and Team Leader grants.
  Preview returns `canSave: true`, zero issues and one Halle B Sh assignment move
  from 13:45–23:00 to 08:45–18:00. Empty-week viewing returns equal saved/proposed
  loads and cannot save. No real-person test proposal was committed.
- Before/after live boards and database counts match: 2,812 Workforce records,
  3,714 revisions and 167 analytical publications. Rechecked all 300 November
  date/Halle/early-late cells: zero gaps, zero overlapping technicians, all 501
  original revision snapshots retained and Task Force middle-only work preserved.

Item/backlog synchronized and plan archived. No schema migration or architectural
exception was needed. Private evidence and protected backup remain outside Git.

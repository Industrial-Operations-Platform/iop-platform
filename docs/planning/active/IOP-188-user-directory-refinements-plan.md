# IOP-188 — User directory controls and current operational names

Status: In progress

Authorization: [owner request](../items/IOP-188-user-directory-refinements.md).
Branch: `feature/IOP-188-user-directory-refinements`, created from integrated
`develop` at `eb50f48` after the approved IOP-187 publication/activation.

## Changes and steps

1. Shared presentation and Handover React adapters: readable table captions where
   they stand alone; remove duplicate visible captions in titled collections while
   retaining accessible table names. Center matrix dates and reserve compact
   widths for date/status/reference/person fields, leaving prose more room.
2. Access feature: framework-free search and multi-criterion sort selection, with
   localized labels/comparison supplied by the React adapter; reuse SortableHeader.
   Add a shared labelled EditButton and compact static name/username presentation.
   Update English/German resources and existing administration/browser tests.
3. API Workforce/Handover application read models: resolve current names via narrow
   ID lookup ports supplied by Users/RBAC through the host composition root. Keep
   existing active-person selection separate. Handover latest-update actors resolve
   through retained revision actor IDs, including existing entries without an actor
   ID in the update preview. Keep stored business snapshots/revisions unchanged.
   Expected files: application/adapter ports, Users/RBAC `site-people.ts`, host
   `runtime.ts`, API unit fixtures and PostgreSQL handover/workforce integration test.
4. Verify current names for renamed, inactive and deleted profiles and scope-safe
   fallback; show revisions retain original names. Run API `npm test`, frontend
   tests/build, existing database integration suite and relevant browser journeys.
5. Update canonical identity/operator/Workforce/Handover guidance, including the
   owner-authorized current-read clarification in ADR-0035. Check links/statuses,
   archive this plan, and commit validated increments locally.
   Refresh the integration fixture migration count for the existing display-name
   migration; use an isolated browser preview port because 3000 is occupied.

Ownership: Access owns directory selection, Workforce and Handover own their read
models and ports, Users/RBAC owns scoped identity lookup, host composes adapters,
shared design owns reusable controls. Existing accepted dependency patterns apply;
no schema migration, permission expansion or new architectural pattern is planned.
Audit views already join profiles by ID; imports retain stable submitter IDs.
Inspect and retain those paths. Historical revisions remain evidence, not mutable directory data.
Read contexts are English; no translation edits are required.

## Validation and evidence

- `npm run typecheck`: API, web and database TypeScript pass.
- Root `npm test` built API/web/database, checked the unchanged API contract, and
  passed 18 script checks plus 342 API tests. Its initial frontend failure was an
  assertion querying an aria-hidden sort arrow; the corrected frontend rerun
  passes all 92 tests. `npm run db:test:unit` passes 77 configuration tests.
  Local-socket tests were rerun with the required sandbox permission after EPERM.
- The real PostgreSQL Handover/Workforce suite passes 12 tests, including its real
  browser journey and the new rename/inactive/deleted/scope-isolation regression.
  Its old migration-count expectation was updated from four to five for the
  already-existing display-name migration; no migration was introduced here.
- Seven intercepted-HTTP browser journeys pass: account/Workforce at 1440/375px,
  Handover at 1440/820/375px, analytical comparison at 1440/375px. The account fixture
  now projects renamed users by ID and exercises search, sort cycling, explicit
  editing, Weekly plan and details. The API/database tests prove actual persistence.
  The two account cases were rerun after correcting their initial-name fixture;
  the other five passed on the first isolated-port run.
- Visual review: `/tmp/iop-188-users-{1440,375}.png` and
  `/tmp/iop182-matrix-1440.png`; compact adjacent account labels, clear edit/delete
  controls, centered dates and one collection title. Mobile tables remain scrollable.
  Preview uses isolated port 4176; the existing service on 3000 was left running.
- Build retains the existing bundle-size advisory. No API/schema/permission change.

Local logs: `/tmp/iop-188-{tests,web-tests,database,db-unit,typecheck,browser,browser-users}.log`.
Documentation/link consistency and final commits remain to be recorded.
New IOP-188 publication/merge and activation require review approval;
the preceding approval has already been fulfilled for IOP-187.

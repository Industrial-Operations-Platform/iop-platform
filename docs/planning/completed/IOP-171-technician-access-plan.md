# IOP-171 execution plan

Status: Completed. Branch: `feature/IOP-171-technician-access` from `develop`
(`8575856`). Scope: [item](../items/IOP-171-technician-access.md).

1. Users/RBAC owns the profile assignment change. Add a scoped migration that deactivates
   existing Technician analytics-reader assignments only; preserve handover roles.
2. Host session composition exposes current analytics capability independently from
   import capability. Avoid requiring analytics.read merely to open a valid session.
   Existing receiving modules keep their per-operation analytics checks.
3. Access/analysis domain session models and React adapters consume the capability to
   hide entry points and avoid home analytics reads. No framework enters application rules.
4. Update ADR-0035's owner refinement, contract artifacts, operator documentation and
   tests. Validate root npm test, scoped real PostgreSQL authorization/migration and
   browser scenarios, links/whitespace/secrets. Complete plan and local commit.

Expected files: Users/RBAC profiles, host runtime/controller/contracts, web session models,
WorkspaceApp/StartOverview, generated OpenAPI/schema, migration and affected migration
counts, API/web/database/browser tests, ADR/operator docs and planning records.
No live account edits, publication, merge or Docker update without approval.

Validation updates the migration-history and rollback-fixture expectations for the
new migration. The existing meeting browser scenario used the current date as an
assumed empty day; select a fixed day outside its fixture history so it remains
independent of when the browser-created report is recorded.

## Validation and outcome

- Root `npm test` passed: secret checks 18, API 321 (including architectural boundaries),
  web 66 and database configuration 77. Production builds and API/browser contract
  generation/check passed. Final web build also passed after preserving existing formatting.
- Disposable PostgreSQL suites `shift-handover|transitional-access|database.spec`:
  3 suites, 23 tests passed. Verify 14 migrations, repeatability/rollback fixtures,
  existing Technician grant removal at the exact profile site, no grant changes at
  another site, temporary migration policies removed, and unchanged other profiles.
- Tests cover profile changes/reactivation, session context without analytics permission,
  and real-browser Technician Start without analytical requests/links. Direct availability
  and report API calls return 403; journal publication/follow-up still works. Existing
  browser workflows verify other profiles and mobile handover navigation.
- Inspected `/tmp/iop-171-technician-start.png`: Start and Shift Handover navigation,
  operational highlights and no analytical section. No live accounts were modified.
- Initial integration failures were stale migration metadata expectations and the existing
  browser test's assumption that the current date had no entries; corrected fixture data
  and reran all three suites successfully. Logs: `/tmp/iop171-tests.log`,
  `/tmp/iop171-database-final.log`, `/tmp/iop171-web-final-build.log`.
- Scoped documentation links, mirrored status/ID, whitespace and staged secret hygiene
  checked before commit. Existing Vite bundle-size advisory remains outside scope.

No merge, push or Docker update. Before publishing the combined IOP-169/170/171 result,
retain this capability restriction in the effective Technician layout preview and keep
IOP-169's bounded imported equipment picker available through handover permissions.
These integration points are explicitly recorded because those review branches remain
unmerged; their implementation is not silently imported into this independent story.

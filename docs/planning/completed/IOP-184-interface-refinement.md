# IOP-184 — Interface and account refinement

Status: Completed. Branch: `feature/IOP-184-m6-workforce`.

The owner explicitly requested this follow-up without confirmation: improve the
account/language header, standardize refresh and department controls, align
Workforce details with Shift Handover, repair detail navigation, allow self/admin
name editing and update the local Docker application. Continue on the existing
unmerged final M6 branch; no merge or publication is included.

## Delivered

- Shared title-first `PageHeading` and breadcrumb `SectionHeading`; removed the
  eyebrow API. Workforce detail returns from section/subsection links and repeated
  sidebar selection while preserving its chosen date. No Close button remains in
  Workforce detail. Saved record facts and revisions use labelled fields.
- Compact globe + DE/EN language control, emphasized account name/role, name-edit
  dialog and quiet logout action. Login uses the same top-right language control.
- One icon-only `RefreshButton`, including accessible labels/titles, busy and
  reduced-motion handling. Aligned date/actions and fixed history loading state
  so the shared refresh control becomes available in data administration.
- `DepartmentScope` reused by Start and Shift Handover, with a white outlined
  surface and dark typography. Responsive header respects the fixed sidebar until
  the existing mobile breakpoint. Conventions are recorded in the component
  README and visual identity for future sections.
- Scoped `POST /api/v1/users/name`, English/German name dialogs and admin editing.
  Users/RBAC validates names, gates self editing on an active scoped profile and
  gates other-user editing on current administrator authority. Writes retain
  before/after audit records. The additive migration grants only the display-name
  column; provisioning validates the grant against installed migration history.
  IDs, usernames, sessions, roles and historical entry snapshots stay intact.

## Evidence

- `npm test`: 18 secret checks, 339 API tests, 84 web tests and 77 database
  configuration tests passed, including build, generated contract comparison,
  architecture checks and localization/design guards.
- `npm run typecheck` passed. PostgreSQL database/access suites: 17 tests passed,
  including migration reruns/rollback, live login flows, self/admin edits,
  cross-organization and disabled/deleted-profile denial, session continuity and
  retained name audit. Updated migration-count fixtures for the additive migration.
- Live local browser: own name persisted after reload; an administrator edited
  another name; technician cross-user editing returned 403. Test names were
  restored. Existing Workforce record snapshots matched before/after rename.
  Breadcrumbs and repeated sidebar selection returned from detail, preserving
  date. English/German switching and accessible icon-only reloads worked. No
  JavaScript errors or page overflow at desktop/mobile sizes. Screenshots are in
  `/tmp/iop-refine-browser/`; additional header/department checks cover tablet sizes.
- API, web and setup images rebuilt; exactly one local database migration applied,
  scoped privileges validated and API/web activated. No reseeding, account removal
  or business-data edits were performed. Browser name checks added retained audit
  records; original names were restored. Existing Vite bundle-size warning remains.

Related: [story](../items/IOP-184-m6-workforce.md),
[visual identity](../../design/visual-identity.md),
[operator notes](../../development/workforce.md),
[authentication decision](../../architecture/adr/ADR-0035-transitional-authentication.md).

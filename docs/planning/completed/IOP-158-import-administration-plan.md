# IOP-158 execution plan

Status: Completed
Branch: `feature/IOP-158-import-administration`, from develop at `1d11ac7`.
Context: [IOP-158](../items/IOP-158-import-administration.md).

1. Separate administrator navigation from report rendering/requests in Workspace.
2. Extract reusable import review and preparation components. Compose upload/history,
   preparation and KPI settings as distinct administrative sections; mount editors
   separately so each reads the current shared profile version.
3. Preview filename date/size in the integration presentation adapter; require date
   confirmation and flag known successful date claims. Server remains authoritative.
   Expose existing inspection fields and diagnostics without changing import contracts.
4. Add navigation/import regressions, run web checks and required API tests; verify
   local Docker UI without importing or modifying owner data. Synchronize operator,
   scope and delivery documentation, record evidence and commit locally.

Expected files: web React workspace/import/preparation/review components and tests;
shared navigation disabled state and import form layout;
operator/product and planning docs. No migrations, new architecture or identity changes.
IOP-157 remains unmerged and unpublished pending owner authorization; no integration
or publication is authorized by this new request.

## Validation

Completed on 2026-09-27:

- Extracted ImportWorkspace, ImportReviewPanel and ProfileEditor. Administration opens
  import tools directly; no report effect runs there. Taskforce keeps report controls.
- Shared ViewNavigation supports disabled items during uploads. Existing tokens,
  controls, surfaces, metrics and tables retain their appearance; the upload form
  uses a responsive vertical layout for metadata/date/validation feedback.
- Preparation and KPI editors mount separately and read fresh profile versions;
  KPI configuration is available without any successful imports.
- `npm test` built API/web/database and checked the browser contract; 18 script
  tests and 53 web tests passed. API listener tests hit sandbox `EPERM`; rerunning
  `npm test --workspace @iop/api` with local-listener permission passed all 287 tests
  across 18 suites. `npm run db:test:unit` passed all 77 configuration tests.
- Component coverage includes date confirmation/reset, invalid calendar dates,
  existing duplicates and server duplicate races, partial/truncated inspections,
  unknown counts, interrupted-upload history refresh, latest-profile settings and
  administration without report requests or existing history.
- Docker frontend rebuilt successfully. Read-only Playwright audit verified 78
  historical imports, a 681-row inspection, duplicate blocking, date confirmation,
  both configuration sections and return to Taskforce. Zero report requests while
  administering, zero uploads/settings writes and zero page errors. Desktop/mobile
  screenshots inspected; no viewport overflow at 1440/1024/768/390 px.
- Final whitespace, indexed Markdown links and secret hygiene checks passed.

No backend contracts, database schema or persisted owner data changed. IOP-157
remains intact on its pending branch; this independent story does not publish it.
IOP-130 owner usefulness acceptance remains open.

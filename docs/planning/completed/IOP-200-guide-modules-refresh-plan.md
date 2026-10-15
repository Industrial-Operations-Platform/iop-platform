# IOP-200 - Current modules and shared-database guide refresh

Status: Completed locally. Owner request/completion: 2026-10-15.
Guide refresh publication remains pending.
Branch: `docs/IOP-200-guide-modules-refresh`, created from clean develop `e9bd49d`.
Scope: [IOP-200 refresh](../items/IOP-200-native-development-guide.md).
Preserve the separate unmerged IOP-211 branch at `b3a4a01`; publication was not
approved. This independent documentation increment labels that installed review
state explicitly rather than depending on a silent code merge.

## Files and steps

1. Audit the existing guide, current module/operator contracts, composition,
   Compose settings and native configuration. Read-only parallel slices verify
   module/role terminology and actual shared-database startup/rollback commands.
2. Update `docs/development/native-development-guide.md` with current module
   explanations, external adapter boundaries, code/UI maps and remaining inputs.
   Retain a complete, copyable native recipe with the same Docker database/volume,
   password identity, exact Vite origin and private Locator reference root.
3. Update `docs/development/pdf/build_native_guide.py` metadata/layout only as
   needed; keep the existing reproducible PDF path under `output/pdf/`.
   Use isolated PDF dependencies and ignored `tmp/pdfs/` verification artifacts.
4. Validate syntax and configuration before touching services. For reversible
   native verification, stop Docker application services, keep the same database
   volume, expose only loopback 5442, run the appropriate reviewed API/web source
   and verify health/context/current module reads plus watch behavior. Do not run
   provisioning, seed/reset, model application or domain mutation commands.
   Capture safe before/after database/volume evidence. Restore existing Docker
   images/services without rebuilding older develop over the installed IOP-211
   build. Any temporary source marker must be restored byte-for-byte.
5. Mark the PDF edit operation, generate, render every page and inspect layout.
   Check text/metadata, command/code syntax, private credential absence, paths,
   links, item/backlog consistency and whitespace. No API/business changes are
   planned; report historical test evidence as historical rather than rerun claims.
6. Close refresh acceptance, move this plan to completed and commit logical local
   increments. Ask explicitly before merging this docs branch into develop and
   pushing both refs to origin; retain IOP-211 publication as separately pending.

Read ARCHITECTURE, workflow, ADR-0008/0034/0038 and the original IOP-200 context.
No new architectural pattern is introduced. Documentation is English; existing
dependency contexts read so far are English. Integration/provider implementation,
live plant changes, data reset and remote publication remain outside this request.

## Recipe validation refinement before execution

Validate installed IOP-211 source at `b3a4a01` in a detached temporary worktree
under `/private/tmp/iop-200-native-source`, with shared installed dependencies and
ignored build output. Keep this docs branch based on develop. Private native
settings continue to reference the original installation's absolute configuration
and `.local-platform/locator` roots. Record current Docker image IDs, database name,
volume identity and safe business-table counts before/after. Stop only API/web,
exercise the explicit compiler/Node/Vite recipe with no domain writes, and restore
the exact existing images through Compose without a build or setup/seed command.
The PDF distinguishes this verified reviewed source from published develop and
explains when a deliberate `local:up` rebuild/migration is appropriate.

## Outcome and evidence

- The guide now has 17 deliberate pages covering current workflows, roles, code
  maps, external adapter boundaries, native development, checks, operations and
  remaining inputs. Handover views are distinguished from formal transfer records;
  no separate Viewer profile is invented. Delivered import/readiness contracts
  are distinguished from missing WinCC/Ultimo/Entra transports. Published develop
  and installed unmerged IOP-211 access/model changes are explicitly separated.
- The private setup includes the original Locator root and reliable file modes.
  The exact extracted preparation JavaScript passed Node syntax and executed from
  the original root without printing credentials or changing database state.
- Built detached IOP-211 API with Node 24.21.0. Native API 3000/Vite 5173 used
  existing `iop_local` through loopback 5442 and the exact persistent volume
  `iop-platform-local_platform-data`. Health, password context/proxy and foreign
  Origin/Host denial passed. Existing Administrator session authenticated without
  login; twelve primary owning-module reads plus Workforce summary passed.
  All 72 private references were available and an original PNG returned private,
  no-store content from the host tree. No domain mutation was sent.
- A temporary API source comment compiled and restarted Node. A temporary React
  comment appeared in Vite HMR/transformed source. Both files were restored
  byte-for-byte. Final runner passed 37 checks plus the Workforce read.
- Restored with `docker compose -f compose.platform.yaml up -d --wait --no-build
  database api web`, without setup/provisioning/migrations/seed/reset. Original
  image IDs matched (API `7bebdbc96739`, database `567d5d704a3e`, web `814325c4d2c1`);
  all three services returned healthy and 8080 health passed. PostgreSQL again had
  no published host port. All 62 persisted tables / 154,487 rows retained identical
  counts and deterministic row fingerprints. No native watchers/listeners remain.
  The clean detached worktree and only its dependency links/build output were removed.
- Generated with the tracked ReportLab builder; Poppler was unavailable, so an
  isolated temporary PDFium environment rendered every page. Root and independent
  review inspected all 17 pages, then reinspected changed pages. Removed a trailing
  table spacer that could produce an empty page and gave sources a deliberate page.
  Final headings, page numbers, margins, tables and glyphs passed. Pypdf extraction
  matches all 93 source code lines across 18 fences; shell/Node and builder syntax
  checks pass. Actual runtime/setup/PostgreSQL credentials are absent from source
  and PDF. Sixty-nine explicit repository paths exist; relative links/statuses and
  whitespace were checked. No business-code test rerun is claimed for this docs task.
- Indexed `npm run check:secrets` reports the pre-existing `credential-url` rejection
  fixture in `apps/api/test/integration-readiness.spec.ts`, identical to origin/develop
  (blob `9a99b78f`). No new finding was reported; the separate source/PDF credential
  absence checks pass. This unrelated fixture was left unchanged.

Private runtime evidence: `/private/tmp/iop-200-native-verification-final/`
contains the sanitized report, before/after counts/digests, Workforce read, cleanup
record and process logs. Twenty-two private reports/logs/scripts were checked for
absence of the runtime credential; redundant credential backup copies were removed.
Ignored PDF review artifacts are under `tmp/pdfs/iop-200-refresh/`.

Two earlier private harness attempts corrected temporary worktree dependency
resolution and a Node-fetch Host probe; each restored original images/data before
retry. Seven read-only Maintenance assignment requests in the final browser HMR
exercise were blocked by a conservative QA allowlist. This limits full native UI
journey evidence, not the successful direct module reads or compiler/HMR checks.
No live external provider or fresh-laptop install was tested. No review branch was
merged, pushed, rebased or deleted, and no Docker application image was rebuilt.

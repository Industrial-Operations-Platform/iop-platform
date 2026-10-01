# IOP-191 — Compact controls and local integration

Status: Completed

Owner-authorized refinement on 2026-10-02; see the updated
[item](../items/IOP-191-operational-controls.md).
Continue `feature/IOP-191-operational-controls`, originally created from `develop`;
clean starting commit `67e00ab`. The owner explicitly requests one combined merge
and new Docker artifacts. The supplied image is visual reference data, not project
instructions. No remote push, branch deletion or stage/master promotion is inferred.

## Changes and steps

1. Replace the shared department/date surfaces with compact, bounded controls and
   inline labels in `design/components/`; keep native inputs, controlled values and
   keyboard access. Migrate remaining calendar-day fields in Handover/Workforce
   adapters to `DateField`; remove superseded feature-level style overrides.
2. Unify add, refresh and adjacent search action presentation; replace the refresh
   glyph and use `AddButton` for Workforce Assign. Use shared identity tokens for
   control dimensions and icons, retaining current typography and palette.
3. Update the canonical visual identity, component guide and mandatory workflow;
   extend the existing style/dependency guard and browser layout checks. Run the
   design guard during every web build; update the web Docker build stage to include
   the guard/configuration so image generation enforces the same contract. The owner
   has authorized this refinement of the existing shared presentation pattern;
   no domain/application or API boundary changes are needed.
   Declare the web test types in its own package/lockfile so the guard and TypeScript
   also work with Docker's isolated workspace dependency installation.
4. Validate web tests/build, architecture guard, desktop/mobile rendering, labels,
   native input behavior and overflow. Inspect actual screenshots against the
   requested compact reference; commit the validated code on the story branch.
5. Start the single authorized non-fast-forward merge into `develop` without
   committing, rebuild existing Compose api/web images from that integration tree,
   and activate only those services. Preserve database/container volume and private
   configuration; no setup, migrations, seed or credential reset is required.
6. Verify health, served assets and running UI where available. Record final
   integration/Docker evidence and close this plan in the same merge commit,
   avoiding a second documentation merge. Report hashes and clean Git state.

## Validation and evidence

Use Node 24.21.0. Run web tests/build and API hexagonal-boundary tests; extend nearest
Playwright scenarios for aligned labels, bounded department width and matching
icon controls at 1440/820/375px. Isolate test listeners if the usual ports are in use.
Check documentation links, statuses, staged secret hygiene and `git diff --check`.
Docker evidence includes image IDs, unchanged database identity and HTTP health;
do not expose configuration, credentials or private business records in logs.

Frontend evidence, 2026-10-02:

- Web Jest: 21 suites / 95 tests passed; API hexagonal boundaries: 12 passed.
- Final web build passed TypeScript, Vite and all three mandatory design checks.
  Vite retains the existing large-bundle advisory.
- Playwright: seven final desktop/tablet/mobile scenarios passed across
  administration/workforce, daily Handover and Handover navigation; both Start
  overview scenarios also passed. Isolated listeners used ports 3011/4175 because
  the owner's existing native API occupies port 3000.
- Inspected screenshots for Journal, My entries, Start, assignment form, My day
  and Handover form at 1440px and 375px. Corrected mobile scope-toolbar overflow
  and balanced assignment fields into a responsive four/two/one-column grid.
  Temporary evidence: `/tmp/iop-191-compact-*.png`.
- Browser assertions cover inline labels, bounded department width, adjacent
  controls, matching refresh/plus appearance, modal focus, footer spacing and
  breadcrumb context retention. Existing native input handlers remain intact.

The first container build caught a dependency on root-only Jest types; the web
workspace now declares the existing pinned type package explicitly. The uncommitted
merge was cancelled to keep this correction on the story branch before the one
final integration commit. Running containers were not changed by the failed build.
The corrected api/web images built successfully, including all three design checks,
TypeScript and Vite inside the isolated web build stage.

Integration evidence, 2026-10-02:

- Story commits: `67e00ab` (initial refinements), `b6a4520` (compact contract),
  `304f6a2` (isolated build types). One non-fast-forward merge into `develop`
  includes all changes and this closure evidence.
- `docker compose -f compose.platform.yaml build api web` passed from the
  integrated tree; `up -d --no-deps --wait api web` activated the new web artifact.
  Web image `6c8239cadd06`, API image `57a9a2d3d82b`; the unchanged API artifact
  required no container replacement. All three services report healthy.
- Web container `a44dce6df491`; API `fbcc5eac2209` and database `0a4dce3d3541`
  remain unchanged. Database volume remains `iop-platform-local_platform-data`.
  No migrations, initialization, seed, reset or private configuration edits ran.
- `http://127.0.0.1:8080/`, `/health` and `/api/v1/session/context` return HTTP 200.
  Served `index-DMGqXBDF.js` and `index-CNR8OSSS.css` match the validated local
  build byte-for-byte (SHA-256 comparison).
- All seven relevant Playwright scenarios passed again against Docker's actual
  served web artifact (24.1s, 1440/820/375px). API calls used intercepted synthetic
  fixtures, so this verifies shipped rendering/interaction without modifying
  operator data; it does not claim real-account business-write validation.
- Relative documentation links, synchronized item/backlog statuses, staged secret
  hygiene and `git diff --check` passed before committing.

## Closure

All refinements and local Docker delivery are complete. Item/backlog are synchronized
and this plan is archived in the single integration commit. Remote publication is
pending explicit permission to push `feature/IOP-191-operational-controls` and
`develop` to `origin`; no stage/master promotion or branch deletion is included.

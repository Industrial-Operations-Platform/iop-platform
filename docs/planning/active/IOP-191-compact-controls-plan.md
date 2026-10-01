# IOP-191 — Compact controls and local integration

Status: In progress

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

Local integration and Docker verification remain pending at the story commit.

## Closure

Complete all authorized refinements, local merge and Docker update, then synchronize
item/backlog and move this plan to `completed/`. Ask separately before pushing
`feature/IOP-191-operational-controls` and `develop` to `origin`.

# IOP-148 — Executive Overview refinement

Status: Completed. Branch: `feature/IOP-148-analytical-workspace`, continuing the
unpublished story originally created from develop. Owner request: 2026-09-27.

## Scope and steps

1. Replace general report counters with Executive Overview prioritization KPIs:
   highest-frequency sector, equipment and error, and highest-duration area.
   Show each leader's share of the complete filtered total, independent of chart
   grouping/pagination. Compute leaders in the existing authorized SQL snapshot.
2. Keep KPI cards exclusively in Executive Overview; show import volume in the
   file review. Remove the Pareto template and defer that feature to a later
   Executive Overview increment. Keep the existing investigation templates.
3. Centralize the current presentation palette/style tokens for React and ECharts;
   document stable visual identity without redesigning the workspace.
4. Configure only Administrator in the local POC launcher/current reference demo.
   Preserve generic authorization and third-party authentication boundaries.
5. Synchronize scope, operator guide and story evidence; validate and commit.

## Files and validation

- OIP report domain/PostgreSQL adapter, HTTP DTO/generated contract: actual-role
  database assertions for complete filtered leader totals, zero/empty selections,
  deterministic ties and independence from grouping/page; API unit/contract tests.
- Analysis domain/presentation/chart adapters, shared design tokens and documentation:
  frontend type/build/tests and browser import → overview → investigation checks,
  including absent Pareto/KPIs elsewhere, administrator access and responsive visuals.
- `scripts/demo.cjs`, operator/scope/planning docs: single default administrator,
  preserved existing database identities, documentation links/status consistency.

No new architectural pattern: use Accepted ADR-0031/0032 ports and adapters.
No invented downtime, failure rates, event timestamps or targets. Publication stays
pending separate owner approval; prior completed execution records remain historical.

## Evidence and outcome

- API: 277 tests pass, including HTTP contracts and hexagonal dependency checks.
  Frontend: 26 tests pass; API/web/database type checks, builds and generated browser
  contract check pass. Secret-tool tests: 9 pass; database configuration: 77 pass.
- Actual PostgreSQL: 6 reporting cases pass. Leader totals remain identical across
  all grouping dimensions, measure changes and an empty displayed row page;
  filters, empty/zero totals and deterministic ties are covered. The first tie
  expectation was corrected to the configured `Nicht klassifiziert` label.
- Complete analytical POC suite: 9 cases pass, including browser uploads, file row
  counts, six templates, no Pareto, KPI absence on investigation/import views,
  drill-down, zero-value placeholders, palette values, resize, reload and recovery.
  Its existing lifecycle cases must run together; isolating the browser test skips
  a required host reset. The first sandboxed API run could not bind test listeners;
  the API suite passed with local listener permission.
- Running reference installation exposes only Administrator. Its existing three
  files and 1,446 admitted rows remain intact. The private selector allowlist was
  narrowed; database principals/grants were not deleted. Both launchers now create
  one Administrator by default; existing configuration migration is documented.
- Real-browser review: desktop 1590px and mobile 390px, all templates, KPI click
  filters, import review and no client errors. After chart resize, mobile content
  fits the viewport. Screenshots inspected under `/private/tmp/iop-148-executive.png`,
  `/private/tmp/iop-148-executive-mobile.png` and `/private/tmp/iop-148-import-volume.png`.
- Independent CSV aggregation agrees: highest-duration area `Kon. & Auslagerloop`
  has 297,931 seconds (18.28%); equipment `=15+15.42.09-A207` has 256 occurrences
  (3.01%); error `Lichtschranke zu lange belegt` has 1,693 (19.93%). Hall B Sky has
  3,009 occurrences (35.42%). Percentages use the complete filtered denominator.

No storage migration or authentication-boundary change was needed. Visual identity
is canonical in `apps/web/src/design/identity.ts` and `docs/design/visual-identity.md`.
Pareto is deferred, not a hidden active feature. Owner usefulness acceptance remains
separate in IOP-130; this is completed technical delivery, pending publication approval.

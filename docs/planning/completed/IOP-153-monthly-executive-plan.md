# IOP-153 — Monthly executive delivery

Status: Completed
Branch: `feature/IOP-153-monthly-executive`, from clean develop at `6347878`.
Item: [IOP-153](../items/IOP-153-monthly-executive.md).

## Scope and implementation

1. Review existing report/profile ports, one-snapshot PostgreSQL aggregation,
   generated contracts, scoped presets and shared presentation components.
2. Extend versioned reporting configuration with bounded KPI definitions/optional
   goals, backward-compatible with saved profiles. Reuse current authorization,
   profile persistence and compare-and-swap; no separate persistence mechanism.
3. Compute monthly/global measures and coverage server-side in the report snapshot;
   domain logic derives averages and lower-is-better comparisons. Keep customer
   message labels in scoped presets, never generic domain defaults.
4. Replace Executive Overview composition with reusable month selection, ranking,
   sorted daily heatmap, overlaid trend and comparative KPI cards. Keep the existing
   palette and component system; add semantic green/red states and textual meaning.
5. Test denominator/goal/zero/missing-data behavior, actual-role PostgreSQL and browser
   journey, contract generation and desktop/narrow rendering. Rebuild the local
   Docker app without resetting history. Update scope, identity and delivery evidence.
6. Commit validated changes locally; publication requires explicit approval.

Expected files: OIP domain/application/report/profile adapters, host DTOs, scoped
reporting presets, frontend domain/gateway/application/React/ECharts and shared
components, corresponding unit/integration tests, generated contracts and canonical
product/design/planning docs. New behavior follows Accepted ADR-0031/0032/0033;
record product semantics without inventing additional architecture or owner approval.

## Confirmed KPI scope

The owner clarified that every KPI selects a Meldetext and can be added, removed
or given an optional goal by an administrator. Use daily averages over imported
dates for both the selected month and all history (including the selected month);
show that denominator and goal unit explicitly. Unimported dates remain gaps,
covered dates without that error count as zero, and goals override the historical
reference. Configuration order is preserved.

## Validation and outcome — 2026-09-27

- `npm test`: build and generated contract check passed; API 282 tests, web 40,
  database configuration 77 and script tests 18 passed. API tests require local
  listeners, so the sandbox-only run was repeated successfully with that access.
- Final `npm test --workspace @iop/web`: 41 tests passed, including add/remove,
  exact Meldetext selection, zero goals, changed measure, failed-save recovery and
  comparison accessibility. Shared components retain enforced dependency boundaries.
- `npm run test:database`: 12 suites / 174 tests passed. Real PostgreSQL verifies
  month/global averages, duration conversion, goal precedence, configured ordering,
  missing coverage, old profiles, scope isolation and stale-write protection.
  The real browser journey verifies persistent settings, goal changes, month
  navigation, import/detail views, reloads and responsive layouts.
- `npm run local:up`: rebuilt frontend/API, healthy services; seed reconciliation
  confirmed 42,220 rows, frequency 212,411 and 56,391,042 exact seconds across 78
  dates. Zero dates imported and 78 unchanged; the existing volume was preserved.
- Read-only browser/SQL reconciliation on the owner's local history passed for
  June and July, all four configured KPIs and their historical references. June
  has 30 imported days; July has 25. Reloads, settings presentation and widths
  1600/1024/768/390 passed with no page errors or horizontal page overflow.
  Desktop and mobile screenshots were visually inspected; the blue charts,
  existing surfaces and new semantic red/green variants retain identity v1.
- Updated canonical scope, operator instructions, design/component reference and
  delivery status. Markdown links/statuses and whitespace checked before commit.

The four source-scoped initial messages have no invented goals. Administrators
can replace them or remove all cards. Daily averages are the documented comparison
convention; monthly totals remain visible on each card. No new architectural
pattern, migration, dependency, login implementation or Pareto view was introduced.
IOP-130 owner-observed usefulness remains open. Publication awaits owner approval.

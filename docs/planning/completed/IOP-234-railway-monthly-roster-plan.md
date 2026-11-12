# IOP-234 — Railway monthly roster execution

Status: Completed. [Scope](../items/IOP-234-railway-monthly-roster.md).
Branch: `feature/IOP-234-railway-monthly-roster`, from develop `3a3f515`.
Owner explicitly authorizes develop publication and Railway data activation.

## Steps and files

1. Inspect the existing development scope, active profiles and November snapshots.
   Inventory: 17 technicians, 3 Task Force users; 145 schedules and 125 assignments
   across those profiles. Existing three shift definitions already permit all days.
   Reuse IOP-233's current protected remote backup; keep customer snapshots private.
2. Add bounded `scripts/railway/monthly-roster*.cjs` operator planning and runner,
   reusing current Railway target/SSH and Workforce ports. A pure preparation
   function owns deterministic evaluation choices; the explicit remote adapter
   composes existing domain/application and PostgreSQL adapters with runtime
   credentials and current scoped authorization. No direct SQL business writes,
   startup lease bypass, new API or customer logic in generic core.
3. Preview the full November plan, retain private expected revisions and snapshots,
   apply only missing days/duties, verify preserved snapshots and aggregate loads,
   then preview again to prove no pending changes. Each existing application call
   is atomic; retain progress for safe resumption without whole-month claims.
4. Add focused scripts tests, operator documentation and execution evidence.
   Commit small increments, merge/push the authorized story and develop, preserve
   other branches and close this plan after actual remote verification.

## Validation

Test repeatability, explicit profile/date bounds, all technician shift/weekend
coverage, Task Force middle choices, tombstones, existing schedules/duties and
home-zone/floating behavior. Check syntax, relevant scripts/API tests, documentation
links and whitespace. Validate on the actual Railway development data through
existing application operations. No private names, IDs, data, credentials or backup
archives enter Git. Record unavailable checks and any preserved exceptions.

Preparation evidence: scripts suite passed 103 tests (four platform skips); syntax
and whitespace checks passed. The live no-write November preview contains 455
new schedule dates and 323 duties for 20 active users. All 17 technicians receive
each configured shift plus Saturday and Sunday work in the prepared missing days;
new Task Force work uses middle only. Existing Task Force data contains 18 early
shifts/duties. A separate owner choice is pending for converting those existing
records; the authorized missing-day increment preserves them.

The first guarded apply rejected before writes: the pinned application facade
incorrectly passed a Workforce transaction to the raw SQL authorization adapter.
Correct it to use the owning transaction's current `canPlan`/`canAdminister` flags;
the outer PostgreSQL transaction already checks authority and holds the access
lease. Repreview and verify no changes before retrying the corrected adapter.

The corrected apply added exactly 455 schedules and 323 assignments; every original
snapshot remained unchanged and no missing days remain. The owner then explicitly
approved converting the 18 retained Task Force early shifts/duties. Extend the
operator with an explicit `--convert-task-force` preview/apply flag; capture exact
before records, use one current authorized transaction per person/week to logically
retire duties, update availability and restore the same duty IDs at middle hours.
Retain phones, zones, prior revisions and unrelated data; verify final revisions,
complete Task Force middle coverage and immediate rerun no-op. Add regression
coverage for the pinned port and conversion preservation before the live change.

## Live execution evidence

- Applied 455 new schedules and 323 duties through existing Workforce operations;
  all pre-existing snapshots were unchanged in that increment.
- With the owner's additional approval, converted exactly 18 Task Force schedules
  and 18 associated duties to middle hours. Same IDs, zones, duties and phone
  references remain; current revisions were verified and all 36 original revision
  snapshots compare exactly with retained history.
- Each of 17 technicians has 30 explicit November dates, all three configured
  shifts, Saturday work and Sunday work. Combined scheduled shift counts are
  early 198, late 93, middle 91, including the preserved existing week.
- Each of 3 Task Force users has 30 explicit dates and only middle working hours
  (66 middle shifts total, including three preserved Saturday work dates).
- Immediate guarded repreview proposes zero additions and zero conversions.
  Private manifests remain under `.railway/monthly-rosters/2026-11/`.
- Remote aggregate verification: 2,797 Workforce records, 2,893 revisions and the
  same 167 analytical publications. The fresh pre-conversion protected PostgreSQL
  archive is 30,466,360 bytes; its signature, SHA-256 and table list were verified.
- Six focused planning/security regressions passed. Full scripts-suite and final
  scripts suite passed: 105 tests, four platform skips. Syntax and whitespace
  checks passed. No new API or migrations.

## Publication and final verification

- Source commits `3819df4`, `a3a2b78`, `0e1a13e` and `78ee3ef` were merged into
  develop at `e1150a0`; both feature review branches and develop were pushed to
  origin under explicit owner authorization. The backlog-only merge conflict was
  resolved by preserving IOP-233's verified publication status and the IOP-234 row.
- IOP-233's complete validated release is active at HTTPS
  `https://iop-development-9fb7.up.railway.app`, revision `3a3f515`. A no-write call
  through that live release's Workforce application confirmed the server workload
  comparison for November: all 17 technicians have each configured shift and both
  weekend categories; all 3 Task Force users have middle-only work and no unknown
  dates. Before/after complete board snapshots matched exactly.
- [Run 43247883328](https://github.com/Industrial-Operations-Platform/iop-platform/actions/runs/43247883328)
  packages the later operator tooling from `e1150a0`; it was still running at this
  closure. It is not needed to apply the data, which already ran successfully via
  the explicit remote operator. No claim is made that this later container revision
  is active. The public application's feature code remains the validated IOP-233
  version; November data and scoped application verification are already complete.
- The browser host was unavailable and native browser observation stopped because
  Windows could not confidently determine the browser URL. No further UI input was
  attempted; authenticated visual verification remains unavailable. Complete CI,
  deployed revision and no-write scoped application checks supply the evidence.
- Closure documentation uses `docs/IOP-234-publication-evidence` from develop.
  Item/backlog synchronized and this plan archived. No stage/master promotion,
  branch deletion, account/password change, restore or data loss occurred.

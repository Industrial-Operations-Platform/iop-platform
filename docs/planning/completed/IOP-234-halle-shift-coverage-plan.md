# IOP-234 — Complete dated Halle and shift coverage

Status: Completed. Branch `fix/IOP-234-halle-shift-coverage`, from develop `8882f25`.
[Scope](../items/IOP-234-railway-monthly-roster.md).

## Requested correction

The owner requires technicians in each Halle and shift on every day of the
selected November month. Earlier checks counted shifts across the whole site.
Live November 12 data shows Halle A T3 with four late and zero early technicians,
Halle A T2 with four early and zero late, and Halle B Sky missing late coverage.
The site has five configured Halles and 17 technicians. The explicit required
shift set was explicitly chosen by the owner as technician early/late coverage,
with Task Force on middle hours. This needs ten technicians per day. November 15 currently has all
technicians off, so complete daily coverage also requires activating some of the
evaluation's off dates. Other November dates have 11–17 working technicians.

## Changes and steps

1. Add a focused operator planner accepting explicit configured targets/shifts and
   the requested month. Allocate one distinct technician to every required dated
   cell for the full shift interval. Prefer existing home/current zones and active
   work dates, balance extra workers within each Halle, and rotate additional work
   among eligible evaluation off dates when needed. Preserve actual absence states
   and reject insufficient capacity. Record precise before/after snapshots.
2. Reuse the existing authorized Workforce transaction and validation path for
   atomic schedule/duty conversion and new duties. Verify expected revisions,
   current profiles, settings and plan fingerprints. Existing duties may move to
   other Halles to satisfy the owner's coverage request. Retain phone references
   with their configured target, prior revisions and Task Force middle schedules.
   Keep customer labels in site configuration and this operator adapter.
3. Test every dated target/shift cell, Halles with only one home technician, off-day
   activation, absence/capacity handling, input bounds and repeat no-op. Preview
   against current Railway data, refresh the protected backup, apply and verify
   both personal schedules and exact assignment shift/target IDs on all 30 dates.
4. Record counts and remaining exceptions, commit, integrate and push under the
   ongoing online/develop authorization. Close only when all required cells pass.

## Validation

Run scripts tests, syntax, whitespace and documentation-link checks. Live evidence
must enumerate the complete date × Halle × required-shift matrix and full-interval
technician coverage, with zero gaps and no duplicate overlapping workers. Verify
Task Force hours, retained revision snapshots and unchanged analytical totals.

## Preparation evidence

The four focused coverage regressions pass, including 300/450 complete dated
cells, five uneven home groups, a Halle with one home technician, off-date
activation, phone responsibility, exact full intervals, capacity/absence handling
and immediate repeat no-op. Existing monthly/weekly operator behavior is also
included in the scripts suite.

Both live no-write options were prepared. Early/late proposes 258 affected dates,
300 covered cells and 10 activated evaluation off dates. All three shifts propose
294 affected dates, 450 covered cells and 80 activated evaluation off dates. Both
have zero proposed coverage gaps and all original board snapshots compare equal.
The full scripts suite passed 110 tests with four platform skips. Syntax and
whitespace checks passed.
The owner selected early/late technician coverage and Task Force middle hours.
The refreshed live preview contains 258 affected dates, 300 covered cells and ten
activated evaluation off dates, with zero proposed gaps. Apply this exact selected
proposal after the fresh backup. Private previews are retained under
`.railway/monthly-rosters/`.

## Applied and verified

- Owner selection recorded at `e506d3a`, following the tested source increment
  `0290e3c`. A fresh protected custom PostgreSQL archive (30,502,899 bytes) was
  exported and its archive list inspected before the selected apply.
- The complete coverage correction committed atomically through existing scoped
  Workforce operations. Updated 167 schedule rows and 258 duties, including 15
  newly created duties. Ten evaluation off dates became working availability.
- Persisted verification enumerated all 300 date × Halle × early/late cells for
  November 1–30. Every cell has at least one distinct active technician for the
  complete configured interval and compatible personal availability. Worker
  overlap checks returned zero conflicts. Task Force retains middle-only work.
- For November 12 the early/late counts are Halle A T3 2/2, Halle A T2 2/2,
  Halle A T1 2/2, Halle B Sh 1/2 and Halle B Sky 1/1. The same complete matrix
  check includes every Saturday and Sunday in the month.
- Compared all 501 original schedule/duty snapshots with retained revision
  history, with exact matches. Current Workforce counts are 2,812 records and
  3,714 revisions. All 167 analytical publications remain present.
- Immediate live repreview proposes zero additions/conversions, 300 covered
  cells and zero gaps. Private evidence includes the complete persisted matrix
  and backup manifests. The 110-test scripts suite, syntax, whitespace and
  affected-document relative links passed.

Item/backlog synchronized and this plan archived. Publish the correction branch
and develop under the owner's continuing authorization. The live coverage data
has already been applied and verified through the existing running application.

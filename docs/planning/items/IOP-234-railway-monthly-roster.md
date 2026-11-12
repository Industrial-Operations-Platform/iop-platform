# IOP-234 — Railway monthly technician and Task Force schedules

## Status and authorization

Completed, including daily early/late coverage in every Halle.
On 2026-11-12 the owner requested updating develop and the online
Railway installation: technicians should have early, late and weekend shifts;
Task Force should have middle shifts. The owner selected the entire current
month, November 2026, and agreed to preserving existing schedules/assignments.
Railway development contains evaluation data; generated days are plans, not
real attendance, payroll or a legally assessed staffing roster.

## Scope and acceptance

- [x] Use existing active Technician and Task Force accounts and configured shift
  definitions; keep all three shifts available Monday–Sunday.
- [x] Complete November schedules and the owner's selected dated coverage.
  Every Halle has technicians on early and late shifts every day. Task Force
  uses middle work hours. Weekend dates are included in the coverage matrix.
- [x] Apply the explicitly requested schedule and Halle/duty corrections with
  retained historical revisions, account profiles, absence states and unrelated
  module data. Preserve existing phone responsibilities in their configured Halle.
- [x] Use existing scoped Workforce operations, recheck expected revisions and
  protect concurrent work. Verify the complete month and immediate rerun no-op;
  retain private pre-change evidence and a current remote backup.
- [x] Validate operator planning/preservation, publish the bounded tooling/docs
  through a story branch and develop, apply on Railway development and confirm
  live preview availability from IOP-233.

Requested evaluation schedule corrections use existing scoped operations and
retain prior revisions. Account provisioning and permissions follow their own
existing administration workflows.
Reuse [Workforce](../../product/workforce.md), [Railway operations](../../development/railway.md)
and the Accepted scoped application/adapter patterns in ADR-0032.

The owner subsequently explicitly approved converting the 18 existing November
Task Force early shifts and their associated duties to middle shifts. This is the
authorized exception to preserving existing schedules. Keep the same account,
date, duty ID, location and phone reference and retain all prior revisions; perform
the schedule/duty replacement atomically per person/week.

[Execution evidence](../completed/IOP-234-railway-monthly-roster-plan.md).
November is complete for 17 technicians and 3 Task Force users in Railway
development. Added 455 days/323 duties and converted exactly the approved 18
Task Force days/duties. All requested coverage and original revision retention
were verified; immediate repreview is a no-op. Source tooling is on origin/develop;
the subsequent container packaging workflow is tracked separately in the evidence.

## Current-week correction

The owner's subsequent report identified missing late coverage in the visible
November 9–15 week. Live inspection confirms 17 technicians on early hours on
each working date November 9–14. The monthly coverage check was insufficient.
Rebalance those existing working dates between early and late, retaining current
Task Force middle work and prior revision evidence. Validate daily schedule and
assignment counts. The correction moved 51 existing technician dates/duties to
late hours. Each working date November 9–14 now has 8/9 early and 8/9 late
technicians, and every technician has three of each in that week. Live schedule
and assignment counts agree, Task Force middle hours were verified, and all 102
original revision snapshots remain retained.
[Correction evidence](../completed/IOP-234-late-shift-balance-plan.md).

## Halle coverage correction

The owner clarified that each Halle needs technicians in each required shift on
every date. Site-level shift balance did not satisfy this requirement. Correct
the selected November month at the date/Halle/shift level, including reassignment
between Halles and sufficient eligible evaluation work dates. The owner selected
early/late technician coverage in every Halle, with Task Force on middle hours.
The correction is applied. All 300 date/Halle/shift combinations have full-interval
technician coverage with compatible personal schedules. Activated ten evaluation
off dates, updated 167 schedules and revised/created 258 duties. Preserved all 501
original schedule/duty revision snapshots and verified immediate rerun no-op.
[Coverage evidence](../completed/IOP-234-halle-shift-coverage-plan.md).

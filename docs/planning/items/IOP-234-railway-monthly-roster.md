# IOP-234 — Railway monthly technician and Task Force schedules

## Status and authorization

In progress for the owner's dated Halle/shift coverage correction.
On 2026-11-12 the owner requested updating develop and the online
Railway installation: technicians should have early, late and weekend shifts;
Task Force should have middle shifts. The owner selected the entire current
month, November 2026, and agreed to preserving existing schedules/assignments.
Railway development contains evaluation data; generated days are plans, not
real attendance, payroll or a legally assessed staffing roster.

## Scope and acceptance

- [x] Use existing active Technician and Task Force accounts and configured shift
  definitions; keep all three shifts available Monday–Sunday.
- [x] Preview and fill only missing November schedules. Technicians rotate through
  configured early/late/middle shifts and staggered weekend work with days off;
  Task Force uses middle shifts on weekdays and explicit weekend days off.
- [x] Preserve existing days, duties, absences, account credentials/profiles,
  historical revisions and unrelated module data. Retained tombstones are not
  silently recreated. New working days use existing home-zone duties, or floating
  support when no home zone is configured, without adding phone responsibility.
- [x] Use existing scoped Workforce operations, recheck expected revisions and
  protect concurrent work. Verify the complete month and immediate rerun no-op;
  retain private pre-change evidence and a current remote backup.
- [x] Validate operator planning/preservation, publish the bounded tooling/docs
  through a story branch and develop, apply on Railway development and confirm
  live preview availability from IOP-233.

No account creation, password reset, overwrite of existing schedules, production
installation, external provider, optimization or permission change is included.
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
between Halles and sufficient eligible evaluation work dates. The owner is choosing
whether required technician coverage includes early/late or all three shifts.
[Coverage execution](../active/IOP-234-halle-shift-coverage-plan.md).

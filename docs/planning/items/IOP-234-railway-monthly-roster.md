# IOP-234 — Railway monthly technician and Task Force schedules

## Status and authorization

In progress. On 2026-11-12 the owner requested updating develop and the online
Railway installation: technicians should have early, late and weekend shifts;
Task Force should have middle shifts. The owner selected the entire current
month, November 2026, and agreed to preserving existing schedules/assignments.
Railway development contains evaluation data; generated days are plans, not
real attendance, payroll or a legally assessed staffing roster.

## Scope and acceptance

- [ ] Use existing active Technician and Task Force accounts and configured shift
  definitions; keep all three shifts available Monday–Sunday.
- [ ] Preview and fill only missing November schedules. Technicians rotate through
  configured early/late/middle shifts and staggered weekend work with days off;
  Task Force uses middle shifts on weekdays and explicit weekend days off.
- [ ] Preserve existing days, duties, absences, account credentials/profiles,
  historical revisions and unrelated module data. Retained tombstones are not
  silently recreated. New working days use existing home-zone duties, or floating
  support when no home zone is configured, without adding phone responsibility.
- [ ] Use existing scoped Workforce operations, recheck expected revisions and
  protect concurrent work. Verify the complete month and immediate rerun no-op;
  retain private pre-change evidence and a current remote backup.
- [ ] Validate operator planning/preservation, publish the bounded tooling/docs
  through a story branch and develop, apply on Railway development and confirm
  live preview availability from IOP-233.

No account creation, password reset, overwrite of existing schedules, production
installation, external provider, optimization or permission change is included.
Reuse [Workforce](../../product/workforce.md), [Railway operations](../../development/railway.md)
and the Accepted scoped application/adapter patterns in ADR-0032.

The owner subsequently explicitly approved converting the 18 existing November
Task Force early shifts and their associated duties to middle shifts. This is the
only authorized exception to preserving existing schedules. Keep the same account,
date, duty ID, location and phone reference and retain all prior revisions; perform
the schedule/duty replacement atomically per person/week.

[Execution plan](../active/IOP-234-railway-monthly-roster-plan.md).

# IOP-234 — Railway monthly roster execution

Status: In progress. [Scope](../items/IOP-234-railway-monthly-roster.md).
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

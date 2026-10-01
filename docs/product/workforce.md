# Workforce and Shift Management

Delivered scope: [IOP-184](../planning/items/IOP-184-m6-workforce.md), covering
M6 IOP-050–059. This local operational module is independent of Data Analysis.

## Responsibilities

| Profile | Operational view | Changes |
| --- | --- | --- |
| Technician | Own day first; colleagues by zone, floating support and shift leaders | None |
| Team Leader | Monday–Sunday board, daily schedules and separate leader section | Enter/update weekly personal schedules; assign/reassign workers, zones, floating/maintenance duties and phone responsibility |
| Administrator | Planning plus import, configuration and workforce profiles | Personal schedules, monthly CSV/email import, teams, shifts, zones, profiles and logical deletion |
| Task Force | Daily operational visibility | None |

The shell also shows the signed-in person's current assignment on Start. Profile
preview changes presentation only; every API operation rechecks the actual account.

Personal schedules state when a person is available. Assignments state where they
work during that availability. Importing a schedule never guesses a zone. There
must be a compatible work/maintenance schedule before a leader can assign a person.
It can be entered manually by the Team Leader/Administrator, or imported by an
Administrator.
Training, compensation, vacation, accident, sickness and days off are explicit
statuses. An absent source day is unknown, not an invented day off. Assignment
conflicts are checked across midnight; adjacent non-overlapping assignments permit
floating workers to move between zones. Leaders have separate duties and rows.

## Manual weekly entry

Team Leaders and Administrators select a person and a week in **Weekly schedules**.
Existing values load into seven dated cards. A configured shift or absence status
can be applied to selected days, with Monday–Friday selected initially. Individual
rows support another shift, status or working interval. Presets respect their active
weekdays; unknown days stay empty. Only changed days are submitted in one save.

Week updates recheck the current scoped grant and each day's revision, and validate
the complete proposed week, neighboring overnight schedules and existing zone/phone
assignments. An invalid or stale row prevents every write. Updating personal hours
does not move or delete workplace assignments: incompatible assignments must first
be corrected within the valid interval, or removed by an Administrator and replanned.
Technicians cannot edit weekly schedules. CSV/email remains an optional admin tool.

## Initial configuration

Site-owned labels retain the current Halle vocabulary and can be renamed. Initial
shift definitions use the supplied email and owner request: Frühschicht 05:00–14:15,
Spätschicht 13:45–23:00 and Mittelschicht 08:45–18:00. The middle shift is available
for weekday leadership and Saturday technicians; additional shifts are configurable.
The demo uses early/late weekday assignments, middle Saturday assignments and no
invented Sunday work. Daily planning is allowed Monday through Sunday.

Each zone has one configurable phone label. Assignment phone references use a
stable zone ID, so renaming a phone cannot bypass exclusive responsibility. There
is also a separate maintenance phone. A phone can have only one holder at a time.
Coverage badges count zones without any zone assignment on the selected day; they
are advisory and do not assert staffing adequacy for every minute or shift.

## History and removal

Every change records an actor/name, time and revision. Administrator deletion is
logical. Deleting a profile revokes local access and hides it from user management;
current operational views resolve the latest name by the stable user ID, including
retained references to disabled/deleted profiles. A missing site profile falls back
to its saved label. Stored records and revision history retain original names. Deleting an entry
hides it from active views and keeps its revisions. The last administrator cannot
be deleted. Workforce history currently returns the latest 100 retained revisions.
No cascading deletion, corporate database access, payroll, automatic optimization
or inference of partial absences is included.

[Operator and import guide](../development/workforce.md) documents formats and tests.

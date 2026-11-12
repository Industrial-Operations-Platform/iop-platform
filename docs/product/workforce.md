# Workforce and Shift Management

Delivered scope: [IOP-184](../planning/items/IOP-184-m6-workforce.md), covering
M6 IOP-050–059. This local operational module is independent of Data Analysis.

## Responsibilities

| Profile | Operational view | Changes |
| --- | --- | --- |
| Technician | Own day first; colleagues by zone, floating support and shift leaders | None |
| Team Leader | Own primary teams with daily availability/distribution, Monday–Sunday board, daily schedules and separate leader section | Enter/update weekly personal schedules; assign/reassign workers, zones, floating/maintenance duties and phone responsibility |
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

Primary teams associate a worker with a configured leader; they do not limit
another authorized leader's responsibility or planning access. Administrators can
edit membership and a person's configured technical level in Worker profiles,
independently of their access profile. The initial site choices are ILO Technical
Operator and ILO Maintenance Technician. Missing qualifications remain unspecified;
retiring a choice preserves its saved label in worker history.

**My team** groups the current actor's primary-team workers independently of the
leader's own shift or availability. Each week shows current member names, dated
availability and every planned shift, zone or duty, including an overnight duty
continuing from the previous date. Members working outside their home zone remain
visible. Unknown days, planned absence, training and available-but-unassigned work
stay distinct; missing records never imply absence or a day off. Training hours
are shown as training, without implying an operational zone assignment is required.
This view organizes already-authorized site data and does not restrict the broader
Weekly plan or grant new planning/configuration authority.

My day indicates a leader's planned availability now and overlap with the viewer's
own shift, including overnight intervals. Text accompanies subtle semantic colors;
the indication describes scheduled availability, not online presence or attendance.
Start's Week view presents Monday–Sunday in one compact dated grid with shift and
zone context; narrow screens scroll inside the assignment area.

## Manual weekly entry

Team Leaders and Administrators select a person and a week in **Weekly schedules**.
Existing values load into seven dated cards. A configured shift or absence status
can be applied to selected days, with Monday–Friday selected initially. Individual
rows support another shift, status or working interval. Presets respect their active
weekdays; unknown days stay empty. Only changed days are submitted in one save.

[IOP-233](../planning/items/IOP-233-schedule-preview.md) adds an unsaved proposal
for up to 100 people in the same week. Switching people retains each draft.
**View schedule** shows the selected person's saved week and workload comparison
without requiring edits or writing data.
**Preview proposal** validates the complete proposal without writing and displays
a weekly matrix plus saved/proposed workload comparisons for active site people.
Choose an inclusive analysis period of up to 93 days containing the edited week;
the default starts on the first day of the week's starting month and ends Sunday.
The server reads the complete period, rather than extrapolating the visible week.

Workload includes scheduled work, training and maintenance days and elapsed hours,
Saturday/Sunday start dates and each configured shift's count. Matching uses exact
configured local hours and active weekdays; unmatched intervals appear as Other
scheduled hours. Overnight hours include the whole interval and actual DST elapsed
time, attributed to the starting date. Assignments do not multiply personal hours;
absence contributes no working load, and unknown days are shown separately.
These measures describe schedules, not attendance, paid hours or staffing adequacy.

**Save proposal** explicitly commits all changed people/days in one transaction,
rechecking authority, revisions, neighboring overlaps and dependent assignments.
An edit or analysis-period change invalidates the preview. Failed preview/save
retains the drafts for correction; Cancel or Discard proposal clears unsaved work.
Drafts exist only while this weekly editor remains open and do not survive closing
it, switching weeks or reloading the page. This adds no persisted draft state.

Week updates recheck the current scoped grant and each day's revision, and validate
the complete proposed week, neighboring overnight schedules and existing zone/phone
assignments. An invalid or stale row prevents every write.
[IOP-235](../planning/items/IOP-235-schedule-edit-preview.md) lets the weekly editor
preview full configured-shift assignments moving with a changed shift, retaining
their Halle and phone responsibility. Absence or training changes preview removal
of operational assignments. The preview lists every intended assignment change;
Save proposal commits it with the schedules and retains revision history.
Custom assignment hours that no longer fit, or conflicting phone responsibilities,
remain visible as blocking issues. Correct those assignments before saving.
**Reload saved schedules** discards drafts and reloads current revisions after a
stale-data error. Legacy weekly API saves and imports retain strict assignment
preservation unless proposal replanning is explicitly requested.
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

## Personal Start summary — IOP-196

Start shows profile/home department/team, assigned reports resolved in the previous
calendar month and current unfinished Maintenance separately. Its assignment card
defaults to today and permits an explicit day or Monday–Sunday week with schedule
hours, shift, zone and duty. It does not change the person's stored assignment.

`POST /api/v1/workforce/summary` derives complete current-actor statistics on the
server under `workforce.read`: last-month scheduled working dates and shift shares,
plus distinct scheduled Saturdays/Sundays in the current month through today.
Work/training/maintenance schedules and explicit assignments count; absences do not.
Repeated duties for the same date/shift are deduplicated. A schedule with no assignment
uses matching configured hours or an explicit Other scheduled hours bucket. These
figures describe plans, not verified attendance. Missing schedule data is explicit.

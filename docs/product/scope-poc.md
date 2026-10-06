# Local analytical POC scope

The owner-confirmed workflow is **CSV → preparation → persistent history → analysis
→ presentation**. This page records the analytical slice and subsequent reporting refinements;
[delivery status](../planning/poc-delivery.md) owns evidence and open acceptance.
This is the historical analytical slice; local authentication/administration,
Shift Handover, [M6 Workforce](workforce.md), [M8 Maintenance and M10 Digital Asset
Record](maintenance-assets.md) are separately implemented through IOP-194.
The current shell opens Administration for administrators and Start for operators;
Data Analysis remains an independent workspace.
The [operator guide](../development/running-poc.md) owns execution instructions.

## Runtime and user

- Separate Docker containers for frontend, backend and persistent PostgreSQL, with
  an optional analytics-only backup seed. Only the web entry point is on loopback.
- Individual local password/session accounts use four profiles under ADR-0035.
  Only Administrator imports/prepares; Administrator, Team Leader and Task Force
  analyze data. Technician has operational access without analytical grants. The
  configured selector remains only in explicit optional native demo mode.
- One configured organization/site/source with an explicit time zone. Retain current
  grants, scoped transactions and forced RLS; corporate/shared-use login is deferred.
- Frontend and backend follow [hexagonal boundaries](../architecture/adr/ADR-0032-hexagonal-application-boundaries.md).
  Reusable frontend components preserve the [visual identity](../design/visual-identity.md).

## Import, preparation and history

Import one daily CSV with the supplied fields `Häufigkeit`, `Dauer`, `Bereich`,
`Betriebsmittelkennzeichen`, `Meldetext`, `Typ` and `Meldegruppe`. Preserve original
bytes, source values, physical lines and import outcomes. Normalize supported text
and numbers conservatively; quoted commas and special characters remain data.
Parse duration into exact seconds and display summed minutes.

Use the supplied five-sector mapping (Halle A T1/T2/T3, Halle B Sh/Sky), with explicit
`Nicht klassifiziert` fallback. Keep source-specific rules in scoped configuration
and adapters. Equipment means `Betriebsmittelkennzeichen`; area means `Bereich`;
error means `Meldetext`. Do not invent separate PLC/sensor identities.

Persist daily files and query all matching historical facts. Reject already admitted
reporting dates within organization/site/source without automatic replacement.
Show invalid, duplicate and interrupted outcomes; retain unclassified rows in totals.
Administrators can version-save normalization/corrections and sector rules for
historical reporting while immutable CSVs/import-time facts remain unchanged.

The backup's normalized analytics model is the database reference, including a
sector catalog and `sektor_id` on the main Hitliste fact. The public prototype is not
the target model or an extra seed source. Backup-derived daily seed files use the
real importer and keep provenance; archive SQL is never executed.

## Analytical workspace

The current shell has a role-aware Start and independent operational workspaces;
Data Analysis navigation selects analytical templates. Its default analytical
presentation is Taskforce, distinct from the account’s profile.
An authorized Administrator enters Import & prepare directly when switching to
Administration. Separate sections handle import/history, data preparation and KPI
settings/goals, including before the first successful import. Reports, charts and
analytical filters remain in Taskforce view; source rows have their own Files & source
rows tool. Import confirms the filename date, flags known duplicate dates, and shows
authoritative saved/rejected/inspection counts, errors and partial/truncated diagnostics.
The server remains authoritative for admission and preserves existing date claims.
Preparation and KPI editors mount separately and load the latest profile when opened.
This toggle changes presentation, not the authenticated principal or backend grants.
Human-readable context identifies Taskforce/Administration and Operational Intelligence
instead of deployment IDs.

| Template | Filter policy |
| --- | --- |
| Executive Overview | One calendar month; configurable Meldetext KPIs appear only here |
| Halle | One or more imported calendar months |
| Bereich | Months, sector and area |
| Equipment | Location filters plus equipment code |
| Error | Equipment/location filters plus error text, type and message group |
| Daily/monthly | All supported source-field filters |

Filters are subtle and collapsible, with the active selection summarized. Grouping
is independent of filtering. Finer investigation preserves compatible constraints;
returning to a broader template clears unsupported constraints. Chart/group drill-down
opens a detail view that can show the selected constraint.

Provide rankings, monthly comparisons, duration/frequency scatter, heatmaps and
period trends. Allow grouping by source fields and sector. Full matching measures
are server-owned and independent of bounded chart groups and contributing-row pages.
Import volume/counts belong to file review, not KPI cards on every template.
Administrative file review provides collapsible exact per-column filters using the
same value controls as Taskforce reports. Filters intersect across all file rows
before sorting/pagination; suggestions are bounded to 200 values per column.
Include line, all source/classification dimensions, frequency and displayed minutes
rounded to two decimals. Show matching/total counts, preserve filters while sorting
or paging, and clear them on file changes. Choices cascade in form order (sector,
area, equipment, message, type, message group, line, frequency, minutes) using the
whole file and preceding criteria. Changing a field clears following criteria.
Drafts refresh choices before Apply; pending, failed or empty previews cannot be
applied, and stale responses cannot overwrite newer choices. Exact manual values
outside the bounded suggestions remain supported when they match. Plain and
sortable headings align.
IOP-163 delivers frequency/duration top-10 source-group Pareto charts with cumulative
percentages against complete matching totals and an 80% reference. They appear in
investigation views without a separate Pareto tab; broader canonical asset coverage
remains with IOP-093.
Screenshot targets and improvement formulas are not invented metrics.

Executive Overview shows a frequency-ranked area chart, an area/day matrix ordered
by monthly frequency, and overlaid daily frequency/alarm-minute series with labelled
axes. The month control is collapsible and uses a whole-field dropdown of imported months. Charts show up to 100 areas; monthly totals
and KPI calculations include all eligible matching facts.

Administrators select up to eight ordered Meldetext KPIs from the prepared database
catalog, excluding already-selected messages. Choices load all catalog pages. Each
KPI has a label, frequency
or duration measure, and an optional daily-average goal. Settings persist with the
scoped reporting profile and its existing version checks. With no goal, compare the
selected month's daily average against the daily average across all imported history,
including that month. Both divide by eligible imported dates, including dates without the
chosen error; missing imports are excluded. Explicit goals override the reference.
Lower is green, higher is red, equality is neutral, and a month without imported
dates has no average. Zero references have no percentage change. Cards show monthly
totals, average units and the reference so incomplete months remain interpretable.

The configured Hitliste analysis calendar excludes Sundays, using the CSV reporting
date. Exclusion applies to every report, ranking, option, daily/weekly/monthly
series, analytical coverage, and both monthly/historical KPI totals and average
denominators. Daily chart axes omit Sundays; they are not missing-data gaps.
Monthly coverage counts eligible days. Saturday remains included. Sunday files
can still be imported, retained and browsed in administrator Files & source rows;
original evidence and the complete Meldetext settings catalog remain intact.

## Metric meaning and acceptance

Frequency sums source-reported occurrences, not stored row count. Accumulated alarm
duration is not plant downtime. Filename dates are reporting labels with unknown
windows; missing imports are not zero-failure periods. Source equipment identifiers
do not establish physical assets. Keep these limits and source provenance visible.

Acceptance requires the owner to import/review data, investigate historical behavior,
obtain independently reconciled measures and present useful results from IOP.
Record actual dataset size, observed timings and owner feedback without inventing
performance or benefit targets. Technical evidence does not replace usefulness review.
The owner accepted Data Analysis v1 on 2026-09-27; IOP-130 remains open for
consolidating the five measures and actual human timing/dataset observations.
Synthetic native fixtures retain a guarded
reset/reload path; the main Docker installation preserves historical data on restart.

## Deferred scope

Shared-use identity-provider choice, live industrial integrations, a general
integration registry, workers and platform-wide audit,
production retention/backup/restore, exports, shared hosting, full physical asset
hierarchy/maps/surveys and improvement tracking remain separately scoped. Local
account administration, Shift Handover, M6 Workforce, M8 Maintenance and M10 Digital
Asset Record have delivered contracts; M9 is explicitly Deferred.
Basic validation, safe configuration, explicit authorization, useful errors and tests
remain part of every delivered slice. POC completion does not complete those future
parents or certify shared-use v1.

## Administrative file rows

Analytical templates show aggregate rankings and trends, without a contributing-row
table. Administration provides a file dropdown, prepared source rows and a link to
the preserved original. Clicking Sector, Bereich, Betriebsmittelkennzeichen,
Meldetext, Typ or Meldegruppe cycles ascending, descending and off. Multiple criteria
retain click-order priority; physical source line breaks ties. Sorting covers the
whole file before pagination, and a preparation change rejects stale pages.
The source-row endpoint requires current `imports.review` and `analytics.read` grants.
The existing report API retains its legacy row fields for compatibility; the Taskforce
presentation is not a separate security role or a restriction on analytical read grants.

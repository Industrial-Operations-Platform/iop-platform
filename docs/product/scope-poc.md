# Local analytical POC scope

The owner-confirmed workflow is **CSV → preparation → persistent history → analysis
→ presentation**. This page consolidates the refinements delivered through IOP-154;
[delivery status](../planning/poc-delivery.md) owns evidence and open acceptance.
The [operator guide](../development/running-poc.md) owns execution instructions.

## Runtime and user

- Separate Docker containers for frontend, backend and persistent PostgreSQL, with
  an optional analytics-only backup seed. Only the web entry point is on loopback.
- One local Administrator can import, prepare and analyze data. Keep the temporary
  configured user selector in the header; third-party login is a later adapter.
- One configured organization/site/source with an explicit time zone. Retain current
  grants, scoped transactions and forced RLS; local selection is not shared-use login.
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

Left navigation contains an initially empty Start page and Data analysis; lower
navigation selects analytical templates. Users enter the Taskforce presentation.
An authorized Administrator can switch to Administration to expose import,
preparation, KPI settings and Files & source rows, then return to Taskforce view.
This toggle changes presentation, not the authenticated principal or backend grants.
Human-readable context identifies Taskforce/Administration and Operational Intelligence
instead of deployment IDs.

| Template | Filter policy |
| --- | --- |
| Executive Overview | One calendar month; configurable Meldetext KPIs appear only here |
| Halle | Date only |
| Bereich | Date, sector and area |
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
or paging, and clear them on file changes. Plain and sortable headings align.
Pareto is deferred as a future function inside Executive Overview, with no separate tab.
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
performance or benefit targets. Technical evidence does not replace usefulness review;
IOP-130 remains open for that assessment. Synthetic native fixtures retain a guarded
reset/reload path; the main Docker installation preserves historical data on restart.

## Deferred scope

Shared-use authentication/provider choice, account and membership administration,
live industrial integrations, a general integration registry, workers, full audit,
production retention/backup/restore, exports, shared hosting, assets/maps/surveys,
workforce, handovers, maintenance and improvement tracking are separately scoped.
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

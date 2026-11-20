# Analysis settings and monthly KPI references

Administrators manage these settings under **Data administration → Data preparation**
and **Data administration → KPI settings & goals**. In German, the first path is
**Datenverwaltung → Datenaufbereitung → Analyse-Ausschlüsse**.

## Monthly comparisons

Investigation filters use **Months to compare → Choose months**. Choose a year
and mark its imported months, then switch years to add nonconsecutive months
without losing earlier choices. **Whole year** selects or clears only the displayed
year; **Select all months** and **Clear month selection** affect the whole month
selection. Unavailable months are disabled, while retained selections remain
inspectable. **Done** closes the selector; **Apply filters** applies the draft.
An empty selection cannot be applied. Other analytical filters stay selected.

Large selections show counts and year coverage instead of listing every month.
Selections remain active through analytical details; **Clear filters** restores
all available months and clears other criteria. The Executive Overview keeps its
single-month scope. Existing reporting-range/query budgets still apply.

The selected month's KPI is its total divided by eligible imported days in that
month. Without an explicit goal, its reference is the same KPI's total over all
eligible imported days **across the entire available history**, divided by that
historical day count. This is a day-weighted average, not an unweighted average of
monthly averages. The reference includes the selected month and any later months
already imported. Every selected month uses the same historical average until
imports or reporting settings change.

For an installation with imports from May through September:

- May, June, July, August, and September all compare against the May–September
  historical average.
- If May is the only imported month, its average equals the historical reference.
- Importing another month updates the reference for every selected month.
- An explicit daily-average goal takes priority in every month, including May.

Eligible imported days with no matching alarms count as zero; missing dates and
excluded weekdays do not count. Details show the historical coverage and date range.

## One equipment identifier

On **Data Analysis → Daily / monthly**, selecting exactly one
**Betriebsmittelkennzeichen** opens a focused equipment view. Its totals cover all
eligible matching source rows in the selected months and filters, independent of
ranking limits and source-row pagination. Clearing the equipment filter restores
the group comparison.

The view shows total frequency, accumulated alarm minutes, daily averages, alarm
minutes per reported occurrence, days with activity, daily frequency/time peaks,
last reported activity and the most frequent matching message. The daily table
includes eligible imported dates without matching alarms as zero; missing imports
remain absent and appear as gaps in the trend. Weekly/monthly display still uses
a daily snapshot pinned to the same report revision for daily observations.

Activity means positive reported frequency or accumulated alarm time. Tied peaks
show the earliest date and the number of tied days. Alarm minutes per occurrence
is total seconds divided by 60 and total frequency, not an average of daily
averages or a measured individual incident duration. A zero frequency denominator
is unavailable. Equipment codes remain source identifiers; accumulated alarm time
does not establish downtime or live sensor health.

## Error analysis with one or two errors

When **Error analysis** is grouped by **Meldetext** and the complete matching set
contains one or two error types, it shows full filtered totals, daily averages,
alarm minutes per occurrence and each error's frequency/time contribution. Only
**Duration versus frequency** is plotted. Three or more errors retain the monthly
comparison and Pareto charts; other grouping dimensions keep their existing views.
The boundary uses the server's complete group count, not the visible ranking size.

Every duration-versus-frequency point exposes its name, frequency and accumulated
alarm minutes on hover, regardless of the selected measure. Selecting an error
still drills into the daily/monthly view with its filters intact. Imported-day,
zero-denominator and source-aggregate limitations are the same as above.

## Persistent analysis exclusions

Under **Analysis exclusions**, add a field and an exact value, then use
**Save historical preparation**. Meldetext suggestions include the retained message
catalog. Other supported fields are Bereich, Betriebsmittelkennzeichen, Typ, and
Meldegruppe. Values follow the configured normalization and explicit corrections;
matching is exact and case-sensitive after preparation. A row matching any rule is
excluded from reporting totals, charts, monthly KPI references, improvement
comparisons, and analytical asset history.

Rules apply to existing history and future imports. They do not delete original
files, admitted source rows, or relational facts. The administration file explorer
and message catalog retain those values for review and for removing exclusions.
Removing a rule and saving includes the rows again without reimporting. Active
rules remain visible in the analysis workspace. These reporting rules do not alter
the legacy pilot query API's caller-supplied filters.

Rules share the versioned reporting profile with corrections, mappings, and KPI
goals. Concurrent edits are rejected rather than overwriting a newer profile.
Saving requires administrator access. No message is excluded automatically.

Application updates preserve the installation's stored settings and data; they do
not copy local settings over Railway or restore an initial snapshot.

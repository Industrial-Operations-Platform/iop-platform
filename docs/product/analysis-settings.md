# Analysis settings and monthly KPI references

Administrators manage these settings under **Data administration → Data preparation**
and **Data administration → KPI settings & goals**. In German, the first path is
**Datenverwaltung → Datenaufbereitung → Analyse-Ausschlüsse**.

## Monthly comparisons

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

# CSV and reporting reference

## Evidence and scope

Owner-provided CSV excerpt and four Power BI screenshots, captured as context for
[IOP-002](../planning/items/IOP-002-technology-stack.md). This is a description of
the current workflow and requested analytical navigation, not an accepted metric
catalog, physical asset survey or selection of frontend/reporting technology.
Customer records and screenshots are not stored here. Source field names below
are external vocabulary; generic contracts use English and configurable mappings.

The administrator currently prepares/imports CSV data through a Python script into
a local database; Power BI presents the results. The owner intends to port the
transformation behavior to JavaScript, using the accepted TypeScript/Node.js backend.
The owner supplied loader and repository excerpts, reviewed as historical evidence;
the complete pipeline has not been inspected or executed. Later implementation must reconcile outputs
on the same representative input before replacing the existing process.
Team Leaders and Taskforce consume analytics with limited permissions. Team Leaders
present results to their superior, who does not need a v1 account.

## Observed source structure

The owner reports a stable export format. The excerpt uses semicolon delimiters,
quoted headers and seven columns. The supplied loader explicitly reads UTF-16;
full exporter quoting rules remain unverified.

IOP-012 subsequently inspected the complete owner-supplied `Hitliste-20260701.csv`
on 2026-09-25: UTF-16 LE with BOM, CRLF, seven ordered columns and 681 data records.
Only header fields are quoted; data fields are unquoted. Durations use `d h:mm:ss`,
not a decimal-day or timestamp representation. All data records have seven nonempty
cells and unsigned integer frequencies; no embedded delimiters/quotes, multiline
cells or repeated five-dimension tuples were observed. This one file does not prove
exporter uniqueness or all possible quoting/precision variants. Production rows
and operational totals remain outside Git. See the bounded
[POC CSV source contract](../architecture/csv-source-contract-poc.md) for supported
syntax, exact-second conversion, neutral fields, mapping and rejection outcomes.

| External column | Observed purpose | Interpretation to verify |
| --- | --- | --- |
| Häufigkeit | Integer frequency | Count of occurrences represented by a row; exact grouping and coverage remain open. |
| Dauer | Duration text | Full sample matches `d h:mm:ss`; the POC contract defines exact-second conversion. Legacy helper parity remains unverified. |
| Bereich | Area label | Customer-scoped grouping, not a generic hierarchy level. |
| Betriebsmittelkennzeichen | Equipment designation | Preserve as opaque text, including leading equals signs and punctuation. |
| Meldetext | Alarm/message description | Includes both collective faults and more specific fault descriptions. |
| Typ | Source message type | Translate through source configuration; the sample does not establish all possible values. |
| Meldegruppe | Source message group | Mapping input; not proof of a physical parent relationship. |

These rows appear to be aggregate alarm statistics, not individual timestamped
occurrences. Do not expand a row into synthetic events. Frequency must use the
reported counts, not the number of CSV rows, after defining duplicate handling.

There is no date, reporting period, explicit hall, separate sensor identity or
parent-equipment column. The owner confirmed that the date comes from the manually
prepared filename. The subsequently supplied Power BI calculated column maps
area labels to reporting sectors; the earlier attribution to Python is corrected below. Do not invent timestamps or derive
physical relationships from equipment-code patterns without validated rules.

## Confirmed legacy import behavior

Evidence: owner-provided `hitliste_loader` and `hitliste_repository` excerpts.
These observations describe the existing process, not an accepted IOP schema or
complete importer specification.

- `Hitliste-20260626.csv` supplies the date `2026-06-26`. The loader removes
  `Hitliste-` from the filename stem and parses `%Y%m%d`; every row receives that
  same date. It is a date value, not an event timestamp. Exact reporting-window
  boundaries and timezone remain unverified. The owner selects the corresponding
  date when exporting: this is the date of the reported data, not the import date.
- The existing operator selects a file through `CSV_FILE` configuration. The loader
  checks its existence and reads UTF-16. This does not prescribe an IOP upload UI
  or require storing environment configuration in the repository.
- Parsing skips blank lines, strips surrounding quotes, replaces doubled quotes
  and splits lines on semicolons. This is not evidence of general CSV quoting
  support: embedded delimiters and multiline fields need representative validation
  before a port. Preserve valid source behavior without copying parsing defects.
- Frequency is converted numerically with invalid values coerced to missing values;
  the repository subsequently casts it to an integer. This is not a defined reject
  policy for invalid or fractional counts. IOP validation must make such cases explicit.
- The original duration text is preserved and a minutes value is produced by
  `dauer_to_minutes`. That function was not supplied; parsing rules, precision and
  invalid-value behavior remain unverified.
- Empty dataframes return zero inserts. For nonempty data, the repository checks
  whether any row already exists for the first row's date; if so, it rejects the
  import. Otherwise it bulk-inserts rows and commits, rolling back on insertion
  errors. The loader assigns one date, but the repository itself does not validate
  that every supplied row has the same date.
- The duplicate-date check and insert use separate connections. The excerpt alone
  does not establish concurrency-safe uniqueness; database constraints were not
  supplied. Do not claim exactly-once ingestion or adopt a global date-only key
  for a customer/source-scoped platform. Correction, replacement and retry policies
  remain future contract decisions.

## Confirmed Power BI area classification

The owner supplied the DAX calculated column `Arbeit Sektor`. It reads `bereich`
from the imported table, applies `TRIM`, then uses `SWITCH(TRUE(), ...)` with five
explicit area-membership lists to assign one reporting sector. The fallback is
`Nicht klassifiziert` (unclassified). This classification lives in Power BI, not
in the supplied Python loader/repository. The five labels describe customer hall/
sector groups; they do not establish five generic hierarchy levels.

The mapping direction is area label → reporting sector. It does not identify a
sensor, equipment parent or physical coordinate. Classifications rely on explicit
membership, not substring guesses from area names or equipment designations.
Customer lists are not copied into generic core code or seed data in this review.

For the future port, capture the lists as customer-scoped mapping configuration
with an explicit unclassified outcome. Preserve unmapped records in totals and
make them visible for administrator review. Verify text-normalization/comparison
behavior against the current report rather than assuming a replacement language's
string trimming is identical. The IOP-012 contract now rejects duplicate normalized
mapping keys and freezes the applied classification/revision; historical changes
require separately authorized correction work. Actual mapping delivery is IOP-049.

Reproducing the current analytics requires both Python data preparation and this
Power BI transformation. Porting the loader alone would omit sector classification.
The backend remains accepted; mapping storage and execution location are undecided.

## Reports visible in the supplied screenshots

| Page | Observed content | Requirement input |
| --- | --- | --- |
| Executive Overview | Area frequency ranking, area heatmap, daily frequency/duration trends, monthly KPI cards with targets | Give Team Leaders a presentation overview of plant improvement or deterioration. Heatmap period definition and KPI formulas remain open. |
| Halle Analysis | Month comparisons by hall/sector, frequency-versus-duration scatter, frequency and duration rankings | Compare configured higher-level groups and select one for deeper analysis. |
| Bereich Analysis | Month comparisons by area, scatter and top-ten frequency/duration rankings | Prioritize areas within the selected context. |
| Betriebsmittel Analysis | Top-ten equipment ranking, scatter, daily trend and scope/date/message filters | Investigate equipment and its contributing fault records while retaining filters. |

Root Cause Analysis, Pareto, Improvement Tracking and another specialized analysis
appear in the navigation only. Their page contents were not supplied; visibility
in the menu does not establish their full requirements or include them all in v1.
Do not adopt screenshot targets, excluded messages or percentage formulas as defaults.

## Requested analytical navigation

Executive overview → configured hall/sector → area → equipment → fault message and,
where source identity or a verified mapping supports it, the affected sensor.
Both Team Leaders and Taskforce need this diagnostic analysis. Preserve selected
scope, reporting period and message filters across levels; expose contributing
records and unresolved identities rather than pretending every fault identifies a sensor.

This is analytical drill-down. A repeated alarm or a collective fault is evidence
for investigation, not a proven root cause. Physical coordinates, maps, plant-wide
surveying and 3D Asset Locator remain deferred. Source-derived equipment detail
does not require completing the future physical asset inventory.

## Metric and presentation constraints

- Report occurrence count and accumulated alarm duration with explicit units.
  Summed alarm durations can overlap and must not automatically be called elapsed
  plant downtime. Event intervals are absent from this excerpt.
- Define reporting coverage and comparable periods before labeling changes as
  improvement/deterioration. Missing imports are not zero-fault periods.
- A true failure rate needs a defined denominator; a screenshot label alone does
  not provide one. KPI targets, percentage direction and threshold rules need validation.
- Make active filters and message exclusions visible and consistent across totals,
  rankings and drill-down. Keep customer-specific rules in scoped configuration.
- Use distinguishable units/axes for frequency and duration; preserve period and
  metric definitions in any future presentation/export.

## Implications for the remaining IOP-002 evaluation

Assess frontend/reporting options against linked filters, drill-down, rankings,
line/bar/scatter charts, heatmaps, KPI cards, readable presentations and maintainability
for one developer. Data volume, response targets, accessibility, licensing and
export needs must be evaluated before choosing tools. A 3D renderer is not a v1
requirement. The backend remains TypeScript + NestJS; no supplied evidence changes it.

## Confirmed pilot reporting-date input and duplicate rejection

In the IOP-008 follow-up, the owner confirmed manually writing the reporting date
into the CSV filename. The date identifies the reported data, not upload time.
For the current file-based pilot, reject an import if that reporting date already
has imported data for the same configured source and organization/site. Do not
append, overwrite or replace those facts automatically. Renaming another file to
an already loaded date must not bypass the check. Existing scope boundaries mean
another site's/source's date is not a global duplicate.

The owner also suggested a second check through an independently selected date.
This is an optional upload-flow design for later work, not an implemented or
mandatory date-selector UI. If adopted, parse a valid calendar date from the
configured filename format and compare it with the selected date before admission:
matching dates continue to duplicate validation; missing/invalid required values
or mismatched dates stop admission with a clear correction request. Neither value
silently overrides the other. Agreement catches inconsistent entry, but does not
prove that the operator chose the correct reporting date.

The duplicate rule is confirmed product intent. Concurrency-safe enforcement,
failed/partial-import retry handling and explicit correction/replacement semantics
belong to [IOP-047](../planning/items/IOP-047-import-idempotency.md) and import
contracts; this note does not activate those stories or copy the legacy check/insert
implementation. Future simultaneous submissions for one source/site/date must not
both admit duplicate facts; filename/selector validation alone cannot ensure that.

This clarification does not establish reporting start/end hours, source zone or
individual event times. Preserve the filename date as a local reporting label under
[ADR-0016](../architecture/adr/ADR-0016-time-and-timezone-model.md). The exact-window
question below remains open. See the
[clarification plan](../planning/completed/IOP-008-csv-date-clarification-plan.md).

## Open validation points

1. What reporting window does the filename date represent, and in which timezone?
   The owner selects the corresponding date at export; exact boundaries are unverified.
2. Area-to-sector classification is confirmed in DAX. What source identity or
   mapping, if any, supports equipment-to-sensor detail?
3. What is the exact aggregate grain and duration meaning, and how should IOP
   handle corrections/retries beyond the observed legacy duplicate-date rejection?
4. Which reports, KPI formulas, targets and filters are required for pilot acceptance?
5. What data volumes and presentation/export outputs must the selected tools support?

These questions are inputs to subsequent discussion, not inferred decisions.

## Original CSV files retained in the repository

On 2026-09-25 the owner explicitly requested adding three original examples of
future imports: `Hitliste-20260701.csv`, `Hitliste-20260705.csv` and
`Hitliste-20260707.csv`. See the [reference files and integrity manifest](reference-data/hitliste/README.md)
for byte-preserved copies, provenance, checksums and structural observations.
These are owner-supplied source data, distinct from the fictional analytical
fixtures. Their inclusion does not establish runtime import acceptance, metric
reconciliation, exact reporting windows or acceptance of pending ADRs.

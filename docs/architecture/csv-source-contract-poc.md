# POC CSV source contract

Defined by [IOP-012](../planning/items/IOP-012-source-integration-contract.md)
for the [local analytical POC](../product/scope-poc.md). This is a design contract,
not an implemented parser, API or database schema. It specializes existing
[module boundaries](modules.md), [scope](adr/ADR-0012-organization-site-scope.md),
[time semantics](adr/ADR-0016-time-and-timezone-model.md) and the
[security baseline](security-baseline-poc.md); no new architectural pattern is introduced.

## Evidence and supported profile

The owner supplied `Hitliste-20260701.csv` and stated that future CSVs have the same
format. Read-only inspection on 2026-09-25 found 120,432 bytes, a UTF-16 little-endian
BOM, CRLF line endings, one header and 681 data records. Every record has seven
fields; all supplied values are nonempty. The header fields are individually quoted;
the data fields are unquoted. No embedded delimiters, quotes, multiline fields or
outer whitespace occur in the data. All frequencies are unsigned decimal integers;
all durations match `d h:mm:ss`, with observed days zero and hours from zero to seven.
These observations do not establish every possible exporter behavior.

The following restrictions define the supported POC profile, rather than claiming
compatibility with arbitrary CSV exports:

- Decode UTF-16 LE with required `FF FE` BOM strictly; reject malformed code units,
  odd byte counts, other encodings and embedded NUL characters. Do not guess encoding
  or replace undecodable characters. Strip only the initial BOM.
- Use `;` as separator. Support unquoted cells or cells enclosed in `"`, with doubled
  `""` representing a literal quote inside a quoted cell. Delimiters inside quoted
  cells remain text. Quotes in unquoted cells, unclosed quotes and characters after
  a closing quote other than a separator/end of record are invalid.
- Support CRLF or LF record endings and an optional final line ending. Multiline
  cells, bare CR endings and whole-line wrapper/double-escaped export variants are
  outside this profile. Reject rather than attempting global quote replacement.
- Ignore empty/ASCII-space-or-tab-only physical lines outside records, counting
  them separately. The first nonblank record is the header; keep original physical
  line numbers for provenance. An empty file or header-only file is rejected, not
  registered as a zero-fault reporting date.
- After CSV unquoting, require exactly this ordered header, without aliases,
  duplicates, extra columns or header trimming:
  `Häufigkeit;Dauer;Bereich;Betriebsmittelkennzeichen;Meldetext;Typ;Meldegruppe`.
  Every subsequent record must contain exactly seven cells. Repeated headers fail
  value validation; missing/trailing extra cells must not shift field meaning.

Use a strict CSV parser in future delivery, not the legacy global quote stripping
and `split(';')`. No library is selected here. Quote/delimiter edge cases above are
contract choices requiring synthetic tests; they were not present in the sample.

## Neutral aggregate and provenance contract

Integrations owns decoding, source names, mapping and import provenance. OIP owns
the receiving aggregate contract and analytical invariants. Platform Core gains no
source columns or customer classification branches. These are logical fields,
independent of HTTP DTOs, table layout and internal invocation mechanisms.

Each import supplies validated `organizationId`, `siteId`, `sourceId`, `importId`,
original filename, RAW reference, receipt instant, adapter/profile revision and
mapping revision. Resolve one explicit configured source within its organization
and site; validate ownership and the site's configured IANA zone before admission.
CSV labels and filenames cannot select or override scope. Runtime access still
requires an accepted execution mechanism; ADR-0018 remains Proposed.

Each aggregate retains the import context and a `sourceRecordNumber` (original
physical line number, including the header and any skipped blank lines):

| Source/input | Neutral field | Meaning and validation |
| --- | --- | --- |
| Filename | `reportingDate` | Valid Gregorian `YYYY-MM-DD` date label derived as below. |
| Häufigkeit | `reportedFrequency` | Required nonnegative integer; count reported by this row, not one event per CSV record. |
| Dauer | `accumulatedAlarmSeconds` | Required nonnegative integer quantity, using the conversion below. |
| Dauer and RAW | `originalDuration` / RAW reference | Preserve the original decoded cell and original bytes; normalization cannot erase source evidence. |
| Bereich | `sourceArea` | Required opaque source label; input to scoped sector mapping. |
| Betriebsmittelkennzeichen | `sourceEquipmentReference` | Required opaque text, preserving punctuation, leading `=` and zeros; not an asset/sensor ID. |
| Meldetext | `sourceMessageText` | Required text; not proof of a root cause or a globally unique message definition. |
| Typ | `sourceMessageType` | Required opaque text; no undocumented enum, filter or severity conversion. |
| Meldegruppe | `sourceMessageGroup` | Required opaque text; not an equipment-parent relation. |
| Scoped mapping | `sectorKey`, `classificationStatus` | Configured key and `mapped`, or null key and `unclassified`; label is configuration/presentation data. |

Trim only leading/trailing ASCII spaces and tabs from normalized cells; preserve
unmodified originals through RAW. All seven cells must be nonempty after that trim.
Keep internal whitespace, spelling, accents, punctuation and case. No numerical
conversion of equipment/type/group strings, message exclusion or asset resolution
is implied. Unknown but nonempty type/group values remain source data.

The ingestion grain is **one source aggregate per input record** under one scoped
source/reporting date, carrying the five source dimensions above. The sample has
no repeated five-dimension tuple, but does not prove exporter grouping uniqueness.
Preserve repeated tuples and identical records separately, flag them for review
and include their reported measures; never silently deduplicate or expand records
into occurrences. Tuple equality is not a safe event identity or import key.
The source's handling of collective/nested alarms is unverified; sums describe
reported frequencies and durations, not necessarily distinct physical incidents.

## Numbers, duration and reporting coverage

Frequency accepts only ASCII digits (`[0-9]+`) after the documented outer trim.
Zero is valid. Reject signs, decimal/thousands separators, fractions, exponent
notation, nonfinite values and coercion to missing/zero. Leading zeros in counts
are allowed; their spelling remains in RAW.

Duration accepts `[0-9]+ [0-9]{1,2}:[0-9]{2}:[0-9]{2}`: days, one ASCII space,
hours 0–23, minutes 00–59, seconds 00–59. Days are elapsed units of 86,400 seconds,
not civil calendar days. Compute exactly:

`accumulatedAlarmSeconds = days × 86400 + hours × 3600 + minutes × 60 + seconds`.

Reject negative values, decimal seconds, other separators and out-of-range clock
components; do not carry or round invalid components. Require each normalized
measure, intermediate calculation and analytical sum to remain within
0–9,007,199,254,740,991 inclusive; detect overflow before losing integer precision.
This is a POC exact-integer contract, not a choice of database column type.
Minutes are a derived display quantity (`seconds / 60`); aggregate seconds before
formatting/rounding. Do not multiply accumulated duration by reported frequency.
The missing legacy `dauer_to_minutes` function has not been inspected, so its
rounding and invalid-input behavior are not claimed to match this contract.

Require the original upload basename to match `Hitliste-YYYYMMDD.csv` exactly,
with a real Gregorian date in years 0001–9999. Reject path components, invalid
dates, alternate prefixes/extensions and extra suffixes. Filename is metadata,
never a storage path. `Hitliste-20260701.csv` yields `2026-07-01` for every row.
If an upload date selector is later provided, require equality; neither value
silently overrides the other. That selector is optional POC UI scope.

Record `reportingWindowStatus = unknown`; occurrence instants, source-window zone
and start/end bounds remain absent. A configured site zone does not prove the
exporter's window or zone. Import time is separate. Filter these aggregates by
their reporting-date labels, never by fabricated midnight instants or partial
shifts. No assumed 24-hour coverage, downtime, availability or failure rate follows.
Missing dates mean missing imports, not zero faults. Durations can overlap and
their sum may exceed the elapsed reporting window.

## Sector mapping and historical interpretation

The supplied Power BI `Arbeit Sektor` expression maps explicit area lists into
five reporting sectors with `Nicht klassifiziert` as its fallback label. Preserve
those customer-provided lists in local organization/site/source configuration when
IOP-049 is delivered; do not put the lists or labels into generic core code or
fictional seeds. This task does not create live mapping configuration.

For the POC contract, compare the trimmed area and configured keys exactly and
case-sensitively; apply the same outer-trim rule to both. No substring matching,
case folding, internal-space collapse or punctuation guessing. This is explicit
IOP behavior, not a claim of complete equivalence to DAX `TRIM` or its comparison
semantics. Reconcile the actual supplied lists in IOP-049, exposing differences
instead of silently introducing aliases. Reject duplicate normalized mapping keys
and contradictory sector assignments before import, rather than relying on list order.

An unmatched nonempty area is a valid aggregate with `classificationStatus =
unclassified` and null `sectorKey`; retain it in overall totals and the unclassified
filter group. Use English `Unclassified` by default; the supplied German label may
remain scoped display data. A missing required area is instead invalid input.
Freeze the applied mapping revision and classification with each import. Editing
configuration affects future imports only; historical reclassification/replacement
requires separately authorized correction work and is outside this POC contract.

## Admission and validation outcomes

Publish analytical data only when the entire file is structurally and semantically
valid, with valid scope/configuration and an available reporting date. One invalid
record rejects the file's analytical admission; valid-looking rows are not partially
published. Preserve bounded diagnostics/RAW evidence under the storage contract,
without treating a rejected attempt as imported coverage. A corrected failed attempt
may retry the same date if no successful import owns it.

Reject a previously imported `(organizationId, siteId, sourceId, reportingDate)`
even if the filename/content changed. No automatic append, replacement or overwrite.
Concurrent submissions must admit at most one successful import for that tuple;
transaction/uniqueness mechanics belong to IOP-042/047. Another configured source
or site has its own date namespace. A checksum alone cannot implement this rule.
Renaming old content to a different valid date cannot prove the label correct;
content duplication across dates remains a visible review limitation.

| Outcome | Required observable behavior |
| --- | --- |
| Valid mapped file | Admit all records; reconcile record count, frequency and exact seconds with contributing RAW lines. |
| Valid file with unmapped areas or repeated tuples | Admit all records with quality warnings/counts; preserve totals and record identities. |
| Invalid encoding/header/quoting/shape/date/value | Reject analytical admission; report a bounded reason and line/neutral field where identifiable. No coercion or row loss. |
| Missing/foreign scope, invalid mapping configuration | Stop admission; no fallback site/source or first-match mapping. |
| Reporting-date conflict | Reject without changing existing data; future HTTP boundary uses the accepted conflict convention. |
| Budget/overflow/processing failure | Stop without partial analytics; retain bounded safe diagnostics and make retry outcome clear. |

Successful runs reconcile `dataRecordCount = admittedRecordCount`, with zero
invalid records, separately counted blank lines and counts of unclassified/repeated
records. Rejected runs admit zero records; distinguish inspected valid/invalid
records and, if processing stopped early, unknown/unprocessed remainder. Never
claim a complete row count after an early decode/size/structural failure. Errors
identify code, record number and field, not raw rows, equipment values or server paths.
Unclassified/repeated counts may overlap and are not an extra additive row total.

Before runtime delivery, declare finite limits for actual bytes, rows, seven columns,
field/record length, processing time, retained diagnostics and temporary storage,
with units, defaults, allowed maxima and at/over-boundary tests under IOP-014.
These numeric operational limits remain delivery choices; this document is not
permission to enable an unbounded upload. The inspected file is evidence of format
and size, not a performance target. Retain original bytes and scoped provenance
under IOP-011/041; storage layout, cleanup and cross-module atomicity remain there.

## Manual design walkthroughs and delivery handoff

These synthetic expectations were checked as document arithmetic/scenarios, not
executed importer tests:

| Input/scenario | Expected result |
| --- | --- |
| Frequency `2`, duration `0 0:01:30` | 2 reported occurrences; 90 seconds, 1.5 minutes. |
| Second row frequency `3`, duration `1 2:03:04` | 3 reported occurrences; 93,784 seconds. Combined: 5 and 93,874 seconds, without per-row rounding. |
| `0` and `0 0:00:00` | Valid zeros; do not infer complete coverage. |
| `1.5`, `-1`, empty frequency; `0 24:00:00`, `0 0:60:00` | Reject file; no truncation, missing-value coercion or carry. |
| Quoted synthetic message `"Fault; check ""A"""` | One message cell containing the semicolon and literal quotes; multiline version rejected. |
| Impossible filename date or optional selected-date mismatch | Reject before analytical admission. |
| One bad row among two otherwise valid rows | Admit zero; expose validation outcome, preserve bounded evidence. |
| Same five dimensions on two rows | Retain two contributing records and sum both, with repeated-tuple warning. |
| New area missing from mapping | Keep its frequency/seconds in totals and the unclassified group. |
| Concurrent valid imports for the same scoped date | Exactly one may become a successful import; the other cannot duplicate facts. |

IOP-045/046 deliver parser/conversion and rejection tests; IOP-041/042/047 deliver
RAW/import lifecycle and concurrency evidence; IOP-049 delivers configured mapping
reconciliation; IOP-125 and analytics delivery supply synthetic expected totals and
overview/detail reconciliation. No adjacent story is activated or completed here.
Exact exporter grouping, reporting-window boundaries and legacy conversion parity
remain unverified; they do not block honest source-date aggregate presentation.

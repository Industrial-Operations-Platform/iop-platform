# Synthetic analytical POC fixtures

Static, entirely fictional data for [IOP-125](../../docs/planning/items/IOP-125-demo-events.md),
following the [source contract](../../docs/architecture/csv-source-contract-poc.md).
These are reviewable inputs and a literal expected-results oracle, not an importer,
seed command or runtime configuration format. No production data is included.

## Use and scope

Use `scope.json` as the explicit fictional organization/site/source and mapping
context for future importer tests. Its IDs are fixture identifiers, not references
to an existing database. IOP-123 must bind or seed the intended demo scope before
runtime use; configure the supported source separately during importer delivery.
No implicit site selection, principal, grants or database access is supplied here.
ADR-0018 remains Proposed. IOP-103 must validate these files through the real
importer when available; this delivery does not claim that validation.

Upload each CSV using its basename, not its containing scenario directory.
The supported files use UTF-16 LE with BOM, semicolons and CRLF. The deliberately
wrong-encoding file is UTF-8 without BOM. Do not resave CSVs in a spreadsheet:
that may change encoding, quoting and equipment references beginning with `=`.
All seven source header names remain verbatim external fields.

## Known results

Import only `valid/Hitliste-20260701.csv` and `valid/Hitliste-20260703.csv` for the
baseline below. The first has a whitespace-only physical line 4 and six records;
the second has three records. `expected.json` records literal, independently
authored normalized rows, date/sector totals, filter checks and rejection outcomes.
Each row array is ordered as:

`[sourceRecordNumber, reportedFrequency, accumulatedAlarmSeconds, sourceArea,
sourceEquipmentReference, sourceMessageText, sourceMessageType, sourceMessageGroup,
sectorKey]`.

A null sector means `unclassified`; otherwise classification is `mapped`. Repeated
tuple groups list every member, rather than choosing an ambiguous duplicate count.
Physical line numbers include the header and ignored blank lines.

| Selection | Records | Reported frequency | Accumulated alarm seconds |
| --- | ---: | ---: | ---: |
| 2026-07-01 | 6 | 12 | 94055 |
| 2026-07-03 | 3 | 7 | 3720 |
| Both dates | 9 | 19 | 97775 |
| Preparation (`alpha`) | 4 | 9 | 300 |
| Dispatch (`beta`) | 2 | 5 | 97384 |
| Unclassified | 3 | 5 | 91 |

Independent arithmetic: the first file's durations are
`90 + 93784 + 0 + 30 + 90 + 61 = 94055`; the second is `120 + 3600 + 0 = 3720`.
The day-bearing duration is `86400 + 7200 + 180 + 4 = 93784` seconds.
The baseline has 19 reported occurrences, not nine events. Do not multiply seconds
by frequency. Overview and detail must reconcile to the same contributing lines.
The two literal filter checks combine area/equipment/message and all five filters.

`Area A` maps after ASCII outer trimming; lowercase `area a` and `Area X` remain
unclassified. Nonempty unknown type `X` is valid. Leading zeros in equipment/type/
group remain text; frequency `001` normalizes to 1. Quoted semicolons and escaped
quotes are part of a single message. Identical records at lines 2 and 7 on July 1
both contribute. Zero measures are valid.

Every reporting window remains unknown. July 2 is missing coverage, not a zero
period. Site time zone is not proof of source-window bounds. No occurrence times,
individual events, physical assets, downtime, availability or 24-hour coverage
are inferred, even when accumulated duration exceeds one day.

## Admission scenarios for later IOP-103 validation

1. Import both valid files into the explicit scope: match the baseline oracle.
2. Re-upload July 1: reject the scoped reporting-date conflict; baseline unchanged.
   Upload `duplicate-changed/Hitliste-20260701.csv` after that success: also reject,
   despite changed bytes (its standalone measures would be 99 and 60 seconds).
3. `renamed-content/Hitliste-20260704.csv` is byte-identical to July 1 but has a new
   valid reporting label. The contract does not prohibit it solely by checksum:
   in a separate scenario it adds six records, 12 and 94055, giving 15 records,
   31 and 191830 overall. This exposes the unverified-date limitation; do not include
   it in the baseline. An arbitrary renamed basename outside the exact filename
   profile is rejected. A second admission of any successful scoped date conflicts.
4. Each `invalid/` file rejects the entire analytical admission, yielding zero
   admitted records and no new coverage. The value/shape files deliberately place
   the bad record between two valid records. Diagnostic reason labels in
   `expected.json` describe fixtures, not a new API error-code catalog. Null line
   numbers mean no specific row assertion. Do not assume all rows were inspected
   after a structural or decoding failure.
5. An invalid July 2 attempt must not reserve that date: subsequently upload a
   copy of a valid fixture with basename `Hitliste-20260702.csv` in an isolated
   scenario and expect admission if the date remains unused. This relabeling is
   synthetic test setup, not evidence of real source coverage.

Missing/foreign scope, concurrency, configured budgets, RAW durability and safe
reset still require real importer/storage/security tests in their owning stories.
This bounded corpus is not an exhaustive parser conformance or performance suite.
It supplies no reset operation and does not change any runtime behavior.

# POC accumulated alarm duration

Definition and validation handoff for [IOP-091](../planning/items/IOP-091-downtime.md),
limited to the [analytical POC](scope-poc.md). This specializes the accepted
[query contract](../architecture/analytics-query-poc.md) and
[aggregate contract](../architecture/event-aggregates-poc.md); no new formula,
architecture or runtime implementation is introduced.

## Definition and units

For the complete selected set of admitted OIP facts, accumulated alarm duration is
`sum(accumulatedAlarmSeconds)`, in **seconds**. Each scoped source line contributes
once, including repeated tuples and unclassified records unless explicitly filtered.
The source already accumulates each row's duration: never multiply it by frequency,
deduplicate equal rows, cap it to a day or infer elapsed plant downtime. No relation
requires frequency and duration to be positive together.

The [CSV contract](../architecture/csv-source-contract-poc.md) owns parsing in the
Integrations adapter. After ASCII outer trimming, the supported duration is
`[0-9]+ [0-9]{1,2}:[0-9]{2}:[0-9]{2}` with hours 0–23 and minutes/seconds 00–59.
Compute `days × 86400 + hours × 3600 + minutes × 60 + seconds` exactly; a day here
is an elapsed unit, independent of civil days, site zones or daylight saving.
Preserve the original decoded duration cell and scoped RAW/physical-line reference.
Negative, fractional, missing or invalid components reject admission; never carry,
round or coerce them to zero. For example, `1 2:03:04` is 93,784 seconds, while
`0 24:00:00` and `0 0:60:00` are invalid.

Each measure and total must remain in 0–9,007,199,254,740,991 inclusive. Zero is
valid. Detect overflow before precision is lost; a query total beyond that range
uses `analytics_total_out_of_range`, with no rounded, partial or zero substitute.
An invalid source value fails admission under the source contract.

Display “Accumulated alarm duration” and an explicit unit. Seconds are authoritative;
minutes (`seconds / 60`) are a display conversion after summing exact seconds.
Never sum rounded per-row minutes. The baseline 97,775 seconds equals
1,629 minutes 35 seconds (27 hours 9 minutes 35 seconds); do not wrap at 24 hours.
Downtime, availability, rates, interval overlap removal and proportional shift
allocation are unavailable from this aggregate source and outside this slice.

## Selection, coverage and traceability

Use one authorized organization/site/source, reporting-label range and complete
[ADR-0023 selection](../architecture/adr/ADR-0023-poc-analytics-filters.md).
Apply every inclusion/exclusion before summing the full result, independent of
detail page size or top-N presentation. Overview and detail consume the same
server total and `dataRevision` under
[ADR-0028](../architecture/adr/ADR-0028-poc-analytics-query-consistency.md).
Refresh on revision changes before comparing totals or continuing pages.

Carry units, applied filters, contributing record count and coverage with totals:

- No admitted dates: “No imports”; an empty sum does not establish zero alarms.
- Admitted dates without selected records: “No matching records”.
- Matching zero-valued records: show zero with the contributing count.
- Partly imported range: show observed totals and missing reporting labels; do not
  fill missing dates with zero or extrapolate full-period duration.

Keep `reportingWindowStatus: unknown`; filename labels and site zones do not prove
24-hour windows or occurrence timestamps. Overlapping alarms remain possible.
All contributing lines retain source dimensions, original duration and provenance.
Analytical access requires current `analytics.read`; original RAW retrieval separately
requires `imports.review`. This metric adds no alternative authorization path.

## Literal reconciliation matrix

Use the fictional [fixtures and independent oracle](../../fixtures/analytical-poc/README.md).
Unless stated otherwise, select `[2026-07-01, 2026-07-04)`. Names identify fixture
tuples; runtime requests use scoped opaque references. `Jam` means `(Jam, 01, 007)`.

| Selection / scenario | Records | Seconds | Evidence required |
| --- | ---: | ---: | --- |
| Both admitted dates | 9 | 97,775 | 94,055 + 3,720; July 2 remains missing. |
| July 1 only | 6 | 94,055 | 90 + 93,784 + 0 + 30 + 90 + 61; repeated lines 2 and 7 both count. |
| July 3 only | 3 | 3,720 | 120 + 3,600 + 0. |
| Sector alpha / beta / unclassified | 4 / 2 / 3 | 300 / 97,384 / 91 | Partitions reconcile to nine records and 97,775 seconds. |
| Area A, equipment =EQ-001, message Jam | 3 | 300 | July 1 lines 2 and 7, July 3 line 2. |
| July 1, beta, Area B, =EQ-002, message (Fault; check "A", X, 008) | 1 | 93,784 | Preserve every restriction and duration above one day. |
| Exclude message Jam | 6 | 97,475 | Exclusion visible in both views; 97,775 minus 300. |
| Area A, =EQ-003, message (Idle, 01, 007) | 1 | 0 | Matching zero, distinct from missing coverage. |
| Sector beta AND Area A | 0 | 0 | No matches; both admitted dates remain available. |
| July 2 only | 0 | 0 | No imports, not a zero-alarm period. |
| Reject duplicate July 1 or invalid July 2 attempt | 9 | 97,775 | No new measures, admitted coverage or revision. |
| Page size 2 across all data | 9 across 5 pages | 97,775 | Every response retains full totals; sum each contributing record once. |

The last two rows require production-path validation; oracle arithmetic does not
prove rejection, pagination or persistence. Also verify exact maximum and maximum
plus one, both individual values and sums; zero frequency with positive duration
and positive frequency with zero duration remain valid under the aggregate contract.
Those extra boundary cases are separate synthetic scenarios, not claims about the
nine-row baseline. Reuse IOP-089's access-denial, revoked-grant, foreign-reference,
revision-change and browser-zone/DST checks without introducing another query layer.

## Delivery handoff

Executable IOP-089 queries, production OIP publications/facts and ADR-0018 host
activation are pending. After delivery, reconcile this matrix through the actual
persisted query, overview/detail and all contributing pages on one selection/revision.
Run `npm test`, `npm run test:database` and relevant HTTP/browser checks, recording
actual dataset size and timings. Existing parser checks and independent arithmetic
validate conversion expectations only; they do not complete IOP-091 or the POC.

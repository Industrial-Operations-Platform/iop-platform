# POC source equipment analytics

Specification and validation handoff for [IOP-094](../planning/items/IOP-094-asset-analytics.md),
limited to the [local POC](scope-poc.md). Reuse the accepted
[query contract](../architecture/analytics-query-poc.md),
[aggregate equality](../architecture/event-aggregates-poc.md) and
[shared selection](../architecture/adr/ADR-0023-poc-analytics-filters.md).
This specifies the bounded source-equipment contract. IOP-147/148 deliver its
connected runtime views/grouped reporting; this design text is not executable evidence.

## Equipment and contributing messages

Within one authorized organization/site/source, partition selected facts by the
exact normalized pair `(sourceArea, sourceEquipmentReference)`. Display both
components to disambiguate repeated designations. Use OIP-issued opaque references
under [ADR-0028](../architecture/adr/ADR-0028-poc-analytics-query-consistency.md),
never labels or browser-concatenated strings as selectors. Preserve case, internal
whitespace, punctuation and leading zeros after the source adapter's normalization.
An equipment designation in another area is a separate group; no physical asset,
sensor identity, surveyed location or asset registry is inferred or required.

Each group shows the existing [Event frequency](event-frequency-poc.md) in reported
occurrences, [Accumulated alarm duration](alarm-duration-poc.md) in seconds, and
contributing record count separately. Sum exact measures after all filters and
exclusions across all matching facts, including repeated lines, unclassified facts
and zero-valued records. Equipment groups partition the full selected result:
all group measures and counts must reconcile to the overview totals independently
of pagination. Never count rows as occurrences, multiply duration by frequency,
cap duration at a day or sum rounded display values.

Within selected equipment, retain each contributing message's exact tuple
`(sourceMessageText, sourceMessageType, sourceMessageGroup)` and source records.
Equal text with different type/group remains distinguishable; the same message may
contribute under multiple equipment pairs. Message selection alone may span those
pairs; equipment drill-down keeps its equipment restriction when selecting a message.
Any displayed message subtotals partition that equipment's selected facts, not an
additional measure to add to equipment totals. Keep original duration, reporting
label, frozen classification, scoped import/RAW identity and physical line number.
Do not deduplicate repeated message rows or interpret correlation as root cause.

Sector is frozen membership on each fact, not equipment identity. Retain unmapped
areas and their equipment in all-data totals. An explicit unclassified filter
selects them; a literal mapped sector label “Unclassified” is distinct. Historical
mapping changes may place the same equipment pair in different sector selections;
never reclassify history from current configuration or count one fact twice.

## Selection, coverage and safe outcomes

Sector → area → equipment → message/contributing records narrows the shared
selection, preserving reporting labels, exclusions and unrelated filters.
Breadcrumb return restores the previous selection; ordinary overview/detail
navigation preserves it. Reset follows the shared latest-admitted-date rule.
Keep valid incompatible filters visible with no matching records; never clear
them automatically to populate an equipment group.

Use the same applied filters and `dataRevision` for overview, groups and records.
Reset cursors after filter changes; refresh after revision changes. Loading, failed
or late responses cannot relabel old totals with a new selection. A display subset
or contributing page is never the full total; expose remaining groups/records
without silently truncating results. Bounded grouped transport and presentation
are delivered by IOP-089/147/148 under the query contract.
Do not build a parallel browser aggregation of one detail page.

Coverage is based on admitted publications before dimension filters. Distinguish
“No imports”, “No matching records” and actual matching zero measures. Show missing
reporting labels and unknown source windows; do not claim zero-fault days, complete
24-hour coverage, downtime, availability or distinct physical incidents.

Require current `analytics.read`, exact scope/source ownership and forced RLS for
every read/page. Original-file retrieval separately requires `imports.review`.
Equipment/message references and cursors never grant access. Reuse the query
contract's safe errors for unknown/foreign/wrong-kind references, changed revision,
invalid input, unavailable persistence and exact-total overflow. Reject unsupported
sums without partial totals even if each equipment group fits the integer range.

## Literal reconciliation matrix

Use only the two valid [synthetic CSVs and independent oracle](../../fixtures/analytical-poc/README.md),
with range `[2026-07-01, 2026-07-04)` unless stated otherwise. Labels identify
fixture tuples, not runtime selectors. July 2 remains missing.

| Equipment pair | Message tuple | Records | Reported occurrences | Seconds |
| --- | --- | ---: | ---: | ---: |
| Area A / =EQ-001 | (Jam, 01, 007) | 3 | 9 | 300 |
| Area A / =EQ-003 | (Idle, 01, 007) | 1 | 0 | 0 |
| Area B / =EQ-002 | (Fault; check "A", X, 008) | 2 | 5 | 97,384 |
| Area X / =EQ-004 | (Unmapped alarm, X, 009) | 2 | 4 | 30 |
| area a / =EQ-005 | (Case-sensitive area, 01, 007) | 1 | 1 | 61 |
| Full selection | All contributing messages | 9 | 19 | 97,775 |

Each baseline equipment pair happens to have one message tuple; that is fixture
data, not a one-message-per-equipment invariant.

| Selection / action | Expected contributing result |
| --- | --- |
| Area A → =EQ-001 → (Jam, 01, 007) | July 1 lines 2 and 7 and July 3 line 2: 3 records, frequency 9, seconds 300. Repeated lines remain distinct. |
| Return from =EQ-001 to Area A | Restore both Area A equipment pairs: 4 records, frequency 9, seconds 300, including the Idle zero record. |
| Area A / =EQ-003 | 1 matching record with zero frequency and seconds; keep this equipment group visible. |
| Unclassified sector | Area X / =EQ-004 and area a / =EQ-005: 3 records, frequency 5, seconds 91. |
| Exclude (Jam, 01, 007) | =EQ-001 has no matching group; the other four pairs remain, including =EQ-003 at zero. Full result: 6 records, frequency 10, seconds 97,475. |
| July 1, beta, Area B, =EQ-002, (Fault; check "A", X, 008) | July 1 line 3: 1 record, frequency 3, seconds 93,784. Preserve all five restrictions. |
| Area A AND equipment (Area B, =EQ-002) | No matching records or groups; both admitted dates still visible. |
| July 2 only | No imports or groups; no zero-fault claim. |
| All-data contributing page size 2 | Five pages reconcile 9 records, frequency 19 and seconds 97,775; equipment totals are independent of page size. |

Additional runtime cases must use separate synthetic scenarios: the same designation
in two areas or sources; case/leading-zero distinctions; several message tuples on
one equipment, including equal text with different type/group; one message across
multiple equipment pairs; changed historical sector mapping; admitted empty
publication; invalid/foreign references and revoked grants; overflow; changed
revision between pages; duplicate/invalid import leaving all groups unchanged.
The baseline arithmetic does not prove those runtime outcomes.

## Delivery evidence

Storage, queries, host activation and connected views are delivered under
[IOP-147](../planning/completed/IOP-147-working-analytical-poc-plan.md). Actual
PostgreSQL/HTTP/browser checks reconcile the baseline and cover tuple identity,
historical mappings, zero/empty selections, revisions, overflow and access denial.
The CSV contract rejects an empty file; an admitted empty publication cannot be
created by this importer. Bounded top-100 group presentation retains full totals;
paged dimension options provide access to any remaining group. No physical asset
registry, legacy pipeline execution parity or additional metric is claimed.

# POC area analytics

Specification and validation handoff for [IOP-095](../planning/items/IOP-095-area-analytics.md),
limited to the [local analytical POC](scope-poc.md). Reuse the accepted
[query contract](../architecture/analytics-query-poc.md),
[aggregate equality](../architecture/event-aggregates-poc.md) and
[shared selection](../architecture/adr/ADR-0023-poc-analytics-filters.md).
This defines expected results, not an implemented view or grouped response API.

## Comparison meaning

For one authorized organization/site/source and applied reporting-label selection,
partition all matching facts by exact normalized source area. Each group shows
“Event frequency” in reported occurrences, “Accumulated alarm duration” in seconds,
and contributing record count separately. Use the existing
[frequency](event-frequency-poc.md) and [duration](alarm-duration-poc.md) definitions:
sum exact measures after every inclusion/exclusion, retaining repeated lines and
zero-valued facts. Never count rows as occurrences or multiply duration by frequency.
The sum of all area groups must equal the full selected totals for both measures
and record count. Never calculate group totals from a contributing-record page.

Area identity is the scoped exact normalized source string; `Area A` and `area a`
are different. Use OIP-issued opaque area references for selection, with labels
only for display. Source areas are not physical locations, sites or surveyed assets.
Unknown sector mapping does not mean unknown area: keep each unmapped area visible,
including its measures, and expose the explicit unclassified sector selection.
Invalid empty area values fail source admission rather than creating a silent bucket.

Sector comparison uses each fact's frozen configured sector key or the unclassified
variant. It is an alternative partition of the same selected facts, not an extra
set to add to area totals. A mapped sector labeled “Unclassified” remains distinct
from unmapped membership. Do not impose a hall/sector hierarchy in the generic core.
If an area's classification changes between imports, an all-sector area group spans
those facts; a selected sector restricts it to the matching historical membership.
Never reclassify history from the current configuration or count one fact twice.

A simple comparison can order groups by either existing measure, descending, with
ties ordered by opaque dimension reference bytewise. Show the chosen measure and
units; do not infer causality or define another KPI. Keep zero-valued matching
groups visible. If presentation limits visible groups, label that subset, keep full
totals separate and provide access to the remaining groups; a top-N sum is never the
selected total. A generic ranking engine, Pareto, rates and percentages are not POC
requirements. Chart type and grouped transport/bounds remain delivery details to
resolve before runtime implementation within IOP-089's accepted boundary.

## Selection, navigation and safe states

Both views retain canonical filters and the same `dataRevision` under
[ADR-0028](../architecture/adr/ADR-0028-poc-analytics-query-consistency.md).
Drilling into a sector or area adds/narrows that dimension; preserve reporting dates,
equipment/message filters and exclusions. An area click opens its contributing
context without requiring physical equipment identity. Source equipment is identified
by the area/equipment pair; message identity includes text, type and group.
Breadcrumb return restores the previous selection; ordinary view navigation preserves
the current one. Reset follows the shared latest-admitted-date rule, not all history.

Keep applied restrictions visible. Incompatible valid filters remain empty; do not
clear them automatically. A failed or late response cannot place old group totals
under new filter labels. Revision changes require refresh before comparing views
or continuing contributing pages. Keep RAW/import and physical-line references;
original-file retrieval separately requires `imports.review`.

Coverage comes from admitted publications before dimension filters. Distinguish
“No imports”, “No matching records” and matching zero measures. Show missing labels
and unknown reporting windows alongside observed totals; no invented zero-fault days,
24-hour coverage, downtime or availability. Duration may exceed one day. Convert
seconds for display only after summing; do not sum rounded row values.

Reuse current `analytics.read`, exact scope/source ownership, forced RLS and the
query contract's validation, overflow and revision errors. No browser reference,
chart group or cursor grants authority. Unknown/foreign references fail safely
without leaking labels or silently broadening selection. A total exceeding the
exact integer range fails explicitly, even if individual groups fit.

## Literal reconciliation matrix

Use only the two valid [synthetic CSVs and independent oracle](../../fixtures/analytical-poc/README.md).
Select `[2026-07-01, 2026-07-04)` unless stated otherwise. Tuple labels below are
fixture data, not runtime selectors. July 2 is missing in every all-date case.

| Area partition | Records | Reported occurrences | Seconds |
| --- | ---: | ---: | ---: |
| Area A | 4 | 9 | 300 |
| Area B | 2 | 5 | 97,384 |
| Area X | 2 | 4 | 30 |
| area a | 1 | 1 | 61 |
| Full selection | 9 | 19 | 97,775 |

Frequency order is Area A, Area B, Area X, area a; duration order is Area B,
Area A, area a, Area X. The two measures need not prioritize the same areas.

| Selection / action | Expected contributing result |
| --- | --- |
| Sector alpha / beta / unclassified | Respectively 4/2/3 records, frequency 9/5/5, seconds 300/97,384/91. Unclassified contains Area X and area a separately. |
| Click Area A | July 1 lines 2, 5, 7 and July 3 line 2: 4 records, frequency 9, seconds 300. Repeated lines and the zero record remain. |
| Area A then equipment =EQ-001 and message (Jam, 01, 007) | July 1 lines 2, 7 and July 3 line 2: 3 records, frequency 9, seconds 300. Return restores the 4-record area selection. |
| Exclude message (Jam, 01, 007) | Area A retains 1 zero record; B, X and area a unchanged. Full result: 6 records, frequency 10, seconds 97,475. |
| July 1, beta, Area B, =EQ-002, message (Fault; check "A", X, 008) | 1 record at physical line 3, frequency 3, seconds 93,784. Every restriction survives drill-down. |
| Beta AND Area A | No matching records; no groups and empty sums, with both admitted dates still visible. |
| July 2 only | No imports; no groups. This is not evidence of zero faults. |
| All-data detail with page size 2 | Five pages together reconcile 9 records, frequency 19, seconds 97,775; all area totals remain independent of each page. |

Additional runtime cases: admitted empty publication, tied group measures, the same
area under two historical sector mappings, a literal mapped “Unclassified” label,
foreign/wrong-kind reference, revoked grant, total overflow, changed revision between
pages, and duplicate/invalid import leaving every group unchanged. These are separate
synthetic scenarios, not claims about the baseline nine records.

## Delivery gates

IOP-026's site seed exists. IOP-090/091 supply metric definitions, but executable
IOP-089 queries, production OIP publications/facts and ADR-0018 host activation remain
pending. Define the bounded grouped response and verify it against this matrix before
connecting the view; do not aggregate a browser page or add a parallel query engine.
A new architectural mechanism needs a Proposed ADR and owner acceptance first.

After those prerequisites, run `npm test`, `npm run test:database` and relevant
HTTP/browser checks through the real authorized path, including denial, navigation,
coverage and revision cases. Record dataset size and observed timings. Arithmetic
validation of these expectations does not prove persisted queries, authorization,
UI behavior or completion of IOP-095/the POC.

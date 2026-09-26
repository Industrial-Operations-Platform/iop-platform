# POC event frequency KPI

Definition and validation handoff for [IOP-090](../planning/items/IOP-090-event-frequency.md),
limited to the [analytical POC](scope-poc.md). This specializes the already accepted
[IOP-089 query contract](../architecture/analytics-query-poc.md); it introduces no
new formula or architecture. Runtime queries and persisted-path reconciliation
remain pending.

## Definition

For the complete selected set of admitted OIP facts, frequency is
`sum(reportedFrequency)`, in **reported occurrences**. Contributing record count
is a separate quantity. The [aggregate contract](../architecture/event-aggregates-poc.md)
defines one fact per scoped import/data line, not per physical incident.
Identical dimension tuples on distinct lines contribute fully; unclassified facts
remain included unless an explicit active filter excludes them. Failed or rejected
attempts contribute nothing; duplicate reporting-date rejection cannot add facts.

Use one organization/site/source, reporting-label range and canonical selection
under [ADR-0023](../architecture/adr/ADR-0023-poc-analytics-filters.md). Sum after
all inclusion and exclusion filters, across the full result, never a detail page
or top-N subset. Overview and detail consume the same server total, selection and
`dataRevision` under [ADR-0028](../architecture/adr/ADR-0028-poc-analytics-query-consistency.md).
A changed revision requires refresh before comparing totals or continuing pages.
Source column names and customer classifications remain adapter/configuration data.

Nonnegative integers, including zero, are valid. The exact upper bound is
9,007,199,254,740,991 for each value and the total. Detect overflow before precision
is lost; use the accepted `analytics_total_out_of_range` outcome, never a rounded,
partial or zero replacement. Invalid source measures fail admission rather than
being silently omitted. The query contract owns transport/error implementation.

The displayed label is “Event frequency”, with unit “reported occurrences” and
an explanation that source aggregates can overlap. This is not a failure rate,
distinct incident count, uptime measure or duration-derived metric. No denominator,
target, percentage change or new ranking calculation is defined by this story.
Accumulated alarm duration remains the separate IOP-091 measure.

## Coverage and traceability

Always carry the query contract's coverage and limitations with the total:

- No admitted dates: “No imports”; do not interpret a numerical empty sum as zero faults.
- Admitted dates but no matches: “No matching records”, preserving active filters.
- Matching records with zero frequency: show zero and the nonzero contributing count.
- A partly imported range: show the observed total and missing reporting labels;
  do not fill gaps as zero-fault days or extrapolate a complete-period result.

Reporting labels and site zone do not establish source-window bounds; retain
`reportingWindowStatus: unknown`. Drill-down preserves scoped RAW/import and original
physical-line references for every contributing record. RAW retrieval separately
requires `imports.review`; analytical access requires current `analytics.read`.
The KPI adds no alternative data-access path or authorization mechanism.

## Literal reconciliation matrix

Use the fictional [CSV fixtures and oracle](../../fixtures/analytical-poc/README.md),
with all-data range `[2026-07-01, 2026-07-04)` unless a date is stated. Names below
identify fixture tuples only; runtime requests use scoped opaque references.
The message `Jam` here means the complete tuple `(Jam, 01, 007)`.

| Selection / scenario | Contributing records | Frequency | Evidence required |
| --- | ---: | ---: | --- |
| Both admitted dates | 9 | 19 | July 1 contributes 12, July 3 contributes 7; July 2 stays missing. |
| July 1 only | 6 | 12 | Frequencies 2 + 3 + 0 + 4 + 2 + 1; repeated lines 2 and 7 both count. |
| July 3 only | 3 | 7 | Frequencies 5 + 2 + 0. |
| Sector alpha / beta / unclassified | 4 / 2 / 3 | 9 / 5 / 5 | Partition totals reconcile to 9 records and 19 occurrences. |
| Area A, equipment =EQ-001, message Jam | 3 | 9 | July 1 lines 2 and 7, July 3 line 2. |
| July 1, beta, Area B, =EQ-002, message (Fault; check "A", X, 008) | 1 | 3 | July 1 line 3; all restrictions preserved. |
| Exclude message Jam | 6 | 10 | 19 minus 9; exclusion visible in both views. |
| Area A, equipment =EQ-003, message (Idle, 01, 007) | 1 | 0 | A real matching zero record, not missing coverage. |
| Sector beta AND Area A | 0 | 0 | No matching records; both admitted dates remain available. |
| July 2 only | 0 | 0 | No imports for this selection, not evidence of zero faults. |
| Reject duplicate July 1 or an invalid July 2 attempt | 9 | 19 | No admitted facts or added coverage/revision from that attempt. |
| Page size 2 across the all-data selection | 9 across 5 pages | 19 | Each response retains the full total; sum every contributing page once. |

The last two rows are future production-path assertions. Oracle arithmetic alone
does not prove rejection, pagination, authorization or persistence.

Additional runtime gates: exact maximum accepted; maximum plus one fails without
partial results; foreign scope/source/reference and revoked grants deny safely;
concurrent successful import invalidates old-revision requests; browser zone/DST
changes do not change reporting-label membership. Reuse IOP-089's full query test
matrix rather than building another query or fixture-only production substitute.

## Delivery handoff

IOP-089 must supply executable authorized queries backed by production OIP
publications/facts; ADR-0018 host activation independently gates runtime access.
Then validate the frequency matrix with `npm test`, `npm run test:database` and
relevant delivered HTTP/browser checks. Record actual timings and dataset size,
without introducing a performance target. Runtime completion requires overview,
detail and all contributing records to reconcile on the same selection/revision.
The completed specification does not complete IOP-090 or the end-to-end POC.

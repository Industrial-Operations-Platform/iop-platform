# POC analytics query contract

Accepted design for [IOP-089](../planning/items/IOP-089-analytics-query-layer.md)
under [ADR-0028](adr/ADR-0028-poc-analytics-query-consistency.md), approved by the
owner on 2026-09-26. No query service,
endpoint or production OIP storage is delivered. Scope is the
[local POC](../product/scope-poc.md); reuse [aggregate equality](event-aggregates-poc.md)
and Accepted [filter semantics](adr/ADR-0023-poc-analytics-filters.md).

## Owning operations

All operations require a current `analytics.read` grant, exact organization/site
ownership and a configured source belonging to that scope. Browser scope and
references never establish authority. Use the existing authorized transaction,
explicit predicates and forced RLS with the non-owner runtime role.

| Internal operation | Input and result |
| --- | --- |
| Availability | Explicit scope/source; bounded admitted date labels, latest admitted date or null, source revision and site-zone context. No dates means no imports, not today's date. |
| Dimension options | Scope/source, revision, dimension kind and bounded cursor; distinct opaque references with labels and disambiguating components, resolved across admitted source facts. Options do not silently change active filters. |
| Analytical query | Scope/source, revision and the complete ADR-0023 selection; full exact totals, coverage, applied filters and the first or subsequent contributing-record page. Both overview and detail consume this operation. |

No client expressions, SQL, arbitrary grouping, ranking engine or new metric is
introduced. Area/equipment charts and UI navigation remain their selected stories.
These internal values are independent of React, HTTP DTOs and source column names.
Endpoint delivery must map them to reviewed OpenAPI and generated browser types
under ADR-0011; this contract does not add a route to the health-only host.

## Selection, measures and traceability

Require Gregorian reporting labels `[from, toExclusive)`. Apply OR within each
nonempty dimension set, AND across dimensions, then exact message exclusions.
Reject inclusion/exclusion conflicts, unknown fields, nulls, impossible dates,
empty sets and invalid/unavailable references. Preserve incompatible valid
selections as an empty result. Return canonical applied filters, never a silently
broadened selection. Unclassified records remain included unless explicitly filtered.

Frequency is the exact sum of `reportedFrequency`; accumulated duration is the
exact sum of `accumulatedAlarmSeconds`, with units `reported occurrences` and
`seconds`. Return contributing record count separately. Sum with exact arithmetic;
if either total exceeds 9,007,199,254,740,991, fail the calculation without rounded
or partial totals. Zero is valid. Repeated source tuples on different lines count
fully. Never multiply duration by frequency, cap it to a day, or infer downtime,
distinct physical incidents, rates or occurrence timestamps.

Every response carries revision, applied selection, metric units/limitations and
coverage. Full totals are independent of page size. Each contributing record
retains scope, import/RAW reference, original physical line, reporting label,
all five source dimensions, normalized measures, original duration, frozen
classification and interpretation revisions. RAW references do not expose file
bytes: separate retrieval requires `imports.review`.

Order contributing records by reporting date, import ID (bytewise), then numeric
source record number, ascending. The complete fact identity breaks ties; no
offset pagination. Option pages order by opaque reference, with cursor binding
to scope, revision and dimension kind. The same ADR-0028 validation rules apply.

## Coverage and finite limits

Determine admitted dates before dimension filtering, using the publication manifest
including successful zero-fact imports. Return missing labels within the requested
range separately. Distinguish no imports, admitted dates with no matching records,
and matching records with zero-valued measures. Always expose unknown reporting
windows; a site zone or imported label proves neither exporter zone nor a full day.

Retain unclassified/repeated-record warning context from admitted facts. Describe
production reconciliation as unverified until the actual persisted path passes
IOP-048; internal fixture success is not a production quality certificate. Rejected
attempt diagnostics remain in the separately authorized import-review contract.

Accepted POC bounds, to be exercised before endpoint delivery:

| Boundary | Limit and behavior |
| --- | --- |
| Reporting range | 1–366 calendar labels; reject longer/invalid ranges. |
| Selections | At most 100 references per set and 300 across all five sets; enforce before deduplication. |
| Detail/option page | Default 50, maximum 100; reject nonintegers or values outside 1–100. |
| Reference/cursor | Exact `d1.` plus 43 base64url characters; cursor at most 4,096 UTF-8 bytes, strict decoded shape. |
| Availability | At most 1,000 dates, matching the retained-attempt budget; fail on overflow, never truncate invisibly. |

These are admission limits, not performance promises. Reuse the existing bounded
dataset; no cache or worker. Execution deadlines/cancellation and HTTP byte limits
must be wired and tested in endpoint delivery before this becomes accessible.

## Safe outcomes and required validation

Malformed selection/cursor maps to a safe 400 validation Problem Details; unavailable
references use the same 400 code regardless of foreign/nonexistent origin. Revision
changes map to 409 `analytics_revision_changed`. Authorization denies through the
existing boundary; unavailable persistence maps to sanitized 503. Exact-total overflow
maps to 422 `analytics_total_out_of_range`, never zero or a partial response. Do not
include SQL, foreign labels or RAW contents in errors. Concrete DTO/error registration
remains implementation work under ADR-0011.

| Scenario | Required evidence before runtime completion |
| --- | --- |
| IOP-043 three-line example | 3 contributing records, frequency 7, duration 93,964 seconds; unclassified-only gives 3 and 93,784. |
| IOP-048 independent oracle | All 9 records sum to 19 and 97,775; reconcile full contributing pages against literal expected values, not the query's own reducer. |
| Filter intersection/exclusion and repeated labels | Overview and detail use identical matches; equipment includes area, message includes text/type/group; mapped label “Unclassified” differs from the unclassified variant. |
| Missing day, admitted empty day, filtered empty day, zero measures | Distinct coverage states; browser zone and DST do not alter label membership. |
| Failed/duplicate import and mapping edits | No added measures/revision for failure; historical classifications remain frozen. |
| Successful concurrent import | Each response is coherent; subsequent old-revision requests fail, including between detail pages. |
| Foreign scope/source/reference, missing grant, revoked grant | Deny before disclosure; actual-role RLS, pool reuse and rollback tested with positive controls. |
| Changed filters/cursor, malformed token, stale anchor/reset | Safe failure; no broader selection, skipped validation or cross-source cursor reuse. |
| Exact integer boundary and over-limit inputs | Safe values remain exact; overflow/invalid limits produce explicit errors without partial totals. |

Use `npm test` and `npm run test:database` for implementation evidence, plus delivered
HTTP checks after ADR-0018 activation. Record actual fixture size and timings.
This document supplies expected outcomes only; it claims no executed query tests.

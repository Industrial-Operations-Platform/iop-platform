# ADR-0023: One OIP filter contract for the analytical POC

## Status

Proposed — prepared under [IOP-097](../../planning/items/IOP-097-analytics-filters.md).
Owner acceptance is pending; no runtime implementation or accepted baseline change.

## Context and alternatives

The [POC](../../product/scope-poc.md) needs the same selection in Executive Overview,
rankings and contributing records. [ADR-0011](ADR-0011-api-contract-strategy.md)
requires explicit, validated filters and applied-filter metadata;
[ADR-0016](ADR-0016-time-and-timezone-model.md) keeps reporting labels distinct
from instants. The [source evidence](../../product/csv-and-reporting-reference.md)
provides sector/area/equipment/message filters, but no approved default exclusions.

| Approach | Assessment |
| --- | --- |
| Independent filters/calculations in each view | Small initial UI effort, but selections and totals can diverge. Reject. |
| OIP-owned request semantics, validated by the server and displayed consistently by both views | Recommended; fits existing ownership and OpenAPI boundaries. |
| Generic query language, saved reports or client-defined formulas | Unnecessary for two fixed measures and one local source. Defer. |

## Proposed contract

This is a semantic contract for the future IOP-089 operation, not an endpoint,
physical dimension schema, module package layout or generated OpenAPI artifact.
Transport DTOs map into OIP-owned values; browser bindings derive from OpenAPI.
React does not own metric/filter interpretation or import server internals.

| Input | Meaning |
| --- | --- |
| `organizationId`, `siteId`, `sourceId` | One explicit configured scope and source. No wildcard or cross-site query. Selectors are untrusted and never establish authority. |
| `reportingDateFrom`, `reportingDateToExclusive` | Required Gregorian `YYYY-MM-DD` labels; select `from <= reportingDate < toExclusive`. End must follow start. No timestamps or zone conversion. |
| `sectors`, `areas`, `equipment`, `messages` | Optional nonempty sets of exact canonical dimension selections; omitted means no restriction for that dimension. |
| `excludedMessages` | Optional nonempty set of exact message selections; omitted means no exclusion. |

Selections are opaque references supplied by the scoped analytical contract,
separate from display labels. IOP-043/049 must settle their identity/encoding and
normalized comparison rules before delivery. Repeated equipment labels in distinct
areas must not silently identify one physical asset. A missing sector mapping is
an explicit unclassified selection, separate from both an omitted filter and a
literal source label named “Unclassified”. No customer sector list enters core code.

Apply OR within a set and AND between dimensions, then remove excluded messages.
Reject the same message in inclusion and exclusion sets instead of guessing intent.
Reject empty arrays, nulls, unknown fields, invalid reference shapes, impossible
dates and reversed/empty ranges. Deduplicate repeated references as set semantics;
return canonical ordering in applied filters. Never discard an invalid selector
and continue with a broader query. Regex, substring matching and arbitrary SQL
are outside this contract; searching a selector's labels does not alter matching.

All-data selection retains unclassified records. A deliberate classified-sector
filter may exclude them, with that active filter visible. Valid but incompatible
selections (for example a sector and an area with no matching records) return an
empty result; do not silently clear child selections. A stale or unavailable
reference returns a safe validation/resource error and requires explicit correction.
Reference errors do not disclose another scope's existence.

### Reporting dates and coverage

The user-facing date picker may present inclusive “From” and “Through” dates;
translate “Through” to the following calendar date for the exclusive bound. This
is calendar arithmetic, never 24 elapsed hours. A one-day selection of June 26 is
`[2026-06-26, 2026-06-27)`. Show the applied human-readable selection in both views.

When data becomes available, initialize the POC to the latest successfully admitted
reporting date for the configured source. With no admitted date, show “No imports”
and do not invent today's date or submit an unbounded query. Reset restores that
initial date and removes all dimension selections/exclusions; it never changes
scope. Importing more data must not silently move a selection already in use.

The site zone remains visible context; a browser-zone change never changes label
membership. The source window remains unknown until independently confirmed.
No shifts, hourly ranges, proportional splitting, downtime or duration-based rates
can be inferred. Missing reporting dates mean missing imports, not zero faults.

Responses distinguish admitted reporting dates, dates without admitted imports,
input/reconciliation quality and unknown source-window coverage. Date availability
is measured before dimension filtering in the authorized source/date range, so
“no matching records” cannot masquerade as “no import”. An imported date alone
does not prove complete source coverage. Metric units and limitations travel with
the results under their owning metric contracts.

### Navigation and result consistency

Maintain one applied selection across overview and detail during the page session.
Draft edits become applied together after validation; all totals, rankings and
records use that same selection. Show active dates, dimension selections and
exclusions, including any drill-down restrictions. Do not use screenshot exclusions
as defaults. Clear/remove and Reset are explicit actions.

Drill-down adds or narrows the clicked dimension within the current selection;
it preserves dates, exclusions and unrelated restrictions. Returning through the
analytical breadcrumb restores the previous selection. Ordinary overview/detail
navigation preserves the current selection. Do not add physical asset or sensor
identity requirements. URL persistence, reload restoration and saved filters are
not required for this POC.

After a filter change, reset the detail cursor. A cursor is bound to original
scope, filters and ordering under ADR-0011. A late response for an older selection
must not replace current results. During loading/error, never label old totals as
belonging to the new selection. The response echoes server-applied filters; totals
cover all matching records, independently of detail pagination or top-N display.
Both views must use the same admitted data revision when reconciling their totals;
if imports change between requests, refresh both before claiming equality. Exact
revision/snapshot mechanics belong to IOP-089, not a cache platform in this story.

### Scope and delivery gates

Validate `analytics.read`, organization/site ownership and source ownership before
looking up options, aggregating or returning records. RLS and application scope
checks remain mandatory. Reset, no filters and cursor possession never grant
broader access. Use ADR-0011 error mappings and safe Problem Details.

IOP-089 must supply the bounded analytical operation, dimension references and
coverage/revision metadata using IOP-043/048/049 contracts. Before endpoint delivery,
specify and test finite date-span, selection-count, option-list and detail-page
limits against the demo fixture; this proposal supplies no performance commitment.
Runtime access independently waits for acceptance and implementation of ADR-0018
or another accepted mechanism. Acceptance here does not accept ADR-0018 or activate
adjacent implementation stories. Fixture-only UI work can follow this decision
without claiming production data or runtime access evidence.

## Design walkthroughs and implementation acceptance

These are reviewed expectations, not executed software tests.

| Scenario | Required result |
| --- | --- |
| One reporting day / month / year boundary | End-exclusive label selection includes the last chosen day and excludes the following day. |
| `2024-02-29` / `2026-02-29` | Valid leap date / rejected impossible date. |
| Browser in another zone; DST transition date | Identical label selection and totals; no fabricated 23/24/25-hour source window. |
| Equal/reversed bounds, timestamp input, empty set, unknown field | Validation error; no fallback query. |
| Two sectors plus an area and an excluded message | Sector union intersected with area; excluded message removed before both measures. |
| Message both included and excluded | Validation error with visible correction; no hidden precedence. |
| Unmapped sector and repeated source equipment labels | All-data totals retain unmapped rows; explicit scoped selections remain distinguishable. |
| Incompatible valid filters | Empty matching result with filters retained, separate from no imports. |
| Missing middle date; imported date with no matches | Missing import stays explicit; filtered emptiness does not alter import coverage. |
| Drill-down, breadcrumb return, view switch and Reset | Preserve/restore selection as specified; exclusions remain visible until explicitly cleared. |
| Rapid filter edits, failed read or changed imports | No stale totals under new labels; reconcile only a common admitted data revision. |
| Detail pagination/top-N | Full filtered totals unchanged; contributing records reconcile across all pages. |
| Foreign/missing scope, foreign source/reference, missing grant or reused cursor | Deny safely, without a widened query or foreign labels; prove RLS separately at runtime. |

## Consequences

A single filter meaning makes overview/detail reconciliation testable while leaving
source normalization in its adapter. The cost is explicit selection, coverage and
navigation state. This proposal does not deliver filters, establish metric formulas,
change source dates or complete IOP-097. Implementation and its test evidence follow
only after acceptance and the relevant contracts are available.

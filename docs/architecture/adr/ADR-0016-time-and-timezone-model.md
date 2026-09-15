# ADR-0016: UTC instants with explicit site and source time context

## Status

Proposed — prepared on 2026-09-15 for
[IOP-008](../../planning/items/IOP-008-time-and-timezone-model.md).
Owner acceptance is pending. ADR-0015 is allocated on the separate IOP-007 branch;
this proposal is independent of its authentication choice.

## Context

Accepted ADR-0003 selects PostgreSQL, ADR-0006 TypeScript/NestJS, ADR-0011 explicit
API period semantics and ADR-0012 explicit site time-zone context. V1 is CSV
normalization and analytics; workforce scheduling remains deferred. The seed task
names time zones, UTC, overnight shifts and timestamps but lists no alternatives.
The comparisons below are project judgments against those requirements.

The [CSV evidence](../../product/csv-and-reporting-reference.md) establishes a
filename-derived reporting date, aggregate counts and accumulated alarm durations.
It does not establish exact reporting boundaries, source time zone or occurrence
timestamps. A generic temporal model must preserve that uncertainty.

## Alternatives evaluated

| Approach | Benefit | Limitation | Recommendation |
| --- | --- | --- | --- |
| Local timestamps only | Matches source displays and wall-clock schedules. | Repeated times cannot identify a unique instant; ordering across zones is unsafe. | Use local values only for calendar intent or unresolved source evidence. |
| UTC instants only, discarding local context | Simple chronological comparison. | Loses reporting-date intent, recurrence rules and original interpretation. | Insufficient alone. |
| UTC instants plus explicit zone and calendar concepts | Separates exact events from local reporting/scheduling intent; preserves evidence. | Requires deliberate conversion, metadata and ambiguity handling. | Select. |
| Numeric epoch values as the public default | Compact exact-time representation. | Unit/precision ambiguity and reduced readability; still needs zone/calendar context. | No public default; adapters may translate explicitly declared units. |

| Decision axis | Options and assessment |
| --- | --- |
| Site zone | Select an explicit IANA zone per site. A global/server/browser zone silently couples sites to deployment or user location. A fixed offset cannot describe a region's changing clock rules. |
| Storage of instants | Select PostgreSQL `timestamptz`; a zone-free timestamp relying on an undocumented UTC convention is easier to misinterpret. Store the relevant zone separately. |
| Interval bounds | Select half-open `[start, end)`; inclusive ends overlap adjacent periods or encourage subtracting a precision-dependent tick. |
| Local-time ambiguity | Select explicit resolution or rejection. Silently picking the earlier/later repeated time or shifting a missing time invents meaning for imported evidence. |
| Overnight shifts | Select local schedule intent plus resolved start/end instants. Fixed UTC recurrence changes local hours across DST; fixed elapsed duration cannot represent every wall-clock shift. |
| Historical context | Preserve applied configuration and resolved bounds. Reinterpreting history from the current site zone makes prior reports unstable. |

## Proposed decision

### Distinct temporal concepts

| Concept | Meaning and contract |
| --- | --- |
| Instant | One point on the timeline, independent of display zone; use for known occurrence and system-record times. |
| Local date | Calendar value `YYYY-MM-DD`, without time or offset; never fabricate an event at midnight from it. |
| Local time / local date-time | Wall-clock intent requiring a date and zone before it can resolve to an instant. |
| Time zone | IANA identifier such as `Europe/Zurich`; example only, never a hard-coded pilot default. |
| UTC offset | Difference from UTC at an instant; does not identify a regional zone or its rules. |
| Period | Known half-open instant bounds plus their calendar/source interpretation, or an explicitly unresolved source period label. |
| Duration | Quantity with a stated unit and meaning; elapsed seconds and accumulated alarm seconds are different metrics. |

Use the ISO Gregorian calendar for canonical date contracts. Platform Core owns
site zone configuration; Integrations owns source interpretation/provenance; OIP
owns event/aggregate and analytical period semantics. Workforce owns future shift
intent and instances. Owners exchange explicit contracts under ADR-0001; a utility
must not become a new central business owner.

### Site and source zones

Require a validated IANA zone before admitting time-dependent site operations.
Use explicit `UTC` for a site intentionally operating in UTC. Reject unknown IDs
and ambiguous abbreviations such as `CST`; never infer the site zone from browser,
server, organization name or customer identity. An offset is allowed in an instant
input, but is not a substitute for a site's regional zone.

Source time interpretation is scoped adapter configuration. A source can explicitly
report UTC or a zone different from its site. A source's offset-bearing timestamp
already identifies an instant; a zone-free timestamp needs a documented source
zone or explicit configuration saying that it follows the site's zone. If both
source zone and offset are supplied, validate consistency for that local date/time;
contradictions remain unresolved. Preserve the original value and applied rule.

The [IANA database](https://www.iana.org/time-zones) tracks changing civil-time rules.
Store the applied zone/configuration revision with normalized period interpretation.
Record the converter's time-zone-data version or reproducible runtime/build identity
in import/derivation provenance. Retain resolved UTC bounds and relevant offsets
and local labels so completed results need not be recomputed under newer rules.
This does not require a separate time-zone database service.

For v1, configure the site zone before first temporal use and disallow ordinary
zone replacement after it has been used. A correction needs an explicitly reviewed
migration/reprocessing plan preserving old provenance. No mutable zone history UI
or effective-dated configuration engine is required. Future shift-rule changes or
time-zone database updates must not silently rewrite materialized instances.

### Instant transport, storage and precision

Use an RFC 3339 profile for instant fields: input requires a date, time including
seconds, and `Z` or a numeric `±HH:MM` offset. Canonical output uses UTC with `Z` and
three fractional digits, for example `2026-09-15T08:30:00.000Z`. Support millisecond
precision in v1; accept zero to three fractional digits and reject greater precision
at canonical boundaries rather than silently rounding. Preserve higher-precision
RAW input as unresolved until an explicit source conversion policy is approved.

Reject offset-free instant input, impossible dates, `24:00`, leap-second `:60`,
unknown-offset `-00:00`, infinity and informal relative strings. These are deliberate
IOP restrictions, not claims that RFC 3339 forbids every such representation.
Local date/time fields use separate schemas and must not be parsed as instant
fields. See [RFC 3339](https://www.rfc-editor.org/rfc/rfc3339).
No library or JavaScript runtime capability is selected by this profile.

Persist instants as PostgreSQL `timestamptz(3)` after validation; use `date` for
calendar dates and zone-free local values only for explicit calendar intent.
Configure backend/database sessions to UTC for predictable system output, while
all business conversions still name their zone. PostgreSQL normalizes `timestamptz`
values to UTC and does not retain the original zone; separate metadata is necessary.
See [PostgreSQL date/time types](https://www.postgresql.org/docs/18/datatype-datetime.html).
Driver/DTO/database round trips must preserve milliseconds without session-dependent
parsing. Detailed schemas, supported business date ranges and tools remain bootstrap
work; this proposal creates no DDL.

Distinguish source `occurredAt` from platform `receivedAt`, `createdAt` and
`updatedAt` where applicable. These are semantic names, not mandatory columns on
all records. The backend assigns system record times; importing old data must not
replace event time with import time. An absent event time stays absent with an
explicit quality state. Timestamps are not unique IDs or reliable causal ordering;
use stable tie-breakers for pagination and source sequence evidence where available.
Clock synchronization/monitoring is operational follow-up, not proof supplied here.

### Local ambiguity and overnight shifts

A local date-time can map to zero or two instants when clock rules change. The
[TC39 explanation](https://tc39.es/proposal-temporal/docs/timezone.html) describes
these gaps and repeated times. Library defaults are not domain policy.

- Nonexistent local time: reject or retain as unresolved source evidence; do not
  silently move it forward/backward.
- Repeated local time: require a matching explicit offset or a recorded choice of
  the earlier/later instant. Without evidence or an explicit scheduling choice,
  retain it as unresolved. An operator cannot guess imported facts into existence.
- Apply the same checks to reporting and scheduling boundaries, including midnight
  transitions or skipped calendar dates. A boundary that cannot be resolved prevents
  materialization until an explicit supported interpretation exists.

Future shift definitions express local start/end times and an explicit end-day
offset. For example, 22:00 to 06:00 with end-day offset 1 crosses midnight; identical
clock times alone do not distinguish zero from 24 hours. A shift instance retains
site, definition revision, local start date (the shift's business-date label), zone,
resolved UTC bounds and any disambiguation. Require end strictly after start.
Resolve both local boundaries independently; never derive the end by assuming eight
elapsed hours. Planned and actual intervals remain distinct if later implemented.
Breaks, pay, labor rules, staffing and overlap policy are outside IOP-008.

### Reporting periods and analytical integrity

Use `[start, end)` for resolved periods and intervals: start is included, end is
excluded. Compare instants for membership; derive elapsed duration from their
difference in a stated unit, normally seconds. Do not assume a local day always
lasts 24 hours or a calendar month has a fixed duration. Add calendar days/months
in the selected zone to obtain local bounds, then resolve each bound to UTC.
Reject empty/reversed query ranges rather than silently broadening them.

Reports default to explicit site calendar context. A viewer's device zone may
format a detail instant only when clearly labeled; it must not change report
buckets, shift labels or date filters. Responses retain zone, applied period,
source grain, coverage and relevant interpretation revision. Repeated local-hour
labels include offsets. No personal-zone preference UI is introduced.

The filename date remains a source reporting label. It does not become midnight,
import date or an occurrence time. Until the source's window and zone are confirmed,
preserve the date and unknown period status. A report may show explicitly labeled
source-date aggregates with incomplete coverage semantics; it must not imply a
known 24-hour window, compute duration-based rates or assign them to shifts.
Selecting a generic calendar-day contract does not settle this source question.

A known aggregate covers its declared period; it cannot be split proportionally
across a smaller query window or shifts without supporting source detail. A metric
must reject unsupported partial coverage or expose it separately as unavailable.
Do not manufacture events from aggregate counts, derive start/end from accumulated
alarm duration, or label overlapping alarm totals as elapsed plant downtime.
Missing imports are missing coverage, not zero faults. Corrections/replay and exact
metric definitions remain ingestion/analytics work.

Future cross-site analysis must explicitly choose a common instant window or each
site's local reporting dates and expose each site's bounds; these answers differ.
Never silently combine local dates into a common UTC day. ADR-0012/0014 authorization
of every requested site still applies; this does not add multi-site reports to v1.
Time-zone, period and interpretation context must follow derived results and future
cache/export keys alongside scope, without replacing access checks.

## Design walkthroughs and future verification

The following are manually reviewed expectations, not executed runtime tests.
Zurich dates are illustrative under the [IANA Europe rules](https://data.iana.org/time-zones/tzdb/europe),
not customer defaults.

| Scenario | Expected result |
| --- | --- |
| `2026-09-15T10:30:00+02:00` | Canonical `2026-09-15T08:30:00.000Z`; original source representation retained. |
| Zurich 2026-09-15 22:00 → September 16 06:00 | UTC 20:00 → 04:00 next day; 8 elapsed hours; shift label September 15. |
| Zurich March 28 22:00 → March 29 2026 06:00 | UTC March 28 21:00 → March 29 04:00; 7 elapsed hours. |
| Zurich October 24 22:00 → October 25 2026 06:00 | UTC October 24 20:00 → October 25 05:00; 9 elapsed hours. |
| Zurich 2026-03-29 02:30 without offset | Nonexistent local time; unresolved/rejected, never auto-shifted. |
| Zurich 2026-10-25 02:30 | `+02:00` resolves to 00:30Z; `+01:00` to 01:30Z. No offset/choice means unresolved. |
| Zurich March 29 / October 25 2026 calendar days | Resolved local-midnight bounds span 23 / 25 hours respectively. |
| Instant equals period end / next period start | Excluded from first, included in second; no duplicate boundary count. |
| Date-only filename `Hitliste-20260626.csv` | Preserve June 26 source label and unresolved window; no synthetic instant or shift assignment. |
| Aggregate overlaps only part of a requested interval | No invented proportional count or duration; unsupported coverage remains explicit. |
| Timestamp has four fractional digits or unknown offset | Canonical validation rejects; RAW evidence survives according to import policy. |
| Same instant in browsers with different local zones | Same report bucket and UTC identity; optional detail formatting cannot change totals. |
| Site zone edited after use / newer conversion rules deployed | No silent history rewrite; preserve old bounds and require explicit correction/reprocessing review. |
| Source claims Zurich 2026-07-01 12:00 with `+01:00` | Zone/offset conflict; unresolved until source interpretation is corrected. |
| Identical instant timestamps on two records | Remain distinct; deterministic ordering requires a stable tie-breaker. |

Future implementation must exercise parser rejection, DST gaps/folds, non-hour
transitions, midnight transitions, database/JSON round trips, source provenance,
period filtering and historical reproducibility in the selected runtime and database.
No runner, library, schema or performance measurement exists in this task.

## Consequences and acceptance boundary

The model preserves human calendar intent and chronological comparison while
making incomplete source evidence visible. Its costs are explicit metadata,
validation and care with time-zone updates. Millisecond precision is sufficient as
a proposed v1 contract, not a measured source capability; revisit if validated
source requirements need finer resolution. No silent precision reduction is allowed.

Accepting this proposal settles generic temporal semantics, not the CSV reporting
window. Source owners must confirm that window and zone before exact period-based
metrics can rely on it. Integration contracts, detailed shift design, audit clocks,
ORM/library selection and runtime implementation remain separate work.

After explicit acceptance, synchronize ARCHITECTURE.md, modules, data model,
glossary and ADR-0011/0012 follow-up references and close IOP-008 as design. Until
then these documents retain their accepted baseline and IOP-008 remains open.
Official sources linked above were consulted on 2026-09-15.

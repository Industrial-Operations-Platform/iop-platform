# POC canonical event aggregates

[IOP-043](../planning/items/IOP-043-canonical-event-model.md) defines the logical
OIP receiving model for the [analytical POC](../product/scope-poc.md). This is
the canonical design, specializing the [CSV source contract](csv-source-contract-poc.md),
[RAW model](raw-ingestion-poc.md), [batch model](import-batches-poc.md) and Accepted
[temporal](adr/ADR-0016-time-and-timezone-model.md) and
[filter](adr/ADR-0023-poc-analytics-filters.md) semantics. The physical schema and runtime receiver are delivered under
[IOP-147](../planning/items/IOP-147-working-analytical-poc.md); the original IOP-043
completion remains design-only evidence.

## Ownership, grain and identity

OIP owns canonical aggregate facts and validates their invariants. Integrations
decodes the supported source, normalizes its cells, applies scoped mappings and
supplies immutable receipt provenance. Source column names stay in the adapter;
customer classifications stay in configuration. Platform Core owns organization,
site and configured site zone. Access uses existing owning-module contracts.

One fact represents **one source-reported aggregate on one input record**, not an
individual occurrence or a deduplicated five-dimension group. Its logical identity
is `(organizationId, siteId, sourceId, importId, sourceRecordNumber)`. The record
number is the original one-based physical line, including header and skipped blank
lines; it never changes with filtering, pagination or sorting. Within an import,
each data line may contribute exactly once. An optional future opaque storage ID
cannot replace that uniqueness or its scoped provenance.

The source grouping is the exact normalized tuple `(sourceArea,
sourceEquipmentReference, sourceMessageText, sourceMessageType,
sourceMessageGroup)`. Repeated tuples, including identical values and measures on
different lines, remain separate facts, contribute fully and carry review warnings.
Tuple equality is neither fact identity nor proof of exporter grouping uniqueness.
Reported frequencies can overlap across collective/nested alarms; their sum is
not evidence of distinct physical incidents.

Import idempotency is separate: Integrations owns the unique successful
`(organizationId, siteId, sourceId, reportingDate)` claim. Different lines do not
bypass that claim; a renamed file cannot replace successful data. Corrected failed
submissions have new import identities under the existing batch lifecycle.

## Logical fields and receiver invariants

Fields may be carried in a shared immutable import envelope rather than repeated
physically per row. Every fact must nevertheless resolve to the same validated
context. This table does not prescribe a relational layout or HTTP shape.

| Fields | Required meaning and checks |
| --- | --- |
| `organizationId`, `siteId`, `sourceId` | Explicit non-null configured scope; ownership matches the authorized operation and receipt. Source values cannot select scope. |
| `importId`, `rawId`, `sourceRecordNumber` | Match one immutable receipt and a real data line, never its header or a skipped blank line. No repeated line reference in a publication. |
| `reportingDate` | Valid source calendar label from the receipt; equal for every fact in this import. It is not an instant or an independently editable row date. |
| `reportedFrequency` | Required nonnegative exact integer reported by the source; zero is valid. Never use row count as frequency. |
| `accumulatedAlarmSeconds` | Required nonnegative exact integer in elapsed seconds, already accumulated by the source; zero is valid. Never multiply by frequency. |
| `originalDuration` | Original decoded duration cell retained with the fact's RAW reference; preserve source spelling even when normalized text is trimmed. |
| Five source dimensions above | Required nonempty normalized strings following IOP-012's ASCII outer trim; retain internal whitespace, case, punctuation, accents and leading zeros. No numeric coercion, undocumented enums or asset inference. |
| `sectorKey`, `classificationStatus` | `mapped` requires a key in the frozen scoped mapping revision; `unclassified` requires a null key. An unmapped nonempty area remains a valid fact. |
| `adapterRevision`, `profileRevision`, `mappingRevision` | Frozen receipt interpretation; no mutable “latest” lookup or silent historical reclassification. |
| `siteTimeZone`, `reportingWindowStatus` | Receipt snapshot of the configured IANA site zone, with window status `unknown`. No source-window zone, bounds or occurrence instants are asserted. |
| Receipt provenance | Resolve original filename, RAW integrity metadata, `receivedAt` and `submittedBy` through the matching scoped import contract. Receipt time/actor are not event time/actor. |

Both measures and analytical sums must stay in IOP-012's exact integer range
0–9,007,199,254,740,991. Detect overflow before losing precision; do not round,
truncate, clamp or replace missing/invalid values with zero. The adapter validates
the duration grammar and exact conversion; OIP validates the normalized quantity.
No constraint derives duration from frequency or requires either to be positive
when the other is positive: the source contract supplies no such relationship.

The receiver validates complete scope, receipt consistency, unique valid data-line
references, required fields, measure bounds and classification consistency before
successful publication. Parser evidence must identify the actual data lines; a
positive line number alone is insufficient. It need not decode RAW again inside
the publication transaction. Encoding/header/lexical parsing stays in Integrations.

## Grouping and analytical references

Fact identity is distinct from dimensions used for grouping. Within the explicit
organization/site/source, use the following logical equality for the POC:

| Dimension | Equality and meaning |
| --- | --- |
| Area | Exact normalized `sourceArea`; not a surveyed location. |
| Source equipment | Exact pair `(sourceArea, sourceEquipmentReference)`; the same label in another area is a different selection. Neither proves an asset or sensor. |
| Message | Exact tuple `(sourceMessageText, sourceMessageType, sourceMessageGroup)`; equal text with a different type/group remains distinguishable. A selection may span equipment; it creates no global message registry. |
| Sector | Scoped configured `sectorKey`; applied membership stays frozen per fact with its mapping revision. Display labels do not define equality. Unclassified is a separate selection, never a literal sector key inferred from a label. |

Group across imported reporting dates only within this same explicit scope/source
and these equality rules. Measures and record identities are not dimension keys.
Use exact normalized string equality, without additional case folding, punctuation
removal or locale-dependent equivalence. Retain all five source dimensions even
when a view groups by only some of them; collapsing a chart group never destroys
its contributing facts.

Under ADR-0023, analytical consumers use opaque scoped references issued by OIP,
with display labels separate. IOP-049 must preserve sector-key meaning across
mapping revisions or distinguish changed meanings; a label rename cannot silently
combine unrelated sectors. IOP-089 must define and validate reference encoding,
resolution and stale-reference behavior before runtime delivery. This logical
model supplies equality, not a client-constructed concatenated key or a new
dimension registry. Those delivery obligations remain open; IOP-097 is not closed.

## Coverage, publication and traceability

`reportingDate` supports label filtering under ADR-0023. The configured site zone
does not establish the exporter's zone or a 24-hour reporting window. Keep exact
window coverage unknown, including for successful imports and rows reporting zero.
Missing dates mean missing imports. An admitted date with no rows matching the
selection is distinct from a date with no successful import.

No occurrence expansion, synthetic midnight, shift assignment, proportional
subperiod split, downtime, availability or rate follows from these facts.
Accumulated durations may overlap or exceed an assumed day; do not cap at 86,400
seconds. Sum exact seconds first and convert/round only for presentation. Analysis
must retain unclassified records unless an explicit visible filter excludes them.

Publication follows [Accepted ADR-0027](adr/ADR-0027-poc-import-publication.md):
OIP inserts all validated facts on the supplied authorized transaction handle;
Integrations commits them with the date claim and successful outcome, or rolls
back the entire publication. Rejected/failed attempts have no admitted OIP facts.
The OIP-owned publication lookup reports scoped receipt identity and record count
for reconciliation through its contract, without cross-module table reads.
Detailed runtime implementation and real-role tests remain future work.

Successful `admittedRecordCount` equals the number of distinct contributing data
lines and the fully validated import's `dataRecordCount`; it is independent of
frequency totals. Overview and detail must use the same filters and admitted data
revision, with full contributing-record sums rather than page or top-N sums.
An analytical reference does not grant original-file access: reads require
`analytics.read`, while RAW/status review requires `imports.review`. Import uses
`imports.submit`. Scoped constraints, forced RLS and current authorization remain
mandatory; ADR-0018 host activation is independently pending.

## Synthetic design review and delivery limits

These are manually checked expectations, not executed parser/database tests.
For one synthetic import, physical line 1 is the header, line 3 is blank and lines
2, 4 and 5 are data. Lines 2 and 4 have identical dimensions and each reports
frequency 2 and 90 seconds. Line 5 has an unmapped area and reports 3 and 93,784
seconds (`1 2:03:04`). All have the same reporting-date label and unknown window.

| Scenario | Expected result |
| --- | --- |
| Publish the three valid data lines | 3 facts, frequency 7, duration 93,964 seconds; two repeated-tuple records remain distinct and the unmapped fact is included. |
| Select only the unmapped area | 1 fact, frequency 3, duration 93,784 seconds; imported-date availability is unchanged. |
| Reuse line 2 twice, reference blank line 3 or substitute a foreign receipt | Reject the publication; no prefix of facts or successful date claim commits. |
| Same equipment label in two areas | Distinct equipment selections; an area restriction cannot leak into the other area. |
| Same message text, different type/group | Distinct message selections; display text alone cannot collapse them. |
| Literal configured sector label “Unclassified” and an unmapped row | Distinct mapped key and unclassified selection; all-data totals include both. |
| Zero frequency/seconds; missing next date; browser in another zone | Preserve zero-valued measures and original date labels, keep missing import explicit, never infer full-day coverage. |
| One invalid measure or sum beyond the exact range | Reject invalid admission or fail the unsupported analytical calculation safely; no guessed/rounded result. |
| Later mapping edit, new upload for an already imported date | Existing classifications remain frozen; date claim rejects replacement regardless of filename/hash. |
| Read all contributing pages under the same selection/revision | Full totals reconcile to 7 and 93,964; no occurrence timestamps or physical downtime are claimed. |

Future receiver/storage delivery must exercise these invariants with actual runtime
roles and atomic failure cases. Parser/conversion, mapping, filters, metric fixtures
and end-to-end demonstration remain their own delivery slices. Exact exporter
grouping, source-window bounds and distinct physical incident counts remain
unverified; an occurrence-level source requires a separately defined contract.

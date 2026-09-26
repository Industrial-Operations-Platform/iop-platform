# ADR-0028: Bounded POC analytical read consistency

## Status

Proposed on 2026-09-26 under [IOP-089](../../planning/items/IOP-089-analytics-query-layer.md).
No implementation or acceptance is implied. The linked
[query contract](../analytics-query-poc.md) is part of this proposal.

## Context and alternatives

Accepted [ADR-0023](ADR-0023-poc-analytics-filters.md) requires opaque scoped
dimension references and a common admitted revision for overview/detail totals.
[IOP-043](../event-aggregates-poc.md) defines equality, not encoding or storage.
The existing ADR-0026 operation uses READ COMMITTED and cannot promise one snapshot
across several SQL statements or browser requests. The POC needs no historical
snapshot service, cache, generic analytical engine or open database transaction
between requests.

| Option | Assessment |
| --- | --- |
| Independent latest reads | Reject: imports between reads can invalidate reconciliation silently. |
| Long-lived transaction or stored report snapshots | Adds lifetime, cleanup and resource management unnecessary for this local POC. |
| One statement per read, fingerprint of immutable admitted publications, reject changed revisions | Recommend: bounded current-data consistency using existing transaction handling; refresh after a new import. |

These are project design judgments, not measured performance claims.

## Proposed decision

OIP owns API-local query contracts and reads only its own persisted publications
and facts on the authorized ADR-0026 handle. Production receiving storage must
retain an immutable publication manifest even for zero-fact successful imports:
complete scope, import/RAW identity, reporting date, admitted record count,
interpretation revisions and site-zone snapshot. It commits with facts and the
Integrations date claim under ADR-0027. Do not read Integrations tables directly
or introduce an independently committed analytical publication.

For each operation, one SQL statement selects the scoped publications, validates
the requested revision/references and derives options or totals/records. This
gives the business read one statement snapshot without changing the authorization
helper's isolation level. Authorization and source ownership precede the business
read; current authorization repeats on every page. Repositories cannot acquire
another connection or change transaction state.

Compute `dataRevision` as SHA-256 over a versioned canonical JSON array containing
the complete organization/site/source and the sorted immutable publication
identities for that source. Use fixed array positions, UTF-8 encoding and bytewise
ordering, never delimiter concatenation, locale ordering, count or maximum date
alone. IDs must be newly generated after reset, never reused. Include all source
publications, even outside the selected date range; a new successful import
invalidates the revision conservatively. Failed/rejected attempts do not change it.
This depends on enforced publication/fact immutability; unsupported in-place edits
must not masquerade as a supported correction. No revision is an authorization token.

The initial availability operation returns the current revision. Every following
query supplies that revision. A mismatch returns `analytics_revision_changed`
without mixed results; the consumer refreshes availability and both views. An
import committed after the statement snapshot may appear next time; the current
response remains internally consistent. No automatic historical replay is offered.

Dimension references use `d1.` plus base64url SHA-256 over a fixed-position JSON
array of version, full scope, dimension kind and its IOP-043 equality tuple.
Use explicit tagged mapped/unclassified sector variants. References are stable
across added dates and mapping label renames; they are not secrets or capabilities.
OIP resolves them against exact tuples in the authorized source's admitted facts,
before applying date/dimension filters. Unknown, foreign or wrong-kind references
share a safe unavailable-reference error. If distinct tuples produce one digest,
fail safely rather than combine them. No persistent dimension registry is required.

Detail cursors are bounded versioned base64url JSON carrying the revision,
canonical selection fingerprint, fixed ordering identifier and last fact identity.
The fingerprint includes scope, dates, sorted/deduplicated filter sets and exclusions.
Treat all cursor fields as untrusted: validate shape/size, equality to the current
request, revision, and existence of the anchor among matching authorized facts.
Reject changed filters, order, revision or unavailable anchors; do not silently
restart. A cursor conveys no authority and requires no signing key: modifying a
valid anchor can only choose another position in the same authorized selection.
Reset/filter changes discard cursors. This is not an export or resumable job API.

## Evidence required and consequences

The [query contract](../analytics-query-poc.md) lists exact boundaries and scenarios.
Implementation must prove single-statement consistency during concurrent imports,
exact sums, actual-role RLS, reference isolation, revocation and cursor validation.
Test hash serialization against punctuation, Unicode, repeated labels and tuple
boundaries. Measure the real fixture before claiming query performance.

This mechanism relies on the bounded immutable local dataset. It adds no generic
snapshot platform, worker, materialized projection or physical asset dependency.
Production OIP storage and ADR-0018 host activation remain independent gates.
Accepting this ADR does not complete IOP-089 or authorize publication.

# ADR-0031 — Historical reporting profiles

## Status

Accepted for IOP-148 under the owner's explicit historical-analysis/preparation
request and continuing delegation of implementation decisions, 2026-09-27.

## Decision

OIP owns a source-scoped persisted reporting profile: conservative Unicode/space
normalization, explicit value aliases, area-to-sector rules. Customer lists belong in scoped presets/configuration.
`imports.submit` authorizes edits; `analytics.read` authorizes report/profile reads.
Edits use an expected profile version and atomic compare-and-swap. Original RAW,
normalized facts and import-time classification remain immutable. An explicit save
changes the analytical interpretation of all historical facts; the UI says so.
This is not a correction/replacement of admitted CSV data.

Each report derives profile, publication manifest, normalized/filterable values,
full exact totals, bounded rankings, periods and contributing pages in one SQL
snapshot under the existing pinned scoped transaction and forced RLS. Its revision
hash includes source scope, immutable publication IDs and profile version. Changed
revisions refuse stale pages. Label filters are bounded literal values in the
configured source, never expressions or scope/permission authority. Unknown values
produce no matches. No browser-derived aggregation of a truncated page is accepted.

Frequency remains an exact integer; duration remains exact stored seconds and is
converted to minutes only after summing. All seven source columns remain available.
Type/group/equipment stay text, retaining leading zeroes, commas, equals signs and
accents. No punctuation deletion or inferred physical hierarchy. Missing reporting
dates remain gaps, not zero incidents; monthly comparisons show admitted coverage.
Rankings/Pareto are descriptive shares of the chosen existing measure, not failure
rates, causal claims, operational downtime or unvalidated screenshot targets.

The profile is preserved by scoped demo reset. A separate local reference
installation avoids erasing or mixing an existing synthetic demo. The user's actual
CSV examples are loaded only through the real importer. Third-party login remains
separate, with the local selector only in the header.

## Owner clarification

The owner clarified that PLC/sensor refers to the existing source columns:
Bereich is location, Betriebsmittelkennzeichen is the equipment/sensor identifier,
Meldetext is the error, and Typ is currently constant. No additional physical
identity or assignment model is requested. Implement those source dimensions
and the provided sector classification; this clarification supersedes tentative
PLC/sensor assignment work above.

## Relational materialization refinement

The owner's subsequent explicit database clarification is implemented by
[ADR-0033](ADR-0033-relational-hitliste-analytics.md). Normalization and sector rules
are now materialized into scoped analytical catalogs/facts, refreshed atomically
with imports/profile saves. The one-snapshot report contract, exact measures,
revision semantics and immutable originals remain; query-time JSON reconstruction
is replaced by relational joins with completeness/version validation. Pareto was
separately deferred by the owner to a future Executive Overview feature.

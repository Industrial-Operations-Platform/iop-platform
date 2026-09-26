# Final source-to-report reconciliation for the POC

Acceptance procedure for [IOP-132](../planning/items/IOP-132-final-reconciliation.md),
limited to the [local analytical POC](../product/scope-poc.md). **Runtime execution
is blocked.** Internal IOP-048 tests and the independent fictional UI preview do
not prove that uploaded CSVs reach either delivered analytical view.

## Prerequisites and independent reference

Use the [synthetic fixture instructions](../../fixtures/analytical-poc/README.md),
unchanged [literal oracle](../../fixtures/analytical-poc/expected.json) and explicit
[scope/mapping configuration](../../fixtures/analytical-poc/scope.json). Import only
the two `valid/` files for the baseline. Keep original bytes and physical-line
references; record fixture hashes, application commit, configuration/mapping revision
and actual import/RAW IDs in the execution evidence. Do not copy expected values
from the application's totals or use its parser/reducer as the independent oracle.

Required delivery: production OIP publications/facts and the actual importer/review
path (IOP-048), executable IOP-089 reads, connected overview/detail and drill-down
(IOP-096), and the IOP-129 demonstration. ADR-0018 is Accepted but its host protection,
current grants and actual-role isolation must be implemented and validated first.
Reuse IOP-128's delivered safe reset when available for reproducibility; no reset
command or ad hoc deletion is authorized by this procedure.

## Comparison procedure

1. In the dedicated local fixture environment, admit July 1 and July 3 through the
   delivered importer. Reconcile receipt/outcome counts and each admitted physical
   line to production OIP facts using IOP-048 evidence. The blank line is not a
   record; July 1 lines 2 and 7 both contribute despite identical tuples.
2. Select the configured organization/site/source and `[2026-07-01, 2026-07-04)`
   explicitly. The default latest-date selection is not the baseline range. Capture
   canonical applied filters, coverage and `dataRevision` under the accepted
   [query contract](../architecture/analytics-query-poc.md).
3. For every selection below, compare the independently calculated expectations,
   persisted query totals, Executive Overview and detail. Follow every contributor
   page (page size 2 for the baseline: five pages), sum each full fact identity once
   and compare the complete set of import/RAW/physical-line references to the oracle.
   Matching grand totals alone can hide missing and duplicated records.
4. Preserve selection and revision while navigating sector → area → source equipment
   → message/contributors and returning. Drill-down adds explicit restrictions;
   compare each restricted selection to its own expectation. On return, restore the
   previous selection. Do not compare a parent total to a filtered child total.
5. If the revision changes, discard the comparison and cursors, refresh availability
   and both views, then restart on one revision. Do not reconcile across revisions,
   stale responses, failed loads or a displayed page/top-N subset.

The [frequency matrix](../product/event-frequency-poc.md) and
[duration matrix](../product/alarm-duration-poc.md) own the complete expectations
and boundaries. The minimum combined comparison is:

| Selection | Records | Reported occurrences | Accumulated seconds |
| --- | ---: | ---: | ---: |
| Baseline, both dates | 9 | 19 | 97,775 |
| July 1 only | 6 | 12 | 94,055 |
| July 3 only | 3 | 7 | 3,720 |
| Sector alpha | 4 | 9 | 300 |
| Sector beta | 2 | 5 | 97,384 |
| Unclassified | 3 | 5 | 91 |
| Area A, =EQ-001, message (Jam, 01, 007) | 3 | 9 | 300 |
| July 1, beta, Area B, =EQ-002, (Fault; check "A", X, 008) | 1 | 3 | 93,784 |
| Exclude message (Jam, 01, 007) | 6 | 10 | 97,475 |
| Area A, =EQ-003, (Idle, 01, 007) | 1 | 0 | 0 |
| Sector beta AND Area A | 0 | 0 | 0 |
| July 2 only | 0 | 0 | 0 |

Fixture labels identify exact tuples; delivered requests use authorized scoped
references, not text matching. July 2 has no imports; the incompatible-filter row
has imports but no matches; Idle is a matching zero record. Preserve these distinct
states in both views. All source windows remain unknown. Frequency is not record
count; accumulated seconds are not downtime and must not be multiplied by frequency.
Compare exact integers before display conversion; verify that 97,775 seconds renders
without rounding before summation or wrapping after 24 hours.

## Rejected and unresolved input

- Unclassified means unresolved sector mapping, not rejected data. Its three rows
  remain in baseline totals. Sector partitions must sum to the same nine records,
  19 occurrences and 97,775 seconds; overlapping warnings are not rejected counts.
- Execute each invalid fixture through the delivered path. Entire analytical
  admission fails, including valid-looking lines surrounding an invalid line.
  Baseline measures, admitted coverage and revision stay unchanged. When inspection
  completes, reconcile data = admitted + rejected; interrupted decoding/structure
  keeps uncounted totals unknown, never invented as zero. Keep available diagnostics
  and RAW provenance visible through authorized review.
- Re-upload July 1 and its changed-content same-date fixture: reject without adding
  measures. A malformed renamed basename rejects. Byte-identical July 1 contents
  named `Hitliste-20260704.csv` are a separate valid reporting label under the source
  contract: in an isolated scenario expect 15 records, 31 occurrences and 191,830
  seconds. Do not add that scenario to the baseline or claim verified source coverage.
- A rejected July 2 does not reserve the date. The fixture README's isolated valid
  relabeling scenario checks subsequent admission; it is synthetic setup only.

## Execution evidence and closure

Run the delivered checks via [POC testing](testing-poc.md): `npm run test:poc`
includes `npm test`, database and browser suites. Add actual path coverage in the
delivering slices; a green existing fixture suite is not this acceptance result.
Record commands, outcomes and links to query/HTTP/browser assertions. Retain actual
fixture size and observed timings without inventing a performance target.

For every matrix selection record expected versus observed record count, frequency,
seconds, canonical filters, revision, coverage, complete contributor identities and
both view observations. Link actual-role permission/RLS and foreign scope/source/
reference denial checks with positive controls. RAW access independently requires
`imports.review`; numerical acceptance adds no login or shared-user release gate.

A discrepancy blocks reconciliation: record the selection/revision, missing or extra
line identities and exact measure deltas, plus the first failing stage (admission,
fact, query or presentation). Preserve evidence; do not silently repair data,
change the oracle to fit the application or broaden filters. Resume after the
responsible delivered slice resolves the mismatch and repeat affected comparisons.

Close IOP-132 only after the real source-to-both-views comparisons, rejected/unresolved
accounting and required evidence pass. Link the IOP-129 demonstration and synchronize
the item/backlog/plan. This procedure does not complete shared-use v1, legacy Python/
DAX parity, performance certification or adjacent implementation stories.

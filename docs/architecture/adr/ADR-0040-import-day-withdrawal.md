# ADR-0040 — Confirmed replacement of an imported reporting date

## Status

Accepted by the owner's explicit 2026-11-23 decision under
[IOP-243](../../planning/items/IOP-243-import-day-removal.md): ask for confirmation
when reimporting an existing date and replace with the new file if accepted.
This supersedes the Proposed standalone-withdrawal design in `d47d418`; retain
its filename for stable links. Publication is not authorized.

## Decision

Keep the binary CSV import path. For an existing successful date, ask for
confirmation naming the date/file, then supply the exact prior import ID in
`X-CSV-Replaces-Import-Id`. Cancellation submits nothing. An ordinary upload
never silently replaces data. A stale confirmed ID returns a date conflict and
requires reviewing the latest import before confirming again.

Integrations persists that prior ID with the new receipt. Existing submit authority
and current Administrator enforcement apply; no independent delete endpoint or grant
is introduced. Validate the complete CSV before publication. On the existing scoped
pinned transaction, compare/swap the date claim from that exact prior import,
receive the new OIP dataset, record OIP-owned supersession, finalize the new attempt
and attribute the old attempt's supersession plus Audit event. Commit together.
Invalid input, stale targets and rollback retain the old dataset without a gap.

Receipts gain immutable `replaces_import_id` and terminal
`superseded_by_import_id` metadata with same-scope/date foreign keys. Narrow grants
and guarded transitions preserve original bytes, measures, successful outcomes and
replacement evidence. Date claims remain unique per organization/site/source/date
and update only their import pointer for a valid replacement. No runtime DELETE,
quota decrease or source-measure UPDATE is added. Retained originals consume quota.

OIP appends immutable scoped supersession links between the old/new manifests
through its receiving port. Current OIP analysis excludes superseded facts and
publications, including coverage, comparisons, canonical analytics, equipment/message
catalogs and live analytical asset history. Integrations does not inspect OIP tables.
Explicit import/source-row inspection retains historical data and labels superseded
versions; stored evidence/comparison snapshots remain unchanged.

Reuse existing attempt/date/projection coordination and finite statement budgets.
Publication holds the prior batch row while changing its claim; preparation and
canonical projections retain their source lock. Reconciliation verifies retained
replacement metadata and the OIP link when a successful import no longer owns the
claim. Unknown acknowledgements inspect the same durable identity without replay
or retargeting whichever import is now current.

Fingerprints and server cache validation use active publications plus existing
profile inputs in one-statement snapshots. Even identical-byte replacements get
new IDs. Browser mutations invalidate reports and refresh availability/history,
including after uncertain responses. Projection rebuilds retain history and cannot
reactivate superseded imports. Update provisioning/reset dependencies with migration.

This refines [ADR-0027](ADR-0027-poc-import-publication.md),
[ADR-0028](ADR-0028-poc-analytics-query-consistency.md) and
[ADR-0033](ADR-0033-relational-hitliste-analytics.md) using
[ADR-0032](ADR-0032-hexagonal-application-boundaries.md) boundaries.
It introduces no completed-day restriction or new source reporting-window claim.

## Verification

Cover confirmation/cancellation, stale and repeated replacements, invalid input,
exact new totals, retained originals, unconfirmed duplicates, scope/permissions,
concurrency/rollback/unknown commits, recovery, revisions/caches, migration/grants,
reset and responsive localization. Record results and limitations in the
[plan](../../planning/completed/IOP-243-import-day-removal-plan.md).

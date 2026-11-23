# ADR-0040 — Explicit withdrawal of an imported reporting day

## Status

Proposed on 2026-11-23 for [IOP-243](../../planning/items/IOP-243-import-day-removal.md).
The owner requested day removal and same-day reimport. This concrete lifecycle
refinement awaits acceptance under AGENTS.md rule 5; implementation is pending.

## Context

The CSV parser validates a calendar date in the filename without waiting for day
end. An active successful date is unique under [ADR-0027](ADR-0027-poc-import-publication.md).
The browser also disables uploading a known accepted date. Thus an early export
for today prevents a later export for today from contributing updated measures.

Original receipts, source facts and publication manifests remain immutable under
ADR-0027, [ADR-0028](ADR-0028-poc-analytics-query-consistency.md) and
[ADR-0033](ADR-0033-relational-hitliste-analytics.md). Runtime lacks DELETE authority.
The current revision fingerprints every publication, and reconciliation expects
every successful import to own the date claim. Merely hiding an import-history row
would leave totals, claims, caches and recovery inconsistent.

## Proposed decision

### Product behavior and authority

Expose `Delete day` only for an active successful import in administrator import
history. A shared confirmation dialog names the reporting date, filename and row
count and explains that the day leaves current analysis while the original remains
in review history. A confirmed action withdraws that exact import. It does not
upload a replacement; the existing CSV form can subsequently load the released
date. Invalid replacement files leave the date absent until a valid import succeeds.

Use an explicit site permission, `imports.withdraw`, owned by Integrations and
included in the site-operator bundle. Require the current Administrator profile
in addition to current scoped authority, including direct/native requests. Submit
or review authority alone does not authorize withdrawal. Reuse current scope/RLS
and access coordination; do not introduce a separate privileged operator endpoint.

The target is the immutable scoped import ID, never just a date from the browser.
An idempotent `POST /api/v1/imports/:id/withdraw` returns the retained withdrawal
state. Repeating it after a newer same-date import succeeds cannot affect that
newer import. Unknown/foreign targets and unauthorized callers expose no foreign
metadata. Received/rejected/failed attempts cannot be withdrawn as accepted days.

### Ownership, persistence and atomicity

Integrations owns an application use case and narrow withdrawal ports under
[ADR-0032](ADR-0032-hexagonal-application-boundaries.md). Reuse ADR-0027's pinned
transaction for the claim change, OIP-owned receiving effect and Audit event.
HTTP and React adapters validate/render transport and state rather than own rules.

Retain each date claim with immutable scope/date/import identity and one terminal
withdrawal timestamp/actor. A forward migration replaces the date-only primary key
with full claim identity and enforces a unique active claim per source/date using
a partial unique index. Grant only the required withdrawal-column UPDATE, with a
guard allowing the single active-to-withdrawn transition. Original identities and
terminal withdrawal evidence cannot be rewritten or reactivated. Existing claims
migrate as active; source bytes and quota charges remain unchanged.

OIP appends one immutable withdrawal marker per original publication, scoped and
linked to its manifest, with matching operation/actor/time attribution. Its port
owns that write and reports publication/withdrawal agreement for reconciliation.
Neither module queries or modifies the other's private tables. Successful import
outcomes and original admitted counts remain historical processing results;
withdrawal is separate state in review/history contracts.

Within the existing bounded lock/statement budgets, recheck current authority and
the exact successful claim; serialize the attempt, terminal claim transition and
OIP visibility change with the existing publication/projection lock order. Commit
claim withdrawal, OIP marker and the safe material Audit event together. Date
uniqueness still admits at most one active file. Establish and test lock ordering
against concurrent publication, preparation and canonical mapping before completion.
Do not introduce broad DELETE, DDL or quota-decrement privileges.

After a lost acknowledgement, inspect the same import's durable withdrawal state
under fresh authorization before any retry. Never infer rollback or remove the
currently active date by a new lookup. Reconciliation recognizes successful active
and successful withdrawn imports, verifies claim/publication/withdrawal agreement,
and refuses inconsistent evidence without automatic repair or replay.

### Reads, revisions and retained evidence

All current OIP analysis uses active publications: exclude OIP-withdrawn imports
from availability, coverage, facts, reports, trend/comparison totals, equipment and
message catalogs, canonical Pareto/source candidates and live analytical asset
history. Preserve module ownership by using OIP's own withdrawal markers. Explicit
import review/original downloads and historical source-row inspection remain
available under their existing permissions and identify the import as withdrawn.
Stored immutable comparison/evidence snapshots retain their recorded source
revision and values; new comparisons use current active data.

Continue retaining original facts and their relational/canonical projections for
traceability. Profile rebuilds and integrity checks account for retained facts;
active query predicates cannot be mistaken for lost projection coverage. Withdrawal
must not erase historical references or reactivate retired facts after a profile save.

Version revision serialization to fingerprint the active publication set plus the
existing profile inputs in each relevant read. Removal alone changes the revision;
a new import gets a new identity even for identical bytes. Preserve one-statement
read snapshots and reject stale cursors/revisions. Server cache hits must validate
the active revision. In the initiating browser, invalidate reports and refresh
availability/history after withdrawal, also reconciling uncertain mutation outcomes.
Other sessions detect the changed revision on their next authoritative read.

### Alternatives and limits

Hard deletion would require new destruction privileges, quota reconciliation and
historical-reference handling. Automatic overwrite on upload conceals an explicit
removal decision; appending cumulative exports double counts measures. Neither is
selected. Logical withdrawal preserves evidence while allowing deliberate reimport.

Retained bytes still consume the existing bounded quota. This is not retention
purging, undo, automatic replacement, a new reporting-window/completeness model or
an extension of the offline reset's authority. Update offline reset dependencies
for the new markers/claims and preserve existing scope checks. Deployment and any
actual removal of customer data require their own requested action.

## Required evidence

Verify migration/backfill and narrow runtime grants; current-day upload followed by
withdrawal and same-day reimport; changed/identical bytes; exact replacement totals
and missing-day coverage; unchanged retained originals and quota; active duplicate
rejection; repeated/stale withdrawal after replacement; authorization revocation
and foreign-source isolation; withdrawal/import/profile-save races; rollback and
ambiguous acknowledgements; recovery of withdrawn successful imports; consistent
active reads/cache revisions; retained snapshots; reset compatibility and responsive
confirmation/cancellation. Run the API/web/database checks in the
[execution plan](../../planning/active/IOP-243-import-day-removal-plan.md).

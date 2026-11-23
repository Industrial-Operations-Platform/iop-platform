# IOP-243 — Confirm and replace an existing reporting date

Status: Completed locally; publication through develop to origin authorized.

On 2026-11-23 the owner selected confirmation on reimport followed by replacement
with the new file. This supersedes the initial standalone day-removal proposal and
resolves its decision blocker. Today's date is already admissible before day end.

## Scope and acceptance

- [x] Importing an existing successful date asks for confirmation naming the date
  and file. Cancellation sends no upload or mutation.
- [x] Replace exactly the prior import shown to the user. A stale confirmation
  cannot overwrite a newer version; unconfirmed duplicates remain rejected.
- [x] Validate the replacement completely before atomic publication. Invalid input
  and rolled-back writes preserve the old dataset. Reconcile unknown outcomes
  without replaying source bytes.
- [x] Current reports, totals, coverage, comparisons, selectors, equipment lookup
  and live analytical asset views use only the new version. Invalidate affected
  revisions/caches. Repeated exports of today's unfinished day do not double count.
- [x] Retain original CSVs, facts, outcomes, supersession and Audit evidence for
  authorized review. Preserve stored evidence snapshots and existing scoped
  Administrator/import authority.
- [x] Verify use cases, database/security/migration behavior and responsive
  English/German confirmation UI with shared identity.

Integrations owns date admission/replacement; OIP owns analytical visibility through
its receiving contract. Accepted [ADR-0040](../../architecture/adr/ADR-0040-import-day-withdrawal.md)
records the explicit owner decision. Physical erasure, a separate Delete day action,
publication and deployment are outside this request.

The owner subsequently authorized merging `feature/IOP-243-import-day-removal`
into develop and pushing both branches to origin on 2026-11-23.
[Publication plan](../active/IOP-243-publication-plan.md).

Existing behavior: [IOP-047](IOP-047-import-idempotency.md) and
[IOP-158](IOP-158-import-administration.md). Implementation/evidence:
[completed plan](../completed/IOP-243-import-day-removal-plan.md).

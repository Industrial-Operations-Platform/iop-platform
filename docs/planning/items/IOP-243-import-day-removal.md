# IOP-243 — Remove an imported day and import it again

Status: Blocked — awaiting acceptance of Proposed ADR-0040; implementation is pending.

The owner's 2026-11-23 request is to remove an imported reporting day and load a
new export for that date, including today before the day has finished. The current
CSV date parser accepts today's date. Both the import form and the database date
claim prevent importing a second accepted file for the same source/date.

## Scope and acceptance

- [ ] A current authorized Administrator can explicitly remove an active imported
  day from Data Analysis through import history, after confirming the exact date
  and file. Cancellation leaves data unchanged.
- [ ] Removal takes that import out of current reports, totals, coverage, selectors,
  equipment lookup and live analytical asset views. A missing day remains a gap.
  Refresh affected server/browser revisions and caches, including removal without
  a subsequent upload.
- [ ] The same date can then be imported through the normal CSV path, including
  repeated exports during today's unfinished day. Use only the newly accepted
  version in current analysis; active dates still reject duplicate uploads.
- [ ] Retain original CSV bytes, provenance, source measures, successful processing
  outcomes and attributed withdrawal evidence for review. Display withdrawn status
  separately from the import outcome. Preserve stored historical evidence snapshots.
- [ ] Check current profile, explicit scoped withdrawal authority and exact import
  identity. Stale/repeated requests must never remove a newer import for that day.
  Failed or uncertain operations cannot expose partially removed/reimported data.
- [ ] Verify use cases, actual runtime-role PostgreSQL behavior, migration, isolation,
  recovery, concurrent requests, cache invalidation and desktop/mobile UI. Preserve
  shared identity and English/German presentation resources.

Integrations owns date admission and the withdrawal lifecycle; OIP owns analytical
visibility through its receiving contract. Users/RBAC owns permission decisions;
Audit retains the material event. Reuse existing scoped, pinned transactions and
hexagonal boundaries. This request does not authorize changing operational data,
automatic replacement on upload, hard erasure of originals or publication/deployment.
No new completed-day restriction or source reporting-window claim is introduced.

## Decision and evidence

Proposed [ADR-0040](../../architecture/adr/ADR-0040-import-day-withdrawal.md)
defines logical withdrawal, retained claims and active-publication reads. It
refines Accepted [ADR-0027](../../architecture/adr/ADR-0027-poc-import-publication.md),
[ADR-0028](../../architecture/adr/ADR-0028-poc-analytics-query-consistency.md) and
[ADR-0033](../../architecture/adr/ADR-0033-relational-hitliste-analytics.md).
AGENTS.md rule 5 requires acceptance before dependent implementation.

Existing behavior: [IOP-047](IOP-047-import-idempotency.md) and
[IOP-158](IOP-158-import-administration.md). Execution and validation:
[active plan](../active/IOP-243-import-day-removal-plan.md). The completed proposal
increment does not complete this story or change the running application.

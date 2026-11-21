# IOP-242 — Approved publication and Railway verification

Status: In progress. Branch: `feature/IOP-242-equipment-quick-access`.
[Scope](../items/IOP-242-equipment-quick-access.md) and
[implementation evidence](../completed/IOP-242-equipment-quick-access-plan.md).

## Authorization and steps

On 2026-11-21 the owner answered "continue" to the explicit publication request
naming this story, its merge into develop, both pushes to origin and Railway
verification. This authorizes the full sequence under ADR-0008.

1. Inspect origin refs and the configured Railway development target. Export and
   verify a fresh protected remote PostgreSQL archive before triggering deployment.
2. Commit this authorization on the story, merge into develop and atomically push
   both named refs. Verify source equality and preserve all review branches/data.
3. Observe complete GitHub validation, including the previously unexecuted real
   PostgreSQL lookup cases, and automatic Railway publication. Diagnose failures
   without bypassing validation or deployment guards.
4. Verify exact HTTPS revision, authentication boundaries and served quick-access
   assets. Run the existing quick-access desktop/mobile scenarios against the hosted
   frontend with intercepted fictional business APIs; compare live table/import
   counts against the backup separately. No live business mutations are needed.
5. Record actual results, update item/backlog, archive this plan and publish the
   documentation closure through the same approved story/develop sequence.

## Files and validation

Tracked changes are limited to this plan, the IOP-242 item and backlog, plus any
necessary scoped validation fixes if CI reveals a defect. Private helpers,
archives, logs and hosted screenshots remain ignored under `.railway/`.
No stage/master promotion, history rewrite, branch deletion or data restoration.

Initial inspection: clean tree on the story at implementation `0bd0295`; local
develop is `2efa4aa`. Local checks passed 575 API, 372 web and 19 affected browser
scenarios, with final targeted rebuild/lookup checks. PostgreSQL runtime coverage
must pass CI before deployment. Validate links/statuses, whitespace, remote parity
and a clean tree at closure.

Origin inspection confirmed develop `2efa4aa` and no existing remote IOP-242 story
branch. Railway targets IOP-development/development with separate iop/database
services and automatic deployment enabled; HTTPS initially serves `732f9fe`.
A fresh protected custom PostgreSQL archive (32,434,036 bytes) was retained
privately. Its signature, SHA-256 and required table-data archive entries were
verified; all 62 table counts and 175 imports across May–November 2026 were stable
during export. No restore or remote business write was performed.

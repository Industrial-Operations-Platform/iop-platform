# IOP-011 — CSV preservation plan

Status: Blocked — awaiting owner acceptance of Proposed ADR-0022. Authorized by the owner's 2026-09-25 request to work on
[IOP-011](../items/IOP-011-file-storage-model.md), limited to the
[POC](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `docs/IOP-011-csv-preservation`, created from clean `develop` before edits.

## Changes and steps

1. Review IOP-005/014 (completed and integrated), IOP-012's source contract,
   accepted scope/RLS/RBAC decisions and Proposed ADR-0018. No dependency story
   needs translation; translate all Spanish prose in IOP-011.
2. Write `docs/architecture/csv-preservation-poc.md`: original bytes/provenance,
   admission budgets, scoped retrieval, failure/duplicate cleanup and reset limits.
3. Compare PostgreSQL binary rows, local files and object storage in Proposed
   `ADR-0022-poc-csv-preservation.md`. Recommend one bounded local option; do not
   implement or treat it as accepted. Keep decision-dependent work paused.
4. Synchronize IOP-011, backlog and a discovery link in `poc-delivery.md`.
   No application, migration, configuration or endpoint changes. No map/attachment
   platform, generic storage abstraction, worker or retention infrastructure.

## Validation and evidence

Review byte-for-byte preservation, missing/foreign scope, permission separation,
at/over-limit input, invalid/duplicate input, interruption, integrity failure and
safe reset scenarios against IOP-012/014. Check changed Markdown links, ADR ID,
status consistency and `git diff --check`; review the staged diff before commit.
Documentation walkthroughs do not establish executable storage/security evidence.

Evidence recorded on 2026-09-25:

- Relative-link check: 183 links across all six changed documents, zero missing targets.
- ADR-0022 identifier is unique; Proposed ADR and Blocked item/backlog agree.
- `git diff --check` passed. Reviewed all proposed lifecycle/access/budget scenarios
  against IOP-012/014 and ADR-0013/0014, including no partial RAW on receive failure,
  retained complete rejected input and independent successful-date uniqueness.
- Official PostgreSQL 17 binary-type/RLS references reviewed and cited in ADR-0022.
- No application files changed and no runtime tests ran. Representative field-length,
  memory, latency, concurrency and integrity checks remain future executable evidence.

## Closure

Commit the validated documentation increment. Keep item/backlog and this plan
Blocked if storage acceptance is pending, with an explicit decision request.
Move the plan to completed only after all design criteria are satisfied.
Runtime access independently requires acceptance of ADR-0018 or an alternative.

# IOP-011 — CSV preservation plan

Status: Completed — owner accepted ADR-0022 and authorized publication on 2026-09-25. Authorized by the owner's 2026-09-25 request to work on
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

5. Record the owner acceptance in ADR-0022 and the preservation contract, close
   the item/backlog, and synchronize discovery guidance in ARCHITECTURE.md and
   the data model. Move this plan to completed after documentation checks.
6. Commit the acceptance increment, merge this story into develop and push both
   branches to origin under the owner’s explicit approval. Preserve the story branch.

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

The owner explicitly accepted ADR-0022 and authorized merging the story into develop
and pushing both branches to origin. The accepted contract, item/backlog, architecture
and data-model discovery guidance are synchronized; all design criteria are met.
This plan moves to completed. Runtime access independently requires acceptance of
ADR-0018 or an alternative; no application implementation or adjacent story is closed.

Acceptance validation: changed-document relative links and item/backlog/ADR/plan
statuses checked successfully; `git diff --check` passed. The remote was fetched
and develop matched origin/develop before the authorized integration. Publication
results and commit hashes are reported in the session, not predicted as evidence.

# IOP-243 — Approved GitHub publication

Status: In progress. Branch: `feature/IOP-243-import-day-removal`.
[Scope](../items/IOP-243-import-day-removal.md) and
[implementation evidence](../completed/IOP-243-import-day-removal-plan.md).

## Authorization and steps

On 2026-11-23 the owner explicitly approved merging this story into develop and
pushing both named branches to origin to synchronize GitHub. Under ADR-0008 this
authorizes the full sequence without another merge/push confirmation.

1. Verify a clean tree, fetch origin and compare develop with origin/develop.
   Preserve unrelated review branches and do not rewrite remote history.
2. Commit this authorization and item/backlog status on the existing story branch.
   Merge into develop and atomically push the story and develop to origin.
3. Verify both remote hashes, merge ancestry and matching tree contents. Reuse
   the completed implementation checks: this increment changes only publication
   documentation and does not require rerunning unchanged application tests.
4. Record actual publication evidence, archive this plan, update item/backlog,
   and publish the documentation closure through the same authorized sequence.

Expected files: this plan, the IOP-243 item and backlog. Validate links, statuses,
IDs, whitespace, remote parity and a clean tree. No stage/master promotion,
branch deletion, force push, data mutation or manual deployment is included.

## Evidence

Started on clean story `581816c`; develop and origin/develop were `1d682ea` before
fetch. The existing implementation record contains complete local API/web, real
PostgreSQL and browser validation. Record post-fetch and final publication results
below before closure. Existing GitHub automation may run after the authorized push;
this plan does not request new deployment settings or claim a hosted release.

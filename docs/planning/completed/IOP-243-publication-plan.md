# IOP-243 — Approved GitHub publication

Status: Completed on 2026-11-23. Branch: `feature/IOP-243-import-day-removal`.
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

Fetch confirmed develop and origin/develop both at `1d682ea`, with no divergence.
Authorization commit `97efdd6` followed validated implementation `581816c` on the
story. The owner-approved merge produced develop `208b476` without conflicts;
ancestry and tree comparison confirmed complete story integration.

`git push --atomic -u origin feature/IOP-243-import-day-removal develop` succeeded.
Independent `git ls-remote --heads` confirmed remote story `97efdd6` and remote
develop `208b476`. The implementation record retains passing API/web, real
PostgreSQL and browser evidence; application inputs did not change during this
publication increment, so those tests were not unnecessarily repeated.

Item/backlog now record publication, this plan is archived, and the documentation
closure is committed on the story and integrated/pushed through the same approval.
Final branch hashes and a clean-tree/remote-parity check are reported to the owner.
Existing GitHub automation runs independently after the push; no hosted deployment
or CI result is claimed by this publication record. No manual deployment, business
data mutation, branch deletion or stage/master promotion was performed.

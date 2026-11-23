# IOP-244 — Approved publication

Status: In progress. Branch: `fix/IOP-244-cancel-import-selection`.
[Scope](../items/IOP-244-cancel-import-selection.md) and
[implementation checks](../completed/IOP-244-cancel-import-selection-plan.md).

On 2026-11-23 the owner approved the explicit request to merge this branch into
develop and push both branches to origin. Follow ADR-0008 without another approval.

1. Verify a clean tree, fetch origin and check develop parity. Commit this record
   and authorized item/backlog status on the story branch.
2. Merge into develop, verify matching trees and ancestry, then atomically push
   both refs. Independently verify remote hashes with `git ls-remote`.
3. Record actual results, archive this plan and synchronize item/backlog. Commit,
   integrate and publish the documentation closure through the same approval.

Expected files: this plan, IOP-244 item and backlog. Check links/statuses and
whitespace. Reuse implementation validation because application inputs remain
unchanged during publication. Preserve unrelated branches and operational data;
no force push, deletion, stage/master promotion or manual deployment.

Initial state: clean story `ef59b9a`; develop and origin/develop `0177fc4`.
Existing GitHub automation may run after the push; this plan does not claim a
hosted release or remote CI result.

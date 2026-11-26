# IOP-245 — Approved publication

Status: In progress. Story branch: `fix/IOP-245-locator-return-navigation`.
[Scope](../items/IOP-245-locator-return-navigation.md) and
[implementation evidence](../completed/IOP-245-locator-return-navigation-plan.md).

On 2026-11-26 the owner approved merging this branch into develop and pushing both
branches to origin. This follows the explicit publication convention in ADR-0008.

## Steps and validation

1. Verify a clean initial tree, fetch origin and check develop parity. Commit this
   plan and authorized item/backlog status on the existing story branch.
2. Merge the story into develop without rewriting history; verify ancestry and
   tree equality, then atomically push both refs to origin. Independently verify
   remote hashes with `git ls-remote`.
3. Record actual publication evidence, synchronize item/backlog and archive the
   plan. Commit, integrate and push the documentation closure under the same
   authorization. Report final hashes and working-tree status.

Expected files: this plan, IOP-245 item and backlog. Check links, statuses and
whitespace. Reuse implementation validation while application inputs are unchanged.
Initial state: clean story `80456a0`; develop and tracked origin/develop `c2f6a70`.
Preserve unrelated branches/data. No force push, branch deletion, stage/master
promotion, manual deployment or hosted-release claim is included.

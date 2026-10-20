# IOP-221 — Approved publication

In progress, 2026-10-20. Story branch: `feature/IOP-221-locator-area-hover`.
[Permanent scope](../items/IOP-221-locator-area-hover.md).

## Authorization and steps

The owner answered yes to the explicit request to merge this story into `develop`
and push both branches to `origin`, under ADR-0008. Preserve all review branches;
service activation and stage/master promotion are outside this approval.

Fetch confirmed no remote divergence: `origin/develop` is `f4db019`, while local
`develop` is `b41e395`, 13 commits ahead. Those inherited commits contain the
already-integrated IOP-211/219 Locator work on which the validated hover increment
depends. Publishing develop includes them; this inclusion was reported to the owner.
The new IOP-221 implementation is `c74e65d`.

1. Commit this authorization record and update the item's publication status.
2. Merge the story into develop, preserving history and verifying the application
   tree equals the validated implementation. Push both refs atomically to origin.
3. Verify remote tips independently, archive this plan with publication evidence,
   synchronize item/backlog/implementation links and commit/publish that closure
   through the same approved story-to-develop sequence.

Expected files are this plan, `items/IOP-221-locator-area-hover.md`, the IOP-221 row
in `backlog.md` and `completed/IOP-221-locator-area-hover-plan.md`. No application
changes are planned. The separate IOP-219 private-model activation stays pending.

## Validation and evidence

Reuse the [validated implementation](../completed/IOP-221-locator-area-hover-plan.md):
53 web tests, 26 architecture checks, 11 browser scenarios, production build and
desktop/narrow light/dark visual review. Check document links/statuses,
`git diff --check`, merge ancestry, unchanged application tree, clean worktree and
exact local/remote branch parity. No new behavior requires repeating the suites.

## Closure

Pending merge, remote publication and verification.

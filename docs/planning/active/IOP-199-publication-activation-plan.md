# IOP-199 - Publication and local activation

Status: In progress
Authorization: owner approval on 2026-10-09 to merge the story into develop, push
both branches to origin and update the local Docker stack.
Branch: `feature/IOP-199-handover-category-workflows`, the reviewed story branch.
Scope: [completed implementation](../completed/IOP-199-handover-category-workflows-plan.md).

1. Verify a clean tree, current origin/develop and the approved story commits.
2. Merge into develop without rewriting history; push story and develop to origin.
3. Run `npm run local:up` without a backup argument, preserving existing volumes,
   credentials, configuration and business data.
4. Verify service state, HTTP response and current deployed source; inspect the
   running interface and compare database row counts before/after activation.
5. Record actual publication/activation evidence in this plan and the original
   completion record; commit on the story branch, integrate and publish the evidence
   through the already approved sequence. Keep stage/master and review refs intact.

Expected files: this plan and the completed IOP-199 implementation record only.
No feature edits, fixture writing, new grants, history rewrites or deployment beyond
the approved local stack. Validation reuses the completed implementation tests and
adds current remote refs, Docker/HTTP and retained-data checks.

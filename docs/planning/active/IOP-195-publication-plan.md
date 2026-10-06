# IOP-195 — Develop integration and publication

Status: In progress. Owner explicitly approved the complete publication sequence
on 2026-10-06: merge `docs/IOP-195-development-status` into develop and push both
branches to origin. Continue on the existing IOP-195 story branch from develop.
Permanent context: [IOP-195](../items/IOP-195-development-status.md).

## Scope and steps

1. Verify a clean checkout, refresh origin and inspect incoming develop changes.
2. Record authorization in the item and commit this execution plan on the story.
3. Merge into develop without rewriting history; verify tree parity and publish
   both refs atomically to origin.
4. Record actual integration/publication evidence on the story, move this plan
   to completed and publish that evidence through the same authorized sequence.
5. Verify remote parity, retained review branch and clean final develop checkout.

Files: this plan and the permanent IOP-195 item. Preserve the completed audit
record. No product/code/schema changes, deployment, stage/master promotion,
force push, history rewrite or branch deletion.

## Validation and initial evidence

The validated audit is commit `b43f279`. Working tree was clean; `git fetch origin`
succeeded. Local develop and origin/develop report zero commits ahead/behind;
origin/develop is contained in the story, with no incoming changes. Only Markdown
documentation differs. Reuse the audit's executed link/ID/status validation; check
the two publication files and `git diff --check`. After each merge verify tree
parity; after publication verify local/remote ref hashes and ahead/behind counts.
No runtime tests are required for an unchanged runtime tree.

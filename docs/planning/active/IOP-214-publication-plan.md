# IOP-214 — Approved publication

Status: In progress. Owner approval on 2026-10-19 explicitly authorizes merging
`fix/IOP-214-desktop-consistency` into `develop` and pushing both branches to
`origin`. Branch: `fix/IOP-214-desktop-consistency`, from develop `905f398`.
[Permanent scope](../items/IOP-214-desktop-consistency.md).

## Steps and validation

1. Confirm the clean reviewed tip `089e46b` and refresh `origin/develop`.
   Local and remote develop match `905f398`; develop is an ancestor of the story.
2. Commit this approval record on the story, merge into develop without rewriting
   history, and verify the resulting tree equals the approved story tree.
3. Push the story and develop atomically to origin; independently compare remote
   tips with local refs. Inspect the resulting CI status if accessible.
4. Record publication evidence, synchronize item/backlog, move this plan to
   `completed/` and commit that documentation increment on the retained story.
   Merge and publish the evidence under the same approval; verify links, statuses,
   whitespace, indexed secret hygiene and final clean local/remote parity.

The [implementation evidence](../completed/IOP-214-desktop-consistency-plan.md)
retains the 509 API, 219 web and 67 browser test results. No application changes are
planned; verify the final implementation tree against `089e46b` instead of repeating
unaffected test suites. No deployment, local service change, stage/master promotion,
force push, rebase, history rewrite or branch deletion is included.

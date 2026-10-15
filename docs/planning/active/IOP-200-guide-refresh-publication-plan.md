# IOP-200 - Approved guide refresh publication

Status: In progress. Owner approval: 2026-10-15.
Branch: `docs/IOP-200-guide-modules-refresh`, based on develop `e9bd49d`.
The owner answered yes to integrating this branch into develop and pushing both
refs to origin under the repository publication convention.
Scope: [guide refresh](../completed/IOP-200-guide-modules-refresh-plan.md).

## Files and steps

1. Verify the clean reviewed tip `1f99aed`, refresh origin and check ancestry.
2. Record approval in this plan, the permanent IOP-200 item and backlog. Commit
   on the approved documentation branch before integrating it.
3. Merge into develop without rewriting history; verify tree equality and the
   unchanged reviewed PDF blob. Push the named story and develop atomically to
   origin and independently verify remote tips.
4. Record actual merge/publication evidence, reconcile item/backlog/current guide
   execution status and move this plan to completed. Commit that documentation
   increment on the same story; integrate/publish under the existing approval.
5. Verify final local/remote equality, clean develop, PDF preservation and unchanged
   stage/master/IOP-211 refs. Do not infer a separate IOP-211 publication approval.

Files: this execution, IOP-200 permanent item/backlog and guide refresh execution.
No PDF regeneration, application/configuration/database changes, Docker activation,
remote default-branch change, force push, rebase, branch deletion or stage/master
promotion. Existing PDF/native validation remains applicable to unchanged sources.
For this publication-only increment check Markdown links/statuses, whitespace,
targeted secret hygiene, exact ancestry/tree/blob equality and actual remote parity.

## Initial evidence

The starting tree is clean on `1f99aed`. `git fetch origin` succeeds; local and
origin/develop match `e9bd49d` with zero ahead/behind. No remote story ref exists.
Reviewed PDF blob: `a36492047d37a7f943e9635b1d386c9be374aab2`.
Stage/master both remain `7009d409ed00a93f22dd05b23de803fb7b065a5d`.
Unmerged IOP-211 remains `b3a4a01c7fd89b232dae69d408b690ac9404b20b`.
The reviewed guide retains 17 inspected pages and successful same-database native
validation; no source or artifact change requires repeating that runtime exercise.
Independent read-only audit confirms exactly six intended guide/source/planning
files in `1f99aed`, with no application, SQL, configuration, dependency or private
artifact changes. The PDF is 50,661 bytes; SHA-256 is
`f73824b7504726b08703e94b8c4211edd1df9dd50c401367e17963ea9a72e0be`.
The prior whole-index secrets scan's unchanged test-fixture finding remains
documented; publication edits receive their own targeted hygiene check.

# IOP-212 — Approved publication

Completed. The owner answered yes on 2026-10-15 to merging
`fix/IOP-212-entry-recovery-filters` into develop and pushing both refs to origin.
Story branch: `fix/IOP-212-entry-recovery-filters`; implementation: `b3d4a81`.
Scope: [item](../items/IOP-212-entry-recovery-filters.md), under
[ADR-0008](../../architecture/adr/ADR-0008-story-branches.md).

## Changes and steps

1. Fetch origin and verify clean tracked files and the reviewed story/base refs.
2. Merge the reviewed story into develop and publish both refs atomically.
3. Verify remote hashes, then record actual publication evidence in the item,
   original delivery record and this completed plan on the story branch.
4. Commit and merge that documentation increment into develop, publish both refs
   and verify remote equality, story ancestry and clean working-tree state.

Only IOP-212 is authorized here. IOP-204–211, stage/master and branch deletion
remain outside this publication. No implementation or Docker changes are needed.

## Validation and evidence

- Starting tree clean; active branch is the reviewed story at `b3d4a81`.
- Fetch succeeded; develop and origin/develop are `06dd8bb`.
- Reuse the [validated delivery](../completed/IOP-212-entry-recovery-filters-plan.md):
  publication changes only Git integration and documentation. Verify merged
  implementation content matches the tested story, plus Markdown links and diff checks.


## Publication results

- Non-fast-forward merge into develop completed without conflicts at `b14540b`.
- Atomic push succeeded for develop and the story on origin. Direct
  `git ls-remote --heads origin` verified develop at
  `b14540bf00a5c8a29f519e7feb52bf538a249fdb` and the story at
  `b3d4a81d39302d95f9d95740319474bdd9a96ad8`.
- `git diff --exit-code fix/IOP-212-entry-recovery-filters develop -- apps docs`
  passed: the merged implementation matches the reviewed, validated story.
- This follow-up changes only the item and the two IOP-212 execution records.
  Markdown local links and `git diff --check` are checked before committing.
- The documentation increment is committed on the same story branch, merged and
  atomically published to the same approved destinations. Final remote equality,
  story ancestry and clean working-tree state are verified after that push and
  reported with the resulting hashes in the session response.

No code, container artifact, other story, stage/master or branch deletion is part
of this publication follow-up. Previous build, unit, architecture and browser
results remain applicable because the implementation content is identical.

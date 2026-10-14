# IOP-203 — Approved develop integration and publication

Status: In progress. The owner explicitly answered yes on 2026-10-14 to merging
`feature/IOP-203-platform-completion` into `develop` and pushing both branches to
`origin`, under Accepted ADR-0008's publication convention.

## Scope, files and steps

Use the existing story branch, originally from develop `24b6269`. Preserve its
validated implementation tip `7c108ac`, other review branches and all private
installation/reference/recovery data. Publication is distinct from plant survey,
provider connectivity, operating acceptance and release.

1. Verify a clean tree, refresh origin and check exact local/remote ancestry.
2. Commit this plan and approval in the permanent item on the story branch.
3. Merge the approved story into develop without rewriting history. Verify the
   resulting tree equals the reviewed story and retain existing source validation.
4. Push both named refs atomically to origin and verify remote parity.
5. Record executed merge/publication evidence on the story, complete this plan and
   reconcile current delivery/roadmap wording. Promote that documentation-only
   increment through the same approved path; verify final parity and a clean
   checkout on develop. Preserve stage/master and all review branches.

Files: this execution, IOP-203's permanent context, backlog, delivery map and
roadmap. No code/schema/configuration/private data, deployment, branch deletion,
force push, rebase or stage/master promotion is selected.

## Validation and initial evidence

Initial checkout is clean on the approved story at `7c108ac`. `git fetch origin`
succeeds. Check refreshed ancestry before integration; stop dependent publication
if a remote ref cannot advance without preserving its existing history.
Refreshed local/origin develop are both `24b6269` with zero ahead/behind; origin
develop is an ancestor of the story. The remote story ref does not yet exist.
Stage and master both remain `7009d409ed00a93f22dd05b23de803fb7b065a5d`.
Existing validated source evidence is API 509, web 192, PostgreSQL 319 and final
browser 57 checks, with actual encrypted/isolated restore in the
[completed implementation](../completed/IOP-203-platform-completion-plan.md).
For this documentation/ref-only increment check links/statuses, whitespace,
merge-tree equality, exact ref ancestry and actual remote parity; do not repeat
source/data operations without a changed source tree or new concern.

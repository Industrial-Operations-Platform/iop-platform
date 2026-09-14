# IOP-002 — Local delivery and tooling requirements

## Status and authorization

Completed — requirements and proposal slice only. The owner requested local frontend/backend/PostgreSQL containers,
portable build/run configuration, scoped commits and automatic commit checks.
Earlier discussion confirmed administrator-owned report configuration files.
This documentation slice continues on `docs/IOP-002-reporting-context`, originally
created from `develop`; current base is `87e9325`, with three evidence commits.
No merge, rebase or new dependent branch is needed.

## Scope and files

Capture confirmed requirements in `items/IOP-002-technology-stack.md` and a new
`items/IOP-002-delivery-tooling-review.md`. Write Proposed ADR-0009 for the tooling
recommendation. Update `backlog.md` with its pointer. Archive this plan on completion.
Frontend framework/chart evaluation remains outstanding; this slice does not
claim to complete the whole requested stack evaluation.

## Dependencies and decisions

Read AGENTS.md, ARCHITECTURE.md, the permanent IOP-002 item, reporting evidence,
workflow and ADR-0001–0008. Existing accepted boundaries remain binding.
The owner specified desired behavior, not acceptance of named tooling packages.
No package manifests, application scaffolds, hooks or Docker files are added in
this documentation slice. IOP-015/016/017/018/020/021 own implementation follow-ups;
they are not activated by this plan. Dependent implementation awaits the decision.

## Steps and validation

1. Capture reporting decisions and local delivery requirements without customer logic.
2. Compare proportionate tooling approaches using official documentation.
3. Record the proposed tools, command contract and future implementation ownership.
4. Check local Markdown links, whitespace, statuses and documentation-only scope.
5. Archive the finished evidence slice and commit; keep IOP-002 In progress.

## Database, API and UI changes

None. No runtime validation is possible before application/tooling bootstrap.

## Completion evidence

Captured the owner-confirmed reporting and delivery requirements, compared tooling
approaches using official sources and wrote Proposed ADR-0009. Updated the permanent
item and backlog pointer. Local Markdown-link existence checks over the four
deliverables and `git diff --check` passed. All changes are documentation only.
IOP-002 remains In progress; ADR-0009 remains Proposed; no application runner exists.
No hooks, containers, merge or push were executed. Frontend and test-runner
evaluation remain outstanding.

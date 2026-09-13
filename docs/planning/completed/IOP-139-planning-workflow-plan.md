# IOP-139 — Planning workflow execution plan

Source specification: [IOP-139](../items/IOP-139-planning-workflow.md).

## Status

Completed. Authorized by the user's planning-workflow request on 2026-09-13.

## Proposed implementation

Documentation only: create permanent task contexts from the supplied outline,
record the workflow decision and synchronize navigation. Preserve previous IDs
in a migration map and retain the IOP-002 evaluation as research evidence.

## Files expected to change

- docs/planning/items/, active/, completed/ and templates/.
- docs/planning/backlog.md, milestones.md, workflow.md and legacy-backlog-map.md.
- docs/architecture/adr/ADR-0007-planned-workflow.md and ADR-0006 links.
- AGENTS.md, ARCHITECTURE.md, README.md, ROADMAP.md and docs/product/scope-v1.md.

## Database and API changes

None. No code, database, dependencies or external systems will be changed.

## Implementation steps

1. Establish this context and plan before the migration.
2. Create the workflow ADR, guidance and templates.
3. Create proposed contexts for the 138 supplied tasks with acceptance evidence,
   explicit dependencies and unresolved decisions; preserve source naming.
4. Reconcile old IDs, milestones and IOP-002 research/plan ownership.
5. Validate links, coverage, dependency graph, statuses and unchanged code paths.
6. Record results and move this plan to completed/; keep item files in place.

## Completion checklist

- [x] Context/index coverage and migration history verified.
- [x] All local links and dependency references resolve without cycles.
- [x] ADR-0006 remains Proposed; workflow ADR is Accepted by explicit user request.
- [x] Only documentation changed; no implementation or release started.

## Evidence

- Verified 139 unique canonical task contexts linked from backlog; 138 supplied
  tasks plus this governance migration. IOP-002 research is a supporting document.
- Validated all local links, task sections, dependency references and acyclic graph.
- Verified ADR sections: ADR-0006 Proposed; ADR-0007 Accepted; foundations unchanged.
- Compared the original IOP-002 comparison through the end of the document with
  the moved evidence: preserved verbatim. Prior research commits remain in history.
- Checked future code directories contain only .gitkeep; no implementation added.
- Ran git diff --check; corrected an extra EOF blank line in milestones.md.
- Final link/status check repeated after moving this plan to completed/.

## Scope notes

The full attachment defines 138 tasks, not the short illustrative 40-task tree.
Added IOP-139 solely to track this explicitly requested repository migration.
The expanded inventory is proposed; login-local and provider assumptions do not
accept designs. Dependencies are initial planning constraints to refine per slice.
No application tests exist, and no runtime behavior was claimed or tested.

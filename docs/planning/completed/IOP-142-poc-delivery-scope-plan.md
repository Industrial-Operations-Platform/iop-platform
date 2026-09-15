# IOP-142 — POC delivery scope execution plan

Source: [IOP-142](../items/IOP-142-poc-delivery-scope.md).

## Status and authorization

Completed — documentation increment. The owner explicitly requested the reviewed POC scope/dependency changes.
Branch: `docs/IOP-142-poc-delivery-scope`, created from clean `develop` on 2026-09-15.

## Scope and expected files

- Product `scope-v1.md`, `personas-and-pilot-workflow.md`, new `scope-poc.md`;
  `ROADMAP.md`, `ARCHITECTURE.md`, architecture modules/data model applicability notes.
- Planning backlog/milestones and a POC delivery map covering all existing IDs.
- Permanent item POC/dependency sections for IOP-007, 009–014, 018, 025–031,
  041–043, 049, 089, 091, 094, 096, 103, 116, 123, 125, 128, 129, 132.
- A Proposed ADR-0018 for the bounded local execution context; reserve IDs 0015
  and 0017 already used on other review branches. No existing ADR is superseded.
- This item/plan and their closure evidence.

## Dependencies and decisions

Use integrated Accepted architecture decisions. Product deferrals are authorized.
Do not merge the IOP-007/009 branches. Keep their historical records intact and
identify integration caveats. A new identity substitute is Proposed only; pause
dependent runtime work, not independent documentation or parsing/UI work.

## Database, API and UI impact

No implementation. Describe the minimum POC data and user journey while preserving
future authorization boundaries and existing RLS requirements.

## Steps and validation

1. Register the request and plan before substantive edits.
2. Write the POC boundary, five delivery increments and complete inventory mapping.
3. Correct story dependency sections and add explicit slice precedence/deferrals.
4. Synchronize navigation and document the Proposed execution-context decision.
5. Check changed local links, IDs, statuses, removed dependency chains and
   `git diff --check`; review the diff. No application test runner exists.
6. Record evidence, archive the completed plan, mark IOP-142 Completed and commit.

## Completion checklist

- [x] Scope and dependencies synchronized.
- [x] ADR acceptance boundaries preserved.
- [x] Documentation validation passed.
- [x] Item/backlog and plan closure recorded; local commit created.

## Evidence and deviations

- Updated 30 permanent story contexts and their relevant dependency/acceptance
  sections; retained IDs, historical evidence and unfinished parent scope.
- Added POC product scope, a five-increment delivery map covering all 142 backlog
  IDs, and Proposed ADR-0018. Synchronized roadmap, backlog, milestones and product/
  architecture applicability. IOP-007/010/028/031 are Deferred beyond the POC.
- One-off Python validation (`python3 /tmp/iop142_validate.py`) checked 43 changed/new
  Markdown files and 627 local file links, all 142 backlog IDs/statuses, complete
  inventory disposition and selected dependency closure. All passed. The first
  inventory-check attempt missed abbreviated ID ranges; the checker was corrected
  to parse them and rerun successfully. No repository defect was hidden by that fix.
- The selected unfinished dependency closure contains no cycles or deferred login,
  workers, physical assets, workforce, handover, maintenance or maps gates. Design
  stories already Completed were treated as satisfied contracts, not reactivated.
- `git diff --check` passed. Inspected scope, dependency and navigation diffs.
- The local context proposal explicitly retains both site role assignments (neither
  inherits the other), RLS and scoped access; no old ADR status changed.
- No application code, runtime tests, merge, push or deployment. The existing
  IOP-007/009 review branches were inspected read-only and remain intact.
- No scope expansion. The temporary validation script is outside the repository;
  its checks and outcomes are recorded here. The completed documentation is committed
  locally on the recorded story branch; the commit hash is reported to the owner.
- IOP-142 is Completed as documentation even though ADR-0018 acceptance and every
  application delivery slice remain future work.

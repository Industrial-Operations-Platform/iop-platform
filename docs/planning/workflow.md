# Planned work workflow

Decision: [ADR-0007](../architecture/adr/ADR-0007-planned-workflow.md), Accepted by
the user's explicit request on 2026-09-13. Applies to future repository changes,
including code, infrastructure, refactors and substantive documentation work.

## Project language

Follow the [English project-language rule](../../AGENTS.md#project-language) for
items, plans, evidence and all other authored deliverables. Conversation language
does not determine project language. IOP-140 records the owner's explicit request.

## Sources of truth

| Document | Responsibility |
| --- | --- |
| backlog.md | Index of work and mirrored status; links to permanent scope. |
| items/IOP-NNN-slug.md | What the task means: context, requirements, acceptance and dependencies. Never moved on completion. |
| active/IOP-NNN-slug-plan.md | How the authorized task/slice will be executed now, expected files and verification. |
| completed/IOP-NNN-slug-plan.md | Finished execution record with outcomes, tests, limitations and deviations. |
| ADRs | Decision records; only Accepted decisions are binding. Proposed records remain under review. |
| AGENTS.md | Permanent navigation and working rules for agents. |

An item is not a plan. A plan is not an architectural decision. A completed plan
can finish one slice while the parent item remains open. Preserve research as a
linked supporting document with a distinct filename, not a second canonical item.

## Start work

1. Resolve the requested ID through backlog.md and read its permanent context,
   AGENTS.md, ARCHITECTURE.md and relevant/referenced ADRs.
2. Check existing active plans and unresolved dependencies. Confirm which slice
   the user requested. Read-only inspection or explanation needs no artificial task.
3. Before making changes, create/update a plan in active/ using the template.
   Record scope, expected files, dependencies, validation and acceptance mapping.
4. A request to work on the task authorizes necessary work within that scope; no
   extra confirmation is required just to write the plan or implement an already
   authorized, decided slice. A task in Proposed status alone authorizes nothing.
5. Execute the plan in small reviewable changes and keep it current. Do not add
   unrelated fixes, cleanup, features or new patterns because they seem useful.

If an explicit change request has no item, first create the permanent context and
plan for exactly that request, add the index entry, then work within it. If scope
is ambiguous, ask for the missing decision; do not invent a task to justify an
unsolicited change. Routine verification and fixes necessary to satisfy the
selected item's criteria belong in its plan.

## Decisions and scope changes

When architecture requires a new decision, write a Proposed ADR and pause only
the work that depends on acceptance. Continue independent authorized work.
An explicit user decision can be recorded Accepted directly; an agent preference
cannot. Never infer acceptance from a commit, an elapsed wait or framework examples.

Record discoveries and necessary plan refinements before dependent edits. A change
that expands the task's requirements or acceptance criteria requires explicit user
authorization and an updated item/plan, or a separate requested item. Backlog order
and dependencies do not authorize starting adjacent tasks automatically.

## Status and closure

Item states: Proposed, In progress, Blocked, Completed, Deferred. The item owns its
status; backlog mirrors it. Use Blocked with the concrete missing input; record
Deferred with a reason. Neither means Completed. Plan states: Planned, In progress,
Blocked, Completed. Proposed ADR status is separate from item/plan status.

On completion, verify each planned criterion with actual evidence. Run relevant
tests for implementation; for documentation check links, IDs, statuses and
consistency. Record commands/results and limitations, not an unverified claim of
success. No test runner exists in the documentation-only baseline.

Move the finished plan to completed/, update links and item/backlog state, and keep
the permanent item in items/. Mark the item Completed only when all its criteria
are met; a completed research slice does not finish stack selection. Keep blocked
or decision-pending plans active. Use distinct suffixes for later execution slices;
do not overwrite prior completed records. Do not publish or deploy by inference.

## Working request example

```text
Work on IOP-032.
Read AGENTS.md, ARCHITECTURE.md, the relevant ADRs and:
docs/planning/items/IOP-032-asset-hierarchy.md
Create an execution plan under docs/planning/active before implementation.
```

The request can simply name the ID because the index resolves the path. In the
adopted numbering IOP-017 means frontend bootstrap, not asset model.

Templates: [item](templates/item.md) and [execution plan](templates/execution-plan.md).
The [legacy map](legacy-backlog-map.md) disambiguates older IDs.

# Planned work workflow

Decision: [ADR-0007](../architecture/adr/ADR-0007-planned-workflow.md), Accepted by
the user's explicit request on 2026-09-13. Applies to future repository changes,
including code, infrastructure, refactors and substantive documentation work.

## Project language

Write project-authored code, identifiers, comments, documentation, stories, plans,
ADRs, tests, UI defaults, errors, logs, commits and PRs in English. Conversation may
use the owner's language. Preserve proper names, external fields and customer data;
localization resources may use their target language.

When reading a story containing Spanish prose, translate that entire story file to
English, preserving its meaning, status, IDs and links. This owner-authorized
translation applies even when reading a dependency: record affected files in the
current plan and keep translation-only changes distinguishable from functional
changes. Do not scan or translate the entire backlog automatically.

## Documentation size and traceability

Document only what is needed to execute, review and resume a story. Use the templates
as guides; omit irrelevant sections and repeated descriptions. Keep scope and
acceptance in the item, execution/evidence in the plan, decisions in ADRs and status
in the backlog. Link to the source instead of copying its content. Cite external
sources when they support a decision or technical claim. Record actual validation
results and material limitations, without repetitive progress narratives.

`AGENTS.md` is an optional local, ignored instruction file. Shared rules live here
and in the linked ADRs; a fresh clone does not depend on that local file.

## Sources of truth

| Document | Responsibility |
| --- | --- |
| backlog.md | Index of work and mirrored status; links to permanent scope. |
| items/IOP-NNN-slug.md | What the task means: context, requirements, acceptance and dependencies. Never moved on completion. |
| active/IOP-NNN-slug-plan.md | How the authorized task/slice will be executed now, expected files and verification. |
| completed/IOP-NNN-slug-plan.md | Finished execution record with outcomes, tests, limitations and deviations. |
| ADRs | Decision records; only Accepted decisions are binding. Proposed records remain under review. |
| AGENTS.md (local, ignored) | Optional local agent guidance; shared rules remain in this workflow and ADRs. |

An item is not a plan. A plan is not an architectural decision. A completed plan
can finish one slice while the parent item remains open. Preserve research as a
linked supporting document with a distinct filename, not a second canonical item.

## Branches and remote publication

[ADR-0008](../architecture/adr/ADR-0008-story-branches.md) records the owner-requested
local branch workflow. Use a story branch from develop before changes, including
plans and documentation, and record its name in the plan. At least one branch per
story; additional slices may use distinct names. Do not mix unrelated stories.

The owner controls promotion through story → develop → stage → master.
When asking to publish, state that approval includes merging the reviewed story
into develop and pushing both the story branch and develop to origin. An affirmative
answer authorizes that full sequence; a narrower instruction takes precedence.
This owner-approved convention (2026-09-25) does not authorize promotion to stage
or master, force pushes, history rewrites or deleting branches. Stage is the chosen
name for the intermediate branch. These refs alone do not create deployment or
branch-protection configuration. Keep each pending review branch intact.

Commit validated increments locally without a reminder. At session end ask whether
to push and identify the exact refs and remote. Never push or change the remote
default branch without authorization. The local main → master rename preserves
history; existing baseline commits are not retroactively split into story branches.

If another unmerged story is a prerequisite, report it and wait for the owner's
integration, or obtain explicit authorization for a dependent branch. Do not merge
it silently to make its files appear. Independent stories can branch from develop.

## Start work

1. Resolve the requested ID through backlog.md and read its permanent context,
   this workflow, local AGENTS.md if present, ARCHITECTURE.md and relevant ADRs.
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
Read docs/planning/workflow.md, local AGENTS.md if present, ARCHITECTURE.md,
the relevant ADRs and:
docs/planning/items/IOP-032-asset-hierarchy.md
Create an execution plan under docs/planning/active before implementation.
```

The request can simply name the ID because the index resolves the path. In the
adopted numbering IOP-017 means frontend bootstrap, not asset model.

Templates: [item](templates/item.md) and [execution plan](templates/execution-plan.md).
The [legacy map](legacy-backlog-map.md) disambiguates older IDs.

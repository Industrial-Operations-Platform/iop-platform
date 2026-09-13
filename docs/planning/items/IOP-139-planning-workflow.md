# IOP-139 — Planning workflow and backlog migration

## Status

Completed

## Milestone

M0 — Repository governance follow-up.

## Goal

Establish the requested item → execution plan → evidence workflow and turn the
supplied 138-task outline into a navigable planning index.

## User / business value

The owner can request work by ID; future agents recover its context and cannot
expand scope through unplanned changes.

## Context

The initial backlog had 15 broad tasks and the backend evaluation lived in active/.
The user explicitly requested permanent item contexts and mandatory execution plans.

## Current state

The documentation migration is complete; application development has not started.

## Desired state

Backlog indexes permanent contexts, active plans drive authorized work and completed
plans retain verification evidence. ADRs record decisions separately from plans.

## Requirements

- Preserve the supplied 138-item numbering and document legacy ID equivalents.
- Preserve IOP-002 research and pending backend acceptance.
- Record the required workflow in an Accepted ADR and permanent agent guidance.

## Acceptance criteria

- [x] Context files exist for IOP-001 through IOP-138 and backlog links resolve.
- [x] Milestones and roadmap use the expanded grouping, with no implied v1 promise.
- [x] Prior IDs have a migration map; IOP-002 comparison is preserved verbatim.
- [x] ADR-0007 and AGENTS.md prohibit unplanned changes and scope expansion.
- [x] Templates distinguish scope, execution and completion evidence.
- [x] Links, IDs, statuses, dependencies and documentation-only scope are verified.

## Domain considerations

Customer vocabulary stays configurable. Local authentication, improvement tracking
and specific adapters remain proposals; alarm duration is not presumed downtime.

## Architecture constraints

[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md) records this explicit
user decision. ADR-0001–0005 remain binding and ADR-0006 remains Proposed.

## Security considerations

No source-system access, credentials, production data or application changes.

## Data considerations

Documentation only. No schema or data migration; preserve legacy task identity
through [the mapping](../legacy-backlog-map.md).

## API considerations

None; task-context API requirements are future scope, not implemented contracts.

## UI considerations

Use narrow index tables and criteria-based comparison sections for readability.

## Dependencies

The supplied backlog outline and repository baseline; no implementation task.

## Non-goals

Application code, accepting a technology stack, infrastructure, deployment or release.

## Validation

Verified local Markdown links, 139 unique indexed contexts, dependency graph,
ADR sections/statuses, preserved research and untouched future code directories.
See the completed plan for results.

## Documentation impact

Planning contexts, index, milestones, workflow/templates and navigation updated.

## Open questions

None blocking this migration. Future tasks retain their own unresolved decisions.

## Execution

[Completed execution plan](../completed/IOP-139-planning-workflow-plan.md).

# ADR-0007: Work through task contexts and execution plans

## Status

Accepted

2026-09-13. Explicitly requested by the repository owner; this is a repository
workflow decision, not acceptance of ADR-0006 or any application stack.

## Context

A backlog row cannot carry enough context for a future session, and a research
document is not an execution plan. IOP needs traceability from authorized work to
scope, implementation steps, decisions and verification. Unplanned changes and
implicit scope expansion undermine reviewability.

## Decision

Use backlog.md as an index to permanent task specifications under planning/items/.
Before changing the repository, create or update the selected task's execution
plan under planning/active/. The item owns scope and acceptance; the plan owns
execution. Preserve item files after completion and move finished plans, with
verification evidence, to planning/completed/.

No code, infrastructure, refactor or substantive documentation change may be
unrelated to a requested item and recorded plan. For a new explicit request with
no item, first document exactly that request as an item and plan. Read-only
inspection and explanation need no plan. Do not create self-assigned scope.

Follow the detailed [workflow](../../planning/workflow.md). Architectural changes
requiring a decision get a Proposed ADR before dependent implementation. Explicit
user acceptance makes the decision Accepted; otherwise pause dependent work only.
Existing authorization for a decided task does not require repeated permission.

Record permanent agent rules in AGENTS.md. Update item, plan, backlog and affected
documentation together. Completing one task does not authorize the next task.
Use stable IDs from this migration onward; retain an explicit mapping of legacy
IDs and preserve the existing IOP-002 evaluation.

## Consequences

Future sessions can start from an ID and recover scope and evidence. This adds
small documentation overhead and requires link/status maintenance. Plans must
remain proportionate; no invented tests or approvals for routine authorized work.
The supplied 138-item inventory remains proposed product scope; being listed does
not accept its design or promise its delivery in v1.

## Alternatives considered

- Backlog-only rows: insufficient context and acceptance detail for independent work.
- Put task scope in active plans: loses the permanent specification when execution ends.
- Allow opportunistic changes: contradicts the owner's explicit requirement.
- Require fresh approval for every edit: unnecessary once the task and scope are authorized.

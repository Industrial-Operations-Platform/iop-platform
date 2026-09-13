# IOP-002 — Select backend, frontend and tooling

## Status

In progress — backend review complete; decision and broader stack work pending.

## Milestone

M1 — Product & Architecture Definition. Documentation/design only.

## Goal

Select backend, frontend and tooling with accepted rationale and documented
setup/development/test commands when the corresponding tooling exists.

## User / business value

The sole maintainer needs a reviewable, supportable stack that delivers CSV analytics
first and preserves the generic platform's future module boundaries.

## Context

Read [architecture](../../../ARCHITECTURE.md), [v1 scope](../../product/scope-v1.md)
and [planning workflow](../workflow.md). The current user request evaluates the
backend options only: Python + FastAPI and TypeScript + NestJS.

## Current state

No application/tooling exists. The [current backend review](IOP-002-backend-review.md)
recommends NestJS after the owner confirmed TypeScript/Node.js experience.
The analytics-only v1 scope is retained and ADR-0006 is Proposed.
The earlier NestJS recommendation is retained as historical evidence. Frontend,
tooling, commands and detailed module layout remain undecided.

## Desired state

Accepted technology decisions and documented workflow appropriate to the selected
stack, with no invented commands or implicit implementation authorization.

## Requirements

- Evaluate the requested backend options against all eight original criteria.
- Preserve generic modules, PostgreSQL, identity abstraction and customer isolation.
- Obtain explicit decision acceptance before documenting a selected backend.
- Evaluate frontend/tooling as separately requested slices; do not infer their choices.

## Acceptance criteria

- [ ] Backend, frontend and tooling decisions accepted with documented rationale.
- [ ] Development/test commands defined when supported by selected tooling.
- [ ] Execution plans and verification evidence reflect the delivered slices.

Completing the backend comparison alone does not complete this parent task.

## Domain considerations

Backend choice must not make analytics source schemas or customer concepts core
entities. Future module breadth does not authorize implementing those modules now.

## Architecture constraints

Read ADR-0001–0005 and ADR-0007 in the [ADR directory](../../architecture/adr/).
[ADR-0006](../../architecture/adr/ADR-0006-backend-stack.md) remains Proposed.
The branch workflow is recorded in IOP-141's separate review branch; the user
explicitly authorized this branch to depend on the current IOP-001 commit.

## Security considerations

Provider verification and scoped authorization remain distinct. No source access,
credentials or production data are needed to evaluate the framework options.

## Data considerations

The existing Python script is reported, not inspected; no reuse or migration is
assumed. ORM, transaction patterns and physical tenancy remain open.

## API considerations

API-first capability is required; API style/contracts and endpoints are separate work.

## UI considerations

Frontend is undecided. Backend choice does not select reporting or 3D libraries.

## Dependencies

[IOP-001](IOP-001-v1-personas-and-pilot-workflow.md): current scope is confirmed;
detailed reports and targets remain open. Review uses that known scope and records
remaining assumptions rather than claiming IOP-001 is complete.

## Non-goals

Code, dependency manifests, database migrations, framework scaffolds, production
connectivity or closing unanswered architectural decisions by inference.

## Validation

Official capability sources; documented tradeoffs and unknowns; local links,
ADR structure/status and reviewable branch diff. No runtime tests exist.

## Documentation impact

Item, review evidence, [active plan](../active/IOP-002-technology-stack-plan.md),
ADR-0006 and architecture proposal navigation. Update selected-stack documentation
only after acceptance. Keep backlog state consistent.

## Open questions

Owner acceptance of the current NestJS proposal; Nest-specific learning needs;
frontend/tooling decisions and actual setup commands in subsequent work.

## Evidence

[Historical evaluation](IOP-002-backend-evaluation.md),
[current review](IOP-002-backend-review.md) and
[decision plan](../active/IOP-002-technology-stack-plan.md).

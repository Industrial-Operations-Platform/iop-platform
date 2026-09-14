# IOP-002 — Select backend, frontend and tooling

## Status

In progress — backend accepted; frontend and tooling remain open.

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
and [planning workflow](../workflow.md). The backend comparison covered Python + FastAPI and TypeScript + NestJS.
The latest requested slice captures CSV and Power BI reporting evidence to inform
the remaining frontend/tooling evaluation.

## Current state

No application/tooling exists. The [current backend review](IOP-002-backend-review.md)
records explicit owner acceptance of TypeScript + NestJS after the owner confirmed
TypeScript/Node.js experience. The analytics-only v1 scope is retained.
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

- [x] Backend decision accepted with documented rationale (ADR-0006).
- [ ] Frontend and tooling decisions accepted with documented rationale.
- [ ] Development/test commands defined when supported by selected tooling.
- [ ] Execution plans and verification evidence reflect the delivered slices.

Completing the backend comparison alone does not complete this parent task.

## Domain considerations

Backend choice must not make analytics source schemas or customer concepts core
entities. Future module breadth does not authorize implementing those modules now.

## Architecture constraints

Read ADR-0001–0005 and ADR-0007 in the [ADR directory](../../architecture/adr/).
[ADR-0006](../../architecture/adr/ADR-0006-backend-stack.md) is Accepted.
Follow Accepted [ADR-0008](../../architecture/adr/ADR-0008-story-branches.md).
Record each slice branch and its base in its execution plan.

## Security considerations

Provider verification and scoped authorization remain distinct. No source access,
credentials or production data are needed to evaluate the framework options.

## Data considerations

The owner intends to port the existing Python CSV preparation behavior to
TypeScript/Node.js. Loader/repository excerpts have been reviewed; the complete pipeline has not
been inspected or executed. Correctness and porting effort remain unverified and require output reconciliation before replacement. ORM, transaction patterns and physical tenancy remain open.

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

Item, review evidence, [completed backend plan](../completed/IOP-002-technology-stack-plan.md),
ADR-0006 and architecture proposal navigation. Update selected-stack documentation
only after acceptance. Keep backlog state consistent.

## Open questions

Nest-specific learning needs;
frontend/tooling decisions and actual setup commands in subsequent work.

## Evidence

[Historical evaluation](IOP-002-backend-evaluation.md),
[current review](IOP-002-backend-review.md) and
[decision plan](../completed/IOP-002-technology-stack-plan.md).

## CSV and reporting evidence slice

Read the [source and reporting reference](../../product/csv-and-reporting-reference.md)
before evaluating frontend/reporting tools. It records the seven-column aggregate
CSV, four observed report pages, analytical drill-down and unresolved period/mapping
semantics. This refines evaluation inputs without choosing a frontend or extending
v1 to physical location/3D. IOP-001 report/KPI acceptance remains open.

Evidence capture: [completed plan](../completed/IOP-002-reporting-context-plan.md).
The parent stays In progress; proposed ingestion/analytics items are not activated.

Follow-up evidence: [legacy import review plan](../completed/IOP-002-import-evidence-plan.md).
Filename dates and UTF-16 reading are confirmed. The subsequent Power BI DAX
evidence confirms area-to-sector classification with an unclassified fallback;
replicating analytics requires this transformation as well as Python preparation.
Exact reporting boundaries and equipment-to-sensor relationships remain open.
See the [mapping evidence plan](../completed/IOP-002-sector-mapping-evidence-plan.md).

## Confirmed reporting and local delivery requirements

The owner confirmed predefined executive/detail views, administrator-owned report
configuration files and selection of implemented metrics, groupings and charts.
New metric formulas require code changes; a configuration UI is deferred.
Local frontend/backend/PostgreSQL containers, portable component builds, scoped
commits and automatic commit checks are required. Read the
[delivery/tooling review](IOP-002-delivery-tooling-review.md) for the full requirements,
proposed tools and implementation ownership.
[ADR-0009](../../architecture/adr/ADR-0009-local-delivery-tooling.md) is Proposed;
frontend and remaining tooling evaluation are still open. No hooks or containers
have been implemented by this documentation slice.

## Frontend, charting and testing recommendation

The [completed evaluation](IOP-002-frontend-testing-review.md) recommends React +
TypeScript + Vite, Apache ECharts, Vitest, React Testing Library, Supertest,
Playwright and Testcontainers PostgreSQL.
[ADR-0010](../../architecture/adr/ADR-0010-frontend-charting-testing.md) remains
Proposed alongside ADR-0009. NestJS was accepted for the backend only.
Parent status remains In progress pending owner review and synchronized closure.
The evaluation explicitly maps the conditional command criterion to future
bootstrap evidence; no runnable commands or runtime validation are claimed.

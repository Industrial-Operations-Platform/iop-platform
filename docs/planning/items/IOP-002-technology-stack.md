# IOP-002 — Select backend, frontend and tooling

## Status

Completed — stack accepted; implementation belongs to bootstrap stories.

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
CSV and Power BI evidence informed the accepted frontend/tooling evaluation.

## Current state

No application/tooling exists. The [current backend review](IOP-002-backend-review.md)
records explicit owner acceptance of TypeScript + NestJS after the owner confirmed
TypeScript/Node.js experience. The analytics-only v1 scope is retained.
The earlier NestJS recommendation is retained as historical evidence. Frontend
and tooling are now accepted under ADR-0009/0010. Executable commands, pinned
versions and detailed module layout belong to subsequent implementation work.

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
- [x] Frontend and tooling decisions accepted with documented rationale (ADR-0009/0010).
- N/A at design closure: development/test commands require tooling that does not
  exist yet. IOP-015/016/017/020 own implementation and executable verification;
  this conditional criterion does not claim commands were run.
- [x] Execution plans and verification evidence reflect the delivered slices.

All applicable design criteria are satisfied, including explicit owner acceptance
of Jest for frontend/backend and the remaining frontend/delivery choices.

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

React + TypeScript + Vite and Apache ECharts are accepted. No 3D library is selected.

## Dependencies

[IOP-001](IOP-001-v1-personas-and-pilot-workflow.md): personas, reporting baseline and
acceptance measures are now agreed and IOP-001 is Completed. Detailed contracts and
release targets remain follow-up work under its explicit deferrals.

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

No stack-selection blockers remain. Nest/React learning and actual setup commands
are implementation considerations; metric definitions remain with IOP-001.

## Evidence

[Historical evaluation](IOP-002-backend-evaluation.md),
[current review](IOP-002-backend-review.md) and
[decision plan](../completed/IOP-002-technology-stack-plan.md).

## CSV and reporting evidence slice

Read the [source and reporting reference](../../product/csv-and-reporting-reference.md)
before evaluating frontend/reporting tools. It records the seven-column aggregate
CSV, four observed report pages, analytical drill-down and unresolved period/mapping
semantics. This refines evaluation inputs without choosing a frontend or extending
v1 to physical location/3D. IOP-001 report/KPI baseline is now accepted with explicit follow-up deferrals.

Evidence capture: [completed plan](../completed/IOP-002-reporting-context-plan.md).
That evidence slice left the parent In progress; ingestion/analytics items were not activated.

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
accepted tools and implementation ownership.
[ADR-0009](../../architecture/adr/ADR-0009-local-delivery-tooling.md) is Accepted.
Frontend and remaining tooling selection are complete under ADR-0010. No hooks or containers
have been implemented by this documentation slice.

## Accepted frontend, charting and testing

The [completed evaluation](IOP-002-frontend-testing-review.md) records React +
TypeScript + Vite, Apache ECharts, Jest, React Testing Library, Supertest,
Playwright and Testcontainers PostgreSQL.
[ADR-0010](../../architecture/adr/ADR-0010-frontend-charting-testing.md) is
Accepted alongside ADR-0009. The owner selected Jest based on existing experience
and explicitly accepted the remaining decisions and story closure. NestJS is the backend.
The evaluation explicitly maps the conditional command criterion to future
bootstrap evidence; no runnable commands or runtime validation are claimed.

## Closure evidence

Completed on 2026-09-14 following explicit owner acceptance. See the
[closure plan](../completed/IOP-002-stack-closure-plan.md) for validation and
conditional command handoff. No application, hooks or containers were implemented.
API contracts, ORM/migration selection, identity and hosting remain separately
scoped work; no adjacent story is activated by this closure.

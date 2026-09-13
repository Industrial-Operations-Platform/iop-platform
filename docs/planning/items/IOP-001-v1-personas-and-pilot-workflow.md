# IOP-001 — Validate v1 personas and pilot workflow

## Status

In progress — scope and responsibilities confirmed; reports/acceptance pending.

## Milestone

M1 — Product & Architecture Definition. Documentation/design only.

## Goal

Validate the v1 personas and define one concrete end-to-end pilot scenario covering
data operations, Team Leader analysis/presentation and Taskforce investigation,
with management receiving Team Leader presentations only and administration
responsibilities confirmed for the owner's Administrator profile.

## User / business value

The team needs a shared, reviewable operational scenario to prioritize a reusable
platform and assess pilot value before implementation.

## Context

Read [modules](../../architecture/modules.md), [vision](../../product/vision.md)
and [planning workflow](../workflow.md). The expanded backlog is an inventory of
proposals, not an agreement to deliver all 138 tasks in v1.

## Current state

Only the documentation baseline exists. The owner narrowed v1 to reproduce the
existing Python → local database → Power BI analytical workflow from CSV.
Individual logins remain required. Team Leaders analyze/present, Taskforce
investigates and management receives presentations only, without a login.
Precise sensor location and Asset Locator/3D are deferred because they require a
substantial plant survey. Source-provided sector/equipment context may still be
used in analytics. The owner's Administrator profile manages imports/error review
and user/configuration administration; other profiles consult/analyze. The existing
Python processing behavior is to be ported to TypeScript/Node.js and checked for
equivalent outputs, without implementation in this documentation task.

## Desired state

An agreed scenario explains each persona's actions, expected outcomes, scope and
observable acceptance evidence without choosing implementation technologies.

## Requirements

- Deliver only the persona, pilot-workflow and acceptance baseline for IOP-001.
- Keep identity, permissions, customer/site context and providers distinct.
- Separate documented assumptions from validated stakeholder requirements.

## Acceptance criteria

- [x] A concrete CSV → preparation → analysis → presentation scenario covers the
  confirmed personas and resolves import-review/configuration ownership.
- [ ] Report/KPI needs and observable acceptance measures are agreed.
- [ ] Validation evidence and documentation reflect the narrowed scope consistently.

Physical asset surveys, maps and 3D are not criteria or dependencies of this v1 task.

## Domain considerations

Personas describe user needs, not fixed RBAC roles. Asset identity, physical
placement and source events remain separate concepts. Team Leader and Taskforce
labels do not imply fixed customer-specific domain types.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md) apply.
ADR-0006 is Accepted following the owner's explicit TypeScript + NestJS decision.

## Security considerations

Describe scoped access and denial scenarios. Use fictional examples, no production
secrets or maps. Industrial integration stays read-only; material changes require
traceability in the future workflow.

## Data considerations

Document evidence and source-grain limits without creating schemas or imports.
Do not infer occurrence timestamps, asset identity or downtime from insufficient data.

## API considerations

Describe operational outcomes and module interactions; no endpoints or API style choice.

## UI considerations

Describe user needs, visible states and recovery from ambiguity; no UI implementation
or frontend selection.

## Dependencies

No implementation prerequisites. Start from the vision and foundational ADRs;
stakeholder input is needed to validate priorities, responsibilities and targets.

## Non-goals

Application code, migrations, infrastructure, detailed RBAC, stack selection,
production connectivity, plant surveys, precise asset location/3D and delivery
of the entire backlog.

## Validation

Review persona coverage, main/failure scenarios, scope and measurable outcomes.
Check documentation links and consistency. Record stakeholder answers separately
from agent assumptions; do not invent test commands or user-validation results.

## Documentation impact

This item, [backlog](../backlog.md),
[active plan](../active/IOP-001-v1-personas-and-pilot-workflow-plan.md),
[product proposal](../../product/personas-and-pilot-workflow.md) and the scope-v1
navigation link. Revise accepted product scope only after its validation.

## Open questions

Scope and persona responsibilities are confirmed. Agree report/KPI needs, reference
inputs/outputs, presentation expectations and measurable success targets. The script
has not been reviewed; transformation details require evidence, not assumptions.

# IOP-001 — Validate v1 personas and pilot workflow

## Status

In progress — workflow priority confirmed; detailed validation pending.

## Milestone

M1 — Product & Architecture Definition. Documentation/design only.

## Goal

Validate the v1 personas and define one concrete end-to-end pilot scenario covering
Technician, Team Leader and Administrator.

## User / business value

The team needs a shared, reviewable operational scenario to prioritize a reusable
platform and assess pilot value before implementation.

## Context

Read [modules](../../architecture/modules.md), [vision](../../product/vision.md)
and [planning workflow](../workflow.md). The expanded backlog is an inventory of
proposals, not an agreement to deliver all 138 tasks in v1.

## Current state

Only the documentation baseline exists. The
[persona/workflow proposal](../../product/personas-and-pilot-workflow.md) follows
the owner-confirmed CSV events → analysis → locate the asset priority. Detailed
responsibilities, pilot data and numeric targets remain unvalidated.

## Desired state

An agreed scenario explains each persona's actions, expected outcomes, scope and
observable acceptance evidence without choosing implementation technologies.

## Requirements

- Deliver only the persona, pilot-workflow and acceptance baseline for IOP-001.
- Keep identity, permissions, customer/site context and providers distinct.
- Separate documented assumptions from validated stakeholder requirements.

## Acceptance criteria

- [ ] A concrete end-to-end scenario covers Technician, Team Leader and Administrator.
- [ ] The plan records scenarios and necessary decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation exist.

The proposed scenario is not considered validated until the owner confirms the
workflow/persona assumptions and agrees the pilot's acceptance measures.

## Domain considerations

Personas describe user needs, not fixed RBAC roles. Asset identity, physical
placement, shifts, handover and maintenance remain separate domain concepts.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md) apply.
ADR-0006 remains Proposed; this task cannot accept it by implication.

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
production connectivity and delivery of the entire backlog.

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

Pilot priority is confirmed. Validate persona responsibilities, initial data source, required
workflow depth and success targets. See the proposal's decision register.

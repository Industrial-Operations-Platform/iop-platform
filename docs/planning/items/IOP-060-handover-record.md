# IOP-060 — Handover record

## Status

Completed — delivered and locally integrated through IOP-204 on 2026-10-14.

## Milestone

M7 — Shift Handover. Local software delivery completed.

## Goal

Handover record. Expected outcome: Record for a shift

## User / business value

Teams need to transfer context and open issues without losing history between shifts.

## Context

Scope: Shift Handover. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; inclusion in the backlog does not authorize implementation.

## Current state

Formal records now identify actual Workforce shift references, retain draft/open/closed state and attributed immutable revisions. Record identity is a saved record plus the source shift instance; a journal date alone cannot create it.

## Desired state

Record for a shift

## Requirements

- Deliver only the outcome described for IOP-060.
- Separate the record, entries, closure and open issues; local categories are configuration.

## Acceptance criteria

- [x] Record for a shift
- [x] The plan documents required scenarios and decisions without expanding scope.
- [x] Validation evidence and synchronized documentation exist.

## Domain considerations

Separate the record, entries, closure and open issues; local categories are configuration.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to make the decision.

## Security considerations

Verify permissions and customer/site scope for relevant operations and references.
Do not include secrets, drawings or production data in the repository. Keep industrial
integrations read-only; record material changes where applicable.

## Data considerations

Preserve authorship, shift, references and changes; closure does not delete pending issues.

## API considerations

Validate writes/closure against permissions and state; asset references use contracts
from the owning module.

## UI considerations

Distinguish draft, open and closed states; make the previous shift easy to read without
mixing scopes.

## Dependencies

[IOP-053](IOP-053-shift-instances.md), [IOP-023](IOP-023-audit-infrastructure.md)

Dependencies indicate required contracts/capabilities, not numerical implementation
order. Refine them in the plan before changing code.

## Non-goals

Implementing adjacent tasks, accepting open decisions by inference or extending delivery
to the entire milestone. Do not introduce customer names into the core.

## Validation

The plan must define executable commands and scenarios for the criteria below using
accepted tooling. Include the expected path, errors and relevant access denial; record
actual results, not fictional tests.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, models, guides or ADRs only if this task changes their content.

## Delivery evidence — 2026-10-14

The owner's [IOP-203](IOP-203-platform-completion.md) request authorized the
remaining outcome. [IOP-204](IOP-204-formal-handover.md), its
[completed execution](../completed/IOP-204-formal-handover-plan.md) and the
[operator contract](../../development/formal-handover.md) record implementation,
permissions, actual boundaries and executed tests. The host now registers the
controller/workspace and builds generated API/browser contracts. Formal workflows
are available to Administrator, Team Leader and Task Force; Technician journal
permissions remain separate.

The completed plan records API/web lifecycle, real PostgreSQL current role/grant
and scope checks, generated contract builds and actual local desktop/390px review.
Actual planned assignments remain operator-owned input; missing planning stays
explicitly unavailable rather than becoming an inferred shift.

# IOP-063 — Asset-linked handover

## Status

Proposed

## Milestone

M7 — Shift Handover. Proposed delivery slice.

## Goal

Asset-linked handover. Expected outcome: A note can be linked to an asset

## User / business value

Teams need to transfer context and open issues without losing history between shifts.

## Context

Scope: Shift Handover. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
outline requested by the owner; inclusion in the backlog does not authorize implementation.

## Current state

IOP-194 Digital Asset Records find Handover evidence through exact source aliases.
Remaining: an explicit canonical asset reference on the Handover entry and its
validation/editing contract; existing equipment references remain unverified.

## Desired state

A note can be linked to an asset

## Requirements

- Deliver only the outcome described for IOP-063.
- Separate the record, entries, closure and open issues; local categories are configuration.

## Acceptance criteria

- [ ] A note can be linked to an asset
- [ ] The plan documents required scenarios and decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation exist.

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

[IOP-062](IOP-062-handover-entry.md), [IOP-034](IOP-034-asset-lifecycle.md)

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

## Open questions

Confirm the approved contract, edge cases and exact evidence for this slice before
starting implementation.

## Current coverage and remaining work — 2026-10-06

IOP-194 Digital Asset Records find Handover evidence through exact source aliases.
Remaining: an explicit canonical asset reference on the Handover entry and its
validation/editing contract; existing equipment references remain unverified.

See the [delivery map](../poc-delivery.md) for implemented slices and evidence.
This update does not authorize the remaining work or accept a Proposed decision.

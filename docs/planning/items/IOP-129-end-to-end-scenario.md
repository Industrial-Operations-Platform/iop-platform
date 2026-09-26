# IOP-129 — POC end-to-end demonstration

## Status

Blocked — production OIP storage, delivered importer/query/view composition,
ADR-0018 host activation and IOP-128 reset are pending. Dependency review and
[demonstration preparation](../completed/IOP-129-end-to-end-scenario-plan.md)
completed on 2026-09-26; no end-to-end runtime result is claimed.

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M17 — v1 Validation & Release. Proposed delivery slice.

## Goal

Demonstrate the local CSV-to-presentation POC.

## User / business value

Users and administrators need a demonstrable, operable and documented version.

## Context

Scope: Validation and release readiness. See [modules](../../architecture/modules.md) and
the [planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; inclusion in the backlog does not authorize implementation.

## Current state

Internal CSV reconciliation and fictional drill-down are available, but the API
host registers only health operations and the UI upload is disconnected. The
[demonstration procedure](../../development/demonstration-poc.md) defines the
bounded journey and evidence. It has not been executed against a delivered path.

## Desired state

Demonstrate the local CSV-to-presentation POC.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Import a known fixture, inspect errors/duplicates, verify overview/detail filters and
  totals, and present from IOP. Login, memberships UI, surveys, maps, shifts and
  maintenance are not gates. Validate the accepted local context mechanism separately
  before runtime access; completion is POC evidence, not shared-use release acceptance.

## Acceptance criteria

- [ ] Demonstrate the local CSV-to-presentation POC.
- [ ] Validate the slice-specific outcomes and limitations in Requirements.
- [ ] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Domain considerations

Verify the agreed v1 scope without requiring every future backlog idea.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt the decision.

## Security considerations

Verify permissions and customer/site scope on relevant operations and references.
Do not include secrets, floor plans or production data in the repository. Keep
industrial integrations read-only; record material changes where applicable.

## Data considerations

Reconcile evidence and test recovery with authorized or synthetic data.

## API considerations

Validate published contracts and documented compatibility; do not introduce features during release closure.

## UI considerations

Validate the agreed workflow and persona-specific documentation; record known limitations.

## Dependencies

[IOP-001](IOP-001-v1-personas-and-pilot-workflow.md), [IOP-048](IOP-048-data-reconciliation.md), [IOP-096](IOP-096-analytics-drilldown.md), [IOP-103](IOP-103-csv-integration.md), [IOP-128](IOP-128-demo-reset.md).

Dependencies require only their relevant POC contracts/slices, not completion of
all future parent capabilities. IOP-001 is completed design; IOP-048 has internal
evidence only, and IOP-096/103/128 remain Blocked for delivered acceptance.
[ADR-0018](../../architecture/adr/ADR-0018-local-poc-execution-context.md) is Accepted;
its host implementation and verification still gate runtime access. IOP-128 reset
design is also accepted in ADR-0029, but the reset is not implemented.
These prerequisites do not authorize adjacent implementation under IOP-129.

## Non-goals

Implementing adjacent tasks, inferring acceptance of open decisions or expanding delivery to the entire milestone. Do not introduce customer names into the core.

## Validation

The plan must specify executable commands and scenarios for the acceptance criteria using the accepted tooling. Include the expected path, errors and relevant access denial; record actual results, not fictional tests.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, models, guides or ADRs only if this task changes their content.

## Open questions

The procedure fixes the bounded scenarios using existing contracts and fixtures.
After prerequisite integration, plan actual endpoint/browser checks and reset
commands before executable validation. No additional architectural decision is
introduced by this preparation.

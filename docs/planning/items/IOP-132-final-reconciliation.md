# IOP-132 — Data reconciliation

## Status

Blocked

The [reconciliation procedure](../../development/reconciliation-poc.md) is prepared;
see the [preparation record](../completed/IOP-132-final-reconciliation-plan.md).
Production OIP storage, delivered import/read composition and connected overview/detail
remain unavailable. IOP-048 internal verification and IOP-096 fictional UI evidence
do not satisfy final source-to-report acceptance; IOP-129 is still Proposed.

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M17 — v1 Validation & Release. Proposed delivery slice.

## Goal

Verify source-to-report totals for the analytical POC.

## User / business value

Users and administrators need a demonstrable, operable and documented version.

## Context

Scope: Validation and release readiness. See [modules](../../architecture/modules.md) and
the [planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; inclusion in the backlog does not authorize implementation.

## Current state

Accepted filter/query/metric contracts and independent synthetic expectations are
available. The procedure defines the comparison and evidence required, but no
delivered source-to-both-views reconciliation has run.

## Desired state

Verify source-to-report totals for the analytical POC.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Compare independently calculated frequency/duration with both views under identical
  filters, accounting for rejected and unresolved input. No login or cross-module
  workflow is required for numerical reconciliation; shared-use access validation
  remains separate.

## Acceptance criteria

- [ ] Verify source-to-report totals for the analytical POC.
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

[IOP-048](IOP-048-data-reconciliation.md), [IOP-096](IOP-096-analytics-drilldown.md), [IOP-129](IOP-129-end-to-end-scenario.md).

Dependencies require only their relevant POC contracts/slices, not completion of
all future parent capabilities. Runtime business access requires implementation and
validation of the local execution-context mechanism in
[Accepted ADR-0018](../../architecture/adr/ADR-0018-local-poc-execution-context.md).
The stale Proposed-ADR wording in IOP-129 is historical; it is translated without
changing that dependency's scope or status in this increment.

## Non-goals

Implementing adjacent tasks, inferring acceptance of open decisions or expanding delivery to the entire milestone. Do not introduce customer names into the core.

## Validation

The plan must specify executable commands and scenarios for the acceptance criteria using the accepted tooling. Include the expected path, errors and relevant access denial; record actual results, not fictional tests.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, models, guides or ADRs only if this task changes their content.

## Open questions

The accepted contracts settle the comparison semantics. Resume delivered validation
when production OIP storage, executable IOP-089 queries, importer/host activation
and connected views are available. Record real IOP-129 demonstration evidence;
no new formula, endpoint or architectural decision is requested by this procedure.

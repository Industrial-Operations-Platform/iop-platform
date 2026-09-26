# IOP-128 — Demo reset

## Status

Blocked — reset authority awaits ADR-0029 acceptance; production OIP storage and
real importer/host composition are not delivered. Dependency review: 2026-09-26.

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M16 — Demo / Pilot Dataset. Proposed delivery slice.

## Goal

Recreate only the dedicated analytical demo dataset.

## User / business value

The team needs to demonstrate IOP without enterprise infrastructure or information.

## Context

Scope: synthetic demo and pilot fixtures. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; backlog membership alone does not authorize implementation.

## Current state

IOP-123 supplies the fictional scope seed and IOP-125 supplies analytical fixtures.
Integrations retains batches/RAW with a database-wide quota; no reset exists.
See the [execution plan](../active/IOP-128-demo-reset-plan.md) and
[Proposed ADR-0029](../../architecture/adr/ADR-0029-scoped-demo-reset.md).

## Desired state

Recreate only the dedicated analytical demo dataset.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Reset only a verified demo environment and explicit scoped dataset. Include a refusal
  check outside that target. No workforce, maintenance or physical asset fixtures are
  prerequisites.

## Acceptance criteria

- [ ] Recreate only the dedicated analytical demo dataset.
- [ ] Validate the slice-specific outcomes and limitations in Requirements.
- [ ] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Domain considerations

Use fictional organizations, names, assets and relationships; fixtures do not define rigid domain levels.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt their decisions.

## Security considerations

Verify customer/site permissions and scope for relevant operations and references.
Do not include secrets, floor plans or production data in the repository. Keep
industrial integrations read-only; record material changes where applicable.

## Data considerations

Use reproducible data with explicit scope and provenance; include useful invalid/ambiguous cases without secrets.

## API considerations

Use agreed loading mechanisms; prevent demo reset from affecting production.

## UI considerations

The user must distinguish demo and real data; scope does not include designing new screens.

## Dependencies

[IOP-123](IOP-123-demo-organization.md), [IOP-125](IOP-125-demo-events.md).

Both direct dependency slices are completed and integrated on develop. Dependencies
require only their relevant POC slices, not future parent capabilities. ADR-0018
is Accepted; host implementation and validation still gate runtime access. Actual
recreation additionally needs production OIP receiving storage and the composed
importer. Their absence does not authorize implementing adjacent stories here.

## Non-goals

Implementing adjacent tasks, inferring acceptance of open decisions or extending delivery to the entire milestone. Do not introduce customer names into the core.

## Validation

The plan must specify executable commands and scenarios using accepted tooling.
Include the expected path, failures and relevant access denial; record actual
results, not fictitious tests. ADR-0029 lists the proposed reset evidence; none
has been executed against a reset implementation.

## Documentation impact

Update this item, its [backlog](../backlog.md) status and execution plan.
Update contracts, model, guides or ADRs only if this task changes their content.

## Open questions

Accept or revise Proposed ADR-0029 before dependent implementation. Before coding,
complete the execution plan with the concrete maintenance/quiescence mechanism
and the delivered OIP cleanup/import contracts.

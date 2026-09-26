# IOP-094 — Source equipment analytics (POC)

## Status

Blocked — specification complete; executable IOP-089 queries, production OIP
storage and ADR-0018 host activation remain pending.

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M11 — OIP / Operational Intelligence. Proposed delivery slice.

## Goal

Analyze source equipment references without a physical asset registry.

## User / business value

Operations staff and managers need explainable metrics to prioritize problems.

## Context

Scope: Operational Intelligence (OIP). See [modules](../../architecture/modules.md) and
the [planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; inclusion in the backlog does not authorize implementation.

## Current state

The [equipment specification and reconciliation matrix](../../product/source-equipment-analytics-poc.md)
refine Accepted ADR-0023/0028 and the canonical aggregate equality rules.
No runtime equipment query/view is delivered. See the
[specification execution record](../completed/IOP-094-source-equipment-analytics-plan.md).

## Desired state

Analyze source equipment references without a physical asset registry.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Group the two measures by source-scoped equipment designation and retain contributing
  messages. Do not create surveyed assets from text. IOP-044 becomes relevant only when
  physical asset linkage is separately delivered.
- Equipment identity is the exact source-scoped area/equipment pair. Preserve
  message text/type/group tuples, repeated lines, zero measures and unclassified
  facts; both measures and record count reconcile across the complete selection.
- Reuse shared filters, data revision, coverage and contributing-record provenance
  between overview and detail; no totals derived from a single record page.

## Acceptance criteria

- [ ] Runtime source-equipment groups and contributing messages reconcile without a physical asset registry.
- [ ] Validate shared navigation, filters, coverage, zero/empty states and relevant
  access denial through the delivered path.
- [x] Record specification evidence and synchronize the story/plan; runtime
  acceptance remains pending.

## Domain considerations

OIP is an IOP module; metrics remain decoupled from the UI and WinCC schemas.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt the decision.

## Security considerations

Verify permissions and customer/site scope for relevant operations and references.
Do not include secrets, plant drawings or production data in the repository. Keep
industrial integrations read-only; record material changes where applicable.

## Data considerations

Define grain, coverage, units and periods; accumulated alarm duration does not automatically equal downtime.

## API considerations

Queries require verified scope filters and traceability to contributing records.

## UI considerations

Show metric definitions and limitations; do not present correlation as root cause.

## Dependencies

[IOP-090](IOP-090-event-frequency.md), [IOP-091](IOP-091-downtime.md).

Dependencies require only their relevant POC contracts/slices, not completion of
all future parent capabilities. Their measure specifications are complete; runtime
reconciliation is Blocked on [IOP-089](IOP-089-analytics-query-layer.md), which has
accepted query semantics under ADR-0028 but no executable queries. Production OIP
facts and implementation/validation of Accepted ADR-0018 independently gate
runtime business access. No adjacent story is activated.

## Non-goals

Implementing adjacent tasks, inferring acceptance of open decisions or expanding delivery to the entire milestone. Do not introduce customer names into the core.

## Validation

The plan must specify executable commands and scenarios for the acceptance criteria using the accepted tooling. Include the expected path, errors and relevant access denial; record actual results, not fictional tests.

## Documentation impact

Update this item, its [backlog](../backlog.md) status and the execution plan.
Update contracts, models, guides or ADRs only if this task changes their content.

## Open questions

No new metric or architecture is introduced. Bounded grouped response delivery
remains to be resolved within IOP-089 after its runtime prerequisites exist.
The specification supplies exact fixture expectations and additional runtime
scenarios; it does not implement the missing storage/query/host dependencies.

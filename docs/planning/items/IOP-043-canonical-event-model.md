# IOP-043 — Event canonical model

## Status

Completed — bounded POC aggregate design documented on 2026-09-26.
No runtime receiver, migration, endpoint or importer is implemented by this story.

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M5 — Industrial Data Foundation. Documentation/design only.

## Goal

Model source-reported event aggregates without fabricating occurrences.

## User / business value

Operations needs traceable imported data and reconcilable metrics.

## Context

Scope: Integrations and Operational Intelligence. See [modules](../../architecture/modules.md) and
the [planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; backlog membership alone does not authorize implementation.

## Current state

The [POC canonical aggregate model](../../architecture/event-aggregates-poc.md)
now specializes the existing source/RAW contracts and accepted temporal, scope,
filter and publication decisions. Internal import batch storage exists under
IOP-042; the production OIP receiver and analytical persistence remain unimplemented.

## Desired state

Model source-reported event aggregates without fabricating occurrences.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Represent frequency, accumulated duration, source grouping, reporting-date label and
  provenance. Keep unresolved coverage explicit. Do not require individual occurrence
  timestamps, asset survey or a universal model for future vendors.

## Acceptance criteria

- [x] Model source-reported event aggregates without fabricating occurrences.
- [x] Validate the slice-specific outcomes and limitations in Requirements.
- [x] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Domain considerations

RAW → validation → normalization; the receiving module validates invariants. Do not infer a physical asset from text alone.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt their decisions.
The model also specializes Accepted ADR-0012/0013/0016/0023/0027; it adds no new
architectural mechanism and requires no new ADR.

## Security considerations

Verify organization/site permission and scope on relevant operations and references.
Do not include secrets, floor plans or production records in the repository. Keep
industrial integrations read-only; record material changes where applicable.

## Data considerations

Preserve provenance and grain; distinguish occurrences from aggregates. Rejections and corrections must be visible.

## API considerations

Use ingestion contracts; credentials and external column names stay in adapters/configuration.

## UI considerations

Expose import states, errors and results only if requested by this task; do not create a full dashboard.

## Dependencies

[IOP-008](IOP-008-time-and-timezone-model.md), [IOP-012](IOP-012-source-integration-contract.md), [IOP-019](IOP-019-database-bootstrap.md), [IOP-026](IOP-026-site-model.md).

Dependencies require only their relevant POC contracts/slices, not completion of
all future parent capabilities. IOP-008/012 are completed design; IOP-019 migration
infrastructure and IOP-026's site seed are integrated on develop. The broader
IOP-026 parent remains Deferred. These slices suffice for this design.
ADR-0018 is Accepted; runtime host activation and verification remain pending.
Existing IOP-041/042 RAW/publication contracts are reused without activating adjacent work.

## Non-goals

Implementing applications, migrations, endpoints or infrastructure. Do not introduce customer names into the core.

## Validation

Review consistency, links, scenarios and decisions; do not invent commands or write runtime code to validate this design task.
The [completed plan](../completed/IOP-043-canonical-event-model-plan.md) records
documentation checks and synthetic walkthroughs, not executable importer evidence.

## Documentation impact

Update this item, its status in the [backlog](../backlog.md) and the execution plan.
Update contracts, model, guides or ADRs only when this task changes their content.
The aggregate model, conceptual data model and delivery map are synchronized.
The entire original story is translated into English; direct dependency stories
were already English and remain unchanged.

## Open questions

Resolve concrete design decisions with options, a recommendation and an ADR when
they affect architecture. No new architectural decision blocks this bounded model.
Exact exporter grouping/window remains unverified. Dimension wire encoding and
resolution belong to analytical delivery; sector-key continuity belongs to mapping
delivery. Physical storage and runtime receiver validation remain future work.

## Owner-supplied CSV and reporting context

Model the supplied input as aggregate alarm statistics with frequency, duration, source dimensions and explicit reporting coverage. Do not synthesize individual event timestamps. Resolve exact grain and distinguish aggregate facts from future occurrence-level sources before defining the canonical contract.

See the [shared evidence](../../product/csv-and-reporting-reference.md), captured
under IOP-002 at the owner's request. IOP-012 establishes one aggregate per source
record; this story defines the receiving model without claiming exporter tuple
uniqueness, occurrence-level evidence or new metric formulas. No runtime
implementation is claimed.

# IOP-012 — Define the CSV source contract

## Status

Completed — bounded POC source contract documented on 2026-09-25.
No importer implementation or runtime validation is claimed.

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M1 — Product & Architecture Definition. Documentation/design only.

## Goal

Define the supported CSV-to-domain contract.

## User / business value

The team needs reviewable decisions before building a reusable platform.

## Context

Scope: product and cross-module architecture. See [modules](../../architecture/modules.md)
and the [planning workflow](../workflow.md). The initial context came from the
owner-requested outline; backlog membership alone does not authorize implementation.
The owner requested this POC design on 2026-09-25 and supplied a representative CSV
plus Python preparation and Power BI classification excerpts.

## Current state

The [CSV source contract](../../architecture/csv-source-contract-poc.md) defines
the bounded format, neutral aggregate, validation and mapping behavior using the
existing accepted architecture. The importer remains unimplemented.

## Desired state

Define the supported CSV-to-domain contract.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Specify the observed format, aggregate grain, units, reporting-date label, configured
  scope and validation outcomes. Keep source-specific columns in the adapter. No generic
  CSV/WinCC/Ultimo provider framework or external connectivity is required.

## Acceptance criteria

- [x] Define the supported CSV-to-domain contract.
- [x] Validate the slice-specific outcomes and limitations in Requirements.
- [x] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Domain considerations

Define contracts and decisions; keep identity, permissions, scope and providers separate.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt their decisions.
The contract specializes Accepted ADR-0011/0012/0016 and IOP-014 without adding
a new architectural mechanism or accepting ADR-0018.

## Security considerations

Verify organization/site permissions and scope on relevant operations and references.
Do not include secrets, floor plans or production records in the repository. Keep
industrial integrations read-only; record material changes where applicable.
The authorized reference CSV was inspected externally and remains outside Git.

## Data considerations

Document persistence and isolation implications without creating schemas.
Keep one aggregate per source row, exact reported measures and scoped RAW provenance.

## API considerations

Specify contracts where relevant; do not create endpoints.

## UI considerations

Document user needs; do not select or build UI by inference.

## Dependencies

[IOP-003](IOP-003-api-contract-strategy.md), [IOP-004](IOP-004-platform-scope-model.md), [IOP-008](IOP-008-time-and-timezone-model.md), [IOP-014](IOP-014-security-baseline.md).

Dependencies require only their relevant POC contracts/slices, not completion of
all future parent capabilities. Runtime business access also requires an accepted
local execution-context mechanism; Proposed ADR-0018 is not yet that acceptance.
All four direct dependencies are completed design and integrated on develop;
none blocks this independent source-contract documentation.

## Non-goals

Implementing applications, migrations, endpoints or infrastructure. Do not introduce
customer names into the core. No general provider framework, live connection,
physical asset model or new metric is included.

## Validation

Review consistency, links, scenarios and decisions; do not invent test commands or
write runtime code to validate this design task. Read-only inspection established
the actual file structure; manual synthetic walkthroughs establish contract
expectations, not parser execution or legacy conversion parity. See the
[completed plan](../completed/IOP-012-csv-source-contract-plan.md).

## Documentation impact

Update this item, its [backlog](../backlog.md) status and execution plan.
Update contracts, model, guides or ADRs only when this task changes their content.
The source contract and [reference evidence](../../product/csv-and-reporting-reference.md)
are synchronized. The entire original story's Spanish prose is translated to English;
direct dependency stories were already English and remain unchanged.

## Open questions

No architectural decision blocks this bounded design. Exact exporter grouping and
reporting-window boundaries remain unknown; the contract preserves row aggregates
and unknown coverage. The supplied duration helper was absent, so legacy conversion
parity and DAX comparison parity require evidence in importer/mapping delivery.
Operational limits, persistence/atomicity, mappings and executable reconciliation
belong to their separately authorized delivery stories; those are not completed here.

# IOP-011 — Define CSV preservation for the POC

## Status

Blocked — design proposal prepared on 2026-09-25; awaiting owner acceptance of
[ADR-0022](../../architecture/adr/ADR-0022-poc-csv-preservation.md).
No runtime implementation is claimed.

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md).

## Milestone

M1 — Product & Architecture Definition. Documentation/design only.

## Goal

Define minimum preservation and retrieval of original CSV input.

## User / business value

The team needs reviewable decisions before building a reusable platform.

## Context

Scope: product and cross-module architecture. See [modules](../../architecture/modules.md)
and the [planning workflow](../workflow.md). This initial context comes from the
owner's requested outline; a backlog entry alone does not authorize implementation.

## Current state

The [preservation contract](../../architecture/csv-preservation-poc.md) proposes
original-byte retention, scoped provenance/retrieval, fixed admission budgets and
failure/reset boundaries. ADR-0022 compares storage options and recommends bounded
PostgreSQL binary rows. Neither the proposal nor its implementation is accepted.

## Desired state

Define minimum preservation and retrieval of original CSV input.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- POC acceptance covers scoped RAW CSV provenance, bounded input size and safe local
  retrieval/storage behavior. Map storage, attachments and a generic object-storage
  abstraction remain future scope. Exact storage choice belongs to this slice, not an
  assumed new service.

## Acceptance criteria

- [ ] Define minimum preservation and retrieval of original CSV input.
- [ ] Validate the slice-specific outcomes and limitations in Requirements.
- [x] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

The first two criteria have a reviewed proposal and scenario walkthroughs; final
closure waits for the storage decision. Runtime tests belong to delivering stories.

## Domain considerations

Define contracts and decisions; keep identity, permissions, scope and providers separate.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt their decisions.
ADR-0022 retains Accepted ADR-0012/0013/0014 scope, RLS and permissions.

## Security considerations

Verify permissions and organization/site scope on relevant operations and references.
Do not include secrets, floor plans or production data in the repository. Keep
industrial integrations read-only; record material changes where applicable.
Original CSV retrieval requires `imports.review`, independently of analytics access.

## Data considerations

Document persistence and isolation implications without creating schemas.
Preserve original bytes and provenance, with no inferred occurrence timestamps.

## API considerations

Specify contracts where relevant; do not create endpoints.

## UI considerations

Document user needs; do not select or build UI by inference.

## Dependencies

[IOP-005](IOP-005-tenancy-and-data-isolation.md), [IOP-014](IOP-014-security-baseline.md).
Both relevant design slices are completed and integrated on develop. The completed
[IOP-012 source contract](IOP-012-source-integration-contract.md) supplies the CSV
format and reporting-date semantics used by this proposal.

Dependencies require only their relevant POC contracts/slices, not completion of
all future parent capabilities. Runtime business access also requires an accepted
local execution-context mechanism; Proposed ADR-0018 is not yet that acceptance.

## Non-goals

Implementing applications, migrations, endpoints or infrastructure. Do not introduce
customer names into the core. Maps, attachments, a general storage platform and
full retention infrastructure remain deferred beyond the POC.

## Validation

Review consistency, links, scenarios and decisions; do not invent test commands or
write runtime code to validate this design task. The
[active plan](../active/IOP-011-csv-preservation-plan.md) records documentation
checks and limitations. No runtime security, storage or performance evidence is claimed.

## Documentation impact

Update this item, its [backlog](../backlog.md) status and execution plan.
Update contracts, model, guides or ADRs only when this task changes their content.
The preservation contract, Proposed ADR-0022 and delivery discovery link are added.
The original story's Spanish prose is translated in full; dependency stories read
were already English. Accepted architecture baselines are unchanged.

## Open questions

Accept ADR-0022's bounded PostgreSQL storage and linked preservation contract, or
select an alternative before dependent work. Ingestion transaction/publication and
reset implementation remain separate delivery work; acceptance of this design does
not accept ADR-0018 or complete those stories.

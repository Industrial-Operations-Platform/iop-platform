# IOP-125 — Synthetic analytical CSV fixtures

## Status

Completed — static POC fixtures and independent expected outputs delivered on
2026-09-25. Real importer validation remains an IOP-103 handoff.

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M16 — Demo / Pilot Dataset. Bounded POC fixture slice.

## Goal

Provide representative CSV aggregates and independent expected totals.

## User / business value

The team needs to demonstrate IOP without enterprise infrastructure or information.

## Context

Scope: synthetic demo and pilot fixtures. See [modules](../../architecture/modules.md) and
the [planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; backlog membership alone does not authorize implementation.

## Current state

The [fixture corpus](../../../fixtures/analytical-poc/README.md) provides 14 synthetic
CSV files, explicit fictional scope/mapping and literal expected outputs. The
baseline contains nine aggregates across two reporting dates; invalid and duplicate
scenarios are separate. No importer, database seed or runtime access is delivered.

## Desired state

Provide representative CSV aggregates and independent expected totals.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Fixtures cover valid, invalid, duplicate and unclassified examples with source
  equipment references, without asset surveys or external connections. Author fixtures
  before importer completion; validate them through IOP-103 when available. Preserve
  unknown windows and do not fabricate individual events.

## Acceptance criteria

- [x] Provide representative CSV aggregates and independent expected totals.
- [x] Validate the slice-specific outcomes and limitations in Requirements.
- [x] Record evidence and synchronize the story/plan; do not close a broader parent with
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

[IOP-123](IOP-123-demo-organization.md), [IOP-012](IOP-012-source-integration-contract.md).

IOP-012 supplies the completed source contract. IOP-123 remains Proposed; this
standalone corpus uses descriptive fixture IDs and does not claim a seeded demo.
IOP-123 must bind or seed that scope before runtime integration.

Dependencies require only their relevant POC contracts/slices, not completion of
all future parent capabilities. Runtime business access also requires an accepted
local execution-context mechanism; Proposed ADR-0018 is not yet that acceptance.

## Non-goals

Implementing adjacent tasks, inferring acceptance of open decisions or extending delivery to the entire milestone. Do not introduce customer names into the core.

## Validation

Independent Python standard-library inspection verified encoding, physical lines,
normalized rows, exact date/sector/filter totals, repeated tuples, ten intentional
invalid inputs and duplicate bytes. See the [completed plan](../completed/IOP-125-analytical-fixtures-plan.md).
Admission, retry, access denial and concurrency scenarios await the real importer
under IOP-103; fixture checks are not runtime test evidence.

## Documentation impact

Update this item, its [backlog](../backlog.md) status and execution plan.
Update contracts, model, guides or ADRs only if this task changes their content.

## Open questions

No open decision blocks static fixture delivery. Seed binding, real importer
validation and observed end-to-end timings remain later handoffs. Reporting windows
and exporter grouping remain unknown as required by the source contract.

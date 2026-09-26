# IOP-103 — Manual CSV delivery validation

## Status

Blocked — production OIP receiving storage, delivered importer/review composition
and ADR-0018 host activation are not yet available. Dependency review and the
[execution plan](../active/IOP-103-csv-validation-plan.md) were prepared on 2026-09-26.

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md). No implementation is claimed.

## Milestone

M13 — External Integrations. Local analytical POC validation slice.

## Goal

Verify the manual CSV path end to end.

## User / business value

Administrators need to connect sources without coupling the product to a provider.

## Context

Scope: Integrations and Authentication adapters. See [modules](../../architecture/modules.md)
and the [planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; backlog membership alone does not authorize implementation.
The owner requested this POC slice on 2026-09-26.

## Current state

IOP-045 supplies pure CSV preparation; IOP-046 supplies internal validation reports.
IOP-047/048 verify date admission and reconciliation through a disposable database
receiver. The API host registers only health operations; no real CSV submit/review
or production OIP receiver is composed. These internal results do not verify the
manual path end to end. Reuse [IOP-125 fixtures](IOP-125-demo-events.md) once that
path is delivered; do not duplicate the importer to claim completion.

## Desired state

Verify the manual CSV path end to end.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Reuse the CSV adapter and integrity checks against a representative fixture. Do not
  create a second importer or require IOP-102 integration registry. Live connections and
  provider health remain later work.

## Acceptance criteria

- [ ] Verify the manual CSV path end to end.
- [ ] Validate the slice-specific outcomes and limitations in Requirements.
- [ ] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Domain considerations

WinCC and Ultimo are adapter candidates, not core entities; Entra belongs in Authentication.

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

Separate secrets, mapping, provenance and scope; preserve existing flows during any migration.

## API considerations

Use documented, authorized interfaces; industrial sources remain read-only. Contracts do not promise real connectivity.

## UI considerations

Show health and errors without leaking credentials or another customer’s data.

## Dependencies

[IOP-045](IOP-045-csv-adapter.md), [IOP-046](IOP-046-import-validation.md), [IOP-047](IOP-047-import-idempotency.md), [IOP-048](IOP-048-data-reconciliation.md).

Dependencies require only their relevant POC contracts/slices, not completion of
all future parent capabilities. [ADR-0018](../../architecture/adr/ADR-0018-local-poc-execution-context.md)
is Accepted; its host implementation and verification remain pending. Production
OIP receiving storage and real importer/review composition are additional runtime
prerequisites. No IOP-102 integration registry is required.

## Non-goals

Implementing adjacent tasks, inferring acceptance of open decisions or extending delivery to the entire milestone. Do not introduce customer names into the core.

## Validation

The plan must define executable commands and scenarios for acceptance using the accepted tooling. Include expected paths, errors and relevant access denial; record actual results, not fictional tests.

## Documentation impact

Update this item, its [backlog](../backlog.md) status and execution plan.
Update contracts, model, guides or ADRs only if this task changes their content.

## Open questions

The plan defines the bounded validation scenarios. Resolve actual endpoint/test
contracts when the missing production path is integrated; internal probes and
fixture UI cannot satisfy end-to-end acceptance. No new architectural decision
is proposed by this documentation increment.

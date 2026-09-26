# IOP-049 — Source aliases/mappings

## Status

In progress — pure scoped mapping implemented; owner memberships reconciled and editable locally;
persisted import composition remains pending.

## POC delivery applicability

Owner-approved scope refinement under [IOP-142](IOP-142-poc-delivery-scope.md),
2026-09-15. The revised Goal, Requirements, Acceptance criteria and Dependencies
control the selected slice; older general platform prose is future context, not
an additional POC gate. See [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md).

## Milestone

M5 — Industrial Data Foundation. Bounded POC delivery slice.

## Goal

Map source area and sector labels through scoped configuration.

## User / business value

Operations needs traceable imported data and reconcilable metrics.

## Context

Scope: Integrations and Operational Intelligence. See [modules](../../architecture/modules.md)
and the [planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; backlog membership alone does not authorize implementation.
The owner requested this POC slice on 2026-09-26.

## Current state

Integrations now validates and snapshots organization/site/source mapping configuration,
classifies prepared CSV records and preserves unclassified records and measures.
See the [internal contract](../../../apps/api/README.md#scoped-source-classification-iop-049).
The owner supplied the original five customer lists on 2026-09-26. Their 89
memberships are preserved in ignored local JSON, with editable labels and area
assignments. Exact supplied-membership reconciliation is complete; durable
receipt/OIP composition remains pending.

## Desired state

Map source area and sector labels through scoped configuration.

## Requirements

- Deliver only the selected POC slice or explicitly deferred future scope below.
- Preserve the evidenced area-to-sector classification, unclassified records and mapping
  revision. No physical asset alias dependency. IOP-037 is relevant only to a future
  surveyed-asset mapping slice.
- Keep sector names and area assignments editable in scoped local configuration;
  retain stable sector keys and use a new revision for changes to future imports.

## Acceptance criteria

- [x] Map source area and sector labels through scoped configuration (pure internal stage).
- [ ] Validate the slice-specific outcomes and limitations in Requirements, including
  reconciliation against the actual owner lists and persisted import handoff.
- [x] Record evidence and synchronize the story/plan; do not close a broader parent with
  unfinished future scope.

## Domain considerations

RAW → validation → normalization; the receiving module validates invariants.
Do not infer a physical asset from text alone.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt their decisions.
This pure stage specializes IOP-012/043 contracts without a new architectural mechanism.

## Security considerations

Verify organization/site permissions and scope on relevant operations and references.
Do not include secrets, floor plans or production records in the repository. Keep
industrial integrations read-only; record material changes where applicable.
Configuration matching is not authorization or proof of site ownership.

## Data considerations

Preserve provenance and grain; distinguish occurrences from aggregates.
Rejections and corrections must be visible. Snapshot the mapping revision and result;
changes affect future preparations only. Never silently reinterpret historical facts.

## API considerations

Use ingestion contracts; credentials and external column names stay in adapters/configuration.
No endpoint is added by this slice.

## UI considerations

Expose import states, errors and results only if requested by this task;
do not create a full dashboard.

## Dependencies

[IOP-012](IOP-012-source-integration-contract.md), [IOP-043](IOP-043-canonical-event-model.md).

Both relevant POC design slices are completed and integrated on develop. They do
not require completion of all future parent capabilities. The integrated IOP-045
adapter supplies prepared records. ADR-0018 is Accepted; its host implementation
and validation still gate runtime business access independently.

## Non-goals

Implementing adjacent tasks, accepting open decisions by inference or extending
delivery to the entire milestone. No customer names in the core, physical aliases,
mapping administration UI, historical reclassification or general registry.

## Validation

Use executable expected-path, error and relevant scope-rejection scenarios with
accepted tooling; record actual results, not invented tests. The
[execution record](../completed/IOP-049-source-mappings-plan.md) covers synthetic
classification, comparison, configuration, revision and measure-preservation tests.
It does not establish DAX parity or delivered database/access behavior.

## Documentation impact

Update this item, its [backlog](../backlog.md) status and execution plan.
Update contracts, model, guides or ADRs only when this task changes their content.
The entire original story is translated to English; dependency stories were already English.

## Open questions

The supplied `Arbeit Sektor` memberships are reconciled under the exact POC
comparison contract; Power BI execution/comparison parity on variant text is not
claimed. Durable mapping/receipt/OIP binding remains a future composition increment.
See the [editable-configuration record](../completed/IOP-049-editable-mappings-plan.md).

## Owner-supplied CSV and reporting context

The export has area labels and equipment designations but no explicit hall, parent
or sensor field. The supplied Power BI DAX column applies `TRIM` to the area label
and classifies it through five explicit membership lists into a reporting sector,
with an unclassified fallback. This corrects the earlier Python attribution.
Preserve this behavior as customer-scoped configuration, including visible unmapped
records; validate text comparison, conflicting mappings and historical changes.
Equipment-to-sensor mappings are still unverified. Preserve ambiguous/unmapped
records; do not infer physical hierarchy from code punctuation or hard-code pilot labels.

See the [shared evidence](../../product/csv-and-reporting-reference.md), captured
under IOP-002 at the owner's request. It supplies historical context, not acceptance
of additional metric formulas or evidence that actual classifications are reconciled.

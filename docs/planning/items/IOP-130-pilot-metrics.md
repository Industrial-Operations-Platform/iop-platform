# IOP-130 — Pilot metrics

## Status

Blocked — IOP-129's delivered demonstration and owner observation are unavailable.
[Measurement preparation](../completed/IOP-130-pilot-metrics-plan.md) completed on
2026-09-26; no pilot measures or owner feedback have been collected.

## Milestone

M17 — v1 Validation & Release. Selected local POC measurement slice only.

## Goal

Measure the acceptance outcomes defined in IOP-001 for the local analytical POC.
The [POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md)
control this slice; broader shared-use v1 validation remains deferred.

## User / business value

Users and administrators need a demonstrable, operable and documented result,
with evidence of analytical correctness and the owner's assessment of usefulness.

## Context and current state

Scope: validation and release readiness. See [modules](../../architecture/modules.md)
and the [planning workflow](../workflow.md). Backlog inclusion alone did not authorize
implementation; the owner requested this POC slice on 2026-09-26.

IOP-001 supplies accepted design measures. IOP-129 is Blocked on production OIP
storage, delivered importer/query/view composition, ADR-0018 host activation and
IOP-128 reset. The [measurement procedure](../../development/pilot-metrics-poc.md)
is prepared; internal tests and fictional views do not supply pilot results.

## Desired state and requirements

- Measure workflow coverage, import integrity, analytical parity, usability/value
  and isolation/traceability using actual local demonstration evidence.
- Reuse the two accepted measures: reported frequency and accumulated alarm duration.
  Record owner feedback, actual dataset size and observed timings without invented
  performance or benefit targets.
- Keep source coverage, unknown windows, exclusions and unresolved mappings visible.
  Measure only the agreed POC, without requiring every future backlog idea.

## Acceptance criteria

- [ ] IOP-001's five acceptance measures have actual POC observations and linked evidence.
- [ ] Owner feedback and observed timing/dataset context are recorded with limitations;
  the two analytical measures reconcile in both views.
- [x] The plan documents scenarios and necessary decisions without expanding scope.
- [ ] Validation evidence and synchronized documentation support successful slice closure.

## Architecture and security constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md) apply.
Proposed ADRs are proposals, not permission to adopt a decision.

Verify permissions and organization/site scope on relevant operations and references.
[ADR-0018](../../architecture/adr/ADR-0018-local-poc-execution-context.md) is Accepted,
but its delivered host verification remains a gate. Do not include secrets, floor
plans or production data. Industrial integrations remain read-only; material changes
retain applicable traceability. No architecture or runtime access change is introduced.

## Data, API and UI considerations

Reconcile evidence and reproducibility with authorized or synthetic data. Validate
delivered contracts and the agreed workflow; retain known limitations. Do not add
features during validation or infer downtime, occurrence timestamps or legacy parity.
One local operator may perform multiple analytical responsibilities without login.

## Dependencies

[IOP-001](IOP-001-v1-personas-and-pilot-workflow.md) — Completed design; reuse its
[accepted measures](../../product/personas-and-pilot-workflow.md#accepted-acceptance-measures).
[IOP-129](IOP-129-end-to-end-scenario.md) — Blocked; supplies the actual demonstration,
reconciliation and local access/reset evidence. Reuse the linked
[IOP-132 procedure](../../development/reconciliation-poc.md) for numerical comparisons.

Dependencies identify required POC contracts and evidence, not numerical execution
order or authorization to implement neighboring stories. Owner observation follows
the delivered workflow; it is not available from an automated or fictional preview.

## Non-goals

Adjacent implementation, inferred acceptance of open decisions, customer names in
core, expansion to the entire milestone, new KPIs/targets, telemetry infrastructure,
legacy pipeline execution, formal performance certification and shared-use release.

## Validation and documentation impact

Follow the measurement procedure, recording actual outcomes, error/duplicate handling
and relevant denial evidence. The runtime plan must name delivered commands and
scenarios before execution. Update this item, [backlog](../backlog.md), delivery map
and execution record. Change other contracts/guides/ADRs only when this task affects them.

## Open work

After IOP-129 prerequisites are delivered, execute the measurement session and collect
owner feedback. No additional architectural decision is required for preparation.

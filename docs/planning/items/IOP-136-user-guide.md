# IOP-136 — User documentation

## Status

Blocked — the POC preview guide is delivered; final operator validation requires
IOP-129's real CSV-to-presentation journey and IOP-122's real-control checks.

## Milestone

M17 — v1 Validation & Release. Selected POC documentation slice.

## Goal and user value

Enable technicians and Team Leaders to use and present the local analytical POC.
Users and administrators need a demonstrable, operable and documented version.

## Context and current state

Scope: Validation and release readiness. See [modules](../../architecture/modules.md)
and the [planning workflow](../workflow.md). This context originated in the
owner-requested outline; backlog membership alone does not authorize implementation.
The owner's 2026-09-26 request selects only the [POC scope](../../product/scope-poc.md)
and [delivery map](../poc-delivery.md), not the broader shared-use v1 manual.

The [user guide](../../product/user-guide-poc.md) describes existing navigation,
fictional filters, contributing records, keyboard operation and recovery. Real
CSV submission, stored analytical views and scoped reset remain unavailable.
The desired outcome is a guide verified against that delivered POC journey.

## Requirements

- Deliver only the user-documentation outcome for IOP-136 within the agreed POC;
  do not require every future backlog idea.
- Give technicians and Team Leaders reproducible local instructions and examples,
  clearly distinguishing current fictional behavior from pending runtime features.
- Explain reporting-date coverage, frequency, accumulated alarm duration,
  classification, filters and provenance without unsupported operational claims.
- Finalize real import, invalid/duplicate input, analysis, presentation and reset
  instructions when dependencies provide executable evidence.

## Acceptance criteria

- [x] Current preview instructions, examples and limitations are documented.
- [x] The plan records scenarios and necessary decisions without expanding scope.
- [x] Evidence for the documentation increment and synchronized references exist.
- [ ] Technicians/Team Leaders can use the delivered real POC journey following
  the guide, with operator walkthrough evidence.

## Domain and architecture constraints

Verify the agreed scope without requiring all future capabilities.
[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md) apply.
Proposed ADRs are proposals, not permission to adopt a decision.
[ADR-0018](../../architecture/adr/ADR-0018-local-poc-execution-context.md) is Accepted;
its runtime implementation and validation remain pending.

## Security, data, API and UI considerations

Verify permission and customer/site scope for relevant operations and references.
Exclude secrets, floor plans and production data from the repository. Keep
industrial integrations read-only; record material changes where applicable.
Reconcile evidence and test recovery using authorized or synthetic data.
Validate published contracts and documented compatibility; do not add features
during release closure. Validate the agreed workflow and documentation per persona,
and record known limitations. This increment changes no runtime contract or UI.

## Dependencies

- [IOP-129](IOP-129-end-to-end-scenario.md): real import, errors/duplicates,
  reconciliation, presentation and scoped reset evidence. Still Proposed; blocks
  final guide validation, not independent preview documentation.
- [IOP-122](IOP-122-accessibility.md): preview baseline available; real analytical
  control/data verification remains Blocked and must inform the final instructions.

Dependencies identify required capabilities, not numerical implementation order.
Only relevant POC slices are required. See the
[execution record](../completed/IOP-136-poc-user-guide-plan.md) for reviewed evidence.

## Non-goals

Adjacent implementation, inferred acceptance of open decisions or the entire
milestone. No customer names in the core. No shared-use administration manual,
login, integrations, new metrics, exports or production operating procedures.

## Validation and documentation

Use executable scenarios and accepted tooling for delivered behavior: expected
paths, errors and relevant access denial when business operations exist. Record
actual results, not fictional tests. Check guide links, labels, sample arithmetic
and status consistency. Final validation requires the real operator walkthrough;
preview tests do not establish import or authorization behavior.

Update this item, its status in [backlog](../backlog.md) and the execution plan.
Update contracts, models, guides or ADRs only where this task changes their content.

## Remaining handoff

Once IOP-129 and IOP-122 provide the relevant runtime evidence, create a continuation
plan on a story branch, replace pending instructions with verified controls/commands
and record the operator walkthrough before marking this item Completed. No new
product or architectural decision is required for the current documentation slice.

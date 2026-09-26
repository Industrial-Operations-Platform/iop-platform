# IOP-136 — User documentation

## Status

Completed — short local POC operator guide, verified under IOP-147 on 2026-09-27.
Broader shared-use v1 user/administrator documentation remains future scope.

## Goal and value

M17 — v1 Validation & Release. Technicians and team leaders can use the agreed
POC with reproducible instructions. Users and administrators need a demonstrable,
operable and documented result; this does not require every future backlog idea.
The original outline has been fully translated from Spanish; the owner-requested
IOP-147 delivery explicitly refines it to the local demonstration guide.

## Requirements and acceptance

- [x] Explain setup, entry/user switching, supported CSV, error/duplicate review,
  file/history analysis, filters, drill-down, metric limitations and safe reset.
- [x] Verify the guide against delivered behavior so technicians/team leaders can
  follow the selected workflow; owner usefulness feedback stays in IOP-130.
- [x] Record executable scenarios, necessary decisions, validation evidence and
  synchronized documentation without expanding to the full release milestone.

## Dependencies and constraints

[IOP-129](IOP-129-end-to-end-scenario.md) and
[IOP-122](IOP-122-accessibility.md) supply the demonstrated workflow and baseline
controls. Dependencies are capabilities, not numeric execution order.
Follow [modules](../../architecture/modules.md), [workflow](../workflow.md) and
Accepted [ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are not implementation authority.

Verify current customer/site permissions on relevant operations and references;
exclude secrets, floor plans and production data from the repository. Industrial
integrations remain read-only and retain applicable material-change traceability.
Reconcile authorized/synthetic data and recovery. Validate published contracts and
persona workflows, recording limits without adding unrelated release features.
No adjacent milestone delivery, inferred acceptance of open decisions or customer
names in core. Shared-use administration and third-party login remain future work.

## Validation and documentation

The [operator guide](../../development/running-poc.md) is the canonical instruction
set. [IOP-147 evidence](../completed/IOP-147-working-analytical-poc-plan.md) records
setup/start/fixtures/recreate verification, real browser behavior, error/access
checks and link consistency. Update this permanent item, [backlog](../backlog.md)
and evidence when behavior changes; avoid duplicate guides. No blocking design
question remains for this selected local slice.

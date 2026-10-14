# IOP-135 — Admin documentation

## Status

In progress

Reconciled on 2026-10-14 under the owner's delegated [IOP-203](IOP-203-platform-completion.md)
request and delivered [IOP-208](IOP-208-local-delivery-infrastructure.md).
The permanent context owns this story's remaining acceptance; software completion
is distinct from remote, operating, human and whole-platform release evidence.

## Milestone and goal

M17 — v1 Validation & Release. Local administrator procedures delivered; shared-use review pending.

An administrator can configure the agreed system.

## Current state

Guides document local accounts/roles, CSV preparation/KPIs, Workforce/Maintenance,
formal Handover, Tracking, provisional Locator, reusable Asset models/mappings and
integration readiness. IOP-208 adds trusted job operation, separate Audit operators,
private backup/key/restore and measurement procedures. Real providers and shared-use
operating/human acceptance remain distinct.

## Requirements and delivery boundary

Product roles configure only their currently granted module functions. Job
operation requires current Administrator authority; Audit inspection/purge uses
separate restricted database operator credentials and grants no product browsing.
Plant survey and credentials/provider contracts remain actual input, not fixtures
or fabricated completion. Preserve English source text and explicit localization.

## Acceptance criteria

- [x] Document current local administration/module configuration and recovery boundaries.
- [ ] Review the complete agreed shared-use administrator procedure with its operators.
- [ ] Verify another deployment/recovery environment and remaining provider/security controls when authorized.

## Validation and evidence

Use the [platform guide](../../development/platform-completion.md), [local operating guide](../../development/local-operations.md),
[formal Handover](../../development/formal-handover.md),
[Tracking](../../development/improvement-tracking.md) and
[Locator guide](../../development/asset-locator.md). Software/permission tests
support those procedures; independent operator review, complete shared-use security
remain pending; actual local backup/isolated restore evidence passes under IOP-112/113.

## Dependencies

[IOP-031](IOP-031-administration-foundation.md), [IOP-109](IOP-109-secret-management.md).

Dependencies identify required contracts/capabilities, not numerical delivery order.
Their broader criteria are not closed by this bounded increment.

## Remaining work

Complete agreed operator/shared-use review, organization/platform security Audit,
provider credential/connection procedures and additional-environment recovery.
Current guides do not substitute for human or whole-platform release acceptance.

## Documentation traceability

[IOP-208 completed plan](../completed/IOP-208-local-delivery-infrastructure-plan.md),
[IOP-203 execution](../completed/IOP-203-platform-completion-plan.md),
[backlog](../backlog.md) and [delivery map](../poc-delivery.md).

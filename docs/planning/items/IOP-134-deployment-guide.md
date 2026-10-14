# IOP-134 — Deployment documentation

## Status

In progress

Reconciled on 2026-10-14 under the owner's delegated [IOP-203](IOP-203-platform-completion.md)
request and delivered [IOP-208](IOP-208-local-delivery-infrastructure.md).
The permanent context owns this story's remaining acceptance; software completion
is distinct from remote, operating, human and whole-platform release evidence.

## Milestone and goal

M17 — v1 Validation & Release. Local operating procedures delivered; other-environment proof pending.

IOP can be deployed in another authorized environment.

## Current state

Local Docker build/start/stop/rebuild, private scoped configuration and operator
troubleshooting are documented. IOP-208 adds CI/checks, encryption/key separation,
full backup/isolated restore, jobs, scoped Audit operation and readiness measurement
procedures. Root IOP-203 assembles these with the operational modules; remote
hosting and another authorized deployment environment remain unverified.

## Requirements and delivery boundary

Use the current local stack and reviewed private configuration. Keep source
references and credentials outside Git, start migrations/provisioning explicitly,
and preserve runtime privilege allowlists. A fresh stopped restore artifact is
not an activated deployment. Publication/promotion requires separate authority.

## Acceptance criteria

- [x] Document current local packaging/configuration, operation and recovery prerequisites.
- [ ] Execute and record deployment/recovery in another authorized environment.
- [ ] Review credentials/origins/storage/security/CI evidence and limitations for that environment.

## Validation and evidence

Current local software builds and repository validation pass. See the
[platform guide](../../development/platform-completion.md), [local operating guide](../../development/local-operations.md),
[local configuration](../../development/local-configuration.md) and
[IOP-203 plan](../completed/IOP-203-platform-completion-plan.md).
Actual local backup/isolated restore passes under IOP-112/113; remote CI and
another deployment environment remain pending. No new remote environment was deployed.

## Dependencies

[IOP-015](IOP-015-local-development-environment.md), [IOP-021](IOP-021-ci-baseline.md), [IOP-113](IOP-113-restore.md).

Dependencies identify required contracts/capabilities, not numerical delivery order.
Their broader criteria are not closed by this bounded increment.

## Remaining work

Select and authorize the additional environment, supply its operating/security
constraints, verify clean reproducibility and recovery, and record human acceptance.
This documentation increment does not publish, deploy or complete v1 release.

## Documentation traceability

[IOP-208 completed plan](../completed/IOP-208-local-delivery-infrastructure-plan.md),
[IOP-203 execution](../completed/IOP-203-platform-completion-plan.md),
[backlog](../backlog.md) and [delivery map](../poc-delivery.md).

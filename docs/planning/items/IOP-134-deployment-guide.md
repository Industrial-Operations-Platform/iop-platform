# IOP-134 — Deployment documentation

## Status

In progress

Reconciled on 2026-10-14 under the owner's delegated [IOP-203](IOP-203-platform-completion.md)
request and delivered [IOP-208](IOP-208-local-delivery-infrastructure.md).
The permanent context owns this story's remaining acceptance; software completion
is distinct from remote, operating, human and whole-platform release evidence.

## Milestone and goal

M17 — v1 Validation & Release. Local and Railway deployment delivered; remote recovery proof pending.

IOP can be deployed in another authorized environment.

## Current state

Local Docker build/start/stop/rebuild, private scoped configuration and operator
troubleshooting are documented. IOP-208 adds CI/checks, encryption/key separation,
full backup/isolated restore, jobs, scoped Audit operation and readiness measurement
procedures. Root IOP-203 assembles these with the operational modules.

On 2026-11-06 the owner selected Railway for a one-month evaluation with a US$20
budget and requested both Docker and Railway update automation. The
[Railway guide](../../development/railway.md) now documents the combined web/API
image, explicit HTTPS mode, initial copy of current local data, forward migrations,
CLI and GitHub release workflows, storage, backups and account configuration.
The first Railway deployment was executed on 2026-11-06 in the authorized Hobby
account. HTTPS web/API and anonymous access rejection passed; all 62 imported
table row counts and 75 private reference checksums were verified. Remote recovery
and evaluator acceptance remain open. GitHub release configuration is prepared
in source; account secrets and automatic publication are not activated.

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
Actual local backup/isolated restore passes under IOP-112/113. The authorized
Railway environment is deployed; remote CI and remote restore remain pending.
Native volume backup requests require Pro in this account and were not enabled
under the owner's Hobby budget. The private initial snapshot remains available.

## Dependencies

[IOP-015](IOP-015-local-development-environment.md), [IOP-021](IOP-021-ci-baseline.md), [IOP-113](IOP-113-restore.md).

Dependencies identify required contracts/capabilities, not numerical delivery order.
Their broader criteria are not closed by this bounded increment.

## Remaining work

Verify isolated recovery of the Railway data and record human acceptance. Review
the deployment guide's cost, native backup and GitHub activation limitations.
The evaluation deployment does not establish completion of the whole v1 release.

## Documentation traceability

[IOP-208 completed plan](../completed/IOP-208-local-delivery-infrastructure-plan.md),
[IOP-203 execution](../completed/IOP-203-platform-completion-plan.md),
[backlog](../backlog.md) and [delivery map](../poc-delivery.md).

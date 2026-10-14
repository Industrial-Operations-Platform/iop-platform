# IOP-021 — CI baseline

## Status

In progress

Reconciled on 2026-10-14 under the owner's delegated [IOP-203](IOP-203-platform-completion.md)
request and delivered [IOP-208](IOP-208-local-delivery-infrastructure.md).
The permanent context owns this story's remaining acceptance; software completion
is distinct from remote, operating, human and whole-platform release evidence.

## Milestone and goal

M2 — Development Platform Foundation. Local workflow configured; remote evidence pending.

Push/PR runs lint, tests and validation.

## Current state

[IOP-208](IOP-208-local-delivery-infrastructure.md) under [IOP-203](IOP-203-platform-completion.md) delivers a tracked
`.github/workflows/validation.yml` for push, pull request and manual execution.
It uses locked dependencies, Node 24.21.0/npm 10.9.2, read-only repository token
permissions and `npm run test:poc` for type/build/contract/architecture/design,
unit, disposable PostgreSQL and Chromium checks. Synthetic browser failure
artifacts have a seven-day lifetime. Publication/remote execution is unverified.

## Requirements and delivery boundary

The workflow is software delivered under Accepted ADR-0038. It does not configure
hosting, deployment environments or branch protection. Existing architecture/design
and secret checks are the current repository validation contract; no absent lint
suite is claimed.

## Acceptance criteria

- [x] Track the reviewed workflow, accepted tooling and safe synthetic artifact policy.
- [x] Execute the configured validation locally and record actual results.
- [ ] Observe successful authorized push/PR execution and retained remote CI results.

## Validation and evidence

Root IOP-203 local build/type/contract/architecture/design and unit checks pass:
509 API, 192 web, 25 secret/tooling and 77 database configuration tests. Full
PostgreSQL validation passes 30 suites/316 tests. The final combined browser gate
awaits correction/recheck of historical strict fixture expectations. Owning IOP-208 PostgreSQL/backup and site Audit checks pass.
See [local operating guide](../../development/local-operations.md) and the
[IOP-203 plan](../completed/IOP-203-platform-completion-plan.md) for final integrated
evidence. A local pass and tracked YAML are not a remote CI pass.

## Dependencies

[IOP-020](IOP-020-testing-foundation.md).

Dependencies identify required contracts/capabilities, not numerical delivery order.
Their broader criteria are not closed by this bounded increment.

## Remaining work

Await authorized publication and a real remote workflow run. No remote run,
repository publication, provider connection or deployment is inferred.

## Documentation traceability

[IOP-208 completed plan](../completed/IOP-208-local-delivery-infrastructure-plan.md),
[IOP-203 execution](../completed/IOP-203-platform-completion-plan.md),
[backlog](../backlog.md) and [delivery map](../poc-delivery.md).

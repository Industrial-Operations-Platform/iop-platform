# IOP-208 — Local delivery and operating infrastructure

## Status and goal

In progress under the owner's [IOP-203](IOP-203-platform-completion.md) delegated
development authorization. Advance CI, reproducible backup/verified isolated
restore, scoped worker infrastructure, general Audit plumbing and measurement
tooling without requiring plant-specific inputs.

## Scope and acceptance

- [ ] CI runs established build/type/contract/architecture/design/secret and
  unit/database/browser checks; remote execution remains unverified until publication.
- [ ] Local full-platform backup includes database and private configuration/
  references with integrity metadata; restoration targets an isolated installation
  and verifies actual data without deleting the current installation.
- [ ] Worker execution has durable jobs, scoped authority, bounded retry/leases,
  idempotency and explicit missing-handler/source states.
- [ ] Audit owns bounded append/inspection/retention contracts under ADR-0017;
  implemented capture coverage and remaining emitter gaps are explicit.
- [ ] Repeatable performance/readiness tooling and operator guides distinguish
  measurements from unagreed plant targets and whole-platform release.
- [ ] Relevant real tests, safe failures and local commits; original parents remain
  open wherever full original criteria or external acceptance remain unmet.

## Evidence and remaining work

Plan before code on `feature/IOP-208-local-delivery-infrastructure`, from develop.
No remote deployment, irreversible restoration over live data or release publication.

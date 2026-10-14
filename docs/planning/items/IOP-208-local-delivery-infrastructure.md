# IOP-208 — Local delivery and operating infrastructure

## Status and goal

Completed local infrastructure slice under the owner's [IOP-203](IOP-203-platform-completion.md) delegated
development authorization. Advance CI, reproducible backup/verified isolated
restore, scoped worker infrastructure, general Audit plumbing and measurement
tooling without requiring plant-specific inputs.

## Scope and acceptance

- [x] CI configures established build/type/contract/architecture/design/secret and
  unit/database/browser checks; remote execution remains unverified until publication.
- [x] Local full-platform backup includes database and private configuration/
  references with integrity metadata; restoration targets an isolated installation
  and verifies actual data without deleting the current installation.
- [x] Worker execution has durable jobs, scoped authority, bounded retry/leases,
  idempotency and explicit missing-handler/source states.
- [x] Audit owns bounded append/inspection/retention contracts under ADR-0017;
  implemented capture coverage and remaining emitter gaps are explicit.
- [x] Repeatable performance/readiness tooling and operator guides distinguish
  measurements from unagreed plant targets and whole-platform release.
- [x] Relevant real tests, safe failures and local commits; original parents remain
  open wherever full original criteria or external acceptance remain unmet.

## Evidence and remaining work

Plan before code on `feature/IOP-208-local-delivery-infrastructure`, from develop
`24b6269`; see the [completed plan](../completed/IOP-208-local-delivery-infrastructure-plan.md),
[operating guide](../../development/local-operations.md) and
[Accepted ADR-0038](../../architecture/adr/ADR-0038-local-operating-infrastructure.md).

Owning validation: full API 31 suites/423 tests; focused updated domain tests three;
scripts four suites/23 tests; actual PostgreSQL jobs/Audit plus full private restore
two suites/seven tests; final full restore also reconciles exact RLS policies. API
typecheck and secret hygiene pass. The full synthetic source includes nonempty
Handover revisions, local job effects and Audit; ciphertext/private-file and scoped
operator failures are tested. One observed full typecheck sample passed in 42.524 s;
the report explicitly leaves workload targets and release acceptance unagreed.

Root-owned integration prerequisites are the Administrator `jobs.manage` catalog/
backfill, exact provisioning allowlists and setup-image CLI packaging. Real database
tests used temporary copies of those shared changes, restored before this story's
commits. Integrated installation validation remains the parent IOP-203 gate.

Remote CI, provider handlers, broad module Audit emitters, organization RBAC Audit,
90-day platform-security collection, plant performance thresholds and whole-platform
release acceptance remain pending. IOP-010/021/023/024/112–115/134–135/137–138 keep
their original status wherever their broader acceptance is unmet. No remote
deployment, active-installation overwrite or release publication was performed.

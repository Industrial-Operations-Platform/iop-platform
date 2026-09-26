# IOP-123 — Synthetic organization execution plan

Status: Completed on 2026-09-26. Owner requested IOP-123 on 2026-09-26, limited to the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Story: [IOP-123](../items/IOP-123-demo-organization.md).
Branch: `feature/IOP-123-demo-organization`, created from clean `develop` before edits.

## Changes and steps

1. Reuse the integrated IOP-025/026 insert-only commands under Accepted
   ADR-0020/0021. Their broader parents remain Deferred. ADR-0018 is Accepted,
   but host implementation remains pending; no runtime access is needed here.
2. Add `fixtures/analytical-poc/seed.env.example` and `poc.example.json`, matching
   the existing fictional labels, stable IDs and zone in `scope.json`. Keep
   credentials out of fixtures and names out of core code. No schema, API, UI,
   principal/grant, source persistence, asset hierarchy or reset implementation.
3. Document explicit native/Compose organization-then-site loading, configuration
   agreement, safe reruns, conflict handling and partial-sequence recovery in the
   fixture README; link it from `infra/database/README.md`.
4. Add a fixture integration test under `infra/database/test/` using disposable
   PostgreSQL and the existing CLI. Verify stored values, unchanged reruns,
   rejection of conflicting input, no implicit principals/grants, and actual-role
   denial. Check fixture/config agreement. Reuse existing seed validation tests.
5. Synchronize item/backlog and record evidence here. No dependency story read
   contains Spanish prose, so no translation-only edits are needed. Correct the
   stale ADR-0018 reference only in IOP-123.

## Validation and evidence

- Node 24.21.0/npm 10.9.2 from the existing temporary toolchain; no dependency changes.
- `npm run typecheck`: passed.
- `npm test`: passed (9 secret checks, 131 API, 15 web and 77 database unit tests).
  Initial sandbox run could not bind test sockets (`EPERM`); rerun with approved
  local socket access passed.
- `npm run test:database`: 8 suites / 128 tests passed on disposable PostgreSQL
  17.6, including exact fixture loading on two fresh databases, valid reference
  configuration, unchanged repeats, conflict/failed-step recovery, no implicit
  principal/grants, missing migrator scope and actual runtime read denial.
- Documented Compose sequence passed using the committed seed environment file
  in uniquely named disposable project `iop123-check-beccd6d5ff`: provision,
  6 migrations, both seeds `created`; repeat provision, 0 migrations and both
  seeds `unchanged`. Test containers, network and volume removed afterward.
  The operator's local environment/database was not modified.
- Changed Markdown relative links, IDs/statuses and `git diff --check`: passed.
  Staged secret hygiene is checked before committing.

No schema or application behavior changed. Organization and site commands remain
separate transactions, with recoverable partial completion documented and tested.
No source persistence, runtime authorization activation, import or reset claim.
No new ADR or dependency-story translation was necessary.

## Closure

Acceptance criteria met for this bounded story; item/backlog marked Completed and
this plan moved to `completed/`. Validated changes are committed on the story
branch; publication remains subject to explicit owner approval.

# IOP-209 — Asset domain completion execution

## Scope and branch

In progress on `feature/IOP-209-asset-domain-completion` from develop `24b6269`,
worktree `/private/tmp/iop-209`. Implements the [item](../items/IOP-209-asset-domain-completion.md)
and [ADR-0039](../../architecture/adr/ADR-0039-asset-domain-enrichment.md).
Original IOP-032/033/035/036/038/039/044/093/124 and relevant dependencies were read
in English; no translation-only edits are needed. Physical plant validation stays pending.

## Files and boundaries

- New Assets domain/application sidecars and PostgreSQL catalog/enrichment/mapping
  adapters; existing registry models and fixtures remain compatible.
- OIP-owned canonical fact-link projection/Pareto adapter and publication callback.
- New host factory/controller/contracts; root integrates shared composition, privileges,
  generated contracts and translation dictionaries without mixed story edits.
- Web Assets sibling domain/application/gateway/workspace, configurable editors,
  mapping review and source/coverage views using the shared visual identity.
- Migration `20261014060000-asset-domain.sql`, synthetic structure fixtures,
  API/web/PostgreSQL tests, product guide and original story context evidence.

## Steps and validation

1. Implement type/metadata schemas, composition cycle/controller validation,
   survey review and immutable sidecar history; exercise replaceable ports.
2. Implement scoped persistence, exact source reviews and OIP projections/history
   without RAW/fact changes; verify current permission/profile and independent
   source permissions with real PostgreSQL and atomic rollback cases.
3. Implement configurable catalog, asset enrichment/survey and mapping/Pareto UI,
   reviewed HTTP contracts and dedicated German resources.
4. Build/typecheck, run required API tests, relevant frontend/design/secret checks,
   disposable PostgreSQL tests and root browser integration. Record actual evidence,
   external inputs and precise root integration APIs. Commit validated increments.

Root-owned shared files are not edited/committed. Temporary test dependencies, if
needed, are explicitly restored before commits. Root mirrors backlog/shared docs.

## Validated API increment

- Full API: 427 tests / 32 suites passed, including eight new domain/real HTTP cases.
- Disposable PostgreSQL 17.6: five cases passed. The 1,506-asset scope exercises
  bounded pagination and exact refinement; mapping tests retain original bytes/facts,
  project newly published imports, reject current permission loss and roll back
  review/history on an injected canonical-projection fault.
- Optional synthetic fixture: repeat-safe fresh identities, all survey decisions,
  parent/controller graph, ambiguity, no fabricated import and preserved user edits.
- Build/typecheck, shared design boundaries (four tests), secrets (18 tests) passed.
- Browser feature tests: four passed; shared dictionary assembly is a temporary
  unstaged test dependency owned by root and will be restored before completion.

Original context updates close delivered software criteria, keep IOP-039 physical
inspection open and record operating-team inputs. Root synchronizes shared backlog,
composition and browser acceptance; no plant acceptance is inferred.

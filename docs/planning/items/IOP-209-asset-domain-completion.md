# IOP-209 — Independent Asset domain completion

## Status and goal

Completed local software scope under the owner's [IOP-203](IOP-203-platform-completion.md) delegated
development authorization. Advance configurable types/composition, controller
relations, structured metadata, software survey workflow and canonical mapping
infrastructure while retaining actual physical validation as pending.

## Scope and acceptance

- [x] Configurable asset types, scoped parent graph/cycle rules and separately
  typed controller relations with durable revisions.
- [x] Structured extensible manufacturer/model/serial metadata and explicit
  Pending/Validated/Rejected survey decisions with retained evidence.
- [x] Explicit reviewed source-to-canonical mapping contract/projection, unresolved
  and ambiguous states, no inferred physical identity or RAW/history rewriting.
- [x] Working administration/editor UI with current permissions and shared identity;
  synthetic verification does not represent a completed physical plant survey.
- [x] Tests and documentation identifying full delivered criteria and remaining
  actual plant verification; design decisions recorded under delegated authority.

## Evidence and remaining work

Plan before code on `feature/IOP-209-asset-domain-completion`, from develop.
Assets remains registry owner; physical placement remains Locator-owned.

API/persistence increment: full API 427 passed and five real PostgreSQL cases passed,
including 1,506 scoped identities and opt-in synthetic fixture preservation. See the
[guide](../../product/asset-domain.md) and
[composition contract](../../architecture/asset-domain-integration.md).

## Final evidence and external inputs

Full API 427/427, frontend 162/162, disposable PostgreSQL 6/6, design 4/4 and
secret checks 18/18 passed; complete build/typecheck and reviewed contract check
passed. See the [completed plan](../completed/IOP-209-asset-domain-completion-plan.md).
Original IOP-032/033/035/036/038/044/093/124 software outcomes are delivered;
IOP-039 remains In progress for actual physical inspection and authentic evidence.
Root integrates composition/privilege guards, generated contracts and navigation
and performs combined browser acceptance under the still-open IOP-203 parent.

Actual types, composition/controller wiring, equipment metadata, inspection
evidence, source mapping decisions and physical Locator placement remain inputs.
No real source-to-asset mapping or physical plant survey was invented.

Importer compatibility regression: explicit receiving-owned publication ports use
current imports.submit without Assets grants or a public registry response.
Native site-operator/analytics-reader admission succeeds; interactive Asset access
and the publication callback after imports permission revocation fail. ADR0039
records this boundary and the six real PostgreSQL cases pass.

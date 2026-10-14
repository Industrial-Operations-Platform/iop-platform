# IOP-209 — Independent Asset domain completion

## Status and goal

In progress under the owner's [IOP-203](IOP-203-platform-completion.md) delegated
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
- [ ] Working administration/editor UI with current permissions and shared identity;
  synthetic verification does not represent a completed physical plant survey.
- [ ] Tests and documentation identifying full delivered criteria and remaining
  actual plant verification; design decisions recorded under delegated authority.

## Evidence and remaining work

Plan before code on `feature/IOP-209-asset-domain-completion`, from develop.
Assets remains registry owner; physical placement remains Locator-owned.

API/persistence increment: full API 427 passed and five real PostgreSQL cases passed,
including 1,506 scoped identities and opt-in synthetic fixture preservation. See the
[guide](../../product/asset-domain.md) and
[composition contract](../../architecture/asset-domain-integration.md).

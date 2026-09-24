# IOP-025 — Organization model

## Status

Blocked — POC implementation awaits explicit acceptance of
[ADR-0020](../../architecture/adr/ADR-0020-local-organization-bootstrap.md).
The proposal increment is complete; organization persistence is not implemented.

## Authorization and POC applicability

The owner requested IOP-025 on 2026-09-24, limited to the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
M3 — Platform Core. Deliver a configured organization with stable identity and
scoped ownership. Organization CRUD, lifecycle and administration screens remain
future parent scope; completing the POC slice must not close those requirements.

## Value, context and current state

The local analytical POC needs a persisted ownership root before site and source
records can reference it. Platform Core owns organization identity; Authentication
and Users/RBAC retain their separate responsibilities. See the
[modules](../../architecture/modules.md), [data model](../../architecture/data-model.md)
and [glossary](../../product/glossary.md).

IOP-018 validates configuration references but does not persist them. IOP-019
provides local role provisioning and migrations, with no business tables. There is
no organization table, seed, runtime connection or organization endpoint.

## Requirements and acceptance criteria

- [ ] Persist an explicitly configured organization with a stable opaque identity
  and configurable display name; support zero sites.
- [ ] Deliver only a local seed/configuration path, preserving constraints and
  forced RLS. Validate the organization scope on that path. Site relationship
  validation belongs to IOP-026; no site is implicitly created here.
- [ ] Verify fresh creation, unchanged repeat, invalid/conflicting input,
  concurrency, rollback and denial of missing/foreign scope and runtime access.
- [ ] Record actual evidence and synchronize the story/plan without closing the
  broader parent while future CRUD, lifecycle and administration scope remains.

## Dependencies and architecture constraints

[IOP-004](IOP-004-platform-scope-model.md) and
[IOP-005](IOP-005-tenancy-and-data-isolation.md) are completed design and integrated
on develop. [IOP-019](IOP-019-database-bootstrap.md) is implemented and integrated.
Only their relevant POC contracts are prerequisites, not future platform capabilities.

Accepted ADR-0001/0003/0004/0005 preserve module ownership, PostgreSQL, identity and
customer isolation. ADR-0012/0013 define logical scope and physical isolation;
ADR-0019 supplies migration tooling. See the [ADR directory](../../architecture/adr/).
Follow Accepted ADR-0007/0008 for plans, story branches and owner review.

Proposed ADR-0020 supplies the missing initial seed authority and concrete storage
contract. Dependent implementation waits for acceptance. Proposed ADR-0018 separately
gates runtime business access; accepting the seed proposal would not accept that
mechanism. No unmerged prerequisite branch needs to be integrated for this proposal.

## Security, data, API and UI boundaries

Organization is the generic customer boundary. Names are configuration data, never
identity or permission. Preserve non-null scope, reference integrity and forced RLS.
The proposal permits only explicit privileged initial creation with the migration
credential; it does not supply ordinary business authorization. Runtime remains
without business grants. Never expose privileged credentials in API/web containers,
logs or committed configuration. No production data or customer-specific core logic.

No endpoints, UI, login, user/grant seed, ORM, repository abstraction, site model,
source configuration or general reset framework. Renaming/deletion/lifecycle and
ordinary actor/action/target authorization require later scoped work. Do not infer
acceptance of Proposed decisions or activate adjacent stories.

## Validation and documentation impact

The [active plan](../active/IOP-025-organization-model-plan.md) maps the proposed
implementation to executable scenarios and expected files. This documentation
increment checks links, IDs, statuses and consistency only. No runtime tests or
persistence/isolation evidence exist for IOP-025.

The [completed proposal record](../completed/IOP-025-organization-proposal-plan.md)
records the dependency review and documentation checks. The item, backlog and plan
are synchronized. POC scope/delivery documents remain authoritative and unchanged.

## Open decision

Accept, amend or reject ADR-0020's bounded initial organization seed. Implementation
is paused under AGENTS.md rule 5, not because login or a full platform is required.

# IOP-026 — Site model

## Status

In progress — the owner accepted the initial site bootstrap authority in
[ADR-0021](../../architecture/adr/ADR-0021-local-site-bootstrap.md).
Accepted on 2026-09-24; site persistence is not implemented.

## Authorization and POC applicability

The owner requested IOP-026 on 2026-09-24, limited to
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
M3 — Platform Core. Persist one configured site with explicit organization ownership
and IANA time zone. CRUD, selectors, lifecycle and administration screens remain
future parent scope; their deferral must not be reported as completed implementation.

## Value and current state

The analytical POC needs a persisted site boundary for later scoped imports and
reports. Platform Core owns site identity/configuration; Users/RBAC owns permission.
See [modules](../../architecture/modules.md), [data model](../../architecture/data-model.md)
and [glossary](../../product/glossary.md).

IOP-018 validates configuration references and zones. IOP-019 provides migrations;
IOP-025 persists organizations through an explicit initial seed. No site table,
seed or runtime site access exists. ADR-0020 limits its authority to organizations;
Accepted ADR-0021 extends it to the site's initial installation.

## Requirements and acceptance criteria

- [ ] Persist one explicitly configured site with stable opaque identity, display
  name, existing organization owner and validated IANA time zone.
- [ ] Enforce ownership, scoped references and forced RLS; missing site scope never
  means all sites. Source labels cannot choose scope.
- [ ] Provide an explicit insert-only seed with unchanged identical reruns, safe
  rejection of conflicting owner/name/zone and no runtime business grants.
- [ ] Verify positive creation and negative input/ownership/scope cases, concurrent
  seeds, rollback and runtime denial using actual roles on disposable databases.
- [ ] Record executable evidence and synchronize item/backlog/plan, leaving future
  lifecycle and administration scope deferred.

## Dependencies and decisions

IOP-025's [organization POC slice](IOP-025-organization-model.md) is implemented and
integrated on develop, although its broader parent is Deferred.
[IOP-008](IOP-008-time-and-timezone-model.md) is Completed as design under Accepted
ADR-0016. IOP-018/019 configuration/migration foundations are also integrated.
No unmerged prerequisite needs owner integration.

Accepted ADR-0001/0003/0004/0005 preserve module, identity and customer boundaries;
ADR-0012/0013 define ownership and RLS; ADR-0016 temporal semantics; ADR-0019/0020
supply existing database/bootstrap patterns. Follow ADR-0007/0008 workflow.
See the [ADR directory](../../architecture/adr/).

ADR-0021 is Accepted and authorizes the bounded site seed implementation. Proposed
ADR-0018 separately gates runtime business access and remains unaccepted.

## Security, data, API and UI boundaries

Keep customer names/source labels in configuration. Never infer scope or permission
from them. Require both organization and site for site-owned records; preserve
foreign keys and enabled/forced RLS. Privileged installation credentials must stay
outside API/web containers, repository content and logs. No production data.

The accepted decision rejects changes to an existing site's identity, owner, name or zone.
Transfers and zone corrections require separately reviewed work; source dates do
not become occurrence timestamps or known 24-hour windows. No API, UI, runtime
repository, authentication, user/grant seed, source seed or generic seed engine.

## Validation and documentation

The [active execution plan](../active/IOP-026-site-model-plan.md) records the branch,
proposal checks and implementation handoff. ADR-0021 specifies concrete validation
scenarios. Proposal review is not runtime test evidence. Update database instructions
and accepted architecture only when implementation/acceptance warrants it.
POC scope and delivery map remain unchanged; no adjacent story is activated.

## Implementation handoff

ADR-0021 is Accepted. The owner authorized committing and merging this design into
`develop` and publishing to `origin`. Site migration, seed, tests and runtime evidence
remain pending under the active plan. No decision blocks this bounded bootstrap;
runtime business access still depends independently on an accepted mechanism.

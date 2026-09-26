# IOP-123 — Synthetic organization

## Status

Completed on 2026-09-26 — bounded fictional organization/site fixture for the analytical POC.

## Scope and authorization

Owner requested IOP-123 on 2026-09-26, limited to the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
M16 — Demo / Pilot Dataset. Seed a fictional organization and site through existing
explicit local installation commands, with configurable labels, stable IDs and an
explicit IANA zone. No physical asset hierarchy or administration screens.

## Delivery and acceptance

The [analytical fixtures](../../../fixtures/analytical-poc/README.md#load-the-fictional-organization-and-site-iop-123)
provide seed inputs and matching reference configuration for Example Operations /
Example Works. Labels remain scoped data outside the generic core. Source references
and mapping fixtures do not imply source persistence or CSV import implementation.

- [x] Load the fictional organization and site with exact fixture IDs, labels,
  ownership and zone through the accepted seed commands.
- [x] Reproduce on empty databases; exact repeats leave data unchanged, conflicting
  input fails without overwrites, and failed site loading can be retried safely.
- [x] Verify reference configuration agreement, scoped access denial and absence of
  implicit users, membership or grants. No credentials or production data in fixtures.
- [x] Document native/Compose loading and limitations; record executable evidence,
  synchronize the backlog and complete the execution plan.

## Dependencies and decisions

[IOP-025](IOP-025-organization-model.md) and [IOP-026](IOP-026-site-model.md)
have their relevant POC persistence/seed slices integrated on develop. Their broader
CRUD/lifecycle/admin parents remain Deferred and are not prerequisites here.
Accepted [ADR-0020](../../architecture/adr/ADR-0020-local-organization-bootstrap.md)
and [ADR-0021](../../architecture/adr/ADR-0021-local-site-bootstrap.md) supply the
insert-only migrator commands, ownership validation, forced RLS and conflict rules.
No new architectural pattern or migration is required.

[ADR-0018](../../architecture/adr/ADR-0018-local-poc-execution-context.md) is Accepted;
its host implementation and validation still gate runtime business access. This
fixture creates no local principal or grants and supplies no implicit permission.
Accepted ADR-0001/0003/0004/0005 preserve modular ownership, PostgreSQL, independent
identity and customer isolation; ADR-0007/0008 govern planning and review.
See the [ADR directory](../../architecture/adr/).

## Validation and boundaries

The [execution plan](../completed/IOP-123-demo-organization-plan.md) records validation.
Tests use disposable PostgreSQL and actual credentials. The two seed commands have
separate transactions: an organization can remain after a failed site step; rerun
with matching corrected inputs. No reset, deletion, renaming or site-zone correction
is supplied. IOP-128 owns safe demo reset.

No new API/UI, source seed, assets, login, principal/grant automation, generalized
seed engine or customer-specific core logic. The fixture is explicitly synthetic;
no runtime screen or end-to-end analytical behavior is claimed. This story has no
broader unfinished parent scope; adjacent stories remain independently selected.

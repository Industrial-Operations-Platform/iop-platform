# Maintenance and Asset History operation

Scope: [product contract](../product/maintenance-assets.md). Implementation and
validation: [IOP-194](../planning/items/IOP-194-maintenance-asset-history.md).
Run the existing local stack using [running-poc](running-poc.md).

## Setup and workflow

The new owning migrations add Maintenance/Asset storage and extend explicit
site-role bundles for active profiles already granted access. They do not restore
inactive memberships or revoked grants. Normal account creation/profile changes
use the same fixed role catalog. The explicit initial administrator bootstrap
provisions the catalog too. API startup never implicitly runs migrations.

Use the repository's setup/migrate procedure for this branch before opening its
UI. Preserve the existing PostgreSQL volume; ordinary start/stop does not erase
history. Running a new database schema is independent from merging the branch.
The user's shared installation is not a test database.

1. Sign in and open Assets. An administrator registers an asset with its code,
   name and configured location. Keep it unverified until validation evidence exists.
2. Add deliberate exact source aliases when imported or handover codes are known
   to refer to that asset. Preserve source namespace, case, code and location
   context. Matching descriptions alone are insufficient evidence.
3. Open Maintenance, create technical work and select its location, asset,
   priority and responsibility. Work may be recorded without an asset when identity
   is unresolved; this does not fabricate a canonical mapping.
4. Progress work, explain blockers and record an outcome when completing it.
   Coordinators can reassign site work; contributors update authored/assigned work.
5. Open a work record to inspect its attributed revisions. On a stale-save
   conflict reload the current record and review the newer changes before retrying.
6. Open the asset's digital record, choose dates/source filters and inspect
   Maintenance, Handover and authorized analytical evidence. Source actions open
   the original context. Follow subsequent pages to inspect all matching history.

No analytics imports still permits registered assets and technical work.
No alias means no inferred Handover/analytical history. A Technician can read
operational history while analytical source coverage reports denied access.
Retired assets retain their digital record; historical references survive catalog
and profile changes.

Source coverage can report an unavailable non-database adapter. A database or
authorization failure returns a sanitized service-unavailable response for the
whole request; retry starts a freshly authorized transaction. It never presents
an aborted database transaction as a complete timeline.

## Implementation boundaries

API modules: `apps/api/src/modules/maintenance` and `modules/assets` own pure
domain/application rules, transaction ports and PostgreSQL adapters. Inbound
controllers/DTOs and cross-module wiring live in `apps/api/src/host`. Workforce,
Users/RBAC, Handover and OIP expose narrow scoped owner adapters; the asset timeline
does not take ownership of their records. REST contracts live in the generated
OpenAPI artifact and browser bindings, outside pure domain/application layers.

Browser features: `apps/web/src/features/maintenance` and `features/assets`
provide pure application/gateway contracts with HTTP and React adapters. The host
shell owns navigation and source destinations. All views compose the existing
shared design library, date/location controls and localization resources.

## Validation

Use the pinned Node/npm versions and isolated test fixtures in the
[testing guide](testing-poc.md): `npm run typecheck`, `npm test`,
`npm run test:database` and `npm run test:e2e`.
Domain/use-case tests exercise transitions, ownership, outcomes, revisions,
aliases, deterministic pagination and source authorization. Real-role PostgreSQL
tests exercise durability, migration/provisioning, scoped rows, immutable revisions,
atomic rollback and optimistic concurrency. Browser evidence distinguishes
intercepted UI fixtures from actual PostgreSQL journeys.

Actual commands/results and material limitations belong in the linked execution
record; this guide does not claim unexecuted checks or owner product acceptance.

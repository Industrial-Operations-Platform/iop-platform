# Architecture baseline

IOP is a generic industrial operations platform. OIP is its Operational
Intelligence module, not the product boundary. This repository is documentation
only; the following decisions guide future implementation.

## Accepted foundations

- [ADR-0001](docs/architecture/adr/ADR-0001-modular-monolith.md): modular monolith with explicit module ownership.
- [ADR-0002](docs/architecture/adr/ADR-0002-monorepo.md): this monorepo is the single main platform repository.
- [ADR-0003](docs/architecture/adr/ADR-0003-postgresql.md): PostgreSQL is the primary relational database.
- [ADR-0004](docs/architecture/adr/ADR-0004-authentication-abstraction.md): provider-independent authentication boundary.
- [ADR-0005](docs/architecture/adr/ADR-0005-customer-isolation.md): generic domain with customer-scoped configuration and data.

## Boundaries and flow

Future web, API and worker directories represent delivery/processing hosts for
one modular platform. They do not establish independently owned microservices.
Modules own business behavior and persistence; hosts compose them. Workers may
execute background jobs using the same module contracts and release baseline.

Industrial data flows from read-only source adapters through RAW capture,
validation and normalization into owning modules and analytical read models.
IOP may write its own handovers, maintenance records and configuration, but does
not issue industrial control commands or write back to source systems in v1.

Keep customer names, location labels, equipment codes, map data and integration
settings in customer-scoped configuration/data. Put vendor protocols and schema
translation in integration adapters. No customer-specific branching, types or
hard-coded hierarchy levels belong in the generic domain.

## Architecture map

- [System context](docs/architecture/system-context.md): actors, external systems and trust boundaries.
- [Modules](docs/architecture/modules.md): ownership and collaboration rules.
- [Conceptual data model](docs/architecture/data-model.md): identities, relationships and normalization.
- [Product scope](docs/product/scope-v1.md) and [roadmap](ROADMAP.md): proposed capabilities and sequencing.

The historical PDFs named in [README](README.md) inform the analytics and locator
model. Their SQL, deployment examples and pilot-specific choices are not adopted
as platform implementation requirements. The five ADRs record accepted choices.

## Intentionally undecided

Languages, frontend/backend frameworks, build tooling, API style, ORM and migration
tooling; module code layout; identity provider, protocols and session handling;
physical tenancy and database enforcement; hosting and network topology; job and
cross-module delivery mechanisms; map storage/rendering; event grain and source
contracts; retention, performance, availability and recovery targets.

Resolve these with scoped plans and ADRs where they affect boundaries. No
application scaffolding, database schema, containers or dependency manifests are
part of this baseline.

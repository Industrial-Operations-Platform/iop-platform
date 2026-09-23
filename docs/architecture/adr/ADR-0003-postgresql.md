# ADR-0003: PostgreSQL

## Status

Accepted

## Context

Users, assignments, assets, maintenance and normalized events have relational structure and integrity requirements. The historical analytics design also used PostgreSQL, but its pilot schema is not a generic platform schema.

## Decision

Use PostgreSQL as the primary relational database for IOP. Design persistence around module ownership and customer isolation; track future schema changes as migrations in infra/database/migrations/. Do not copy historical customer-specific SQL as the initial schema.

## Consequences

One relational foundation supports transactional workflows and initial analytical projections. Analytics load and indexing need measurement. PostgreSQL version, extensions, physical module schemas, ORM, migration tooling and non-relational file storage remain undecided. Additional stores require a documented need.

## Alternatives considered

Other relational databases remain technically viable but offer no established reason to displace this baseline. Document-only storage is a weaker default for relational workflows. A dedicated analytical store may be evaluated later against measured needs.

## Subsequent isolation decision

Accepted [ADR-0013](ADR-0013-tenancy-data-isolation.md) selects shared tables with
scoped constraints and RLS alongside application authorization. Detailed schema,
policy implementation and database tooling remain future work.

## Subsequent local migration decision

Accepted [ADR-0019](ADR-0019-local-database-migrations.md) selects node-pg-migrate
without an ORM for local POC migrations. IOP-019 supplies role provisioning and
migration infrastructure on the PostgreSQL 17.6 local image introduced by IOP-015.
Business schemas, ORM, application transactions and production database support
remain separate work; this does not accept the Proposed local execution adapter.

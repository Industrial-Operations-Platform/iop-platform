# ADR-0005: Customer isolation

## Status

Accepted

## Context

IOP must be reusable across organizations. Historical inputs contain customer/site vocabulary, equipment codes, maps and source schemas that cannot become generic domain assumptions.

## Decision

Keep the platform domain generic. Store customer names, site/location labels, asset data, role assignments and mapping rules in customer-scoped configuration/data. Put vendor/source behavior in integration adapters. Enforce customer context across reads, writes, relationships, jobs, caches, files, analytics and exports. The generic core must not import customer adapters or contain customer-name conditionals.

## Consequences

Reuse requires explicit configuration contracts and isolation checks. No fixed local hierarchy or globally unique external equipment code is assumed. Physical tenancy and enforcement are subsequently selected by Accepted [ADR-0013](ADR-0013-tenancy-data-isolation.md): shared tables, scoped constraints and RLS alongside application authorization. Deployment configuration storage and hosting remain open. Future tests must cover cross-customer access attempts and reference validation.

## Alternatives considered

Customer-specific forks undermine the single reusable platform. Hard-coded pilot labels leak customer concepts into the domain. Dedicated deployments may provide physical separation, but alone do not prevent customer-specific logic from contaminating core code.

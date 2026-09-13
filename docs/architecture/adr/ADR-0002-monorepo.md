# ADR-0002: Monorepo

## Status

Accepted

## Context

The platform needs synchronized product documentation, architecture, application hosts, contracts, infrastructure and tests.

## Decision

Use iop-platform as the single main repository. Keep future hosts in apps/, explicit contracts and minimal neutral utilities in packages/, infrastructure in infra/, and product/architecture/planning documentation in docs/. Use small logical commits.

## Consequences

Cross-cutting changes are reviewable together and share one history. Repository co-location does not allow modules to bypass contracts. Build orchestration, package tooling and release automation remain undecided. Customer deployments must not require customer-specific forks of the core.

## Alternatives considered

Multiple repositories would require early cross-repository coordination. A flat repository would provide too little guidance for ownership and navigation.

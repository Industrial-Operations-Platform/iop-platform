# IOP roadmap

## Immediate target: local analytical POC

**Manual CSV → preparation/normalization → verified analysis → presentation.**
The owner approved this priority on 2026-09-15 under IOP-142. Start with one local
operator, one configured organization/site/source and no login or external connections.
Preserve the accepted stack and domain boundaries. No delivery date is committed.

## Delivery direction

1. Run the local frontend, API and PostgreSQL with reproducible migrations and configuration.
2. Import a representative CSV with provenance, visible validation, configured source
   mappings, scoped duplicate rejection and reconciled frequency/duration.
3. Show Executive Overview with consistent filters and known reference totals.
4. Add analytical detail through sector, area, source equipment and message records.
5. Demonstrate import → analysis → presentation and safe reproducibility of the demo.

Use the [delivery map](docs/planning/poc-delivery.md) for existing story slices.
Make a small plan and branch for the selected story. Do not complete all architecture,
platform or future-module stories before delivering useful analytics.

## Decisions and later capabilities

Reuse Accepted stack, API, scope, isolation and temporal decisions. The bounded local
execution mechanism without login is Proposed in ADR-0018; dependent runtime access
waits for an accepted mechanism. Independent bootstrap, parsing and UI work can proceed.
Login deferral does not silently remove authorization or RLS.

After demonstrating analytical value, deliver authentication and operational controls
for shared use. External connections, full audit, workers, maps/surveys, workforce,
handovers, maintenance and improvements require their own scope and evidence.
Manual CSV ingestion does not require a general integration registry. Full surveyed
assets are not prerequisites for source-equipment analytics. Additional charts and
performance optimization follow demonstrated needs.

## Navigation

- [Current POC scope](docs/product/scope-poc.md).
- [Later shared-use v1](docs/product/scope-v1.md).
- [Backlog](docs/planning/backlog.md), [delivery map](docs/planning/poc-delivery.md)
  and [milestones](docs/planning/milestones.md).
- [Workflow](docs/planning/workflow.md), [active plans](docs/planning/active/)
  and [completed plans](docs/planning/completed/).

No adjacent implementation, merge, push or deployment is authorized by this roadmap.

# IOP-020 — Testing foundation

## Status

Completed — local POC testing foundation validated on 2026-09-26.

## Milestone

M2 — Development Platform Foundation. Local POC delivery slice.

## Goal

Testing foundation. Expected result: an executable unit/integration/end-to-end
strategy for delivered POC behavior.

## User / business value

Developers need a reproducible environment and executable validation.

## Context

Scope: Development infrastructure and application hosts. See [modules](../../architecture/modules.md) and
[planning workflow](../workflow.md). This initial context comes from the
owner-requested outline; backlog inclusion alone does not authorize implementation.
The owner selected only the [POC scope](../../product/scope-poc.md) and
[delivery map](../poc-delivery.md) for this execution.

## Current state

API/web Jest, HTTP/process, Playwright and disposable PostgreSQL tests already
exist. IOP-020 consolidates their invocation and documents coverage boundaries;
CSV/analytics and the local execution adapter remain future runtime work.

## Desired state

An executable unit/integration/end-to-end strategy for the current POC hosts,
configuration and database bootstrap, with delivery-specific tests added as behavior ships.

## Requirements

- Deliver only the result described for IOP-020 within the selected POC boundary.
- Apply only the accepted stack and contracts; hosts are not business microservices.
- Reuse existing suites through one fail-fast command; document prerequisites,
  synthetic/disposable fixtures and pending business-path evidence.

## Acceptance criteria

- [x] An executable unit/integration/end-to-end strategy for the current POC hosts,
  configuration and database bootstrap, with delivery-specific tests added as behavior ships.
- [x] The plan documents required scenarios and decisions without extending scope.
- [x] Validation evidence exists and documentation is synchronized.

## Domain considerations

Apply only the accepted stack and contracts; hosts are not business microservices.

## Architecture constraints

[ADR-0001](../../architecture/adr/ADR-0001-modular-monolith.md),
[ADR-0003](../../architecture/adr/ADR-0003-postgresql.md),
[ADR-0004](../../architecture/adr/ADR-0004-authentication-abstraction.md),
[ADR-0005](../../architecture/adr/ADR-0005-customer-isolation.md) and
[ADR-0007](../../architecture/adr/ADR-0007-planned-workflow.md).
Proposed ADRs are proposals, not permission to adopt a decision.
Accepted [ADR-0010](../../architecture/adr/ADR-0010-frontend-charting-testing.md)
selects the test layers; ADR-0009/0019 supply workspace and migration tooling.
No new architectural mechanism or dependency is introduced.

## Security considerations

Verify permission and customer/site scope in relevant operations and references.
Keep secrets, site plans and production data out of the repository. Keep industrial
integrations read-only; record material changes where applicable.

## Data considerations

PostgreSQL is the reference; keep test configuration and synthetic data separate.
Database reproduction tests must use test-owned disposable containers, never operator data.

## API considerations

Apply accepted health/error contracts without adding business functionality.

## UI considerations

Only what is needed to verify the host or environment; do not create business screens.
Existing fixture UI tests do not establish working ingestion or analytics.

## Dependencies

[IOP-016](IOP-016-backend-bootstrap.md), [IOP-019](IOP-019-database-bootstrap.md)

Both dependencies are Completed and integrated on develop. Existing web suites
are also available. Dependencies identify required contracts/capabilities, not
numeric implementation order; refine them in the plan before changing code.
ADR-0018 is Accepted, but its runtime implementation and verification remain
pending; they do not block independent foundation tests.

## Non-goals

Implementing adjacent tasks, implicitly accepting open decisions or extending
delivery to the entire milestone. Do not introduce customer names into the core.
CI/hooks, login, workers and an upfront full-platform test suite remain outside scope.

## Validation

The plan must specify executable commands and scenarios using accepted tooling.
Include expected paths, errors and relevant access denial; record actual results,
not fictional tests. `npm run test:poc` composes type checks, `npm test`, disposable
database integration and browser tests.

## Documentation impact

Update this item, its [backlog](../backlog.md) status and the execution plan.
Update contracts, model, guides or ADRs only when this task changes their content.
The [POC testing guide](../../development/testing-poc.md), README and delivery map
identify commands and current coverage limits.

## Open questions

No foundation blocker remains. Missing future business features are handoffs,
not permission to implement adjacent stories.

## Evidence

`npm run test:poc` passed with Node 24.21.0 and npm 10.9.2. The
[completed plan](../completed/IOP-020-poc-testing-foundation-plan.md) records the
actual layer results and limitations. No new test framework or runtime behavior
was introduced.

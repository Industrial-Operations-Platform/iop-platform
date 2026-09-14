# ADR-0010: React analytics UI, ECharts and layered testing

## Status

Proposed. Await owner acceptance of this concrete recommendation.
NestJS remains the Accepted backend under ADR-0006.

## Context

[IOP-002 evaluation](../../planning/items/IOP-002-frontend-testing-review.md)
compares frontend, charting and test tools against the owner's confirmed reporting
and delivery requirements. The monorepo has no application or package manifests.
ADR-0009 separately proposes workspace, hook and Docker delivery tooling.

## Decision

Propose React with TypeScript and Vite for a client-rendered frontend under
apps/web. Keep the NestJS API under apps/api as the sole business backend.
Produce a static frontend artifact for its own runtime container. Prefer same-origin
relative API paths with deployment-configured proxy routing; finalize the server
and configuration implementation under IOP-015/017/018. No browser secrets or
customer data in build-time constants. Do not add an SSR server without a need.

Use Apache ECharts for analytical charts, importing required chart types only.
A small frontend adapter owns chart lifecycle and presentation options; the API
supplies authorized data and owns metric semantics. Versioned administrator
configuration selects validated metric/dimension/chart identifiers. Keep external
Halle/Bereich/equipment/message labels in customer-scoped mappings. Report users
can filter and inspect but cannot change configuration. New formulas require code;
an administrator editor remains future work.

Use Vitest for unit/module tests with separate frontend and backend configuration;
React Testing Library for UI behavior; @nestjs/testing and Supertest for HTTP
integration; Playwright for browser journeys; and Testcontainers PostgreSQL for
database integration. Keep test databases disposable and separate from local user
data. Run relevant quick checks locally and full applicable suites in CI.

## Consequences

React needs learned state/lifecycle conventions and deliberate data-loading design.
ECharts adds an option API and resize/disposal responsibilities. Accessible data
alternatives and keyboard filters remain application work. No measured performance,
export capability or accessibility compliance is claimed by library selection.

Vitest configuration must preserve Nest's required decorator behavior for the
selected versions. Bootstrap validation must exercise real dependency injection,
HTTP handling and database lifecycle, not only pure functions. Playwright and
Testcontainers add browser/Docker setup and runtime cost; keep those suites separate
from pre-commit formatting checks. Pin compatible versions and verify licenses and
notices during bootstrap. No runtime tests or commands exist in this design slice.

## Alternatives considered

Vue is a credible alternative without a demonstrated maintainer advantage. Angular
provides more integrated conventions but a broader framework surface for the known
views. Next.js adds server/full-stack concepts without an established requirement.
Recharts is attractive for React composition; ECharts better consolidates the known
chart mix. Chart.js would need further heatmap integration evaluation. Jest and
Cypress are viable testing alternatives; Vitest and Playwright form the recommended
baseline. Shared manual databases reduce test isolation. See the evaluation for
primary sources, tradeoffs and the conditional command criterion at story closure.

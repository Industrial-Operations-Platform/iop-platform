# IOP-002 — Frontend, charting and testing review

Status: evaluation complete; recommendation Proposed in
[ADR-0010](../../architecture/adr/ADR-0010-frontend-charting-testing.md).
Companion: [delivery tooling](IOP-002-delivery-tooling-review.md).
Reviewed official documentation on 2026-09-14; no prototype or benchmark executed.

## Requirements and decision boundary

NestJS is the accepted backend. No frontend was previously accepted. The owner
requested a recommendation for a solo developer with strong backend experience,
limited frontend experience, local Docker execution and later server deployment.
V1 replaces Power BI with an executive overview and filtered analysis. Report
configuration selects existing metrics, dimensions and chart types; new formulas
are code changes. No report designer, server rendering or public SEO requirement
has been established. Preserve customer isolation and generic dimension contracts.

## Frontend options

| Option | Fit and tradeoff |
| --- | --- |
| React + TypeScript + Vite | Recommended: component UI with a separate static build and explicit Nest API boundary. Requires deliberate choices for routing and data loading; hooks/state must be learned. |
| Vue + TypeScript + Vite | Strong alternative with declarative templates and progressive composition. Could be equally suitable; no maintainer familiarity advantage is established. |
| Angular | Integrated framework with routing, forms and dependency injection. Its conventions may appeal to a backend developer, but its broader framework surface is more than these two analytical views presently require. |
| Next.js | React framework with full-stack/server capabilities. Those capabilities have no demonstrated v1 requirement alongside the dedicated Nest API; reconsider if server rendering becomes necessary. |

Recommendation is a project-fit judgment, not evidence that React is universally
simpler or faster. Use React with Vite for a client-rendered application, keep API
behavior in Nest and add routing/data libraries only when a concrete need warrants
them. Sources: [React build guidance](https://react.dev/learn/build-a-react-app-from-scratch),
[Vite](https://vite.dev/guide/), [Vue](https://vuejs.org/guide/introduction.html),
[Angular](https://angular.dev/overview), [Next.js](https://nextjs.org/docs).

## Charting options

| Option | Fit and tradeoff |
| --- | --- |
| Apache ECharts | Recommended: broad built-in analytical chart coverage including heatmaps, line/bar/scatter, configurable series and Canvas/SVG rendering. Its option model and lifecycle integration require care. |
| Recharts | Declarative React/SVG components are attractive for ordinary dashboard charts. Prefer ECharts here to keep the broader analytical chart requirements within one engine. |
| Chart.js | Suitable for conventional line/bar/scatter charts. Additional heatmap support would need further integration evaluation; less attractive for the known report mix. |

ECharts chart options stay inside a frontend adapter. Administrator files reference
validated metric/dimension/chart identifiers, not arbitrary JavaScript or database
queries. Nest owns aggregation and metric definitions. Provide equivalent values
in accessible text/tables and keyboard-operable filters; chart accessibility support
alone does not establish accessible reports. Test resize/disposal, empty data,
units and filter preservation. Benchmark representative volumes before making
performance claims. Export formats remain an open pilot requirement.

Sources: [ECharts features](https://echarts.apache.org/en/feature.html),
[selective imports](https://echarts.apache.org/handbook/en/basics/import/),
[Recharts](https://github.com/recharts/recharts),
[Chart.js scatter](https://www.chartjs.org/docs/latest/charts/scatter.html).
Verify release licenses and dependency notices when pinning packages; no commercial
reporting service or Power BI embedding dependency is proposed.

## Testing options and recommendation

| Layer | Options | Recommendation |
| --- | --- | --- |
| Unit/module | Vitest; Jest | Vitest across web and backend with separate configurations. It fits Vite and current Nest testing guidance; Jest remains viable but provides no established advantage for this new repository. |
| React behavior | Testing Library; implementation-oriented component snapshots | React Testing Library with Vitest: test visible states and user interactions. Avoid snapshots as the principal correctness evidence. |
| HTTP API | Supertest with Nest testing utilities; browser-only tests | Supertest with @nestjs/testing for validation, errors and scoped access checks. |
| Browser journeys | Playwright; Cypress | Playwright for automated browser journeys and trace-based failure inspection. Cypress is a viable interactive alternative; one browser suite is sufficient. |
| PostgreSQL integration | Testcontainers; manually shared test database | Testcontainers for disposable PostgreSQL with real migrations, isolation and cleanup. Requires Docker in local/CI test environments. |

Sources: [Vitest](https://vitest.dev/guide/), [Jest](https://jestjs.io/docs/getting-started),
[Nest testing](https://docs.nestjs.com/fundamentals/testing),
[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/),
[Playwright](https://playwright.dev/docs/intro/),
[Cypress](https://docs.cypress.io/app/get-started/why-cypress),
[Testcontainers PostgreSQL](https://node.testcontainers.org/modules/postgresql/).
Nest's current documentation uses Vitest; compatibility with the chosen pinned
Nest/TypeScript release and decorator transformation must still be verified at
bootstrap. Do not assume frontend transpilation settings work for Nest injection.

Prioritize synthetic fixtures with independently calculated frequency/duration
results, invalid inputs, duplicate/correction behavior once defined, customer
isolation and filter-consistent overview/detail totals. Browser tests use real
API/data for critical journeys and assert visible values, not only chart pixels.
Keep slower container/browser suites out of every commit; run them explicitly and
in CI. Formatting/lint/type hooks from ADR-0009 remain separate from functional tests.

## Closure mapping

Backend acceptance is already recorded in ADR-0006. Owner acceptance of ADR-0009
and ADR-0010 would complete frontend/tool selection for this design story.
Then synchronize ARCHITECTURE.md, README, item/backlog and milestone/roadmap status.

The command criterion is conditional on tooling existence. At design closure,
record it as not yet applicable with explicit handoff to IOP-015/016/017/020, rather
than claim executable commands passed. These stories must implement and verify
install, dev, build, lint, typecheck, unit/integration/browser test and Docker
start/log/stop commands. Command names/versions are finalized with real manifests.
ORM/migrations, API contracts, identity, detailed module code layout and hosting
remain their separately scoped decisions; this review does not accept them.

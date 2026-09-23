# Industrial Operations Platform (IOP)

IOP is a reusable industrial operations platform connecting people, shifts,
maintenance, assets and operational insight. This is the single main repository
for the platform. It includes a local API health host (IOP-016) and a web health UI (IOP-017);
business functionality and the worker host are not implemented. TypeScript/Node.js
with NestJS is the accepted backend ([ADR-0006](docs/architecture/adr/ADR-0006-backend-stack.md)). React +
TypeScript + Vite, ECharts and Jest for frontend/backend are accepted in
[ADR-0010](docs/architecture/adr/ADR-0010-frontend-charting-testing.md). Workspace,
hook and Docker tooling are accepted in
[ADR-0009](docs/architecture/adr/ADR-0009-local-delivery-tooling.md). IOP-002 stack
selection is complete. See [API startup and checks](apps/api/README.md) for the
implemented backend bootstrap and [web startup and checks](apps/web/README.md)
for the frontend. [Local Compose instructions](infra/docker/README.md) cover
the three-host container environment and its validation status.

## Start here

- [Product vision](docs/product/vision.md) and [proposed v1 scope](docs/product/scope-v1.md)
- [Architecture](ARCHITECTURE.md), [module boundaries](docs/architecture/modules.md)
  and [architecture decisions](docs/architecture/adr/)
- [Roadmap](ROADMAP.md), [backlog](docs/planning/backlog.md)
  and [milestones](docs/planning/milestones.md)
- [Agent navigation](AGENTS.md)

## Repository map

| Path | Purpose |
| --- | --- |
| `docs/product/` | Vision, scope and domain language |
| `docs/architecture/` | Context, modules, conceptual data model and ADRs |
| `docs/planning/items/` | Permanent task contexts and acceptance criteria |
| `docs/planning/active/` | Current execution plans, written before changes |
| `docs/planning/completed/` | Completed plans with verification evidence |
| `docs/planning/templates/` | Item and execution-plan templates |
| `apps/web/` | Local React/Vite health UI |
| `apps/api/` | Local NestJS API health host |
| `apps/worker/` | Future background processing host |
| `packages/contracts/` | Future explicit API and module contracts |
| `packages/shared/` | Future minimal, domain-neutral utilities |
| `infra/docker/` | Local Compose instructions and validation boundary |
| `infra/database/` | Future PostgreSQL migrations and non-sensitive seeds |
| `scripts/`, `tests/` | Future development tooling and tests |

Empty future directories use `.gitkeep`. From the root, use Node 24.21.0 and
`npm ci` and `npm run build`, then follow the
[local configuration startup](docs/development/local-configuration.md).
`npm test` builds and checks both hosts.
The API exposes only `GET http://127.0.0.1:3000/health`. Run `npm run dev:web`
in another terminal for the UI at `http://127.0.0.1:5173`.
See [API instructions](apps/api/README.md) for configuration, contracts and limits.

## Planned work

Start from an ID in the [backlog index](docs/planning/backlog.md). Read its context
and relevant ADRs, then create/update its plan before changes. Follow the
[required workflow](docs/planning/workflow.md); no unrelated or unplanned edits.

## Design lineage

Historical inputs: `OIP_Documento_Tecnico_Conceptual_v0.1.pdf` and
`OIP_Modelo_Datos_y_Asset_Locator.pdf` (provided separately; not vendored here).
Their operational intelligence, event normalization, asset hierarchy and locator
work informs this baseline. OIP now denotes the Operational Intelligence module
inside IOP. Historical proposals are design inputs, not implementation mandates.
Customer vocabulary and source-specific behavior belong in configuration or
integration adapters, outside the generic core.

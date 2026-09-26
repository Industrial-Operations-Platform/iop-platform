# Industrial Operations Platform (IOP)

IOP is a reusable industrial operations platform. Its Operational Intelligence
module now provides a local analytical POC: configured demo user → CSV upload →
persistent history → Executive Overview and analytical detail. The React/Vite web
and NestJS API share generated contracts; PostgreSQL retains original files,
normalized aggregates and provenance with scoped authorization and forced RLS.

## Run the POC

With Node 24.21.0, npm 10.9.2 and Docker running:

```sh
npm ci
npm run demo:setup
npm run demo:start
```

Open **http://127.0.0.1:5173**. Follow the [demonstration guide](docs/development/running-poc.md)
for file format, reference totals, historical filters, user switching and safe reset.
Local demo user selection is temporary; third-party authentication remains a future
adapter before shared use. Workers, external integrations and other platform modules
remain outside this POC.

## Start here

- [Product vision](docs/product/vision.md) and [proposed v1 scope](docs/product/scope-v1.md)
- [Architecture](ARCHITECTURE.md), [module boundaries](docs/architecture/modules.md)
  and [architecture decisions](docs/architecture/adr/)
- [Roadmap](ROADMAP.md), [backlog](docs/planning/backlog.md)
  and [milestones](docs/planning/milestones.md)
- [Agent workflow](docs/planning/workflow.md)

## Repository map

| Path | Purpose |
| --- | --- |
| `docs/product/` | Vision, scope and domain language |
| `docs/architecture/` | Context, modules, conceptual data model and ADRs |
| `docs/planning/items/` | Permanent task contexts and acceptance criteria |
| `docs/planning/active/` | Current execution plans, written before changes |
| `docs/planning/completed/` | Completed plans with verification evidence |
| `docs/planning/templates/` | Item and execution-plan templates |
| `apps/web/` | React/Vite analytical workflow and optional fixture previews |
| `apps/api/` | NestJS health and explicitly activated local business API |
| `apps/worker/` | Future background processing host |
| `packages/contracts/` | Future explicit API and module contracts |
| `packages/shared/` | Future minimal, domain-neutral utilities |
| `infra/docker/` | Local Compose instructions and validation boundary |
| `infra/database/` | Local PostgreSQL provisioning, migrations and checks |
| `scripts/`, `tests/` | Development tooling, demo launcher and checks |

Empty future directories use `.gitkeep`. From the root, use Node 24.21.0 and
`npm ci` and `npm run build`, then follow the
[local configuration startup](docs/development/local-configuration.md).
`npm test` builds and checks both hosts and database configuration.
`npm run test:database` verifies migration behavior in disposable PostgreSQL containers.
`npm run test:poc` runs type checks and all current unit/integration/browser layers;
see the [POC testing guide](docs/development/testing-poc.md) for prerequisites and limits.
Without explicit demo activation, business operations remain unavailable and
`GET http://127.0.0.1:3000/health` remains public. Use the demo launcher for the
connected import/analysis workflow.
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

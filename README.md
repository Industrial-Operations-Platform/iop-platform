# Industrial Operations Platform (IOP)

IOP is a reusable industrial operations platform connecting people, shifts,
maintenance, assets and operational insight. This is the single main repository
for the platform. It currently contains documentation and directory placeholders;
there is no runnable application. TypeScript/Node.js with NestJS is the accepted
backend ([ADR-0006](docs/architecture/adr/ADR-0006-backend-stack.md)). React +
TypeScript + Vite, ECharts and Jest for frontend/backend are accepted in
[ADR-0010](docs/architecture/adr/ADR-0010-frontend-charting-testing.md). Workspace,
hook and Docker tooling are accepted in
[ADR-0009](docs/architecture/adr/ADR-0009-local-delivery-tooling.md). IOP-002 stack
selection is complete; implementation and runnable commands remain bootstrap work.

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
| `apps/web/` | Future user interface |
| `apps/api/` | Future application API |
| `apps/worker/` | Future background processing host |
| `packages/contracts/` | Future explicit API and module contracts |
| `packages/shared/` | Future minimal, domain-neutral utilities |
| `infra/docker/` | Future container configuration |
| `infra/database/` | Future PostgreSQL migrations and non-sensitive seeds |
| `scripts/`, `tests/` | Future development tooling and tests |

Empty future directories use `.gitkeep`. No installation, build or test commands
exist yet. Do not infer a language, framework or deployment topology from paths.

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

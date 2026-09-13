# Industrial Operations Platform (IOP)

IOP is a reusable industrial operations platform connecting people, shifts,
maintenance, assets and operational insight. This is the single main repository
for the platform. It currently contains documentation and directory placeholders;
there is no runnable application or selected frontend/backend framework.

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
| `docs/planning/active/` | Plans for work currently being implemented |
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

## Design lineage

Historical inputs: `OIP_Documento_Tecnico_Conceptual_v0.1.pdf` and
`OIP_Modelo_Datos_y_Asset_Locator.pdf` (provided separately; not vendored here).
Their operational intelligence, event normalization, asset hierarchy and locator
work informs this baseline. OIP now denotes the Operational Intelligence module
inside IOP. Historical proposals are design inputs, not implementation mandates.
Customer vocabulary and source-specific behavior belong in configuration or
integration adapters, outside the generic core.

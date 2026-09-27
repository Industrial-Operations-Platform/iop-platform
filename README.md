# Industrial Operations Platform (IOP)

IOP is a modular industrial operations platform. Its Operational Intelligence (OIP)
module provides CSV import, persistent history and analytical report templates.
The local application has one Administrator; third-party login is deferred.

## Run locally

With Node 24.21.0, npm 10.9.2 and Docker with Compose running:

```sh
npm run local:up -- /absolute/path/to/backup.backup
```

Open **http://127.0.0.1:8080**. Frontend, API and PostgreSQL run in separate containers.
Omit the optional backup on first startup to start empty. Subsequent `npm run local:up`
reuses the seed and persistent history. Stop with `npm run local:stop`.
No host `npm ci` is required for this container workflow.

The [operator guide](docs/development/running-poc.md) owns startup, seed provenance,
CSV preparation, report navigation and troubleshooting. Native tools and synthetic
previews are optional development paths, not the primary installation.

## Documentation

| Need | Source of truth |
| --- | --- |
| Current product behavior and limits | [POC scope](docs/product/scope-poc.md) |
| Delivered work and remaining acceptance | [Delivery status](docs/planning/poc-delivery.md) |
| Next priorities and deferred capabilities | [Roadmap](ROADMAP.md) |
| Architecture and implementation boundaries | [Architecture](ARCHITECTURE.md) |
| Reusable frontend components and colors | [Visual identity](docs/design/visual-identity.md) |
| Development checks | [Testing guide](docs/development/testing-poc.md) |
| Task selection and contribution rules | [Backlog](docs/planning/backlog.md), [workflow](docs/planning/workflow.md) |

Permanent task contexts and completed plans preserve scope and historical evidence;
ADRs preserve decisions. Their past findings are not current operating instructions.
Proposed decisions and the [shared-use v1 scope](docs/product/scope-v1.md) describe
future work, not additional requirements for this local POC.

## Repository map

| Path | Responsibility |
| --- | --- |
| [apps/web](apps/web/README.md) | React/Vite application, analysis adapters and shared presentation components |
| [apps/api](apps/api/README.md) | NestJS host, module use cases and persistence adapters |
| [infra/database](infra/database/README.md) | PostgreSQL roles, migrations and integration checks |
| [infra/docker](infra/docker/README.md) | Container composition and packaging |
| `scripts/local/` | Local launcher, analytics backup extraction and initialization |
| `config/` | Example configuration and source-specific classification |
| `docs/` | Product contracts, architecture and task evidence |

For native development, install dependencies with `npm ci`; follow the testing and
component guides. Empty future host/package placeholders are not delivered features.
Customer terminology and source schemas stay in scoped configuration or integration
adapters, outside generic domain policy.

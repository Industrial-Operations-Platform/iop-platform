# Local container platform

The primary entry point is `npm run local:up`, optionally with a backup path on first
startup. The [operator guide](../../docs/development/running-poc.md) owns prerequisites,
seed behavior, stop/start commands and troubleshooting. Open http://127.0.0.1:8080.

## Composition

[compose.platform.yaml](../../compose.platform.yaml) contains:

| Service | Responsibility |
| --- | --- |
| `database` | PostgreSQL 17.6, persistent `platform-data` volume, no published port |
| `setup` | One-shot role provisioning, migrations and idempotent analytics seed before API startup |
| `api` | Built NestJS application, scoped non-owner credentials, private port 3000 |
| `web` | Built React application served by Nginx; only published port is loopback 8080 |

`scripts/local/platform.cjs` orchestrates the sequence. Private `.local-platform/`
files hold configuration, credentials and seed provenance and are excluded from
Git/image contexts. Setup and runtime credentials are separate. Preserve both the
private directory and volume when stopping; do not delete volumes to fix startup.
API process health does not prove analytical readiness or replace migration/seed checks.

Images use the root lockfile, Node 24.21.0/npm 10.9.2, PostgreSQL 17.6 and Nginx 1.28.0.
API/web run as non-root users. Build inputs exclude local data, Git, secrets and host
modules; packaging retains dependency notices. Patch tags are local packaging choices,
not a production support or image-digest policy.

Re-run `npm run local:up` to rebuild after code changes. Images have no hot-reload
source mounts; use the optional native path for rapid development. Port conflicts,
a stopped daemon or registry failures must be resolved before startup can succeed.
This stack is for one trusted local operator, not public/shared hosting.

## Optional foundation tooling

[compose.yaml](../../compose.yaml) is the earlier health-only bootstrap, not the
business platform. It uses `.env` and `config/poc.local.json`, which are separate from
`.local-platform/`, and competes for web port 8080. Its fixed API configuration does
not activate business operations. The earlier setup procedure is retained in the
[IOP-015 execution record](../../docs/planning/completed/IOP-015-local-development-environment-plan.md).

[compose.database.yaml](../../compose.database.yaml) supplies explicit database
provisioning/migration tools for that foundation stack. Consult the
[database guide](../database/README.md) and
[configuration contract](../../docs/development/local-configuration.md) when using
those tools. Do not mix their credentials or volumes with the primary installation.

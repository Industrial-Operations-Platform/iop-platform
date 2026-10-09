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

The web build runs the mandatory shared design guard before TypeScript/Vite.
The build stage copies the guard and its Jest configuration; a conflicting date
control or feature-owned compact-control style fails image generation. These test
sources are not copied to the Nginx runtime image.

Images use the root lockfile, Node 24.21.0/npm 10.9.2, PostgreSQL 17.6 and Nginx 1.28.0.
API/web run as non-root users. Build inputs exclude local data, Git, secrets and host
modules; packaging retains dependency notices. Patch tags are local packaging choices,
not a production support or image-digest policy.

Re-run `npm run local:up` to rebuild after code changes. Images have no hot-reload
source mounts; use the optional native path for rapid development. Port conflicts,
a stopped daemon or registry failures must be resolved before startup can succeed.
The entry HTML and platform SVG use `Cache-Control: no-cache` for revalidation.
The selected platform mark also has a shared `unified-record` URL revision in the
header, introduction and favicon, bypassing cached icons from earlier designs.
Reload the browser after a successful rebuild; the running web container must
serve the same SVG bytes as `apps/web/public/iop-mark.svg`.
This stack uses individual temporary local accounts and remains loopback-only.
After the first startup, run `npm run local:admin` to issue the initial administrator
password in your terminal, then change it at first sign-in. Existing accounts and
analytical data survive rebuilds. See the operator guide for profiles and recovery.

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

Shift Handover uses the private `config/handover.json` created by the local launcher.
Configure confirmed department/area identities there; no analytical imports are
required. See [the operational guide](../../docs/development/shift-handover.md).

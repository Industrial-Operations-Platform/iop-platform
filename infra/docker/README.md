# Local POC containers

IOP-015 starts the existing React UI, public-health API and an empty PostgreSQL
service. IOP-019 adds opt-in [role provisioning and migrations](../database/README.md).
Application database access, seed data, CSV ingestion and analytics remain future work. See the [execution plan](../../docs/planning/completed/IOP-015-local-development-environment-plan.md)
for validation status and limitations. This is not completion of POC increment 1.

## First startup

Install/start Docker with Compose v2 supporting `up --wait` (CLI 2.39.2 used during
validation). Run commands from the repository root. No native Node is required
for container execution; builds use the root lockfile and Node 24.21.0/npm 10.9.2.

Copy `.env.example` to `.env`, restrict it with `chmod 600 .env`, and set
`IOP_POSTGRES_PASSWORD` to a locally generated password (for example, generate a
hex value with `openssl rand -hex 24`). Never use production credentials.
The empty example intentionally fails. Shell environment overrides Compose `.env`;
native npm commands do not load this file. Avoid sharing `docker compose config`
output because it can contain the password; use `config --quiet` to validate.

Copy `config/poc.example.json` to `config/poc.local.json` and restrict it with
`chmod 600 config/poc.local.json` before startup. The API validates this read-only
mount; see the [configuration contract](../../docs/development/local-configuration.md).
It contains fictional scope IDs and no credentials. Missing or invalid configuration
prevents API health and web startup.

```sh
docker compose up --build --wait --wait-timeout 120
```

Open `http://127.0.0.1:8080`. The UI calls same-origin `/health`, which Nginx proxies
to `api:3000`. Only web port 8080 is published, explicitly on IPv4 loopback.
API and PostgreSQL have no host ports. Container-wide API binding is explicitly
enabled by Compose; native startup still defaults to loopback. This is a trusted
single-operator local environment, not shared-user access control.

`up --wait` checks all three processes. Web startup waits for API health, while
PostgreSQL starts independently because the current API has no database dependency.
Health does not establish business or database authorization readiness.

## Verify and operate

```sh
docker compose ps
curl --fail http://127.0.0.1:8080/health
docker compose exec database psql -U iop_bootstrap -d iop_local -c 'SELECT 1;'
docker compose logs --tail 50 api web
docker compose down
```

The health response is `{"status":"ok"}`. `down` retains the dedicated named
`postgres-data` volume. Start again with the startup command. PostgreSQL initializes
its database/user/password only on an empty volume; editing `.env` does not rotate
an existing database password. Do not delete a volume to resolve credentials.
This story supplies no demo dataset reset; that belongs to IOP-128.

The bootstrap database user is an owner, used only for database initialization and
local operator inspection. No database credentials reach API or frontend images.
IOP-019 provides migrations and separate non-owner runtime credentials through an
explicit tooling overlay. Future business persistence must add scoped constraints,
forced RLS and reviewed runtime grants in its owning migrations.
IOP-018 supplies local target configuration and startup validation; future business
consumers must still enforce persisted ownership and authorization.

Images pin Node 24.21.0, PostgreSQL 17.6 and Nginx 1.28.0 patch tags. These are
local packaging choices, not a production support/security certification or a
commitment to an ORM or server topology. ADR-0019 selects node-pg-migrate for
local migration tooling. Patch tags may be
rebuilt upstream; digest pinning/update policy remains future release work.
Build inputs use an allowlist, excluding local `.env`, data, Git and host modules.
API/web run as non-root image users. API dependencies retain distributed notices;
browser build dependency notices are retained under `/usr/share/iop-notices`.

## Editing and troubleshooting

Rebuild with the startup command after code changes. Runtime images have no source
mounts or hot reload; native `npm run dev:web` remains the fast UI development path.
No source-file mount is required until the CSV importer defines its input contract.

- Missing password: set the local value; diagnostics never print its contents.
- Port 8080 occupied: stop the conflicting local process or stack, then retry.
- Daemon unavailable: start Docker Desktop/Engine before retrying.
- Registry/build failure: verify registry access and availability of the pinned
  images/packages. Do not treat configuration validation as a successful build.
- API stopped: the UI displays its safe unavailable state; restart with
  `docker compose start api`, then choose **Check again**. Nginx resolves the API
  service name through Docker DNS, including after container recreation.

No worker, login bypass, business origin policy, industrial integration or public
deployment is included. ADR-0018 remains Proposed. Business mutations require
the execution-context and browser-origin controls described in the POC baseline.

References: [Compose readiness](https://docs.docker.com/compose/how-tos/startup-order/),
[Compose networking](https://docs.docker.com/compose/how-tos/networking/),
[PostgreSQL image initialization](https://hub.docker.com/_/postgres).

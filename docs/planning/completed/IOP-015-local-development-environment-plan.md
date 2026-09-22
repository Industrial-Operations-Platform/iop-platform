# IOP-015 — Local development environment execution plan

Source: [IOP-015](../items/IOP-015-local-development-environment.md).

## Status and authorization

Completed on 2026-09-22. The owner requested IOP-015 limited to the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `feature/IOP-015-local-development-environment`, created from clean
`develop` on 2026-09-22 before file changes.

## Proposed implementation

Provide one Compose command to build/start the real static React UI, NestJS health
API and persistent PostgreSQL. Publish only the web endpoint on host loopback;
proxy public health to the API on the private container network. Use multi-stage
host Dockerfiles, explicit build exclusions and pinned image versions. Keep native
API loopback default; explicitly select container binding through validated input.
Require a locally supplied database bootstrap password; never pass it to the API
or web. No application database connection or business-readiness claim.

## Files expected to change

- `compose.yaml`, `.dockerignore`, `.env.example`.
- `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/web/nginx.conf`.
- API entrypoint/configuration and their existing tests for container binding.
- `infra/docker/README.md`, root and host READMEs, `ARCHITECTURE.md` for startup
  instructions and accurate current-state statements.
- This plan, permanent IOP-015 item and its backlog row.

## Dependencies and decisions

- IOP-016/017 are Completed and present in develop; reuse their real hosts.
- Accepted ADR-0001/0003–0011 establish boundaries, stack, Compose, multi-stage
  images and static frontend with same-origin proxy. Nginx is the bounded static
  server/proxy implementation assigned to IOP-015 by ADR-0010.
- IOP-018 remains Proposed: only transport/container startup inputs belong here;
  scoped business configuration and general validation remain there.
- IOP-019 remains Proposed: start an empty PostgreSQL service with persistent
  storage, without schema, migrations, seeds, ORM or application credentials.
  Its migration and RLS contracts are not prerequisites for process startup.
- ADR-0018 remains Proposed and blocks business access, not public health.
- No workers, live integrations, login, source mounts without an importer,
  production deployment, hook platform or adjacent story implementation.
- Native Vite development remains available; runtime images have no source mounts
  or hot reload. Compose rebuild is the documented container edit workflow.

## Database changes

Dedicated Compose volume only. No schema or runtime role. Bootstrap credentials
are database-only and must never become application runtime credentials.
Do not delete existing volumes during validation; isolate disposable test projects.

## API and UI changes

Existing health contract and UI retained. Native API binding defaults to loopback;
container binding accepts only the explicit supported listen addresses. The host
publishes web on loopback; API and database have no published ports.

## Tests and validation

- `npm test` and `npm run typecheck`: both hosts, health contract, safe invalid
  configuration and compiled entrypoint behavior, including container binding.
- Compose configuration: missing password fails without echoing secrets; exactly
  three services, loopback web publication, no API/database port exposure.
- Build/start an isolated Compose project; check real UI and proxied health,
  SQL readiness, API-failure visibility/recovery and persistent data across restart.
- Verify runtime users/build contents and cleanly stop only validation containers.
- Check changed Markdown links, story IDs/statuses and `git diff --check`.
- Record infrastructure/network blockers honestly; do not mark unexecuted
  acceptance complete. Docker Desktop was initially stopped and is being started.

## Implementation steps

1. Record dependency refinement and plan before implementation.
2. Implement bounded images, networking, persistence and API binding support.
3. Run positive/negative validation and synchronize startup documentation.
4. Record evidence, update item/backlog, archive the plan only when complete,
   commit locally and request permission before any push.

## Completion checklist

- [x] Planned acceptance criteria verified with actual results.
- [x] Relevant tests/reviews completed; limitations recorded.
- [x] Scope deviations authorized and recorded before dependent work.
- [x] Item/backlog updated and plan moved to completed/ with links fixed.

## Evidence and deviations

Initial inspection: clean develop, real API/UI present, Compose 2.39.2 installed.


### Final validation evidence — 2026-09-22

- `docker compose config --quiet` without IOP_POSTGRES_PASSWORD failed with the
  expected missing-field diagnostic and no secret value. With disposable validation
  input it passed. No `.env` containing credentials was added to the repository.
- `IOP_POSTGRES_PASSWORD=validation-only docker compose -p iop015-validation up
  --build --wait --wait-timeout 120` built both real hosts from the lockfile and
  started all three services healthy. Docker Desktop was started for validation;
  registry manifest checks confirmed the three pinned image tags exist.
- Node 24.21.0/npm 10.9.2 from the existing temporary IOP-017 runtime were used for
  local checks, without modifying the user's default Node installation.
- `npm test`: passed API 3 suites / 31 tests and web 2 suites / 11 tests, including
  build and generated contract drift verification. Initial sandbox execution failed
  on restricted TCP listeners; the approved rerun passed. No application failure
  was hidden. `npm run typecheck`: passed both workspaces.
- Playwright Chromium against actual `http://127.0.0.1:8080` confirmed the reachable
  UI state. Stopping only the validation API showed the unavailable state; forcing
  API container recreation and retrying restored the reachable state. This also
  exercised Docker DNS re-resolution in Nginx, with no browser secret configuration.
- SQL created a single synthetic `iop015_probe` row in the disposable validation
  database. `compose down` then `up --wait` recreated the containers; querying
  the row returned `persistent`. The UI reached the API again after full restart.
  TCP SQL with the disposable password returned `1` for `SELECT 1`.
- Runtime inspection: API user `node`, web user `nginx`; API has no port bindings,
  database has no published host port, web publishes only `127.0.0.1:8080`.
  API runtime has no TypeScript package, source directory or `.env`; web retains
  dependency notices and no workspace node_modules. API production dependencies
  and their distributed notices remain in its runtime image.
- The isolated `iop015-validation` containers/network and its newly created volume
  were removed after testing. Other projects and existing volumes were untouched.
  Built images/cache remain available; Docker Desktop remains running.
- Changed Markdown local links and `git diff --check` passed. Item/backlog statuses
  match Completed; this plan moved to completed. IOP-018/019 and ADR-0018 retain
  their existing statuses. No POC-wide, migration, RLS or business readiness claim.

### Limitations and decisions retained

Runtime images are the bounded container edit/rebuild workflow; native Vite remains
available for hot reload. No unused source-file mount is added before importer
requirements exist. PostgreSQL 17.6 is a local image-version choice; database schema,
ORM/migrations and runtime role design remain IOP-019. Image patch tags are explicit
but not immutable digests; no production image-security certification is claimed.
No new architecture pattern or scope expansion required owner acceptance.

Implementation references: [Compose startup/readiness](https://docs.docker.com/compose/how-tos/startup-order/),
[service-name networking](https://docs.docker.com/compose/how-tos/networking/),
[PostgreSQL image](https://hub.docker.com/_/postgres).

# IOP-018 — Local configuration execution plan

Source: [permanent item](../items/IOP-018-configuration-management.md).

## Status and authorization

Completed on 2026-09-23. Owner requested IOP-018 on 2026-09-22, limited to the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `feature/IOP-018-configuration-management`, created from clean `develop`.

## Scope and implementation

Validate a bounded server-side JSON document for one explicit organization, site
(with IANA time zone) and source, including ownership references. Require an explicit
file path at API startup; use no implicit business target. Reuse existing host/port
validation, restrict wildcard binding to an explicit container transport setting,
and mount configuration read-only in Compose. No new dependencies or architecture
pattern: this is host configuration, not identity, persistence or a source registry.

Configuration has a fixed 16 KiB maximum (read at most limit + 1 bytes), exact keys,
bounded opaque identifiers and no optional mapping/adapter fields. Unsupported
mapping configuration is rejected until importer-owned contracts exist; no mapping
is applied. This limit is an admission bound, not a performance promise. Validate
all input before creating the Nest host; no hot reload or partial activation.

## Files expected to change

- `apps/api/src/configuration.ts`, `main.ts`, `application.ts` and configuration/startup tests.
- `config/poc.example.json`, `.gitignore`, `.env.example`, `compose.yaml`.
- `docs/development/local-configuration.md`, API/container/root startup documentation.
- `apps/web/playwright.config.ts` and web README: preserve isolated browser-test startup
  with explicit synthetic config after making API configuration mandatory.
- This plan, IOP-018 item and backlog.

## Dependencies and decisions

IOP-002 and IOP-014 completed design is integrated on develop, alongside IOP-015,
016 and 017 hosts. Reuse Accepted ADR-0001/0003–0009, 0012/0013/0016 and existing
npm/Jest tooling. ADR-0018 remains Proposed; no business access, principal/grants,
RLS bypass, seed, migrations or database connections are delivered. Production,
login, general mapping engines, storage/reset and runtime business authorization
remain outside this slice. Config references validate the document only; persisted
ownership and temporal immutability must be checked by their future consumers.

## Database, API and UI

No schema or endpoint change. Health remains public process liveness. Frontend
continues same-origin health requests with no scope or secrets in browser bundles.
Compose retains its dedicated database and loopback-only published web port.

## Steps and validation

1. Add strict config parsing/loading and wire startup/Compose examples.
2. Test valid configuration, missing/foreign scope, unsupported keys, malformed JSON,
   time zones, file errors and size boundaries. Verify child-process startup fails
   closed and does not echo secrets or paths. Keep tests isolated from ambient config.
3. Run `npm run typecheck`, `npm test`, Compose `config --quiet` with synthetic
   credentials, document links/status checks and `git diff --check`.
4. Synchronize scope/evidence, move plan to completed and commit validated work.

## Completion checklist

- [x] Scope and startup validation verified.
- [x] Relevant tests and documentation checks pass; limitations recorded.
- [x] Item/backlog synchronized and plan archived.

## Evidence and deviations

- `npm run typecheck`: API and web passed on Node 24.21.0/npm 10.9.2.
- `npm test`: builds and browser contract check passed; 59 API tests and 11 web
  tests passed, including real compiled startup and sanitized failure cases.
- `npm run test:e2e`: both browser tests passed through the actual local API/proxy.
- `IOP_POSTGRES_PASSWORD=synthetic-validation-only docker compose --env-file /dev/null config --quiet`:
  passed without printing resolved credentials. Container images/stack were not
  rebuilt or restarted in this slice; read-only mount runtime portability remains
  subject to the operator's container platform and file permissions.
- Configuration size tests accepted exactly 16,384 bytes and rejected 16,385;
  malformed shapes, foreign organization/site references, invalid zones, missing
  files and unsupported mapping fields were rejected. No mapping is applied.
- Markdown local-link checks, ignored-local-file checks and `git diff --check`
  passed. Reviewed changed files contain fictional config and no credentials.

Initial validation accidentally used the default Node 20.18.3 and failed due to
ESM/runtime compatibility and sandbox listener restrictions. A first temporary
PATH setup also selected npm's shell wrapper incorrectly. Final successful runs
used `/private/tmp/iop-017-runtime/node_modules/.bin` and approved local-listener
execution; the user's default runtime was not changed. Initial branch creation
was sandbox-blocked; the plan file was written before the approved branch retry,
but all implementation edits occurred on the required story branch. No merge,
rebase, push or adjacent-story activation occurred.

The only scope refinement was updating Playwright's startup environment and web
startup instructions to accommodate required configuration; this was recorded in
the plan before those edits. No new ADR or dependency was needed. Production,
source mapping execution, persisted ownership/RLS and ADR-0018 acceptance remain
outside this completed configuration slice.

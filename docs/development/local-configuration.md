# Host scope configuration

This is the scope-file contract delivered by IOP-018, also used by the active host.
The primary [Docker launcher](running-poc.md) generates its private scope, identity,
mapping and credential files automatically. The manual examples below are for the
independent health-only/native foundation. A scope file alone does not seed records,
create a principal, authorize operations or establish database readiness.
Local business execution is accepted under ADR-0018/0030/0034.

## Native startup

From the repository root, after installing the documented Node/npm versions:

```sh
cp config/poc.example.json config/poc.local.json
chmod 600 config/poc.local.json
npm run build
IOP_CONFIG_FILE="$PWD/config/poc.local.json" npm start
```

The example contains fictional identifiers. Change the local file to the intended
explicit targets; keep local configuration out of Git. The API requires the file
path even for health-only startup. Use an absolute path: relative paths resolve
against the API process working directory (`apps/api` for npm workspace startup).
No `.env` file is loaded by native API commands. Environment variables are the
source for host settings; the selected JSON file is the only source for
scope. There is no field merge, fallback site, discovery or hot reload. Restart
after changing configuration; the entire document must pass before listening.

## Inputs and bounds

| Input | Requirement / default |
| --- | --- |
| `IOP_CONFIG_FILE` | Required path to a regular UTF-8 JSON file, at most 16,384 bytes. Read at most 16,385 bytes and reject overflow. |
| `HOST` | Defaults to `127.0.0.1`; only this address and `0.0.0.0` are supported. |
| `PORT` | Defaults to 3000 if absent; digits only, integer 1–65535. Empty is invalid. |
| `IOP_TRANSPORT` | Defaults to `native`; accepts `native` or `container`. Wildcard HOST requires `container`. This is a transport choice, never an identity mode. |
| `organization.id` | Required opaque configuration ID. |
| `site.id`, `site.organizationId`, `site.timeZone` | Required; organization reference must match the configured organization. Zone is `UTC` or a slash-qualified IANA identifier recognized by Node ICU, at most 100 characters. |
| `source.id`, `source.organizationId`, `source.siteId` | Required; both references must match the configured organization/site. |

IDs contain 1–64 ASCII letters, digits, underscores or hyphens and start with a
letter or digit. They are stable identifiers, not display names. These are local
configuration admission rules, not a database ID-generation decision. Root and
nested objects accept exactly the fields shown in
[the example](../../config/poc.example.json). Null, arrays, extra fields, missing
fields, unsupported zones and foreign ownership references fail closed. JSON uses
standard parser semantics; do not repeat object keys. No secrets belong in this
scope document. File and field failures emit fixed field names/reasons without
values, input paths, parser messages or stack traces, then exit with code 1.

The fixed byte/string limits bound this small single-target document and are not
performance commitments. No configurable collections, source mappings, credentials,
storage paths or database URLs are supported. Mapping fields are rejected; the
import host loads and validates its bounded mapping configuration separately.
Site-zone configuration does not establish source
reporting windows or permit changing historical temporal interpretation.

## Foundation containers and secrets

The earlier `compose.yaml` foundation (see [container guide](../../infra/docker/README.md)) reads the same
`config/poc.local.json` through a read-only bind mount, without baking it into an
image. A missing source file is not automatically created. Compose explicitly
sets container transport, HOST, PORT and the in-container configuration path;
host API environment variables do not override these literal service settings.
Only web port 8080 is published, on loopback. Do not publish the wildcard API
listener or use container transport for native/LAN operation.

`.env` is exclusively Compose input. The shell's `IOP_POSTGRES_PASSWORD` overrides
the same variable in `.env`; neither API nor frontend receives it. Database name
`iop_local`, initialization owner `iop_bootstrap` and the dedicated named volume
remain fixed by Compose. The foundation health API does not receive runtime database credentials.
Restrict private config/credential files to the operator account and ensure the
container's non-root user can read the mounted scope file on the local platform.
Do not print resolved Compose config containing credentials; use `config --quiet`.

The frontend keeps same-origin `/health` and its existing local proxy port 3000;
it consumes no server configuration. Changing native API PORT requires adjusting
the frontend proxy in a separately planned change or testing health directly.
Never add secrets to Vite public variables or browser assets.

## Tests and remaining boundaries

`npm test` supplies explicit synthetic configuration to compiled startup tests;
parser tests use isolated temporary files, including the exact byte boundary and
one byte above it. `npm run test:e2e` sets explicit example configuration and native
loopback transport for its API process. Neither command requires private `.env` or
local scope files. `npm run typecheck` checks both hosts.

Scope-file ownership validation does not prove ownership of persisted records.
Consumers must check persisted organization/site/source references, current grants,
transaction-local RLS and site-zone immutability before business use. The active host
enforces these checks separately. This scope-file validator alone
does not provide authorization, seeding, migrations or shared-user security.

See [POC secrets hygiene](secrets-poc.md) for staged-index checks and private credential handling.

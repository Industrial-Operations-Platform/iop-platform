# Local API host

IOP-016 implements process liveness only. This is the API composition host for the
modular monolith; it contains no business modules or database connection.

## Run from the repository root

Use Node 24.21.0 (`nvm install && nvm use`, when nvm is installed) and npm 10.9.2. Dependencies
are pinned in the workspace manifests and root lockfile. If your Node installation
bundles a different npm major, select the verified version with
`npm install --global npm@10.9.2` before installing this workspace.

```sh
npm ci
npm run build
npm start
```

In a second terminal:

```sh
curl --fail http://127.0.0.1:3000/health
```

Expected: HTTP 200, `application/json`, `{"status":"ok"}`. The listener is fixed
to IPv4 loopback. Set `PORT=3001 npm start` to use another port. PORT must be an
integer from 1 to 65535; absence defaults to 3000, an empty value is invalid.
No `.env` file is loaded, no database or secret configuration is needed. Stop with
Ctrl-C or SIGTERM. Startup failures exit nonzero with a fixed diagnostic message;
configuration values and exception details are not logged.

## Checks and contract

```sh
npm run typecheck
npm test
npm run openapi
```

`npm test` builds first and enables the VM module support required by Jest when
loading Nest 12 ESM packages from the CommonJS TypeScript build. Node emits its
experimental VM-module warning during tests. It runs Jest/Supertest checks plus compiled
process tests. Tests open ephemeral local ports and need permission to listen.
`npm run openapi` regenerates [the reviewed artifact](contracts/openapi.json)
from Nest DTO/operation metadata; the integration test detects artifact drift.
The verified dialect is OpenAPI 3.0.0. No documentation route or Swagger UI is served.

`GET /health` is public and requires no identity, organization/site or permission.
It proves only that the process responds, not readiness of storage/import/analytics.
It accepts no meaningful inputs and returns no application configuration or data.
Unknown routes/versions and unsupported operations return 404 Problem Details.
Unexpected host errors return sanitized 500 Problem Details and a fixed server log.
Bootstrap errors use `about:blank`, `title`, and matching HTTP/body `status` with
`application/problem+json`. Domain error types and correlation remain IOP-022/013.

## Boundaries and follow-up

IOP-013 remains open for broader health/logging contracts. IOP-015 owns Compose
integration; IOP-018/019 own broader configuration/database bootstrap. No frontend,
worker, migrations, database readiness, authentication, principal, authorization
bypass or business routes are implemented. ADR-0018 remains Proposed; business
access waits for an accepted mechanism. Loopback binding is a local host choice,
not proof of shared-user security. Hooks/lint/format tooling and CI remain future
scoped work; this bootstrap provides build, type and runtime checks only.

Direct packages use MIT or Apache-2.0 licenses. Installed package distributions
retain their license files (including the reflect-metadata CopyrightNotice).
The lockfile records dependency licenses; any future redistribution/container
packaging must preserve applicable notices. No production readiness is claimed.

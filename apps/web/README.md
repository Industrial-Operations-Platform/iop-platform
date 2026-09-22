# Local web host

IOP-017 supplies a React/TypeScript/Vite page that checks API process liveness.
No CSV import, analytical views, authentication or database readiness is implemented.

## Run locally

Use the root-required Node 24.21.0 and npm 10.9.2 (`nvm use` if available).
From the repository root:

```sh
npm ci
npm run build
npm start
```

In a second terminal, run `npm run dev:web` and open `http://127.0.0.1:5173`.
For the built static application, run `npm run preview:web` and open
`http://127.0.0.1:4173` instead. Both listeners bind to loopback and fail if their
port is occupied. The API must use its default port 3000 for this bootstrap.
The browser uses relative `/health`; Vite proxies that exact path to
`http://127.0.0.1:3000` in development and preview. No CORS change or browser
configuration/secrets are needed. Stop processes with Ctrl+C.

The page checks on mount, times out after five seconds and offers **Check again**.
A reachable API does not establish storage or business readiness. When the API is
stopped, the page displays a safe unavailable message; start it and retry.

`dist/` is the static build output. Vite preview is for local verification only;
the [IOP-015 container environment](../../infra/docker/README.md) serves the
static artifact with Nginx and proxies `/health` to the internal API. Do not expose these local
hosts as a shared deployment.

## Validate

From the repository root:

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
```

`npm test` builds both hosts, checks generated browser contract drift, runs the
existing API suite and Jest/React Testing Library checks in a separate DOM config.
The browser suite starts the compiled API and Vite preview itself; ports 3000 and
4173 must be free. It checks actual proxy connectivity, narrow layout and keyboard
error recovery. Browser artifacts are ignored by Git.

Browser types in `src/api/schema.d.ts` derive from the reviewed API OpenAPI 3.0.0
artifact, never from Nest classes. After an authorized API contract change, run
`npm run openapi` then `npm run contract --workspace @iop/web`; review both diffs.
The health consumer validates runtime data and tolerates additional response fields.

Dependencies are pinned in the root lockfile. Preserve their distributed license
and third-party notices when packaging. Broader configuration, hooks, CI and business
access checks remain separate delivery slices.

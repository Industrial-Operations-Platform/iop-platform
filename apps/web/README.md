# Local web host

IOP-017 supplies the React/TypeScript/Vite host and API process-liveness check.
IOP-116 adds navigation between Import CSV, Executive Overview and analytical
detail. These destinations show explicit empty states; CSV submission, analytical
results, filters and business access are not connected yet.

For the operator walkthrough, see the [POC user guide](../../docs/product/user-guide-poc.md).

## Run locally

Use the root-required Node 24.21.0 and npm 10.9.2 (`nvm use` if available).
From the repository root:

```sh
npm ci
npm run build
cp config/poc.example.json config/poc.local.json
chmod 600 config/poc.local.json
IOP_CONFIG_FILE="$PWD/config/poc.local.json" npm start
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
error recovery, navigation history/reload, direct links, unknown destinations,
focus and narrow/tablet layouts. Browser artifacts are ignored by Git.

Browser types in `src/api/schema.d.ts` derive from the reviewed API OpenAPI 3.0.0
artifact, never from Nest classes. After an authorized API contract change, run
`npm run openapi` then `npm run contract --workspace @iop/web`; review both diffs.
The health consumer validates runtime data and tolerates additional response fields.

Dependencies are pinned in the root lockfile. Preserve their distributed license
and third-party notices when packaging. Broader configuration, hooks, CI and business
access checks remain separate delivery slices.

## POC navigation

Open `/#import` (the default), `/#overview` or `/#detail`. Native fragment links
preserve browser back/forward and reload without server rewrite rules or a router
dependency. Unknown fragments show a recovery link. Navigation moves keyboard
focus to the page heading; a skip link bypasses the header. Scope and filter
availability stay visible on each page. Only `/health` is requested; navigation
never grants business permission or selects a trusted actor/scope.

The IOP-097 opt-in filter preview below uses fictional metrics; no real imports
or analytical queries are connected. Production filter integration remains pending; ADR-0018 is Accepted, with runtime implementation pending. This completes
only [IOP-116 navigation](../../docs/planning/items/IOP-116-navigation.md), not the
end-to-end POC.


## Analytical state previews (IOP-120)

On overview or detail, expand **Preview UI states** to inspect loading, request
failure, absent imported coverage and no matching records. The default is honestly
not connected. All selected states are explicitly simulated; retry shows the loading
preview until another state is selected, and reset returns to not connected. No
business request, real filter change or metric is generated. Navigation resets the
preview. Both views retain coverage and metric limitations. Real endpoint state
integration remains pending under [IOP-120](../../docs/planning/items/IOP-120-ui-states.md).

## Responsive POC baseline (IOP-121)

The existing three destinations support laptop (1366×768), tablet portrait
(768×1024), tablet landscape (1024×768) and compact 640×480 CSS viewport reflow.
Navigation and actions wrap/stack, long text wraps, and navigation/state controls
have at least 44px height. Content remains available by vertical scrolling.
Playwright checks simulated states, touch activation, keyboard recovery and state
preservation across orientation changes; screenshots are in `test-results/`.
The compact viewport approximates the layout space at 200% zoom on 1280×960;
it is not a physical-device or browser-zoom certification. Real charts, tables,
filters and records still need responsive verification when delivered. See
[IOP-121](../../docs/planning/items/IOP-121-responsive-ui.md).

## Accessibility POC baseline (IOP-122)

The existing preview uses native links, buttons and a labelled state selector,
landmarks, a skip link and polite status updates. Navigation gives the page heading
visible focus; simulated retry/reset returns focus to the state selector when the
recovery button disappears, reopening the preview if collapsed. The selector has a contrasting boundary.

Playwright checks a keyboard-only overview/detail journey at 768px and 1366px,
accessible names/descriptions, live-region markup and rendered text contrast of
at least 4.5:1, with selector boundaries and heading focus at least 3:1. Existing
navigation tests cover the skip link and history. Screenshots are in `test-results/`.
These checks do not verify screen-reader speech or certify accessibility compliance.
Real analytical filters, charts, tables and runtime feedback still need verification
under [IOP-122](../../docs/planning/items/IOP-122-accessibility.md).

## Shared fictional filters (IOP-097)

On overview/detail, expand **Try shared filters with fictional data**. The separate
state preview remains disconnected. The filter preview uses five fictional rows,
one fixed demo scope and revision, and admitted labels June 26 and June 28, 2026.
Reset selects the latest fixture date (June 28); no exclusions are selected by
default. Its four rows total 8 reported occurrences and 90,140 accumulated alarm
seconds. Both dates together give 10 occurrences and 90,200 seconds across five
rows, with June 27 explicitly missing. These are UI examples, not imported metrics.

Edit inclusive From/Through and native checkboxes, then **Apply filters**. Invalid
dates or message inclusion/exclusion conflicts preserve the previous applied
results. Selections combine OR within each group and AND across groups; exclusions
remove matching messages. Unclassified and mapped “Unclassified” are distinct;
source equipment options include area context. Drafts and applied filters survive
overview/detail/import navigation within the page session, but not reload.
**Inspect Area A/B/C** narrows the current selection into detail; **Back to previous
selection** restores it. Reset clears dimensions, exclusions and drill-down history.

All displayed sums and contributing records use the same synchronous fixed fixture;
missing imports are measured before dimension filters. No business requests,
production query contracts, ranking engine, persistence or permissions are provided.
Real OIP metrics/filter interpretation stays server-owned; generated API bindings,
revision refresh, cursor reset and stale-response protection follow endpoint delivery.
Unit/RTL and Playwright checks cover the preview's behavior and compact/tablet/laptop
layout. Production isolation and import reconciliation remain independently pending.

## Fictional drill-down (IOP-096)

In the shared filter preview, use **Inspect** to follow sector → area → source
equipment → message, or inspect a group directly. The path records each narrowing;
**Back to previous selection** restores one step, and **Return before** restores
an earlier selection. Apply/Reset starts a new path; ordinary page navigation keeps
it. All applied dates, exclusions and unrelated restrictions survive drill-down.

Detail lists every matching fictional aggregate with source, import/RAW identity,
filename and physical line. These identifiers describe synthetic preview provenance;
there is no downloadable original file. Repeated rows remain separate, source
equipment includes area context, and matching zero values remain visible.

The fixed five-row preview is synchronous and unpaginated. It does not validate
production queries, cursor/revision behavior, failed reads or permissions. See the
[execution record](../../docs/planning/completed/IOP-096-fixture-drilldown-plan.md).

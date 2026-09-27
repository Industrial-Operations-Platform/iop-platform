# Web application

Run the complete local stack with `npm run local:up` from the repository root.
The [operator guide](../../docs/development/running-poc.md) owns startup, CSV import,
historical preparation and report navigation. The current interface exposes one
Administrator, an import/preparation workflow and six analytical report templates.

## Development boundaries

`src/AnalyticalApp.tsx` composes `src/features/analysis`:

- `domain` and `application` own framework-free selection values, ports and use cases.
- `adapters/http` consumes the reviewed generated API contract through a gateway.
- `adapters/react` renders the workspace and progressive collapsible filters.
- `adapters/echarts` translates report data into charts; totals remain server-owned.

Use [`src/design/components`](src/design/components/README.md) for reusable controls,
surfaces and navigation. `ReportFilters` and `Plot` are feature compositions over
these boundaries. Preserve [visual identity](../../docs/design/visual-identity.md)
and the shared `src/design/identity.ts` tokens; do not copy feature markup/styles
into new features or redesign the palette per iteration.

Executive Overview alone presents priority KPI cards. Overview/Halle have date-only
controls; finer views add relevant dimensions. Import counts belong in file review.
Pareto is deferred. The [product scope](../../docs/product/scope-poc.md) owns these rules.

## Checks and contracts

With Node 24.21.0/npm 10.9.2 and dependencies installed, from the repository root:

```sh
npm run typecheck
npm test --workspace @iop/web
npm run build --workspace @iop/web
```

For integration/browser prerequisites and actual CSV/history verification, use the
[testing guide](../../docs/development/testing-poc.md). It distinguishes real database
journeys from synthetic previews.

`src/api/schema.d.ts` derives from the reviewed API OpenAPI artifact, never Nest
classes. After an authorized contract change, run `npm run openapi`, then
`npm run contract --workspace @iop/web`, and review both diffs.
HTTP responses are checked at the gateway boundary.

## Optional native development and previews

The operator guide describes native launchers with PostgreSQL in Docker. Native
Vite development (`npm run dev:web`) and preview (`npm run preview:web`) bind to
loopback on ports 5173 and 4173 and proxy same-origin API requests to port 3000.
`dist/` is the static artifact; the container serves it through Nginx.

`?preview=1` selects the older health/fixture application (`App.tsx`), with `#import`,
`#overview` and `#detail` routes. Its fictional filters, states and drill-down are
developer examples with no real imports or analytical requests. They retain test
coverage; their historical walkthroughs belong in completed IOP-096/097/116/120–122
plans, not the current operator flow. The default page uses the connected application.

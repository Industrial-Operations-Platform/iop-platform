# Web application

Run the complete local stack with `npm run local:up` from the repository root.
The [operator guide](../../docs/development/running-poc.md) owns startup, CSV import,
historical preparation and report navigation. The interface provides scoped profiles,
operational workspaces, an import/preparation workflow and six analytical report templates.

## Development boundaries

`src/host/AnalyticalApp.tsx` composes `src/features/analysis`:

- `domain` and `application` own framework-free selection values, ports and use cases.
- `adapters/http` consumes the reviewed generated API contract through a gateway.
- `adapters/react` renders the workspace and progressive collapsible filters.
- `adapters/echarts` translates report data into charts; totals remain server-owned.

Use [`src/design/components`](src/design/components/README.md) for reusable controls,
surfaces and navigation. `ReportFilters` and `Plot` are feature compositions over
these boundaries. Preserve [visual identity](../../docs/design/visual-identity.md)
and the shared `src/design/identity.ts` tokens; do not copy feature markup/styles
into new features or redesign the palette per iteration.

Executive Overview alone presents priority KPI cards. Overview uses one month and Halle uses imported-month selection; finer views add relevant dimensions. Import counts belong in file review.
Selected-month source-group frequency/duration Pareto is delivered under IOP-163;
broader canonical asset coverage remains with IOP-093. The [product scope](../../docs/product/scope-poc.md) owns these rules.

## Checks and contracts

With Node 24.21.0/npm 10.9.2 and dependencies installed, from the repository root:

```sh
npm run typecheck
npm test --workspace @iop/web
npm run build --workspace @iop/web
```

For integration/browser prerequisites and actual CSV/history verification, use the
[testing guide](../../docs/development/testing-poc.md). It distinguishes real database
journeys from browser tests with intercepted HTTP responses.

`src/contracts/schema.d.ts` derives from the reviewed API OpenAPI artifact, never Nest
classes. After an authorized contract change, run `npm run openapi`, then
`npm run contract --workspace @iop/web`, and review both diffs.
Only HTTP adapters consume these generated bindings; application ports remain independent.

## Optional native development and build output

The operator guide describes native launchers with PostgreSQL in Docker. Native
Vite development (`npm run dev:web`) and preview (`npm run preview:web`) bind to
loopback on ports 5173 and 4173 and proxy same-origin API requests to port 3000.
`dist/` is the static artifact; the container serves it through Nginx.

The retired fictional preview is removed. Every page load uses the connected
workspace, including URLs retaining `?preview=1`. Only `src/main.tsx` remains at
the source root; it mounts the host composition and shared `design/base.css`
resets. Generated transport bindings live in `src/contracts`; HTTP parsing stays at the
adapter boundary. `src/host/WorkspaceApp.tsx` composes the independent Analysis,
Access, Shift Handover, Workforce, Maintenance and Assets features.
Vite empties `dist/` before building, so only the current HTML and bundled assets
remain. Tests and fixtures are not production build inputs.

## Workforce, localization and identity

The signed-out entry is a minimal interactive presentation home focused on
Data Analysis, Maintenance and Workforce. Sign in opens the existing individual
account login or configured native demo selector in a shared dialog; About contains
the full module/workflow presentation. Restored sessions open their assigned
workspace directly, and initial-password replacement keeps its dedicated screen.
The foreground uses six unnamed capability glyphs that illuminate in groups when
a main module is selected, around the refreshed shared platform mark. Layered
SVG depth and pointer parallax are decorative, support reduced motion and
can be paused. The host composes Access without new authentication endpoints or
dependencies. Original identity tokens and English/German resources remain shared.

Workforce provides technician daily visibility, leader weekly planning and
administrator schedule import/configuration. The shared English/German dictionary
selects the browser language automatically and persists explicit overrides.
The owner-selected Unified Record SVG mark in `public/iop-mark.svg` is reused by
the introduction, shell and favicon and copied into the web image. See the
[Workforce guide](../../docs/development/workforce.md).
All branding consumers use the `unified-record` URL revision; Docker revalidates
the icon and entry HTML so browser caches receive the selected mark after rebuilds.

## Maintenance and Digital Asset Record — IOP-194

The host composes separate Maintenance and Assets browser applications with HTTP
and React adapters. Maintenance provides the filtered work board/list, personal
work, forms, revision history and administrator priorities. Assets provides the
registry, validation/retirement, explicit source aliases and bounded digital
record. Source actions open Maintenance, Handover or the exact contributing
analytical import line through its existing gateway. New HTTP adapters consume
generated transport bindings; pure ports/models remain independent. Shared
components/tokens and English/German localization preserve platform identity.
See [operation and validation](../../docs/development/maintenance-assets.md).

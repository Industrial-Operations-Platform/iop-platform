# IOP-161 — Execution plan

Status: Completed. Authorized by the owner's report of clipped trend controls.
Branch: `fix/IOP-161-trend-time-controls`, from `develop`.
Scope: [item](../items/IOP-161-trend-time-controls.md).

## Changes and validation

- Adjust the trend layout in the existing ECharts `charts.ts` adapter: reserve
  bottom space, inset/enlarge the slider and position the legend explicitly.
- Run existing chart tests and the web build. Visually inspect real ECharts SVG
  rendering at desktop/mobile widths and exercise resizing/panning in Chromium.
- Check documentation links and diff whitespace, close the item/backlog/plan,
  and commit locally. No new architectural pattern or dependency is needed.

## Evidence and closure

- Existing `analysis-charts` tests: 6 passed; `npm run build --workspace @iop/web`
  passed on Node 24.21.0, including TypeScript checking.
- Chromium against the built workspace with intercepted report fixtures at 1440px
  and 375px: both slider handles remain within the SVG bounds; dragging the right
  handle changes the visible time window and dragging its pan bar shifts that
  window. Both checks passed without horizontal page overflow.
- Visually reviewed card screenshots after resizing and panning:
  `/private/tmp/iop-161-chart-1440.png` and `/private/tmp/iop-161-chart-375.png`.
  Date labels, top legend and the inset 24px slider remain separate and visible.
  Temporary verification harness: `/private/tmp/iop-161-browser.cjs`.
- Relative documentation links and `git diff --check` passed. Item/backlog closed
  and execution plan moved to completed. No backend or running stack changes.

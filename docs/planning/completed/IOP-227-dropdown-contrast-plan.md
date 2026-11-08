# IOP-227 — Native dropdown contrast plan

Completed. Authorized by the owner's screenshot-based request on 2026-11-08.
Branch: `fix/IOP-227-dropdown-contrast`, created from `develop` with a clean tree.
Scope: [IOP-227](../items/IOP-227-dropdown-contrast.md).

## Changes and steps

1. Audit native selects and the working month selector. All native selects render
   through `design/components/Controls.tsx`; compact/account variants use transparent
   closed controls, leaving native options without an opaque semantic background.
2. In `apps/web/src/design/components/components.css`, give native options/groups
   shared surface/ink tokens, with muted disabled options. Preserve native behavior.
   Ownership stays within the shared React/CSS presentation adapter; no application
   use case or module boundary changes are required.
3. Extend `apps/web/e2e/appearance.spec.ts` and `month-comparison.spec.ts` for actual menu
   colors, appearance switching and selection in compact/account/month controls.
   Update `docs/design/visual-identity.md` to state the shared popup-color contract.
4. Record checks, close item/backlog and move this plan to completed; commit locally.

## Validation and evidence

- Native-select audit: `rg -n '<select' apps/web/src` found only the shared
  `Controls.tsx` implementation, covering every feature and account selector.
- Before the fix, the new browser assertion failed on account options with
  `rgba(0, 0, 0, 0)` backgrounds and inherited muted text.
- `npm.cmd run build --workspace @iop/web`: passed TypeScript, the four shared
  design/architecture guards and the production bundle (existing chunk-size advisory).
- `npm.cmd test --workspace @iop/web`: 49 suites / 319 tests passed.
- `npm.cmd run test:e2e --workspace @iop/web -- appearance.spec.ts month-comparison.spec.ts`:
  9 scenarios passed. Checked semantic option colors across workspace/account
  controls, month choices in both palettes, native location selection, account
  Escape/focus return, saved preferences, System changes and no horizontal overflow.
  Widths: 1440, 1024, 390 and 375 pixels. Windows test teardown needed process-cleanup
  permissions; the final run completed normally.
- Visually reviewed generated account, Maintenance, Handover and analysis screenshots
  in `apps/web/test-results/IOP-202-*.png`, including desktop and narrow dark layouts.
  Option colors were verified in Chromium's computed styles; OS popup chrome and
  selection highlights remain native and were not captured in these screenshots.
- Documentation relative links, IOP-227 identity/status and `git diff --check`: passed.

## Closure

All acceptance criteria met. Item/backlog synchronized and this plan moved to
completed. No API/domain changes, unrelated edits or translation-only changes.
Implementation commit: `d9ab839`.

## Owner-approved publication — 2026-11-08

The owner approved merging `fix/IOP-227-dropdown-contrast` into local `develop`
and pushing both branches to `origin`. After fetching, local `develop` and
`origin/develop` matched, and the working tree was clean.

Publication steps: commit this authorization record on the story branch, merge
the story into `develop`, atomically push both branches to `origin`, and verify
that the local, tracking and remote branch tips match. Preserve the story branch;
no stage/master promotion or manual deployment is included.

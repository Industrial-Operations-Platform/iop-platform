# IOP-220 — Record title alignment

Status: Completed. Authorized by the owner's three-screenshot request on 2026-10-20.
Story branch: `fix/IOP-220-record-title-alignment`, created from `develop` at `efddf8f`
in `/private/tmp/iop-220-record-title-alignment` to preserve unrelated IOP-219 edits.
Scope: [permanent item](../items/IOP-220-record-title-alignment.md).

## Changes and steps

1. Register the request in the item and backlog before implementation.
2. Adjust presentation styles in Operational Overview, formal Shift Handover and
   Improvement Tracking so blue record titles start at the padded content edge and
   supporting text is inset by 8px. Remove inherited inline button padding/borders
   from the affected title buttons. Scope formal-card changes with a collection
   modifier to preserve other Handover card variants.
3. Update `docs/design/visual-identity.md` with the owner-requested hierarchy.
4. Validate, record evidence, complete the item/backlog and archive this plan.

Expected implementation files:
- `apps/web/src/features/operational-overview/adapters/react/overview.css`
- `apps/web/src/features/shift-handover/adapters/react/{FormalHandoverWorkspace.tsx,handover.css}`
- `apps/web/src/features/improvement-tracking/adapters/react/improvement.css`

Ownership remains in the existing React/CSS adapters under Accepted ADR-0032.
No domain, API, permission, schema or architectural boundary changes are needed.
Read related IOP-179, IOP-186 and IOP-214 contexts; all are already English.

## Validation and evidence

- `npm run build --workspace @iop/web`: passed with the existing chunk-size advisory;
  includes TypeScript and all 4 design-boundary checks.
- `npm test --workspace @iop/web -- --testPathPatterns='(formal-handover|improvement|operational-overview|architecture|identity|design-boundaries)'`:
  4 suites / 28 tests passed.
- `npm test --workspace @iop/web -- --testPathPatterns='(design-components|appearance)'`:
  2 suites / 9 tests passed.
- `npm test --workspace @iop/api -- --testPathPatterns=hexagonal-boundaries`:
  26 checks passed, including browser domain/application boundaries.
- Existing `desktop-consistency.spec.ts`: 6 browser regressions passed against the
  production preview with browser-only API fixtures.
- Temporary browser checks: 4 scenarios passed at 1440px and 390px in both light and
  dark appearances. DOM text ranges confirmed an 8px title/supporting-text offset
  in all three collections; badge surfaces retain the same inset. Verified long
  title wrapping, 44px targets, visible keyboard focus, Enter navigation and page
  containment, with no browser errors. Inspected all three desktop-light and
  narrow-dark screenshots; 12 captures remain under ignored `apps/web/test-results/`.
  The temporary runner/configuration were removed after validation.
- `git diff --check` and changed-document local links/status review passed.

Checks used Node 24.21.0 and the existing dependency installation through local
worktree symlinks. Browser checks used read-only synthetic fixtures; no publication
or deployment was performed.

## Closure

All acceptance criteria are complete. Item/backlog statuses and the visual identity
are synchronized; this plan is archived under `completed/`. The validated increment
is committed locally on the recorded story branch. Remote publication awaits the
owner's explicit approval under ADR-0008. IOP-219 work was isolated in the original
worktree throughout this increment.

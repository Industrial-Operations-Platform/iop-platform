# IOP-175 — Consistent handover detail heading

Status: Completed and published; local Docker activated. Owner-authorized screenshot feedback, 2026-09-29.
Branch: `fix/IOP-175-handover-detail-heading`, created from clean `develop`.
Scope: [item](../items/IOP-175-handover-detail-heading.md).

## Changes and steps

1. Reuse a feature-owned heading in `HandoverWorkspace.tsx` and `EntryDetail.tsx`
   through `HandoverHeading.tsx`. Allow React content in the shared `PageHeading`
   title (`design/components/Layout.tsx`) for the breadcrumb title.
2. Replace the small detail action/reload icon with the consistent heading and
   breadcrumb; remove the workspace Refresh action. Scope styles to `handover.css`.
   Preserve existing application calls and automatic refresh after mutations.
3. Update `e2e/handover-navigation.spec.ts` to verify breadcrumb keyboard navigation,
   department retention, heading consistency, absent refresh controls and mobile
   overflow, retaining existing navigation/form/matrix checks.
4. Synchronize navigation and conflict-recovery instructions in
   `docs/development/shift-handover.md`, this plan, item and backlog; commit locally.

Ownership remains in the Shift Handover React adapter. Existing Accepted
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md) and
[ADR-0036](../../architecture/adr/ADR-0036-shift-handover.md) apply unchanged.
No new architectural pattern or story translation is required.

## Validation

- Web build/typecheck and web unit/architecture tests.
- Focused handover browser tests at 1440px and 375px; inspect screenshots.
- Review diff, documentation links, IDs and matching statuses.

## Evidence and closure

- Web build/typecheck passed with Node 24.21.0; existing large-bundle warning remains.
- All 73 web tests in 15 suites passed, including architecture checks.
- Both handover browser scenarios passed (1440px and 375px), including equal
  heading font size/weight/color, breadcrumb semantics, keyboard return, department
  retention, sidebar navigation, absent refresh controls and no horizontal overflow.
- Visually inspected `/tmp/iop175-detail-1440.png` and
  `/tmp/iop175-detail-375.png`; the heading, description and report cards fit both.
- Automatic loading after changes retains the existing `setAttempt`/`onChanged`
  calls; only manual refresh controls were removed.
- Logs: `/tmp/iop175-build.log`, `/tmp/iop175-web-tests.log`,
  `/tmp/iop175-browser.log`. Initial Node 20 failures were resolved by using the
  existing Node 24 runtime at `/tmp/iop-147-bin`. Browser servers required execution
  outside the sandbox to bind local ports.
- Documentation links/statuses and `git diff --check` passed. No API/domain changes
  or real-data mutations. [Publication and local Docker activation](IOP-177-platform-visual-identity-plan.md)
  are complete under the owner-approved IOP-177 integration.

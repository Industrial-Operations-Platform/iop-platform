# IOP-179 — Shared entry-title hierarchy

Status: Completed locally. Owner-authorized visual refinement, 2026-09-29.
Branch: `fix/IOP-179-handover-entry-title-style`, from clean `develop` at `3a20e64`.
Scope: [item](../items/IOP-179-handover-entry-title-style.md).

1. Add a scoped title rule in `handover.css` for `EntrySummaryCards`, using existing
   `--iop-link` and `--iop-labelWeight` tokens. All consumers inherit the change;
   no markup, selection, domain or application changes are required.
2. Synchronize the title roles in `docs/design/visual-identity.md` and the shared
   card description in `docs/development/shift-handover.md`.
3. Run the web build, existing web identity/component tests and desktop/mobile
   handover browser journey. Inspect Journal/Meeting screenshots; no new tests
   for this small CSS-only refinement.
4. Check links, statuses and diff; archive this plan and commit the validated change.
   Request publication and local Docker activation for the concrete result.

## Evidence

- One scoped rule styles every shared summary-card title with link ink (`#076bb5`)
  and weight 600. Section headings retain navy ink (`#172b43`) and weight 700;
  entry/section title sizes remain 14px/16px respectively. Existing canonical tokens are reused.
- Confirmed all consumers: Journal category previews, Meeting preparation/Daily
  overview canvas, and meeting pending entries. No duplicated per-view CSS.
- Web build/typecheck and all 74 web tests passed. Both existing browser journeys
  passed at 1440px/375px, including shared card equality and contextual navigation.
- Inspected `/tmp/iop179-journal-1440.png` and `/tmp/iop179-meeting-375.png`:
  blue semibold entry titles contrast with bold navy section headings while the
  card borders, department labels and layout are preserved.
- Logs: `/tmp/iop179-build.log`, `/tmp/iop179-web-tests.log`,
  `/tmp/iop179-browser.log`. Existing bundle-size warning remains.
- Documentation links/statuses and diff whitespace verified. No new tests, API or
  business logic changes. Publication and Docker activation remain pending approval.

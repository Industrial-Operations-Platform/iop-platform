# IOP-174 execution plan

Status: Completed locally. Branch: `fix/IOP-174-handover-navigation-layout`, from develop
(`51eed07`). Scope: [item](../items/IOP-174-handover-navigation-layout.md).

1. Compose the identifier and condition in the same shared FieldRow inside the
   feature picker; update component-facing copy. Files: EntryForm, EquipmentPicker.
2. Route sidebar and detail home actions through the workspace shell's module-home
   reset, preserving the selected department. Files: WorkspaceApp, HandoverWorkspace,
   EntryDetail. Keep a native accessible button styled as text for in-app navigation.
3. Scope matrix widths, wrapping and alignment; style the detail home/reload actions.
   Files: Entries and handover.css. No shared global style changes.
4. Build/test web and add a browser regression for the broken navigation and the
   complete populated form/matrix journey at desktop/mobile widths. Inspect screenshots.
5. Record evidence, check docs/diff/secrets, archive and commit locally. Publish and
   rebuild Docker only after approval for this new increment. IOP-172 is unchanged.

## Evidence

The picker composes the identifier and condition through a shared FieldRow with
lookup feedback below it. Its visible copy describes component identifiers.
The host remounts the handover workspace on explicit module-home navigation,
clearing detail/temporary filters while preserving its department selection.
The detail module name uses the shared text-button variant; reload uses an SVG
icon with an accessible name, tooltip and retained 44 px target. Matrix styles
are scoped, with fixed proportions, single-line dates and centered date/status
cells; narrow screens scroll within the existing table viewport.

- Web build passed; all 73 web tests passed, including boundary checks.
- New browser regression passed at 1440 px and 375 px: both home navigation paths,
  retained department, keyboard activation, actual reload request, populated matrix,
  aligned component/condition before and after pagination, and no page overflow.
- Screenshots visually inspected: `/tmp/iop174-form-{1440,375}.png`,
  `/tmp/iop174-detail-1440.png`, `/tmp/iop174-matrix-{1440,375}.png` and
  `/tmp/iop174-matrix-status-375.png`.
- Logs: `/tmp/iop174-build.log`, `/tmp/iop174-web-tests.log` and
  `/tmp/iop174-browser.log`. Documentation links, diff whitespace and staged secret
  checks passed. The operator guide was synchronized with the new labels/navigation.

No application/domain or persistence changes, live-data mutations, service rebuild,
new permissions or architectural patterns. The approved IOP-173 story and develop
were verified on origin at `51eed07`. This UI increment remains local for review.

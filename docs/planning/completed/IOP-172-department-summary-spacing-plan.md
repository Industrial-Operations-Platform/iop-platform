# IOP-172 execution plan

Status: Completed locally. Branch: `fix/IOP-172-department-summary-spacing`, from develop
(`3346955`). Scope: [item](../items/IOP-172-department-summary-spacing.md).

1. Add a scoped class to HandoverHighlights and adjust its panel/metric spacing in
   the existing handover stylesheet; preserve shared tokens outside this summary.
2. Build the web app and use existing Start browser scenarios to inspect the selected
   department at desktop/mobile sizes. No new tests are needed for this CSS change.
3. Record evidence, verify documentation links/whitespace, archive and commit locally.
   Publication and Docker update require approval for this new increment.

Expected code: `HandoverHighlights.tsx` and `handover.css`. No API or domain changes.

Validation: web build passed; both existing Start browser scenarios passed at
1440 px and 375 px, including department selection and overflow checks. Visual
inspection confirmed the spacing at both widths. Logs: `/tmp/iop172-build.log`
and `/tmp/iop172-browser.log`. `git diff --check` passed.

The summary uses a scoped class, 24 px metric grid margins/gap and 20 px panel
margins. Shared tokens elsewhere are unchanged. The owner subsequently approved
[publication and runtime activation](IOP-174-integrated-publication-plan.md), now complete.

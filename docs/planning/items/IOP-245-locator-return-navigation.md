# IOP-245 — Return from Locator scenes to groups and overview

Status: Completed locally; remote publication approved. Authorized by the owner's 2026-11-26 report that entering a
scene hides the return path and clicking Asset Locator in the sidebar does not
restore the overview.

## Scope and acceptance

- [x] Keep a visible return action and navigable heading above the scene viewer.
  Returning to the previous overview preserves its source group and scene search;
  returning from an asset-search placement preserves that search.
- [x] Provide an explicit way to show all scenes. The module heading and sidebar
  Asset Locator action restore the unfiltered Plant overview, including when a
  scene request is still pending or the current view came from an exact asset.
- [x] Preserve camera continuity, role restrictions, private-reference behavior
  and explicit draft-discard wording. Verify meaningful regressions and actual
  desktop/mobile English/German rendering using existing shared controls.

Reuse [IOP-211](IOP-211-locator-models-and-access.md), Accepted
[ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md) and
the [visual identity](../../design/visual-identity.md). This is presentation
navigation within the existing Locator adapter; no API, data model, permission,
browser-history architecture or deployment changes are included.

[Execution evidence](../completed/IOP-245-locator-return-navigation-plan.md).
On 2026-11-26 the owner approved merging `fix/IOP-245-locator-return-navigation`
into develop and pushing both branches to origin.
[Publication execution](../active/IOP-245-publication-plan.md).
Service activation remains outside this increment.

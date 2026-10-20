# IOP-219 — Prepared model activation

Planned; requires explicit local activation approval. Retained story branch:
`fix/IOP-219-locator-reference-curves`. The code is integrated into local develop.
[Permanent scope](../items/IOP-219-locator-reference-curves.md) and
[integration evidence](../completed/IOP-219-locator-integration-plan.md).

## Remaining work

Use the validated compatible API/web build when local service activation is
authorized. Preserve the running installation's data, source images and grants.
The three ignored `.local-platform/locator-inspection/IOP-219-scene-revisions.json`
payloads replace ten legacy components, add one square-corner piece and preserve
422 other components in the affected scenes plus all 69 other scenes.

Re-read the current scoped scenes and compare exact before values/revisions before
each save. Stop on unrelated edits; never overwrite or bypass the optimistic
revision guard. Apply only through the current Administrator Locator application
boundary, retaining immutable scene and audit revisions. No direct SQL or automatic
registry identity assignment is needed.

## Validation and closure

Verify persisted component counts/identities, before/after revision history and
actual source-aligned curves in desktop/mobile viewing and editing. Confirm reader
image denial and geometry-only viewing on the activated build. Record actual local
results, complete the parent acceptance and move this plan to completed/. Keep
publication authorization independent from activation and commit any new repository
evidence on the story branch before its authorized develop integration.

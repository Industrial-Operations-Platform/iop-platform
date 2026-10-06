# IOP-196 — Personal operational workflows execution plan

Status: In progress. Authorized by the owner's 2026-10-06 request.
Branch: `feature/IOP-196-personal-operational-workflows`, created from `develop`.
Scope: [permanent item](../items/IOP-196-personal-operational-workflows.md).

## Changes and steps

1. Workforce owns pure calendar/statistics derivation from complete bounded boards;
   Workforce exposes an authorized personal-summary endpoint; host composes personal
   Start cards (including Administrator) with independent Maintenance/Handover reads.
   Update `features/workforce`, `host/WorkspaceApp`, Start presentation and localization.
2. Handover owns attention exclusion and revision-based personal closure counts,
   coordinator category rules, bounded image/mention validation and revision-backed
   notification delivery. Update its API domain/application/PostgreSQL adapter,
   host catalog/contracts and browser models/forms/details/notifications. Keep the
   local Handover demo adapter compatible by selecting a coordinator for restricted
   categories when preparing new manifests; never rewrite existing manifests.
3. Correct `HandoverHighlights` department defaults/other-department browsing and
   `HandoverWorkspace` daily date placement/current pending selection.
4. Maintenance browser application and React adapters add focused status actions
   using the existing save/revision contract and reusable `RepairScope` review.
5. Regenerate OpenAPI/browser bindings; update product/operator/ADR-0036 refinements
   and visual contract where the requested behavior supersedes earlier descriptions.

No schema migration or new architectural pattern is expected: additional bounded
content stays inside existing durable snapshots/revisions. Historical content lacking
new optional fields remains readable. Inspected dependency stories are already in
English; no translation-only edits are required.

## Validation and evidence

Run API `npm test`, web tests/design/contract guards, typecheck and relevant real
PostgreSQL tests. Cover calendar/month boundaries, duplicate shift/weekend handling,
assignment fallback, non-overlapping attention counts, Information authorization,
image limits, scoped mention IDs, update notifications and Maintenance stale/unreviewed
completion. Inspect real desktop/narrow browser rendering and navigation. Record
actual results and material limits before closure.

## Closure

Synchronize item/backlog and affected guides, move the completed plan, create small
English local commits and report hashes/status. Ask explicitly before merging the
story into develop and pushing both branches to origin, under ADR-0008.

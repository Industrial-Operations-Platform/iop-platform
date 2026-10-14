# IOP-204 — Formal Handover execution plan

Status: Completed local software increment. Owner authorization: [IOP-203](../items/IOP-203-platform-completion.md), 2026-10-14. Story branch: `feature/IOP-204-formal-handover`, based on `develop` at `24b6269`. Scope: [IOP-204](../items/IOP-204-formal-handover.md); decisions: [ADR-0037](../../architecture/adr/ADR-0037-operational-completion.md).

## Changes and steps

1. Add bounded Workforce-owned dated shift projections and receiving-owned Handover ports.
2. Implement draft/open/closed formal records, frozen closure evidence, receiving acknowledgements, previous-shift context and atomic immutable revisions in Handover. Add migration `20261014010000-formal-handover.sql` with explicit scope, forced RLS and narrow grants.
3. Add optional canonical asset references to journal entries through Assets-owned lookup ports, preserving original equipment evidence and historical links.
4. Add formal controller/contracts and reusable browser workspace, using existing identity/components. Parent composition owns shared runtime, controller registration, RBAC catalog/backfill, host navigation and generated contracts.
5. Verify meaningful application, transport, storage and browser behaviors; update item/evidence and commit coherent local increments.

Files: API `modules/workforce/{domain,adapters/postgres}/shift-reference.ts`, `modules/shift-handover/{domain,application,adapters/postgres}/` formal-record files and existing journal link seams; `host/formal-handover-{composition,controller,contracts}.ts`; web `features/shift-handover/` formal domain/application/HTTP/React files; owning tests and migration.

## Validation and evidence

Use Node 24.21.0. Validate typed build and inward boundaries; draft/closure/ack transitions, stale writes and idempotency; exact manager profile/grant denial; actual-shift and previous-shift selection; canonical missing/foreign/retired references; frozen history and pending issues; scoped database RLS/grants and atomic revision rollback; responsive shared-component UI. Commands and actual results will be recorded at completion. Full root integration checks run in the parent workspace.

## Remaining inputs

No plant coordinates or corporate-provider connectivity are needed. Unplanned Workforce dates stay explicitly unavailable. The parent owns shared documentation/backlog synchronization and runtime integration.

## Implementation evidence — 2026-10-14

- API and web workspace typechecks passed.
- Focused API suite: 5 suites, 67 tests passed, including real Nest HTTP tests, original journal regressions and inward boundary guards.
- Complete web suite: 31 suites, 162 tests passed with the temporary shared German dictionary spread; formal create/review/publish/close/receive journey and denied/missing-plan states included.
- Disposable PostgreSQL formal suite: 8 tests passed with parent-owned current permission catalog/migration and a temporary narrow provisioning allowlist. Verified forced RLS, cross-site/current-grant/current-profile denials, concurrent/idempotent writes, FK rollback, retained close/ack evidence, alias-free canonical history, overflow-safe closure and exact 20+1 pagination. Temporary shared-file copies were restored before committing.
- Synthetic Chromium fixture inspected at 1440px and 390px in light/dark appearance: no page errors or horizontal overflow; frozen evidence opens retained revisions independently of live journal navigation. Temporary fixture removed; PNG evidence retained in `/private/tmp/iop-204-formal-*.png`.
- Full API suite was attempted before compilation/contract regeneration: 30 suites passed; compiled startup and OpenAPI artifact tests failed on absent build/generated artifacts. Parent-owned host registration and regeneration remain required before the root full suite.

## Operational bounds and integration handoff

Formal records require `handover.records.manage`, current advanced profile and current Handover read access. Workforce evidence uses exact zone assignment intervals; empty planning stays explicit. A record retains at most 100 selected report snapshots and 100 pending snapshots; closure rejects larger pending scopes before committing. Images remain in original journal revisions; retained evidence stores content and exact entry/revision references without duplicating bitmap attachments. History pages contain 25 revisions and record pages 20 records; previous-shift lookup covers 92 days and uses UTC start order.

Localized formal/canonical controls and statuses passed the German dictionary guard and a German UI test, retaining customer titles. Shared German catalog integration is parent-owned. The [operator guide](../../development/formal-handover.md) records the delivered lifecycle and bounds.

The parent integrates `composeFormalHandover`, registers `FormalHandoverController`, injects authorized canonical Assets ports, applies its permission/provisioning catalog, regenerates OpenAPI/browser bindings and exposes `FormalHandoverWorkspace`. Shared integration is now validated; no plant coordinates or provider credentials block this slice.

## Actual host integration evidence — 2026-10-14

IOP-203 registers the formal controller/factory, canonical Assets ports, advanced
current-profile permission bundles, narrow database provisioning and browser
workspace/German resources. Generated OpenAPI/browser bindings build. The first
integrated full suite passed API 472, web 173 and database configuration 77 tests;
the formal disposable PostgreSQL lifecycle suite passed 8 checks independently.

Isolated Playwright reviewed the actual running local installation at 1440px and
390px: scoped formal context returned 200, composed controls and explicit department
selection were present, no page errors or horizontal overflow occurred. The
source-owned query found 10 planned shifts across 5 configured departments for the
selected day. Private screenshots were inspected. This read-only review did not
modify existing records or change any account password; the full synthetic
create/publish/close/receive workflow remains covered by the prior web/PG evidence.

Additional actual unsaved-form review selected two real planned shifts and six
relevant reports, accepted a temporary draft and canceled without saving. The
390px creation form initially exposed overflow from long actual shift labels.
The scoped parent fix constrains the field grid/controls and wraps report labels.
Rechecking the actual rebuilt form confirms no horizontal overflow or page errors;
the temporary draft and integration metadata form were canceled without saving.

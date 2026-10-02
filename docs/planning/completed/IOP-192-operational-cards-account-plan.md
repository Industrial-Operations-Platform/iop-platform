# IOP-192 — Execution plan

Status: Completed

Scope: [item](../items/IOP-192-operational-cards-account.md).
Branch: `feature/IOP-192-operational-cards-account`, from clean `develop` at
`1cc480a`. Existing IOP-191 implementation is published and is the baseline.

## Steps and ownership

1. Refine `EntrySummaryCards`, collection layout and `Entries` matrix composition
   in the Handover React adapter. Share responsive three/two/one-column behavior
   between Start and My entries; retain full content access and original semantics.
2. Extend shared presentation controls for compact anchored disclosures and search
   icon actions; compose account behavior in the host/access adapters. Preserve
   native keyboard interaction, Escape/outside dismissal and focus restoration.
   Update the source SVG mark/favicon and English/German resources.
3. Inspect the existing scoped Handover read port and agree the notification scope.
   Reuse accepted query/application/HTTP/React patterns, with explicit unread state
   and no external messages. Record concrete fields/files/validation before changing
   the notification data flow. New architectural patterns require an ADR first.
4. Update the canonical visual contract and component guide; enforce shared action
   reuse. Extend meaningful nearby unit/browser cases for layout, dropdown and
   notification behavior. Run web tests/build, API boundary tests and relevant API
   tests if the read contract changes; regenerate bindings if needed.
5. Inspect actual desktop/tablet/mobile screenshots, verify docs/links/status and
   secret hygiene, archive this plan and commit coherent local changes. Publication
   of this new story requires owner approval; do not infer it from IOP-191's push.

## Validation

Notification implementation scope (default communicated after the optional question):
new Handover publications by other actors, including Start's operational reports.
Extend the existing `Selection`/query DTO with an optional ISO `notificationsAfter`
predicate. The PostgreSQL read adapter excludes the current actor, orders by creation
instant (including backdated entries) and retains existing totals, 20-row pagination,
authorization and exact site predicates. No new endpoint, table, permission, worker
or cross-module event infrastructure is introduced; this reuses ADR-0036's read port.
Regenerate OpenAPI/browser contracts and test the query against isolated PostgreSQL.

The Handover application layer owns notification/checkpoint transitions through a
small storage port. Its browser adapter stores only a last-read creation timestamp,
keyed by organization/site/user. First use establishes a baseline; later polling
(30 seconds while visible, plus focus/manual reload) reads newer entries. Explicit
Mark all as read advances only to the newest successfully displayed publication.
The bell opens entry details through host composition. This is in-app polling with
browser-local read state, not cross-device delivery, follow-up alerts or external
messages. Tests cover own-author exclusion, backdated publications, pagination,
first-use baseline, failure recovery and account/site checkpoint isolation.

Use Node 24.21.0 and isolated listeners if needed. Check three columns at available
desktop widths, two on tablet, one on mobile; no page overflow. Check icon labels,
matrix alignment/filter retention, account menu keyboard/focus behavior, localization,
notification actor/scope separation and error handling. No operator data mutation is
needed for browser fixture tests. Preserve private config and existing containers.

## Evidence and closure

Validated with Node 24.21.0 on 2026-10-02:

- Web build passed TypeScript, Vite and all three mandatory design checks. The
  pre-existing bundle-size advisory remains. API and database builds passed.
- API unit suite: 22 suites / 345 tests passed. Web unit suite: 22 suites / 98 tests
  passed, including boundary guards, localization, notification baseline/concurrent
  reads, failed-read recovery and browser checkpoint isolation/storage denial.
- `npm run contract:check --workspace @iop/web`: generated contract matches.
- Playwright: nine existing administration, Workforce and Handover scenarios passed;
  three new operational-shell scenarios passed at 1440, 1024 and 375px. Verified
  three/two/one card columns, no page overflow, account keyboard/outside dismissal,
  profile editing, notification navigation/acknowledgement/reload, site-time display,
  and shared plus/search launchers.
- Isolated PostgreSQL Handover suite: all 14 tests passed, including the real HTTP/
  browser bell journey, other-author exclusion, deleted-entry exclusion, exact site
  authorization, backdated publication ordering and 20-row cursor pagination.
  Test fixture namespaces and search markers isolate these cases from prior entries.
- Inspected `/tmp/iop-192-{start,mine,account,notifications,matrix}-1440.png` and
  mobile account/notification screenshots. Entries retain clear metadata and full
  detail access; matrix alignments/filters remain; popovers do not blur the page.
- `git diff --check`, relative documentation links and bounded secret hygiene passed.
  Temporary browser listeners and the disposable database did not alter the operator
  stack, private configuration or its data.

Shared components and canonical visual rules are updated; the static design guard
rejects plain-text New entry/Search history launchers. No new architectural pattern,
migration, external delivery or cross-device read synchronization is introduced.
Notifications cover new Handover publications only, as documented above. Existing
English dependency contexts required no translation.

Item and backlog are complete; this plan is archived. Changes are ready for a local
story commit and owner review. Publication of this story and operator activation
remain separate from the already completed IOP-191 publication.

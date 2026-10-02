# IOP-193 — Execution plan

Status: Completed

Scope: [item](../items/IOP-193-compact-account-pending-matrix.md).
Branch: `feature/IOP-193-compact-account-pending-matrix`, from published develop
`2004835`. IOP-192 publication approval was confirmed using the prior exact request
and ADR-0008 after automatic review initially rejected it; retry was approved.

1. Refine AccountControl, ProfileViewControl, LanguageControl and shared styles.
   Preserve native-mode preview behavior, 44px controls, focus and authorization.
2. Add optional `departmentMatrix` to the existing Handover Selection/DTO. The API
   application derives the current site day, time zone and category IDs from trusted
   catalog/clock, passing an optional matrix scope to its existing transaction read
   port. PostgreSQL applies category/state/publication-day predicates before totals
   and pagination. No schema, endpoint, permission or architecture pattern changes.
3. Browser application composes the operational matrix selection; React preserves
   it through pagination and ordinary column filters. Explicit history search and
   equipment/history deep links bypass it; Clear search restores the default.
   Daily views, Start collections and notifications keep their existing queries.
4. Regenerate contracts; test validation, application scope, real PostgreSQL history/
   category/state/time-zone/pagination behavior and browser menu/search transitions.
   Inspect desktop/mobile screenshots. Run relevant web/API tests, builds, design
   guards, contract consistency and secret hygiene under Node 24.21.0.
5. Update canonical product/development/style docs, verify links, archive the plan
   with evidence and commit locally. Preserve operator data/containers. New-story
   publication awaits review; IOP-192 approval is already fulfilled.

Dependencies read are English and require no translation. Reference images inform
presentation only. Scope remains within accepted ADR-0032/0036 boundaries.

## Validation and outcome

Node 24.21.0, 2026-10-02:

- API build and full unit suite passed: 22 suites / 351 tests. New cases validate
  the boolean mode and trusted catalog/clock derivation, including a site date that
  differs from UTC and custom category IDs.
- Web build passed TypeScript, Vite and all three mandatory design guards. Existing
  large-bundle advisory remains. Web unit suite: 22 suites / 99 tests passed.
- OpenAPI regenerated; `npm run contract:check --workspace @iop/web` passed.
- PostgreSQL Handover integration suite: 15 tests passed. New real-query coverage
  verifies both ongoing categories, all four daily categories, resolution exclusion,
  untracked ongoing exclusion, backdated entry dates, Zurich midnight rollover,
  full totals and 20+6 cursor pages, explicit history, department filters and denied
  foreign-site access. Existing real browser/HTTP Handover journey also passed.
- Playwright administrator-workspace, daily-handover and operational-shell suites:
  all seven scenarios passed. Verified initials-only trigger, DE/EN options, direct
  authorized profile select, actual role, keyboard/dismissal, no overflow, ordinary
  column filters retaining operational mode, explicit category history opting out,
  and Clear search restoring it. Other cards/notification flows still pass.
- Inspected `/tmp/iop-193-admin-menu-{1440,375}.png` and account screenshots at
  1440/375px: compact panel, aligned selectors, readable identity and retained focus.
  Shared three/two/one card layouts remain verified at 1440/1024/375px.
- Relative documentation links, status/ID consistency, `git diff --check` and bounded
  secret hygiene passed. Temporary fixtures/listeners did not change operator data,
  private configuration or existing Docker containers.

The API application owns trusted policy inputs, storage applies predicates before
pagination, and the browser application composes operational/history requests.
No new architecture pattern or migration was required. Canonical visual/product/
development documentation now describes the refined behavior. All requested criteria
are complete; this story is ready for its local commit and owner publication review.

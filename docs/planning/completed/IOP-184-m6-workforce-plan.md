# IOP-184 — M6 execution

Status: Completed. Branch: `feature/IOP-184-m6-workforce`, from clean `develop`.
Final review branch contains the complete authorized increment; no merge or push.

## Scope and ownership

[Request](../items/IOP-184-m6-workforce.md). Reuse accepted ADR-0032 inward
boundaries, ADR-0014 scoped grants, ADR-0016 site-time semantics and ADR-0036
snapshot/revision persistence. No existing Proposed ADR is implicitly accepted.
The owner waives intermediate confirmation for this task; record decisions here.

## Files and steps

1. Workforce domain/application ports, PostgreSQL adapters/migration, integration
   CSV/email decoder adapters, host composition/controllers/OpenAPI and tests.
2. Workforce browser domain/application/HTTP/React, role-specific daily and weekly
   boards, import review and planning forms, shared identity components.
3. Shared localization resources/adapters and existing UI text adoption; favicon
   and reusable platform mark. English source and German resource values.
4. Users/RBAC and Handover logical deletion, retained names/revisions, admin UI.
5. Explicit local demo provisioning using private password input; two technicians
   per configured department plus leader coverage; do not overwrite real data.
6. Synchronize architecture, product/development guides, M6 stories/backlog and
   executed evidence. Translate Spanish M6 contexts read during discovery in full;
   preserve IDs/links/meaning and distinguish updated delivery status.

## Validation

Run API/web unit tests, TypeScript/build, generated-contract check, architecture
and identity guards, database integration (including RLS, conflicts and retention),
import real-email parsing without committing private bytes, and desktop/mobile
browser inspection. Record actual results and any bounded limitations.

## Implementation decisions

Use supplied email times over older board times. Preserve local names as scoped
configuration. Missing days stay unknown. Reject unrecognized import rows and
ambiguous local times. Import preview must not write. Re-import is idempotent;
conflicting changes require explicit revision checks. Removal is logical, with
history kept and existing author names unchanged. The final branch stays local.

## Review refinements

Browser inspection identified a missing Docker public-asset copy; the web image now
ships the shared mark/favicon. Daily cards and schedule lists have deterministic
ordering. Historical assignment labels and shifts remain visible after configuration
changes. Phone identity remains stable when a label changes, and the maintenance
phone ID is reserved. Revision details expose the saved planning context.

Database fixtures now expect all 16 migrations and 31 application/metadata tables. Existing
browser flows were updated for the current Administration tools, Data Analysis
navigation and contextual Shift Handover headings/highlights; no application behavior
was changed to satisfy obsolete selectors. The analytics maintenance allowlist also
includes the previous handover migration and the two new migrations, retaining its
analytical-only reset scope.

## Evidence and outcome — 2026-09-30

- `npm run typecheck` passed. `npm test` passed: 18 secret-hygiene tests,
  334 API tests, 81 browser unit tests, 77 database-configuration tests; production
  builds, generated-contract comparison, architecture and visual-identity guards pass.
- PostgreSQL integration: 201 tests verified across the full run and focused
  reruns after fixing migration expectations and obsolete browser navigation.
  Final analytical suite: 9 passed; final Handover/Workforce suite: 10 passed,
  including real JSONB replay, grant denial, concurrent phone exclusivity, forced
  RLS, retained author/history and last-administrator protection.
- Browser acceptance: all 12 existing scenarios pass across the isolated full run
  and final Handover rerun (3 viewport scenarios). The default port 3000 was occupied;
  a temporary equivalent static proxy/native API used 41731/33001 without stopping
  the existing process. Fixtures now include the new Start Workforce request.
- Actual Docker application at `http://localhost:8080`: Administrator, Team Leader
  and Technician verified in German, switching to English; desktop 1440 and mobile
  390 widths, no page overflow or JavaScript errors. Icon/favicon loaded as SVG.
  Administrator preview of an existing CSV row correctly reports zero changes.
  Desktop/mobile screenshots were inspected in `/tmp/iop184-browser/` (local QA,
  not permanent artifacts). In-app browser automation was unavailable; the
  repository Playwright browser performed these checks.
- Real owner email parsed to 24 explicit rows: 10 work, 10 vacation, 4 off. No source
  content, private personal schedule or supplied password is committed.
- Local fixture command created 10 technicians (two per five Hallen), three leaders
  and one Springer, with 854 schedules and 732 assignments for September/October.
  Usernames: `m6.tech.1.1`–`m6.tech.5.2`, `m6.leader.1`–`m6.leader.3`, `m6.springer`.
  The supplied private password was applied to all local accounts. Existing
  analytical history remains 78 dates/42,220 rows; setup added 0 imports and retained all 78 existing dates.
- `git diff --check`, relative documentation links/status checks and indexed secret
  hygiene pass. Completed implementation is committed locally on the review branch.

Validation caught and corrected JSONB key-order dependence in duplicate detection:
imports now compare normalized schedule fields, preserving idempotency after storage.
No unresolved test failures remain. Vite retains its existing large-bundle warning;
this increment does not introduce a bundling redesign.

## Delivery boundaries

The local operational scope of IOP-050–059 and this explicit request is complete.
No Proposed ADR was implicitly accepted and no broader dependency was closed.
Corporate database connectivity/synchronization, payroll and optimization remain
future work. One personal interval per person/day is supported; absent source days
remain unknown, partial absences require a richer source, ambiguous DST intervals
are rejected, coverage badges count day-level empty zones, and history responses
return the latest 100 revisions while storage retains all revisions.

The original M6 context translations were committed separately before implementation
(`2bbefde`); subsequent context edits document delivery rather than translation.

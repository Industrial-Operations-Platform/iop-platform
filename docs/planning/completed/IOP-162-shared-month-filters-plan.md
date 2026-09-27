# IOP-162 — Execution plan

Status: Completed. Authorized by the owner's follow-up about missing month
comparison, downstream filters and collapsed reset in the running application.
Branch: `fix/IOP-162-shared-month-filters`, from `develop`.
Scope: [item](../items/IOP-162-shared-month-filters.md).

## Changes and validation

- Normalize all investigation view selections to months in the existing application
  helper; simplify ReportFilters to always show month controls and count a restricted
  month selection as an active filter. No backend changes are needed.
- Update selection/component/workspace tests and the existing browser comparison
  scenario to cover direct entry, downstream propagation and collapsed clearing.
- Synchronize the outdated filter description in the local operator guide.
- Run web tests/build and browser checks. Rebuild only local web/API images and
  restart those services for the requested running-app fix; retain database/setup,
  volumes, configuration and source history. Verify the live UI and request results.
- Record evidence, validate docs/diff, close the item and commit locally. Publication
  of this new story remains separately subject to owner approval.

## Evidence and closure

- Diagnosed the running web bundle `index-CuBMTtpr.js`: neither the multiple-month
  selector nor the external reset control was present. Local web/API containers
  had not been rebuilt after IOP-160. Direct detail entry also retained date controls
  in the current source, now corrected.
- Web suite: 17 suites / 70 tests passed; web build and TypeScript checks passed
  on Node 24.21.0. Updated browser comparison checks: 2 passed at 1440px and 375px,
  including direct Bereich entry, navigation through all investigation views,
  sector drill-down, active count and collapsed reset.
- `docker compose -f compose.platform.yaml build api web` and
  `up -d --no-deps --wait api web` succeeded. Both refreshed services are healthy;
  the existing database container, volumes and imported history were retained.
- Chromium checked the actual `http://127.0.0.1:8080` installation with real reports:
  May/July combined frequency, seconds and records equal the sum of separate monthly
  reports; returned rows exclude June. Selected months persist in all detail views;
  sector drill-down adds an active restriction; Clear filters while collapsed
  restores May/June/July and removes dimension filters.
- Live harness/log and screenshots are local evidence under `/private/tmp/iop-162-*`.
  Visually reviewed `/private/tmp/iop-162-live-filters.png` showing the collapsed
  month/sector summary and external Clear filters action.
- Documentation relative links and `git diff --check` passed. Item/backlog closed
  and plan moved to completed. No dependency-story translation was required.
- The previously approved IOP-161 branch was merged/pushed as `35eefd4` before this
  story. This new story is committed locally; its merge/push awaits separate approval.

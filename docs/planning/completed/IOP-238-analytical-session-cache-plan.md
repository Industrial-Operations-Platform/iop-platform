# IOP-238 — Analytical session reuse

Completed locally on 2026-11-13. Authorized by the owner's request to continue the proposed
browser improvement. Branch `feature/IOP-238-analytical-session-cache`, created
from clean `develop` at `7fa19db` before edits.
[Permanent scope](../items/IOP-238-analytical-session-cache.md).

## Changes and steps

1. Add bounded, expiring report reuse and in-flight deduplication to the Analysis
   application using framework-free memory and existing gateway/report contracts.
   Canonical keys cover the complete selection. Generation checks discard late
   completions after invalidation. Preserve weekly/daily snapshot consistency.
2. Compose a separate Analysis application per current host session/context in
   `apps/web/src/host/WorkspaceApp.tsx`. Retain analysis navigation in the existing
   React adapter and restore it on module return. Clear cached results through
   existing refresh and import/preparation callbacks in Analysis React adapters.
3. In `Workspace.tsx`, display matching retained results immediately and load misses
   through the existing application. In `Plot.tsx` and the ECharts adapter, reuse
   mounted chart instances and update handlers/options while preserving disposal.
4. Add focused regressions for navigation request counts, bounded expiry, revision
   changes, invalidation races, failures, isolation and chart lifecycle. Extend
   existing browser scenarios for desktop/mobile navigation and refresh.
   The existing readiness scenario waits up to five seconds for its first lazy
   Analysis import, whose cold Jest transformation exceeded the default one second.
   The drill-down scenario verifies restored months/results and zero additional
   requests when returning to a cached selection, replacing its old reload assertion.
5. Synchronize the query contract, item/backlog and completed evidence. Changes stay
   within existing Analysis application/React/ECharts and host composition boundaries
   under ADR-0032. Existing API, persistence and authorization contracts apply.

Expected files include the Analysis application/cache, relevant React/ECharts
adapters, host composition, focused web tests/e2e, the query contract and this
story's planning records. Read story contexts are English.

## Validation and evidence

| Check | Result |
| --- | --- |
| `npm.cmd test --workspace @iop/api` | 55 suites / 573 tests passed |
| `npm.cmd test --workspace @iop/web` | 51 suites / 338 tests passed |
| Final focused Analysis cache/workspace, Start and readiness recheck | 4 suites / 41 tests passed, including two added availability-race cases |
| `npm.cmd run build --workspace @iop/web` | Design guard 4/4, TypeScript and production build passed |
| Chromium analytical cache, drill-down, filter ancestors, exclusions, chart layout and month comparison | All 17 scenarios passed across final runs; 15 initial passes and 2 corrected drill-down assertions |
| Final production-build cache recheck | 2/2 desktop/mobile scenarios passed |
| Secret hygiene, changed Markdown links/statuses and whitespace | Passed |

Browser evidence shows six Halle/Bereich tab changes and a module round trip add
zero report requests after their selections are loaded. Explicit refresh adds one
request. Signing out and back into the same account starts fresh and resets the
selected view. Inspected generated screenshots at 1440px/light and 375px/dark;
the UI remains contained and chart appearance changes preserve data. Existing
filter/month/empty-result scenarios pass through cache reuse. Unit regressions
cover complete keys, eviction/expiry, weekly snapshot pairing, revisions, failures,
response isolation and late report/availability completions.

The readiness fixture's cold lazy import exceeded its original one-second wait;
its bounded five-second wait passes. The drill-down fixture originally expected a
new HTTP request when restoring cached months; it now verifies the displayed months,
restored rows and unchanged request count. A sandboxed Windows browser run needed
manual cleanup of its verified temporary API/Vite processes after both tests passed.
Subsequent browser runs used normal process permissions and closed automatically.
Vite retains the existing large-chunk warning.

Implementation defaults are five-minute retention and bounded serialized reports.
Memory belongs to the currently composed session. Existing visible results can age
until refresh/expiry, matching the requested browser reuse. Every new server read
retains current authorization and revision/projection checks from IOP-215.

## Closure

Acceptance is met. The item/backlog and query contract are synchronized.
The owner approved merging the story into develop and publishing both branches
to origin on 2026-11-13. [Publication evidence](IOP-238-publication-plan.md)
records the successful atomic push and remote verification. The review branch is retained.

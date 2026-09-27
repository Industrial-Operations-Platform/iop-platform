# IOP-165 — Operational home and transitional access

Status: Completed (home and access-design slice only). Authorized by the owner's 2026-09-27 request to accept Data
Analysis v1 and start the operational home and temporary user administration.
Branch: `feature/IOP-165-operational-home`, created from clean `develop`.
Permanent context: [IOP-165](../items/IOP-165-operational-home.md).

## Changes and steps

1. Record Data Analysis v1 owner feedback in IOP-130 and the delivery map, without
   claiming a platform release or completing unmeasured acceptance criteria.
2. Extend the existing React landing view using the analysis application contracts
   and shared components: selected local user, latest imported month, sector/area
   summary, analysis navigation, and explicitly unavailable operational sections.
   Expected files: analysis application/React adapters, related web tests and E2E.
3. Prepare ADR-0035 for replaceable temporary authentication, scoped user creation
   and future corporate identity linking. New credentials/session persistence
   requires acceptance before dependent implementation (ADR-0007). The owner
   confirmed four profiles with existing bundles; only Administrator imports.
   Keep existing server authorization intact while completing the independent home.
4. Synchronize backlog, glossary, architecture/module naming and delivery status.
   Translate the already-read Spanish prose in IOP-028, IOP-031, IOP-117 and IOP-138
   in full, preserving IDs, statuses, links and meaning. These are translation-only
   maintenance edits, not activation or completion of those parent stories.

## Validation and evidence

- `npm run typecheck`: passed; web production build also verifies TypeScript.
- `npm test` with existing `/tmp/iop-147-bin` Node 24.21.0/npm 10.9.2: passed
  (18 secrets, 293 API, 54 web and 77 database configuration tests), including
  API/browser contract drift checks. After the coverage-count correction, the web
  build and all 54 web tests passed again; unchanged backend tests were not repeated.
- Browser regression: five existing Chromium scenarios passed; both new Start
  scenarios passed at 1440/375px after correcting native-select automation and the
  fixture's executive-request expectation. Covers sector/area selection, keyboard
  navigation, return to Start, no privileged requests and no horizontal overflow.
  Generated desktop/mobile screenshots were visually inspected.
- Docker web rebuilt with the pinned Node 24 image and became healthy at
  `http://127.0.0.1:8080`; API/database containers and business data were preserved.
- Actual Docker API read smoke: latest month 2026-07, six sector groups, frequency
  85,669 and 337,622.93333333335 accumulated alarm minutes; selected sector returned
  12 area groups. The API dates cover the entire history (69 eligible dates), so
  Start now bounds the imported-date count to the selected month. A regression test
  includes an older out-of-month date. These are analytical totals, not machine state.
- Unit scenarios cover unavailable/denied history, empty history, retry, scope-free
  UI placeholders and ignoring late reports after user selection clears. Profile
  and import-history endpoints are never requested by Start.
- Changed Markdown links/statuses/IDs, complete translations and `git diff --check`
  reviewed. No password/authentication implementation is claimed.

Initial default-shell tests used unsupported Node 20 and sandbox-blocked listeners;
they failed on ESM/listening, then passed with the existing supported runtime and
local-server permissions. Interactive browser tools exposed no available browsers;
automated Chromium plus screenshots and real API reads supplied verification.
The existing Vite large-bundle advisory remains; bundle splitting is outside scope.

## Closure

Home and documentation increment completed; IOP-165 remains In progress until
temporary authentication and administration are implemented and verified. The
[access plan](../active/IOP-165-transitional-access-plan.md) remains decision-pending.
ADR-0035 is Proposed. Data Analysis v1 acceptance is recorded; no tag/platform
release, merge or remote publication is implied. Validated local commits follow
ADR-0008; owner approval is required before merging/pushing.

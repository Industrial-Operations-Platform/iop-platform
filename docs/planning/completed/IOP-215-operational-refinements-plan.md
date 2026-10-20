# IOP-215 — Execution evidence

Completed locally on 2026-10-20 under the owner's request and follow-up excluding
absent people. Branch: `feature/IOP-215-operational-refinements`, from `develop`
`0df0299`. [Permanent scope](../items/IOP-215-operational-refinements.md).

## Delivered changes and boundaries

- Workforce reuses editable `teams[].leaderId` and worker `teamId` as primary
  groups without restricting other leaders' authority. Optional configured
  technical levels and trusted retained labels use existing JSON snapshots;
  legacy/retired values remain compatible. The host adapter owns initial ILO labels.
  My day pairs subtle availability accents with explicit current/overlapping-shift
  labels, using resolved UTC intervals and the preceding date for overnight work.
  Start renders seven compact weekday/date columns with shift and zone, reusing
  its single loaded-week request and containing narrow-screen scrolling.
- Scoped roster tooling prepared four groups and applied 20 memberships through
  existing Workforce grants, optimistic revisions and material audit. Mike's five
  existing members were linked using explicit aliases in ignored site configuration.
  The owner instructed omission of the two absent accounts and will add them later.
  Accounts, grants, schedules and home zones were preserved. A repeated preview
  reported zero settings/worker changes. Qualifications remain unspecified until
  confirmed; normal page loading never assigns groups or qualifications.
- Shared table filter indicators are muted until hover, focus or active selection;
  their names, target and pressed state remain accessible. Improvement filters use
  the shared inline context-field pattern. Area entry titles align at the left edge.
  Maintenance supports native card dragging and retains its board after saves;
  blocked/completion/reopen transitions reuse the existing evidence dialogs and
  authorized application save operation, including expected revisions.
- OIP's existing PostgreSQL report adapter reuses serialized report values within
  64-entry, 16 MiB and five-minute limits. Actor/source/normalized-selection keys
  never replace current authorization. Every hit runs one scoped statement checking
  complete publication identities, profile version/configuration fingerprint and
  projection readiness. Misses keep the original one-statement aggregate; stale
  requested revisions, errors and revocations retain their existing semantics.
  This owner-requested adapter optimization preserves ADR-0028 and adds no cache
  service, browser persistence, schema or module dependency.
- Locator opens lightweight area cards with no overview graphics context, reference
  images or editor asset search. Opening a zone loads one reference, bounded to
  2048 pixels per side without mipmaps and a 1.5 render pixel ratio. Component
  selection updates the existing renderer; lost contexts use the accessible
  component/image fallback. Configuration/import requires an explicit mode and a
  current Administrator plus management grant. Team Leader and Task Force retain
  scoped viewing; obsolete management grants cannot authorize writes.

Changes stay in owning application/domain contracts and PostgreSQL, HTTP, React,
Three.js and host adapters under Accepted ADR-0032/0037. Existing generic transport
envelopes and database schemas are unchanged. Module guides, visual identity,
query contract and architecture summary are synchronized. Read dependency stories
were already English; no translation-only edits were required.

## Technician journal investigation

The reported selected-date denial was not reproduced. Read-only inspection of the
running Docker API with its current runtime role found all 17 technicians could read
Halle A T3 on 2026-10-05: pending Available 6, journal Available 4. Empty October
dates returned journal Available 0. Formal shift context remained independently
Not authorized. No runtime service, grant or record was changed for this inspection.
Unit and actual-role PostgreSQL regressions now distinguish both journal groups,
empty dates and separately restricted formal context. No speculative grant change
was introduced.

## Verification

Node 24.21.0 / npm 10.9.2. Final results:

| Check | Result |
| --- | --- |
| `npm test --workspace @iop/api` | 49 suites / 519 tests passed |
| `npm test --workspace @iop/web` | 40 suites / 231 tests passed |
| `npm run test:e2e --workspace @iop/web -- --reporter=line` and focused recheck | All 70 scenarios passed across final runs; 68 initial passes plus corrected 2 fixture cases; 9 affected scenarios passed in the recheck |
| PostgreSQL `reporting-workspace`, `operational-overview`, `asset-locator` suites | 29 tests passed across final runs, including current revocation, profile/projection invalidation and obsolete Locator grants |
| `npm run build --workspace @iop/api`; `npm run db:build` | Passed |
| `npm run build --workspace @iop/web` | Design guard 4/4, TypeScript and production bundle passed |
| `npm run typecheck` | API, web and database tooling passed |
| `npm run contract:check --workspace @iop/web` | Browser binding matches API artifact |
| `npm run test:secrets` | 6 suites / 27 tests passed, including roster preservation/idempotence |
| `npm run db:test:unit` | 77 checks passed |

The 4,000-row synthetic import returned identical exact totals (8,000 frequency,
360,000 seconds) and records: cold query 252 ms, repeated query 15 ms in disposable
PostgreSQL. This is one local fixture observation, not production acceptance or a
representative plant-data benchmark. Cache unit tests also prove that repeated
reports skip aggregation while rechecking current authority.

Chromium checks cover real card drag/cancel/save, 71 unloaded Locator areas,
single-reference loading, context reuse/loss, weekly day alignment and bounded
narrow scrolling. Inspected desktop/narrow light/dark screenshots for Improvements,
Maintenance, Locator and Workforce. Initial failures exposed the legacy profile
configuration cache case (fixed), old Locator role expectations (updated), dynamic
Workforce fixtures based on the expanded query start (corrected), a missing German
key (added), and JSDOM cloning setup (test-local fallback). A temporary Testcontainers
startup timeout passed on retry; sandbox listener restrictions passed under the
required local test permissions.

## Closure

Implementation commits: `bc281db` (cache), `d830968` (Locator), `0052d4e`
(operational controls), `1557fae` (Workforce); initial planning `5dd0312`.
The item/backlog are complete locally. Changed Markdown links, IDs/statuses,
indexed-file hygiene and whitespace are checked at the documentation closure commit.
Private roster data remains outside Git. Vite retains its existing large-chunk
warning. No merge, push, deployment, real-provider or plant acceptance is claimed.

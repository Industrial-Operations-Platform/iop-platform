# IOP-180 — Operational visual polish

Status: Completed. Authorized by the owner's design request on 2026-09-29.
Branch: `feature/IOP-180-operational-visual-polish`, from clean `develop`.
Scope: [item](../items/IOP-180-operational-visual-polish.md).

## Changes and steps

1. Extend shared presentation components (`Surfaces`, `Controls`, `ViewNavigation`,
   exports and CSS) with paired metrics, semantic badges, inline navigation,
   refresh and history actions, reusing canonical identity tokens.
2. Refine handover React adapters (`HandoverHighlights`, `EntrySummaryCards`,
   `Entries`, `entry-labels`, `CategoryBoard`, CSS) and the analytical Start refresh control.
   Preserve framework-free application/domain boundaries and server-owned counts;
   allow full attention-list access through existing `WorkspaceApp`/`HandoverWorkspace` selection composition.
3. Synchronize `docs/design/visual-identity.md`, the component README and handover
   development guide. No architecture change or dependency-story translation needed.
4. Verify web build, web tests/identity guards and relevant desktop/mobile browser
   journeys. Add behavioral coverage for the new Start selection/refresh behavior,
   inspect screenshots, check whitespace and documentation links.
5. Record results, complete item/backlog, archive plan and commit locally. Request
   publication approval only after the result is validated and reviewable.

## Validation and evidence

- Centered paired metrics use shared semantic tones and descriptions. Inline
  navigation below them defaults to Needs attention and shows one bounded list.
  Open reports no longer omits attention entries; collection links preserve the
  correct attention/pending/highlights selection and department scope.
- Start composes the same feature-owned summary card as Journal/Meeting, adding
  structured state, reference, excerpt and deadline slots. Location emphasis,
  shared count badges, history actions and both Start refresh controls are aligned.
- Updated the canonical identity, shared component guide and operational guide.
  No domain, API, storage, permissions or architecture changes were required.
- Web build/typecheck passed under Node 24.21.0. The shell initially selected Node
  20 and lacked the pinned Rolldown native binding; reused the existing temporary
  Node 24 runtime and restored binding 1.2.9 in ignored node_modules, without
  changing manifests or the lockfile. Existing bundle-size warning remains.
- All 76 web tests passed, including identity guards and new tests for collection
  switching, overlapping open/attention issues, full-list navigation, loading,
  refresh failure/retry and selection preservation. Log: `/tmp/iop180-web-tests.log`.
- All 10 hexagonal-boundary tests passed. Log: `/tmp/iop180-boundaries.log`.
- Four browser journeys passed at 1440px/375px: Start and the complete handover
  flow, with centered metrics, inline navigation, keyboard selection, refresh,
  department filtering, attention-list routing and preserved detail navigation.
  Browser fixtures intercept API requests; this does not claim a live-database test.
  Log: `/tmp/iop180-browser.log`; build: `/tmp/iop180-build.log`.
- Inspected `/tmp/iop180-start-1440.png`, `/tmp/iop180-start-375.png`,
  `/tmp/iop180-journal-1440.png` and `/tmp/iop180-meeting-375.png`. Titles remain
  blue/semibold, departments are emphasized, controls are readable, and the
  existing responsive journey confirms no document-level horizontal overflow.
- Reviewed dependency direction, shared component props, server-owned counts,
  unchanged customer data and absence of new feature palettes. Diff whitespace
  and changed-document links/statuses checked before commit.

## Closure

All requested implementation criteria are complete. This story is committed locally
for review; publication/merge and local Docker activation await owner authorization.
The running Docker build has not been replaced.

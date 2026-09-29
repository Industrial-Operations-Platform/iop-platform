# IOP-177 — Platform identity and local activation

Status: In progress. Branch: `feature/IOP-177-platform-visual-identity`, created
from clean develop at `3a0a40e`. [Scope](../items/IOP-177-platform-visual-identity.md).

## Changes and steps

1. Record the owner's integration/publication/Docker approval; merge IOP-175 into
   this story branch, preserving IOP-176 and both backlog entries. Read and update
   IOP-175/176 contexts and completion evidence for their final integration/activation.
2. Extend existing `design/identity.ts` typography tokens, consume them in shared
   `components.css` and feature CSS (`analysis/.../workspace.css`, handover CSS).
   Use the Meeting preparation scale without changing existing chart metric roles.
   Shared design owns presentation; React adapters compose it. No inward-layer edits.
3. Synchronize `docs/design/visual-identity.md`, shared component README and
   `docs/planning/workflow.md` so future work must reuse identity and validate both
   presentation and Accepted ADR-0032 boundaries. Extend existing design boundary
   checks and handover browser coverage for meeting/detail identity continuity.
4. Build web, run web and API architecture/unit checks, exercise existing browser
   journeys, and inspect desktop/mobile screenshots. Verify links and whitespace.
5. Commit, merge into develop and publish IOP-175, IOP-177 and develop to origin.
   Rebuild only the web Docker service (frontend-only change), preserving the running
   API/database and persistent volumes. Verify health and actual served assets.
6. Record evidence, archive this plan and publish completion documentation through
   the same approved story → develop path. No stage/master or branch deletion.

IOP-175 integration is explicitly authorized. Existing Accepted ADR-0032/0036 and
the canonical identity/component pattern suffice; no new architectural decision.

## Implementation evidence

- Integrated IOP-175 at `1c5f280`; only the backlog required conflict resolution,
  retaining IOP-175, IOP-176 and IOP-177. The source keeps both heading and spacing fixes.
- Typography and panel/action spacing roles now live in `identity.ts`; existing
  palette and chart roles remain intact. Handover preview body copy is normalized
  from 14.4px to the shared 14px body role. No domain/application edits.
- Shared workflow and identity/component documentation now require the owner's
  Meeting preparation reference, shared tokens/components, visual review and
  existing hexagonal/clean-code checks for future generated/manual UI changes.
- Web build/typecheck passed (existing bundle-size warning). All 74 web tests and
  325 API tests passed, including identity and hexagonal boundary guards.
- Eight browser journeys passed at 1440px/375px across handover, administration,
  Start and monthly analytics. Meeting/detail checks compare actual computed font,
  size, weight, ink, card background/border/radius and verify the 16px action gap.
- Visually inspected `/tmp/iop177-meeting-1440.png`,
  `/tmp/iop177-detail-{1440,375}.png`. Logs:
  `/tmp/iop177-{build,web-tests,api-tests,browser}.log`.
- API tests initially hit sandbox loopback restrictions; the authorized rerun
  passed. Node 24.21.0 was used throughout.

Publication and served-build verification remain to be recorded below.

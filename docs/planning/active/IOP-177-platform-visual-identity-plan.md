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

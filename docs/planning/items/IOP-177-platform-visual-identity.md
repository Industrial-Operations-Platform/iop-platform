# IOP-177 — Enforce the shared platform visual identity

Status: In progress. Owner requested on 2026-09-29 that Meeting preparation's
typography, colors and sizes define the platform identity, with blue action accents,
and that generated changes respect both that identity and hexagonal/clean-code rules.

## Scope and acceptance

- Document Meeting preparation as the visual reference for every module and detail
  view. Keep the existing palette, shared controls and surfaces; centralize typography
  roles so feature code cannot silently introduce a different scale or typeface.
- Add automated identity guardrails alongside the existing architecture checks.
  Verify Start, handover/meeting/detail, administration and analytics compositions.
- Integrate the pending IOP-175 heading/breadcrumb and refresh removal with the
  published IOP-176 action spacing; show the combined result in local Docker.
- Keep domain/application logic independent of presentation under Accepted ADR-0032.

The owner explicitly approved integrating `fix/IOP-175-handover-detail-heading`
into this story branch, merging the result into develop, publishing both story
branches and develop to origin, and updating local Docker. Preserve existing data.
No new architecture, authentication or business behavior is requested.

Execution: [plan](../active/IOP-177-platform-visual-identity-plan.md).

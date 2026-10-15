# IOP-212 — Landing motion, connection recovery and area filters

## Status and goal

Completed and published to origin. Owner request on 2026-10-15: keep the landing animation running without
a pause action, show clean reconnection guidance when the backend is unavailable,
align Area / location with existing compact filters, check local Docker delivery
against develop, and audit branch integration into develop and origin/develop.

## Scope and acceptance

- [x] Remove the landing pause/resume action and its state; retain system reduced-motion support.
- [x] Backend/network/invalid JSON failures expose no parser or proxy HTML details;
  the disconnected access panel explains reconnection and Retry connection restores login.
- [x] Area / location uses the shared inline caption/value filter treatment and preserves selection behavior.
- [x] Compare active Docker artifacts with develop, rebuild/activate the authorized
  local fixes, and verify web/API health and desktop/narrow rendering.
- [x] Fetch origin and report exact ancestry of retained local/remote branches;
  identify missing integration without inferring merge or push authorization.

No API/domain/schema change or external deployment. Existing owning boundaries:
browser host for landing/session presentation, Access HTTP adapter for transport
errors, shared design controls for filter presentation, Operational Overview for
selection. Follow [workflow](../workflow.md), [ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md)
and [ADR-0034](../../architecture/adr/ADR-0034-local-container-platform.md).

## Evidence and remaining work

See the [execution plan](../completed/IOP-212-entry-recovery-filters-plan.md).

Local Docker is active with the fixes. The owner approved IOP-212 publication on
2026-10-15; the story was merged into develop and both refs were verified on origin.
See the [publication record](../completed/IOP-212-publication-plan.md). Integration
of retained IOP-204–211 branch refs remains outside that approval; the audit records
those missing merges rather than claiming they are complete.

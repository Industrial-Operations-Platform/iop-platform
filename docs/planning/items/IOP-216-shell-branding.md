# IOP-216 — Balanced workspace header and platform mark

## Status and goal

Completed and published to origin on 2026-10-20. The owner's 2026-10-20 request authorizes a new branch from `develop`
to improve the platform icon, brand placement, navigation and upper-right header
alignment shown in the supplied screenshots.

## Scope and acceptance

- [x] Place the aligned platform mark and name in the shared workspace header,
  preserving the accessible action back to Start and a clear supporting name.
- [x] Use compact, consistently left-aligned navigation and balanced header actions;
  keep every authorized destination reachable on short desktop and narrow screens.
- [x] Refine the existing Unified Record SVG proportions and use the same asset
  throughout the workspace, introduction and favicon.
- [x] Inspect desktop/narrow light/dark rendering, keyboard navigation, search and
  account behavior; pass relevant regression, design, architecture and build checks.

Presentation ownership remains in the shared design components and host adapters
under Accepted [ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md)
and [ADR-0010](../../architecture/adr/ADR-0010-frontend-charting-testing.md).
This requested refinement updates the [visual identity](../../design/visual-identity.md)
without changing module behavior, permissions, API contracts or persistence.
IOP-215 work is independent and must remain untouched.

## Evidence and remaining work

[Execution plan](../completed/IOP-216-shell-branding-plan.md).

## Approved local integration — 2026-10-20

The owner explicitly requested merging all pending IOP-215 and IOP-216 commits
into local `develop`. Both stories are integrated and validated. [Integration evidence](../completed/IOP-216-develop-integration-plan.md) records execution.
The owner subsequently approved publication as recorded below.

## Approved publication — 2026-10-20

The owner explicitly approved pushing both retained story branches and `develop`
to `origin`. The atomic push succeeded and remote hashes were independently
verified. [Publication evidence](../completed/IOP-216-publication-plan.md) records the result and
completion checks.

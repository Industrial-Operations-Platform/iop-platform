# IOP-214 — Desktop reliability and visual consistency

## Status and goal

In progress. The owner's 2026-10-15 follow-up authorizes implementing the findings
from the platform review autonomously, prioritizing a harmonious desktop experience
and preserving the existing mobile baseline and platform identity.

## Scope and acceptance

- [ ] Formal Handover direct navigation tolerates delayed context; Area overview
  retries failed initial loading; Improvement pagination retains applied filters
  and rejects stale/duplicate responses.
- [ ] All desktop sidebar destinations remain reachable on short laptop displays;
  shared native controls follow the selected appearance.
- [ ] Operational collections, filters, result states, detail facts and form spacing
  consistently reuse shared presentation components and semantic tokens.
- [ ] Tables use deliberate text/numeric/status alignment, useful accessible ordering
  where the complete collection or existing query contract supports it, and clear
  filtering/reset and pagination feedback. Workforce supports a compact weekly view.
- [ ] Asset model states use localized presentation labels; Locator cards inherit
  platform typography; initial loading avoids eagerly loading analytical rendering.
- [ ] Validate API/web regressions, identity/architecture/contracts, production build
  and actual desktop/narrow browser rendering; update documentation and commit locally.

Follow [ADR-0032](../../architecture/adr/ADR-0032-hexagonal-application-boundaries.md),
[ADR-0010](../../architecture/adr/ADR-0010-frontend-charting-testing.md) and the
[visual identity](../../design/visual-identity.md). The owner-authorized table
alignment refinement supersedes the affected IOP-187 presentation rules only;
palette, typography, permissions, source semantics and module ownership are retained.
No new backend architecture, dependency, schema, deployment, merge or push is implied.
Never sort a partial server page as if it were the complete matching collection.

## Evidence and remaining work

[Execution plan](../active/IOP-214-desktop-consistency-plan.md).

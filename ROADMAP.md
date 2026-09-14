# IOP roadmap

## Current v1 boundary

CSV events → preparation/normalization → analysis → presentation, with individual
login and authorized views. Reproduce the useful behavior of the current local
Power BI workflow. Exact reports, KPIs and acceptance targets remain under IOP-001.
No implementation or delivery date is committed.

## Delivery direction

1. Validate persona responsibilities and report/acceptance requirements in IOP-001.
2. Resolve stack and essential API, scope, identity, ingestion and operational
   decisions. IOP-002 stack selection is complete under Accepted ADR-0006/0009/0010,
   including React/Vite, ECharts, Jest and local delivery tooling. Bootstrap and
   the other architectural decisions remain separate work.
3. Plan minimal vertical slices for authorized CSV import, reconciled analysis and
   reporting. Use source-provided equipment/sector references without requiring a
   fully surveyed physical asset registry.
4. Validate the agreed outputs against the current workflow, including isolation,
   data quality and operational requirements, before release.
5. Evaluate meeting, shift and other operational functions after v1. Survey-backed
   asset location, potentially in 3D, and direct source integration are future work
   with separate prerequisites and undecided sequencing.

Asset Locator, maps, sensor coordinates and a full plant survey are outside v1.
M1–M17 remain a longer-term capability inventory, not a sequence of mandatory v1
gates. Security, testing and UX belong in each selected slice, not only late milestones.

## Navigation

- [Current scope](docs/product/scope-v1.md).
- [Backlog index](docs/planning/backlog.md) and [contexts](docs/planning/items/).
- [Milestones](docs/planning/milestones.md): broader capability groupings.
- [Workflow](docs/planning/workflow.md), [active plans](docs/planning/active/)
  and [completed plans](docs/planning/completed/).

Do not start adjacent tasks automatically. Scope and sequence require explicit
selection and recorded execution plans.

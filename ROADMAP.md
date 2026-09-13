# IOP roadmap

The repository baseline is the only work completed here. All implementation is
future work. Sequence is dependency-driven; dates and staffing are not committed.
The [v1 scope](docs/product/scope-v1.md) is a proposal to validate.

| Milestone | Outcome | Dependencies |
| --- | --- | --- |
| M0: Repository baseline | Documentation, accepted foundational ADRs and logical Git history | Current task |
| M1: Delivery design | Validate workflows, stack, tenancy, identity and source contracts | M0 |
| M2: Platform foundation | Customer/site context, authentication boundary, RBAC and audit foundation | M1 |
| M3: Assets and data foundation | Canonical assets, validated mappings and repeatable read-only imports | M2 |
| M4: Operational workflows | Basic workforce/shifts, handover and maintenance | M2; M3 asset references |
| M5: Locator and intelligence | Versioned map lookup and traceable event analytics with workflow context | M3; M4 for shift/work context |
| M6: v1 pilot readiness | End-to-end validation, isolation, operations and agreed pilot measures | M4, M5 |

After v1, evaluate additional connectors, richer maintenance workflows, reporting,
advanced analytics and deployment scale based on evidence. None is authorized
for implementation by this document.

See [milestone exit criteria](docs/planning/milestones.md) and the
[initial backlog](docs/planning/backlog.md). Put a scoped plan in
[active planning](docs/planning/active/) before beginning a planned implementation
slice, linking its acceptance criteria and relevant ADRs.

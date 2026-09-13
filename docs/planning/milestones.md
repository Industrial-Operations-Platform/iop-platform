# Milestone exit criteria

Status: M0 is delivered by this repository task; M1-M6 are not started. These are
planning gates, not fixed delivery dates. See [backlog](backlog.md) for work items.

| Milestone | Exit evidence |
| --- | --- |
| M0 | Requested layout and concise documentation exist; five ADRs are Accepted; seven logical commits contain no application implementation. |
| M1 | Validated v1 workflow and targets; documented stack, identity, isolation, integration and operational decisions sufficient for the next implementation slice. |
| M2 | Reproducible foundation; customer/site context and permission checks work; relevant tests cover denial paths and audited changes. |
| M3 | Canonical assets and aliases are validated; import replay is idempotent; normalized counts/metrics reconcile with RAW inputs and explained exclusions. |
| M4 | A representative shift can transfer open issues; basic maintenance links to assets and records ownership, status and outcomes with audit history. |
| M5 | An authorized user can trace an analytical result to source data and locate its validated asset on the correct map version; ambiguities remain visible. |
| M6 | Agreed end-to-end acceptance, isolation and operational checks pass; pilot integration is read-only and agreed value/performance measures are evaluated. |

For each implementation slice, place a plan in `active/` with scope, dependencies,
acceptance criteria, relevant ADRs and verification steps. Keep its status current;
move completed plans out of `active/` into a historical planning location when
needed. The directory is intentionally empty apart from `.gitkeep` today.

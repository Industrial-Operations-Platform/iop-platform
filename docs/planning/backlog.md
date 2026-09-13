# Initial backlog

All items are proposed and not started. Ordering follows the
[roadmap](../../ROADMAP.md); split items into small reviewable plans before coding.
No active implementation plan exists yet.

| ID | Milestone | Work and acceptance evidence |
| --- | --- | --- |
| IOP-001 | M1 | Validate v1 personas and workflows; agree a concrete end-to-end scenario and measurable pilot targets. |
| IOP-002 | M1 | Select languages/frameworks/tooling and host/module layout; record rationale and development/test commands. |
| IOP-003 | M1 | Design customer/site scope, physical tenancy and access matrix; document enforcement across database, jobs, files and exports. |
| IOP-004 | M1 | Select identity integration and principal mapping; define sessions, provisioning, revocation and RBAC semantics. |
| IOP-005 | M1 | Discover one industrial source, version, read-only interface and event grain; define source contract, access limits and sample-data approach. |
| IOP-006 | M1 | Specify module transactions and reliable audit/job delivery; decide hosting, retention, map/RAW storage, time semantics and recovery targets. |
| IOP-007 | M2 | Implement platform context, authentication adapter and scoped RBAC after decisions; verify unauthorized and cross-customer requests fail. |
| IOP-008 | M2 | Establish migrations, test tooling and audit foundation; show reproducible setup and traceable material changes. |
| IOP-009 | M3 | Model canonical assets, configurable hierarchy, controller links and aliases; validate scope, cycles, collisions and survey status. |
| IOP-010 | M3 | Build RAW capture and normalized imports; repeated inputs do not duplicate facts, rejected records remain visible and totals reconcile. |
| IOP-011 | M4 | Add teams, shifts and assignments; validate site time zones, overnight intervals and chosen overlap rules. |
| IOP-012 | M4 | Add handover notes/open issues and basic maintenance records; demonstrate ownership, asset links, status transitions and audit history. |
| IOP-013 | M5 | Build Asset Locator with versioned maps and normalized markers; verify scoped search, ambiguous aliases and unmapped assets. |
| IOP-014 | M5 | Add OIP event views, frequency/duration trends and Pareto analysis; verify source reconciliation and avoid fabricated occurrence/downtime claims. |
| IOP-015 | M6 | Validate the end-to-end workflow, permissions, data isolation and read-only integration; rehearse agreed backup/restore and measure performance/adoption. |

Historical follow-ons such as BI deep links, compatibility views, action-impact
comparisons, near-real-time ingestion and root-cause workspaces require separate
prioritization. Preserve existing customer data flows during any future migration;
no external database or BI system is changed by this baseline.

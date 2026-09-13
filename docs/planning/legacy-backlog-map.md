# Legacy backlog mapping

On 2026-09-13, IOP-139 adopted the user's expanded 138-item outline. This is a
one-time renumbering before implementation; previous commits retain the old
15-item backlog. Qualify old references as **baseline-v0 IOP-NNN**. Bare IDs now
resolve only to the new [backlog](backlog.md). Future IDs must never be reused.

IOP-001 and IOP-002 retain their intent. No previous implementation was migrated.
The IOP-002 backend evaluation from a44628a/dd51b63 is preserved in
[research evidence](items/IOP-002-backend-evaluation.md); its Proposed ADR and
pending acceptance remain unchanged. The former active filename was a research
file; the replacement active file is an execution/decision plan.

| Baseline-v0 ID and scope | New IDs |
| --- | --- |
| IOP-001 — Personas/workflows | 001 |
| IOP-002 — Stack selection | 002 |
| IOP-003 — Customer/site isolation and access | 004, 005, 006 |
| IOP-004 — Identity and sessions | 007, 028, 106 |
| IOP-005 — Industrial source discovery | 012, 104, 105 |
| IOP-006 — Delivery, storage, time and operational decisions | 008, 009, 010, 011, 013, 014, 112, 113, 114 |
| IOP-007 — Context, authentication and RBAC foundation | 025–031 |
| IOP-008 — Migrations, testing and audit foundation | 019, 020, 021, 023 |
| IOP-009 — Canonical assets and aliases | 032–040 |
| IOP-010 — RAW and normalized ingestion | 041–049 |
| IOP-011 — Teams, shifts and assignments | 050–059 |
| IOP-012 — Handover and maintenance | 060–075 |
| IOP-013 — Asset Locator | 076–083 |
| IOP-014 — OIP event analytics | 089–097 |
| IOP-015 — End-to-end pilot readiness | 108–115, 129–138 |

## Milestone mapping

| Baseline-v0 | Expanded grouping |
| --- | --- |
| M0 repository baseline | M0 preserved; IOP-139 is a governance follow-up. |
| M1 delivery design | M1 product/architecture definition. |
| M2 platform foundation | M2 development foundation and M3 platform core. |
| M3 assets/data | M4 assets and M5 industrial data. |
| M4 operational workflows | M6 workforce, M7 handover and M8 maintenance. |
| M5 locator/intelligence | M9 locator, M10 asset history and M11 OIP. |
| M6 pilot readiness | M13–M17 integration, reliability, UX, demo and release. |

M12 improvement tracking is a proposed extension with ownership and v1 inclusion
still open. The attachment's Hall/Area/other local labels are configurable data,
not mandatory hierarchy levels. Local POC authentication requires a decision in
IOP-007; downtime requires sufficient source semantics in IOP-091. These safeguards
preserve Accepted ADRs and the existing conceptual data model.

The short example ending at IOP-040-v1-release was illustrative. The supplied full
outline defines IOP-040 as asset search and IOP-138 as v1 release. Likewise the
request example's IOP-017-asset-model is superseded by IOP-032-asset-hierarchy.

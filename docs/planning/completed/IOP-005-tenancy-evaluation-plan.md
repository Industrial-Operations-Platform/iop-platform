# IOP-005 — Tenancy evaluation plan

Source: [IOP-005](../items/IOP-005-tenancy-and-data-isolation.md).

## Status and authorization

Completed — proposal slice only. The owner requested option evaluation and an ADR on 2026-09-15,
with baseline documentation updates if accepted. No tenancy decision is accepted.
Branch: `docs/IOP-005-tenancy-isolation`, created from clean `develop` before edits.

## Proposed implementation

Complete the design proposal slice: compare physical tenancy and database
enforcement, recommend a v1 approach, and document failure/concurrency scenarios.
Leave acceptance-dependent baseline changes pending explicit owner acceptance.

## Files expected to change

- This plan, moved to `../completed/` when the proposal slice is validated.
- `docs/architecture/adr/ADR-0013-tenancy-data-isolation.md` (new Proposed ADR).
- `docs/planning/items/IOP-005-tenancy-and-data-isolation.md` (English context and evidence).
- `docs/planning/backlog.md` (IOP-005 title/status only).
- Only after acceptance, under an updated active plan: `ARCHITECTURE.md`,
  `docs/architecture/modules.md`, `docs/architecture/data-model.md`,
  `docs/product/glossary.md` and affected ADR references.

## Dependencies and decisions

Read AGENTS.md, architecture, workflow, templates, modules, data model, glossary
and Accepted ADR-0001/0003/0004/0005/0006/0007/0008/0011/0012.
IOP-004 and its scope decision are already integrated in develop.
The requested `active/IOP-002-backend-stack.md` no longer exists; use permanent
`items/IOP-002-backend-review.md` and Accepted ADR-0006 as current backend evidence.
The seed IOP-005 item enumerates no options; compare the shared-table,
schema/database and deployment alternatives identified in existing architecture.
RBAC, identity, ingestion mechanics, ORM and hosting remain separate decisions.

## Database changes

Design only; no schema, policies, migrations or database provisioned.

## API and UI changes

No endpoints or UI. Describe scope enforcement consistent with ADR-0011/0012.

## Tests and validation

- Consult official PostgreSQL documentation for RLS, transaction context,
  constraints and schema boundaries; distinguish capabilities from design judgment.
- Walk through authorized and foreign organization/site reads/writes, references,
  missing context, pooled concurrency/rollback, imports, jobs and derived outputs.
- Check changed Markdown links, unique ADR ID, mirrored status and diff whitespace.
- Record actual results; no runtime isolation or performance claim, no test runner.

## Implementation steps

1. Verify prerequisites and create story branch and plan.
2. Research mechanisms and write the Proposed ADR with alternatives and tradeoffs.
3. Update permanent item/backlog; validate and archive this proposal plan.
4. Commit the coherent proposal locally; present acceptance and push questions.

## Completion checklist

- [x] Proposal criteria verified with actual results.
- [x] Documentation checks completed; limitations recorded.
- [x] No unapproved scope expansion or inferred ADR acceptance.
- [x] Item/backlog updated and finished slice plan archived.

## Evidence and deviations

Initial working tree was clean. Normal branch creation was sandbox-denied;
the approved escalated Git operation created the required branch successfully.


Proposal outcome: ADR-0013 recommends shared tables, scoped constraints and RLS,
with explicit transaction/role boundaries and operational limitations. Reviewed
14 scenario rows against ADR-0011/0012 and official PostgreSQL RLS, SET, schemas
and constraints documentation. These are design walkthroughs, not executed tests.
IOP-005 is Blocked pending owner acceptance; baseline documents remain unchanged.
The missing historical backend path was resolved through its permanent review;
no scope expansion was needed.

Validation results (2026-09-15): `git diff --check` passed. A read-only Markdown
link/status check over the four changed documents resolved all 161 relative links,
confirmed ADR-0013 is unique, and confirmed Proposed ADR / Blocked item and backlog /
Completed proposal-plan statuses. Final diff review found only the four planned
proposal files; accepted baseline files were not modified. No runtime tests ran.

# IOP-184 — M6 execution

Status: In progress. Branch: `feature/IOP-184-m6-workforce`, from clean `develop`.
Final review branch will contain the complete authorized increment.

## Scope and ownership

[Request](../items/IOP-184-m6-workforce.md). Reuse accepted ADR-0032 inward
boundaries, ADR-0014 scoped grants, ADR-0016 site-time semantics and ADR-0036
snapshot/revision persistence. No existing Proposed ADR is implicitly accepted.
The owner waives intermediate confirmation for this task; record decisions here.

## Files and steps

1. Workforce domain/application ports, PostgreSQL adapters/migration, integration
   CSV/email decoder adapters, host composition/controllers/OpenAPI and tests.
2. Workforce browser domain/application/HTTP/React, role-specific daily and weekly
   boards, import review and planning forms, shared identity components.
3. Shared localization resources/adapters and existing UI text adoption; favicon
   and reusable platform mark. English source and German resource values.
4. Users/RBAC and Handover logical deletion, retained names/revisions, admin UI.
5. Explicit local demo provisioning using private password input; two technicians
   per configured department plus leader coverage; do not overwrite real data.
6. Synchronize architecture, product/development guides, M6 stories/backlog and
   executed evidence. Translate Spanish M6 contexts read during discovery in full;
   preserve IDs/links/meaning and distinguish updated delivery status.

## Validation

Run API/web unit tests, TypeScript/build, generated-contract check, architecture
and identity guards, database integration (including RLS, conflicts and retention),
import real-email parsing without committing private bytes, and desktop/mobile
browser inspection. Record actual results and any bounded limitations.

## Implementation decisions

Use supplied email times over older board times. Preserve local names as scoped
configuration. Missing days stay unknown. Reject unrecognized import rows and
ambiguous local times. Import preview must not write. Re-import is idempotent;
conflicting changes require explicit revision checks. Removal is logical, with
history kept and existing author names unchanged. The final branch stays local.

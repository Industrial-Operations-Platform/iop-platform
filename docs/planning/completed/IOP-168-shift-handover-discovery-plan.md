# IOP-168 — Shift Handover requirements and architecture proposal

Status: Completed (discovery/documentation only), 2026-09-29.
Owner-requested M7 work on 2026-09-29.
Branch: `docs/IOP-168-shift-handover`, created from clean `develop`.
Permanent scope: [IOP-168](../items/IOP-168-shift-handover.md).

## Changes and steps

1. Inspect M7 stories, current home, shared components, authorization and module
   boundaries. Identify contracts missing before operational publishing.
2. Record the owner's concrete workflow in IOP-168 and a linked product contract;
   add the backlog entry. Keep M7 parent stories open.
3. Propose ADR-0036 for durable operational references before Asset/Workforce
   implementation, handover revision history, and explicit handover permissions.
   Pause dependent schema/API/UI implementation until acceptance under ADR-0007.
4. Translate only Spanish stories read during this task, preserving scope, status,
   IDs and links: IOP-060–067 and dependency stories IOP-023, IOP-034, IOP-053.
   Keep these edits distinguishable from the new functional specification.
5. Link the proposal from the module map and backlog. Validate documentation,
   commit the completed discovery increment, and retain implementation as pending.

Expected files: this plan, `items/IOP-168-shift-handover.md`, `backlog.md`,
`docs/product/shift-handover.md`, `docs/architecture/adr/ADR-0036-shift-handover.md`,
`docs/architecture/modules.md`, and the eleven translation-only story files above.
No runtime, credentials, dependencies or deployment changes in this slice.

## Boundaries and follow-up validation

Shift Handover owns entries, follow-up and immutable revisions; Users/RBAC owns
explicit grants; Platform Core owns scoped location configuration; Asset Management
and Workforce retain canonical assets and shifts. Backend use cases and browser
application orchestration follow ADR-0032, using PostgreSQL/HTTP/React adapters.
Workspace composition owns Start integration, with shared design components.

For this slice: check local Markdown links, unique new IDs, mirrored statuses,
complete translation and `git diff --check`. Review coverage against every field
and journey in the owner's request. Record actual evidence before closure.
For later implementation: framework-free use cases, API tests (`npm test`), real
PostgreSQL isolation/revision tests, generated OpenAPI consistency, browser journeys
for all profiles, reload durability and desktop/narrow visual verification.

## Evidence and closure

- Reviewed existing profile grants and Start composition: no handover persistence,
  operational permission or canonical equipment catalog is implemented.
- Owner clarified that Ultimo is the generated reference code for a registered
  change or repair; recorded this in the product contract.
- Documentation link/ID/status check passed for 17 changed/new Markdown files and
  309 local links. All eleven translated files retain their original link targets,
  IDs and statuses. IOP-168 and ADR-0036 are unique.
- `git diff --check` passed. Manually reviewed the six categories, six problem
  fields, six matrix columns, history, four-profile navigation, Start selection,
  future M6 override, shared components and architectural boundaries against the
  request. Proposed mutation rights are clearly distinguished from requirements.
- No runtime files changed; application tests were not run for this documentation
  slice. No operational behavior or browser validation is claimed.

IOP-168 remains In progress and original M7 parents remain Proposed. ADR-0036 is
Proposed; acceptance is required before dependent implementation. A follow-up
implementation plan must record approved decisions, actual files and executable
checks before code changes. No merge, push or deployment was performed.

# IOP-027 — Local principal plan

Status: Blocked — awaiting explicit acceptance of Proposed ADR-0024. Authorized on 2026-09-26 by the owner's request to work on
[IOP-027](../items/IOP-027-user-model.md) within the POC boundary.
Branch: `docs/IOP-027-local-principal`, created from clean `develop` before edits.

## Scope and dependencies

Limit this slice to the stable active development principal required by Accepted
[ADR-0018](../../architecture/adr/ADR-0018-local-poc-execution-context.md).
Full lifecycle, login, memberships, grants and runtime adapter implementation are
outside this story slice. A principal alone never authorizes business access.
IOP-007 sessions are deferred, not a prerequisite; IOP-025's organization seed is
integrated, but its privileged bootstrap authority excludes users. Existing site
storage is integrated too. No prerequisite branch needs merging.

ADR-0013 classifies global identities separately; ADR-0014 leaves detailed lookup
policies/schema for review. Prepare a Proposed decision for principal storage and
initial seed authority before migrations or code. Pause dependent implementation
until explicit acceptance; do not reopen the accepted local adapter decision.

## Files and steps

1. Translate the whole IOP-027 story and the Spanish IOP-007 dependency read during
   review. Preserve IOP-007's meaning/status/links; no functional changes there.
2. Add `docs/architecture/adr/ADR-0024-local-principal-bootstrap.md` with bounded
   storage, insert-only seed authority, failure behavior and verification contract.
3. Update IOP-027 and its backlog row with scope, dependencies and decision status.
   Link the proposal from `docs/planning/poc-delivery.md`; leave product scope intact.
4. Validate links, unique ID, statuses, English prose and diff hygiene; commit the
   documentation increment. Keep this plan active while the decision is pending.

## Validation and evidence

Planned: `git diff --check`, local Markdown target checks for all changed files,
manual ADR/status/scope consistency review and `git status --short --branch`.
No executable changes or runtime evidence are claimed by this proposal. After
acceptance, extend this plan with implementation files and concrete database/API
test commands before edits; use the verification scenarios in ADR-0024.


## Documentation increment evidence — 2026-09-26

Prepared ADR-0024 and synchronized IOP-027/backlog as Blocked. IOP-007 received
translation-only edits; its Deferred status and contracts are unchanged. IOP-025
was reviewed in English and left unchanged. Existing historical Proposed references
to ADR-0018 in dependency documentation do not override its current Accepted status.

`git diff --check` passed. Local Markdown file targets in all six changed documents
were checked; no missing targets. ADR-0024 has one file, remains Proposed and is
linked from item/plan/delivery map. Scope review confirms no login, lifecycle,
membership/grant implementation or runtime privileges. No application tests were
run for this documentation-only increment. The proposed command is not executable yet.

Implementation remains pending the new bootstrap authority decision. Keep the plan
in active/ and the parent open; a committed proposal is not accepted design or
completed POC principal delivery.

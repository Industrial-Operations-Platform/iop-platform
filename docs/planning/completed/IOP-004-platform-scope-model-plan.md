# IOP-004 — Organization/Site scope evaluation plan

Source: [permanent item](../items/IOP-004-platform-scope-model.md).

## Status and authorization

Completed — evaluation slice only. On 2026-09-14 the owner requested evaluation of
IOP-004, an ADR and dependent documentation updates if the decision is accepted.
No acceptance of a scope decision has been provided.
Branch: `docs/IOP-004-platform-scope-model`, created from clean `develop`.

## Proposed implementation

Compare organization-only scope, explicit Organization/Site scope and a generic
scope tree. The seed item names no concrete alternatives; these make its open
design question reviewable. Propose logical identities, ownership, scope contracts
and invariants fitting the accepted analytical v1. Finish the evaluation slice;
leave the parent awaiting acceptance before changing the accepted model.

## Files expected to change

- `docs/architecture/adr/ADR-0012-organization-site-scope.md`: proposal, options,
  consequences, boundary contracts and design scenarios.
- `docs/planning/items/IOP-004-platform-scope-model.md`: English context, evaluation
  outcome, acceptance blocker and links.
- `docs/planning/backlog.md`: IOP-004 row only.
- This plan, moved to `docs/planning/completed/` when evaluation is complete.

After acceptance, a subsequent planned slice will synchronize ARCHITECTURE.md,
modules, data model and glossary. They remain unchanged during this proposal.

## Dependencies and decisions

Read AGENTS.md, ARCHITECTURE.md, workflow, templates, modules, data model, glossary,
Accepted ADR-0001/0003/0004/0005/0006/0007/0008/0011 and IOP-001's completed context.
IOP-002 is complete on develop. The requested `active/IOP-002-backend-stack.md`
does not exist; its permanent backend review and Accepted ADR-0006 supply context.
IOP-005/006/008 were inspected only to preserve tenancy, RBAC and time boundaries.
No adjacent story is activated. Architecture acceptance remains the owner's decision.

## Database changes

None. Logical ownership only; no schemas, constraints, ORM, migrations or physical
tenancy selection.

## API and UI changes

Proposed transport-independent scope semantics only. No endpoints, HTTP scope
transport, authentication provider, role matrix or UI implementation.

## Tests and validation

Review fictional single/multiple-site, cross-organization, denied-site, missing
scope, forged reference, import, background and rename scenarios against the ADR.
Check relative Markdown file links, unique ADR ID, statuses and English content;
run `git diff --check` and review the changed-file list. These are documentation
checks and conceptual walkthroughs, not executed security/runtime tests.

## Implementation steps

1. Verify prerequisites and record this plan before substantive edits.
2. Write the proposal and synchronize the item/backlog without implying acceptance.
3. Review scenarios, links and consistency; record evidence and archive this slice.
4. Commit the validated increment locally; request permission separately for push.

## Completion checklist

- [x] Evaluation and scenario coverage verified.
- [x] Documentation checks completed and limitations recorded.
- [x] Scope deviations recorded before dependent edits.
- [x] Item/backlog synchronized and finished evaluation plan archived.

## Evidence and deviations

Initial tree was clean on develop. Git metadata required sandbox escalation to
create the story branch; creation succeeded. No prerequisite integration needed.
Missing historical IOP-002 path and unspecified seed alternatives are recorded
above; neither changes the requested scope.


Evaluation deliverables are Proposed ADR-0012, the English IOP-004 context and its
Blocked backlog row. Three alternatives and twelve conceptual scenarios were
reviewed against accepted ownership, identity, isolation and API requirements.
No contradictions were identified; actual persistence enforcement, permission
inheritance and runtime behavior remain unverified and outside this slice.
The parent remains Blocked on owner acceptance. No accepted baseline was changed.

Validation on 2026-09-14: relative Markdown file targets resolved in all four
changed documents at their final locations; the ADR ID is unique, ADR status is
Proposed, item/backlog status is Blocked and this evaluation plan is Completed.
`git diff --check` passed. Changed-file review was limited to the four planned
files. No application test runner exists and no runtime tests were claimed.

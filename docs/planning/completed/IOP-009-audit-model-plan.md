# IOP-009 — Audit model proposal plan

Source specification: [IOP-009](../items/IOP-009-audit-model.md).

## Status and authorization

Completed — proposal slice only. The owner requested evaluation, an ADR and documentation updates if
accepted. This slice prepares the proposal; it does not infer acceptance.
Branch: `docs/IOP-009-audit-model`, created from clean `develop` on 2026-09-15.

## Proposed implementation

Define and compare audit capture, delivery, access and retention options for the
CSV analytics pilot. Produce a Proposed ADR with event categories, conceptual
record contract, failure behavior and design walkthroughs. Translate the revised
permanent item into English. Keep accepted architecture unchanged pending review.

## Files expected to change

- This plan; archive to `../completed/` when the proposal slice is validated.
- `docs/planning/items/IOP-009-audit-model.md`.
- The IOP-009 row in `docs/planning/backlog.md`.
- `docs/architecture/adr/ADR-0017-audit-model.md` (new proposal).

Acceptance would require a separate recorded continuation covering ARCHITECTURE.md,
modules, data model, glossary and the item/backlog. Do not perform it by inference.

## Dependencies and decisions

Read AGENTS.md, architecture, workflow, templates, modules, data model, glossary,
accepted ADR-0001/0003/0004/0005/0006/0007/0008/0013/0014/0016 and scope/API
requirements. IOP-005/006 are complete. Authentication remains unresolved on
develop; do not depend on the separate IOP-007 proposal or merge its branch.
ADR-0015 is reserved there; use ADR-0017.

The requested `active/IOP-002-backend-stack.md` is obsolete; read its preserved
`items/IOP-002-backend-evaluation.md`, current backend review and completed
technology-stack plan. The IOP-009 seed contains no enumerated alternatives;
derive the comparison from its audit-event and retention requirements.

## Database, API and UI changes

Conceptual contracts only; no DDL, endpoints, libraries, UI or runtime changes.
No general queue, observability stack, identity provider or new product roles.

## Tests and validation

Review commit/rollback, retries, denied operations, scope separation, redaction,
clock ordering, retention and privileged access. Check changed Markdown links,
unique ADR ID, status consistency, branch ancestry and `git diff --check`.
Use official PostgreSQL and OWASP references for capability/security evidence;
separate proposed retention defaults from any unconfirmed contractual requirement.
No runtime tests or test runner exist; do not write validation code for this task.

## Implementation steps

1. Compare options and draft ADR-0017 as Proposed.
2. Synchronize the permanent item and backlog with the decision pending.
3. Review links, scenarios and statuses; record actual evidence.
4. Archive this completed proposal slice, commit locally and present the concrete
   decision for acceptance. Keep the parent open. Ask separately before pushing.

## Completion checklist

- [x] Evaluation and Proposed ADR cover the requested outcome.
- [x] Documentation checks completed and limitations recorded.
- [x] Item/backlog remain open pending owner acceptance.
- [x] Completed proposal plan archived for the validated local documentation commit.

## Evidence and deviations

Initial tree was clean on develop. No scope expansion. Git branch creation needed
sandbox escalation and succeeded; no merge, rebase or push occurred.

ADR-0017 compares five capture models, three delivery models and four retention
approaches. Its walkthroughs cover positive and negative cases, including partial
imports and outage gaps. Official PostgreSQL transaction/RLS pages and OWASP's
logging guidance were consulted on 2026-09-15. No runtime tests were performed.

`git diff --check` passed. `rg` inspection confirmed one ADR-0017 filename, its
Proposed status, and matching Blocked item/backlog states. Local Markdown targets
were reviewed against existing files, including the archived plan path. The
three external source pages opened successfully. `git merge-base --is-ancestor
develop HEAD` passed. Accepted architecture and unrelated items are unchanged.

The proposal is complete and reviewable; the parent is Blocked only on explicit
owner acceptance. A separate acceptance continuation must be planned before
changing dependent architecture documentation. The obsolete backend-stack path
was resolved through its migration record, not recreated. No other deviations.

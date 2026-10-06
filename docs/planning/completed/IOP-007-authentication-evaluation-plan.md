# IOP-007 — Authentication evaluation plan

Source: [IOP-007](../items/IOP-007-authentication-model.md).

## Status and authorization

Completed — evaluation slice only. The owner requested option evaluation and an ADR, with baseline
updates conditional on explicit acceptance. The subsequent request authorizes
merging pending stories into develop, synchronizing develop with origin and
starting IOP-007 from that integrated baseline.

Branch: `docs/IOP-007-authentication-model`, created from develop and to be aligned
with integrated develop before substantive edits. Preserve existing review branches.

## Scope and files

Evaluate local login, an OIDC provider and Entra, browser sessions, identity mapping,
provisioning and revocation. Produce Proposed ADR-0015, revise the permanent item
in English, and synchronize its backlog row. Provide Spanish explanation in the
conversation. Files: this plan (archived on slice completion),
`docs/architecture/adr/ADR-0015-authentication-sessions.md`, the IOP-007 item and
`docs/planning/backlog.md`. Accepted baseline changes await the owner's decision.

## Dependencies and decisions

IOP-002 and IOP-006 supply accepted stack and RBAC contracts. IOP-005/006 commits
must first be integrated into develop. The obsolete backend plan is preserved as
`items/IOP-002-backend-evaluation.md`; the current review is
`items/IOP-002-backend-review.md`. ADR-0004 does not already select local passwords.
No adjacent implementation or Proposed-ADR acceptance is authorized.

## Database, API and UI

Design contracts only; no schema, code, endpoints, libraries or infrastructure.

## Steps and validation

1. Fetch origin, inspect ancestry and clean worktree; integrate pending IOP-005/006
   into develop without rewriting history, validate, and push develop as requested.
2. Align the story branch with integrated develop; evaluate against official OWASP,
   Microsoft and Nest documentation and accepted ADR-0004/0011/0012/0013/0014.
3. Write the proposal, identity/session lifecycle and negative review scenarios.
4. Check local links, unique ADR IDs, item/backlog status and `git diff --check`.
5. Record evidence, archive this completed evaluation slice and commit locally.
   Keep IOP-007 open for acceptance; ask separately before publishing its branch.

## Completion checklist

- [x] Integration and remote synchronization verified.
- [x] Options and failure scenarios documented with sources.
- [x] Links, status and whitespace checked; no runtime tests claimed.
- [x] Evaluation archived and committed; parent remains decision-pending.

## Evidence

Initial tree clean. Pending commits are IOP-005 2c7494a/4045dc7 and IOP-006
7678df1/67b43d8. Origin fetch succeeded. No merge conflicts or runtime results
are assumed in advance.

## Outcome and validation evidence

IOP-005 merge: `6c84384`; IOP-006 merge: `520471b`. Both merged without
conflicts; develop was pushed to origin and the IOP-007 branch fast-forwarded
to that integrated baseline before substantive edits. Existing branches preserved.
Automatic approval review rejected merging historical IOP-001 persona-validation
as outside its interpretation of the authorized prerequisite integration. That
branch remains untouched and requires specific owner confirmation.

ADR-0015 documents three viable provider paths, rejected shared login, three session
models, ownership/lifecycle contracts and 14 design walkthroughs. Official OWASP,
Microsoft and Nest references were reviewed. No credentials, application files or
runtime tests were created. The parent remains In progress and the ADR Proposed.

Validation: local Markdown file targets in the four changed documents resolve;
ADR-0015 has a unique filename; item/backlog statuses agree; `git diff --check`
passes. Accepted baseline files have no changes in this story. Develop/origin
synchronization and final local commit are verified separately in Git output.

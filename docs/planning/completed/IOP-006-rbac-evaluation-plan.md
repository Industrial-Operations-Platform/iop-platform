# IOP-006 — RBAC evaluation plan

Source: [IOP-006](../items/IOP-006-rbac-model.md).

## Status and authorization

Completed — proposal slice only. The owner requested IOP-006 evaluation, an ADR and translation of
items through IOP-006, leaving later items for their own work. The owner explicitly
authorized a dependent branch after learning IOP-005 is not integrated in develop.
Branch: `docs/IOP-006-rbac-model`, based on `docs/IOP-005-tenancy-isolation`
at `4045dc7`. No merge or publication is authorized for this story.

## Proposed implementation

Complete the proposal slice: compare authorization models, define a minimal pilot
Role → Permission → Scope matrix, delegation limits and failure scenarios.
Translate IOP-006 and audit items IOP-001–005, including IOP-002 supporting reviews.
Those earlier items are already English; no bulk translation edits are necessary.
Later items will be translated when worked on, as already required by AGENTS.md.

## Files expected to change

- This plan, archived in completed/ after the proposal slice is verified.
- `docs/planning/items/IOP-006-rbac-model.md`.
- `docs/planning/backlog.md` (IOP-006 only).
- New `docs/architecture/adr/ADR-0014-scoped-rbac.md`.
- After explicit acceptance in a separate planned increment: architecture,
  modules, data model, glossary and affected scope/isolation references.

## Dependencies and decisions

Reviewed AGENTS.md, architecture, workflow, templates, current IOP-002 backend
review, personas, v1 scope, modules, data model and glossary. Accepted
ADR-0001/0003/0004/0005/0006/0007/0008/0011/0012/0013 constrain this evaluation.
The requested `active/IOP-002-backend-stack.md` is absent; permanent
`items/IOP-002-backend-review.md` and ADR-0006 provide the current backend decision.
IOP-004 and IOP-005 are accepted as design; the dependent branch contains both.
The seed RBAC item enumerates no alternatives; make the comparison explicit.
Authentication/session mechanics remain IOP-007. Basic pilot access and future
enterprise reuse do not authorize a policy engine, Entra integration or admin UI.

## Database changes

Design contracts only; no DDL, policy SQL, ORM or migrations.

## API and UI changes

No endpoints or UI. Define server-side authorization expectations and keep report
configuration in the already accepted file-based workflow.

## Tests and validation

Review positive/negative cases for role composition, scope inheritance, membership,
foreign references, grant escalation, revocation, background work and RLS separation.
Consult official OWASP/Nest authorization references for mechanism context; design
choices are project judgments. Check links, IDs, mirrored statuses, English prose
and diff whitespace. No runtime tests or application runner exist.

## Implementation steps

1. Create authorized dependent branch and this plan before edits.
2. Write Proposed ADR and English item with concrete matrix and constraints.
3. Validate, update backlog, archive completed proposal evidence and commit locally.
4. Present the ADR for acceptance and ask separately about pushing this branch.

## Completion checklist

- [x] Alternatives, matrix and failure scenarios reviewed.
- [x] Translation audit and documentation validation recorded.
- [x] Item/backlog synchronized; proposal plan archived.
- [x] No inferred ADR acceptance or adjacent implementation.

## Evidence and deviations

Initial working tree was clean. Branch exception is explicitly owner-authorized;
no merge/rebase occurred. Previous read-only inspection found English content in
IOP-001–005 and Spanish seed prose in IOP-006 only.


## Validation results and outcome

`git diff --check` passed. A read-only Markdown check resolved 165 relative links
across the four changed files, confirmed unique ADR-0014 and consistent Proposed
ADR / Blocked item and backlog / Completed proposal-plan states. An English prose
review plus language scan covered 10 item/review documents for IOP-001–006;
only IOP-006 needed translation. No later item was modified.

Reviewed all 18 scenario rows against the accepted personas, ADR-0011 denial
semantics, ADR-0012 scope and ADR-0013 authorization/RLS separation. The proposal
covers five permissions in three fixed bundles, explicit composition and
organization-admin delegation, no implicit site inheritance, and revocation races.
OWASP and Nest official authorization documentation informed the comparison; no
framework or policy engine was selected. No runtime tests ran or isolation proof
was claimed. Diff review confirmed only the four planned files changed.

IOP-006 remains Blocked pending owner acceptance. The accepted baseline and prior
completed records remain unchanged. Commit the completed evaluation locally;
publication of this new branch requires separate owner authorization.

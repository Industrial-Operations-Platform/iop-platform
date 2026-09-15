# IOP-006 — RBAC acceptance plan

Source: [IOP-006](../items/IOP-006-rbac-model.md).

## Status and authorization

Completed — documentation acceptance slice. The owner explicitly answered yes to ADR-0014 acceptance and pushing
`docs/IOP-006-rbac-model` to `origin`. Continue on the clean authorized dependent
story branch, whose evaluation commit is `7678df1`; no merge is authorized.

## Proposed implementation

Record acceptance without changing the chosen matrix, synchronize current
architecture guidance, close IOP-006 as design and publish the story branch.

## Files expected to change

- This plan, moved to completed/ after documentation validation.
- ADR-0014 status and closure; follow-up notes in ADR-0004, ADR-0012 and ADR-0013.
- `ARCHITECTURE.md`, `docs/architecture/modules.md`,
  `docs/architecture/data-model.md`, `docs/product/glossary.md`.
- IOP-006 item and backlog row.

## Dependencies and decisions

ADR-0014 is explicitly accepted, including the three fixed role bundles and
organization access-admin delegation. ADR-0012/0013 scope and isolation remain
binding. Authentication/session implementation remains IOP-007; no adjacent work.
Preserve the completed proposal record and previously translated items.

## Database changes

None. Document accepted membership/assignment requirements only.

## API and UI changes

None. No permission engine, identity provider, endpoints or admin UI selected.

## Tests and validation

Check relative links, unique ADR ID, accepted/completed statuses, current-scope
wording and whitespace. Compare synchronized text to the accepted matrix and
revocation/delegation semantics. No runtime tests exist in this documentation baseline.

## Implementation steps

1. Record acceptance and synchronize baseline documents and ADR follow-up notes.
2. Validate documentation, complete item/backlog and archive this plan with evidence.
3. Commit locally and push the authorized branch to origin; report Git verification.

## Completion checklist

- [x] Acceptance and current guidance synchronized.
- [x] Documentation checks completed; runtime limitations preserved.
- [x] Item/backlog completed and plan archived.

## Evidence and deviations

Branch and clean working tree verified before edits. No scope deviations.
Publication verification will be reported in the final session result.


## Validation results

Read-only Markdown checks resolved 215 relative links across 11 changed
documents, confirmed unique Accepted ADR-0014 and consistent Completed item/backlog
states, with no unchecked item acceptance criteria. Diff review compared the
synchronized role bundles, exact-scope composition, admin delegation and revocation
limits with the accepted decision. Historical ADRs retain context with subsequent
RBAC notes. No prior proposal plan or later item was changed. No runtime tests ran.

`git diff --check` passed. The final change set contains only the eleven planned
acceptance documents. The working-tree and upstream checks after commit/push are
reported in the session result rather than claiming runtime verification here.

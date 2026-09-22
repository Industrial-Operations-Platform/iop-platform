# IOP-014 — Local POC security baseline execution plan

Source specification: [IOP-014](../items/IOP-014-security-baseline.md).

## Status and authorization

Completed — documentation reviewed on 2026-09-22. The owner requested IOP-014 on 2026-09-22, using IOP-016 as
context and limiting work to scope-poc.md and poc-delivery.md's product boundary.
Branch: `docs/IOP-014-security-baseline`, created from clean `develop` at
`4383cfb` before edits. This is documentation/design only.

## Proposed implementation

Define dedicated local operation, trust boundaries, secret/configuration hygiene,
bounded CSV/request validation and scoped access. Record review scenarios and
delivery ownership without implementing neighboring stories or accepting ADR-0018.
All three item criteria map to the baseline, its scenario review and closure evidence.

## Files expected to change

- `docs/architecture/security-baseline-poc.md`: local controls and verification handoff.
- `docs/planning/items/IOP-014-security-baseline.md`: English context, outcomes/status.
- `docs/planning/backlog.md`: mirror IOP-014 status only.
- `docs/product/scope-poc.md` and `docs/planning/poc-delivery.md`: link the baseline.
- This plan, moved to `docs/planning/completed/` on completion.

## Dependencies and decisions

IOP-004/005 are Completed design on develop; Accepted ADR-0012/0013 supply scope
and RLS contracts. ADR-0014 supplies permissions. ADR-0001/0003/0004/0005,
ADR-0007/0008 and the accepted API strategy remain in force. IOP-016 implements
loopback process health and sanitized bootstrap failures only. IOP-018 consumes
this local configuration baseline; it is not activated here. IOP-007 sessions are
deferred. ADR-0018 remains Proposed and blocks dependent runtime business access,
not this independent design. No new architectural pattern is introduced.

## Database changes

None. Preserve required scoped constraints, transaction-local context and RLS.

## API and UI changes

None. Specify future validation evidence without endpoints, UI or identity adapters.

## Tests and validation

Review each baseline scenario against POC scope, dependency ADRs and actual IOP-016
boundaries. Check changed Markdown local links, IDs and mirrored status, then run
`git diff --check`. No application tests are required for documentation-only changes;
do not claim runtime control verification. Numeric input budgets belong to the
delivering contract and must be explicit and tested before those paths are delivered.

## Implementation steps

1. Read dependencies and create the story branch and this plan.
2. Write the bounded baseline and review positive/negative scenarios.
3. Synchronize the item, index and discovery links; record evidence and complete plan.
4. Commit validated documentation locally; ask before pushing to origin.

## Completion checklist

- [x] Planned acceptance criteria verified with actual results.
- [x] Relevant reviews completed; limitations recorded.
- [x] No unauthorized scope deviations.
- [x] Item/backlog updated and plan moved to completed/ with links fixed.

## Evidence and deviations

Dependency inspection found no missing integration prerequisite for this design.
The initial branch command encountered the filesystem sandbox; the authorized
retry created the branch successfully. No source or runtime configuration edits.


Completion evidence:

- Added the baseline with dedicated-operation, configuration/secrets, bounded-input
  and scoped-access requirements, plus twelve scenario walkthroughs and explicit
  delivery ownership. Reviewed each scenario against POC scope and ADR-0012/0013/0014;
  the pending ADR-0018 gate remains explicit for all runtime business access.
- Reviewed IOP-016's README and main entry point to distinguish existing loopback
  health/startup behavior from future business controls. No runtime test was rerun
  or claimed; no application files changed.
- Checked 183 relative Markdown links across the six changed/new documents with a
  read-only path-existence check: zero missing targets. No new anchor links added.
- Reviewed IDs and statuses: IOP-014 item/backlog are Completed as local POC design;
  ADR-0018 remains Proposed and adjacent implementation stories remain unchanged.
- `git diff --check` passed. The final staged diff is restricted to the six planned
  documentation files. No new ADR, architectural pattern or scope deviation.
- All three acceptance criteria are met by the documented trust/control requirements,
  scenario/limitation review and synchronized item/backlog/completed plan. Numerical
  budgets and executable security evidence remain requirements of future delivery,
  not an assertion of completed runtime controls or shared-use security.

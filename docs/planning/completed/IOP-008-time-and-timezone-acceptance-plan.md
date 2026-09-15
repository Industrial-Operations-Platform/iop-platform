# IOP-008 — Temporal model acceptance plan

Source specification: [IOP-008](../items/IOP-008-time-and-timezone-model.md).

## Status and authorization

Completed — acceptance/documentation slice. The owner answered yes to acceptance of ADR-0016 and publication of
`docs/IOP-008-time-and-timezone-model` to `origin`. Continue the same story branch,
created from develop at `520471b`; proposal commit is `a35c59c`. No merge authorized.

## Proposed implementation

Record explicit acceptance, synchronize temporal guidance and close IOP-008 as
design. Preserve unknown CSV window/zone and deferred runtime/shift implementation.

## Files expected to change

- This plan, archived under completed/ after validation.
- `docs/architecture/adr/ADR-0016-time-and-timezone-model.md`.
- `ARCHITECTURE.md`, `docs/architecture/data-model.md`,
  `docs/architecture/modules.md`, `docs/product/glossary.md`.
- Temporal follow-up notes in ADR-0011 and ADR-0012.
- IOP-008 permanent item and its backlog row.

## Dependencies and decisions

ADR-0016 explicitly accepted by the owner in this turn. Accepted baseline and
proposal evaluation were read during this story. IOP-007 remains independent.
Prior evaluation plan remains historical evidence; no adjacent work is activated.

## Database, API and UI changes

Documentation of accepted contracts only; no runtime, schema, tools or UI changes.

## Tests and validation

Check links in all changed Markdown files, matching Accepted/Completed states,
remaining temporal deferrals, scoped diff and `git diff --check`. No runner exists.
After the local commit, push only the authorized story branch and verify remote
HEAD matches the local commit and the working tree is clean.

## Implementation steps

1. Record acceptance and synchronize the listed documents.
2. Validate links/statuses/consistency and archive this completion record.
3. Commit the validated acceptance increment and push the authorized branch.

## Completion checklist

- [x] Acceptance and architecture documentation synchronized.
- [x] Documentation checks passed and limitations recorded.
- [x] Item/backlog Completed; plan archived.

## Evidence and deviations

Accepted ADR-0016 and synchronized architecture, modules, data model, glossary,
ADR-0011/0012 follow-up notes and matching Completed item/backlog states.
Reviewed the scoped diff against the accepted proposal: no temporal policy changes,
source assumptions or new features. `git diff --check` passed; a one-off relative
Markdown link scan of all ten changed files after archival passed, including
acceptance-plan links. No runtime tests exist or were claimed.

The historical evaluation remains unchanged. All design acceptance criteria are
met; unknown CSV boundaries and future implementation verification remain explicit.
This record is archived under completed/. Local commit and authorized story-only
push follow validation; hashes and remote verification are reported in the delivery
summary. No implementation, merge, rebase or other story changes.

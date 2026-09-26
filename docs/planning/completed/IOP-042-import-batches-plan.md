# IOP-042 — Import batch execution plan

Status: Completed — design and owner acceptance; implementation remains open. Owner requested IOP-042 on 2026-09-26, limited to the
[POC scope](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Story: [IOP-042](../items/IOP-042-import-batches.md).
Branch: `docs/IOP-042-import-batches`, created from clean `develop` before edits.

## Scope and dependencies

Define the bounded direct-import lifecycle, counts, atomic admission/publication
and failure/retry contract. IOP-041 is integrated and completed as logical design;
RAW persistence and the importer are absent. Its referenced CSV preservation and
source contracts control this work. ADR-0026 supplies a pinned authorized operation
but does not select cross-module publication or uncertain-commit recovery.
ADR-0018 is Accepted; host activation remains an independent runtime gate.

New publication/recovery mechanics require a Proposed ADR under AGENTS.md and
ADR-0007. Prepare a reviewable decision and pause dependent implementation until
accepted. No workers, automatic replay, general integration registry, UI, endpoint,
parser or analytics implementation belongs to this documentation increment.
Do not mark the story completed on design evidence alone.

## Files and steps

1. Create this plan, then translate the entire IOP-042 item into English while
   preserving its requirements. The direct dependency IOP-041 is already English.
2. Add `docs/architecture/import-batches-poc.md`: attempt identity, states/counts,
   admission, failure, reconciliation, permission boundaries and review scenarios.
3. Add `docs/architecture/adr/ADR-0027-poc-import-publication.md`: alternatives and
   recommended bounded transaction, quota and recovery mechanism, explicitly Proposed.
4. Synchronize IOP-042, backlog, delivery map and the conceptual data-model link.
   Keep the implementation criteria open and this plan active pending the decision.
5. Validate the documentation and commit this coherent increment locally. Request
   the architectural decision separately from publication permission.

## Validation

Check local Markdown links in changed documents, unique ADR ID, item/backlog/plan
status consistency, English authoring and `git diff --check`. Review successful,
invalid, duplicate, concurrent, interrupted and uncertain-commit paths; counts must
not imply partial publication. Review permission loss and scoped recovery without
owner credentials. No application code changes: runtime tests would not validate
this design. Implementation later requires `npm test`, actual-role PostgreSQL
concurrency/fault tests and host access checks before runtime completion.

## Evidence and continuation

2026-09-26: completed the documentation increment, including full English translation
of IOP-042. IOP-041 required no translation. Checked 214 local Markdown links across
the seven changed documents with a Python path-existence check: all passed. Verified
unique ADR-0027, Proposed status, matching Blocked story/backlog and open implementation
criteria. `git diff --check` passed. Manually reviewed all batch-model scenarios
against RAW/source/preservation contracts and inspected the current site-operation
helper: its generic unavailable error cannot establish whether a commit succeeded.

The proposal handles that uncertainty conservatively through scoped reconciliation;
it introduces no runtime changes. No application tests run or runtime success
claimed for this documentation increment. The plan stays active because acceptance
and implementation remain outstanding. After acceptance, refine implementation files
and executable checks before code changes; preserve these design review results.
Acceptance of the ADR is not acceptance of a merge or push.

## Owner acceptance — 2026-09-26

The owner explicitly answered yes to ADR-0027 acceptance and publication of
`docs/IOP-042-import-batches` through develop to origin. This completes the design
increment only. Updated decision/model/status references, checked local links and
`git diff --check`; implementation requires a separate active plan before code edits.

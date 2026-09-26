# IOP-043 — POC canonical aggregate model

Status: Completed — 2026-09-26. Authorized by the owner's 2026-09-26 request to work on
[IOP-043](../items/IOP-043-canonical-event-model.md), limited to the
[POC](../../product/scope-poc.md) and [delivery map](../poc-delivery.md).
Branch: `docs/IOP-043-canonical-event-model`, created from clean `develop`
at `c45da20` before edits.

## Scope, dependencies and steps

Design only: specialize the existing CSV contract into OIP's canonical aggregate
model. No application, migration, endpoint, physical asset registry or future-vendor
model. Reuse Accepted ADR-0001/0003/0004/0005/0007/0008/0012/0013/0016/0023/0027.
No new architectural mechanism is planned; propose an ADR and pause dependent work
if inspection reveals one is needed.

Direct dependencies reviewed: IOP-008 and IOP-012 are completed design; IOP-019 is
completed local migration infrastructure; IOP-026's POC site seed is implemented
while its broader parent is Deferred. All relevant slices are on develop. Existing
IOP-041/042 contracts supply scoped RAW provenance and atomic publication. ADR-0018
is Accepted, but host activation remains a separate runtime gate. None blocks this
documentation slice. Direct dependency stories are English and need no translation.

Expected files and sequence:

1. Translate the entire IOP-043 item into English, preserving meaning and links;
   distinguish translation from current-state/status updates.
2. Add `docs/architecture/event-aggregates-poc.md`: grain/identity, fields,
   source grouping, exact measures, unknown coverage, provenance, receiver
   invariants and synthetic review scenarios. Specify logical dimension equality
   under ADR-0023 without choosing a wire encoding or adding dimension storage.
3. Link the bounded model from `docs/architecture/data-model.md` and
   `docs/planning/poc-delivery.md`; synchronize the item and backlog.
4. Review acceptance, record actual validation, move this plan to completed,
   and commit the coherent documentation increment locally.

## Validation

Review synthetic cases for repeated rows, equipment labels in different areas,
message type/group distinctions, unclassified sectors, exact sums/overflow,
missing dates, invalid references, atomic rejection and unknown source windows.
Check Markdown link targets, IDs/status consistency, English prose and
`git diff --check`. Confirm changes are documentation only and branch ancestry is
develop. These are design checks, not importer/runtime tests; no test code or
`npm test` is needed without API changes. Preserve future implementation gates.

## Outcomes and closure

Delivered the logical model in `docs/architecture/event-aggregates-poc.md` and
linked it from the conceptual data model and POC delivery map. IOP-043 and its
backlog row are Completed as bounded design only. The entire story's Spanish
prose was translated; other story files were not changed. No architecture pattern,
ADR acceptance, runtime implementation or adjacent-story completion is inferred.

Manual review covered all ten scenario rows: three contributing lines reconcile
to 3 facts, frequency 7 and 93,964 seconds; unclassified-only selection yields
3 and 93,784. Repeated tuples retain both lines; invalid/foreign/blank-line
references reject publication; source equipment and message grouping preserve
context; literal sector labels remain distinct from unclassified. Zero values,
unknown windows, missing dates, exact-range overflow, frozen mappings and
same-date replacement limits match the source/batch/filter contracts.

Validation: `git diff --check` passed; local Markdown target checks passed for
all 219 local targets across the six changed/new documents. Item/backlog completion and all three acceptance
checkboxes agree; changed files are documentation only. English prose reviewed.
`git merge-base --is-ancestor develop HEAD` passed before the story commit;
no unmerged prerequisite was imported. No API/runtime tests were run for this
explicitly documentation-only story. Runtime receiver/storage, reference encoding,
sector-key continuity and end-to-end reconciliation remain delivery obligations.

No scope deviation. This finished plan moves to `completed/`; the validated
increment is committed locally on the story branch, pending owner publication
approval under ADR-0008.

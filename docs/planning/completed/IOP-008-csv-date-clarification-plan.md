# IOP-008 — CSV reporting-date clarification plan

Source: [IOP-008](../items/IOP-008-time-and-timezone-model.md).

## Status and authorization

Completed — clarification recorded. The owner clarified manual filename dating, required rejection of an
already imported date, and the possibility of checking a separately selected date.
Continue `docs/IOP-008-time-and-timezone-model`, originally based on develop at
`520471b`, after acceptance commit `6bc549d`. Documentation clarification only.

## Scope and files

Update this plan, the IOP-008 permanent context and
`docs/product/csv-and-reporting-reference.md`. Preserve Completed item/backlog
status and Accepted ADR-0016; the source date does not establish exact period bounds.
Capture the requested duplicate-date behavior as pilot input for later ingestion
contracts, without activating IOP-047 or defining database constraints here.

## Decisions and boundaries

Manual filename dating and rejection of a previously imported reporting date are
confirmed. An additional date selector is an option, not a required UI yet. Any
future comparison must reject a mismatch rather than silently prefer one date.
Apply existing source/site isolation; a date is not globally unique across customers.
No schema, endpoint, implementation, new architectural pattern or automatic replace.

## Steps and validation

1. Record the clarification in source evidence and link it from IOP-008.
2. Review duplicate, mismatched-date and unknown-window scenarios; validate links
   and whitespace, record results and archive this plan.
3. Commit the documentation increment; report publication status.

## Completion checklist

- [x] Confirmed requirements distinguished from optional UI and future design.
- [x] Links, statuses and whitespace checked; plan archived.

## Evidence

No runtime runner exists; validation is documentation review only.


Reviewed: an existing source/site/date rejects another file, an optional selected
date mismatch stops admission, and agreeing dates do not prove the report window.
Concurrent/partial imports remain future contract work. Item/backlog remain
Completed and ADR-0016 remains Accepted. Relative links in the three changed files
resolve and `git diff --check` passes. No runtime tests or implementation changes.

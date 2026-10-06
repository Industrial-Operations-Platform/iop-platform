# IOP-144 — Next POC stories plan

## Status and branch

Completed. Branch: `docs/IOP-144-poc-next-stories`, created from clean `develop`.

## Scope and files

Recommend four existing stories under the visual-first delivery preference; no
implementation, architectural acceptance or activation of those stories.
Create `items/IOP-144-poc-next-stories.md`, update `backlog.md`, and preserve this
plan in `completed/` after validation.

The translation-on-read rule also requires translation-only edits to the consulted
stories IOP-089, 094, 095, 096, 097, 116, 123 and 125. Preserve all IDs, links,
statuses and meaning, including historical baseline statements. Other consulted
stories IOP-008, 012, 017 and 142 are already English.

## Steps and dependencies

1. Review AGENTS.md, scope, delivery map, backlog, workflow, architecture,
   ADR-0007/0008/0018, selected stories and their direct dependency contexts.
2. Record a bounded recommendation separating fixture-backed progress from full
   runtime delivery. Identify unresolved dependencies without activating them.
3. Translate the eight consulted mixed-language stories in full.
4. Check local links, preserved story IDs/statuses, translation completeness and
   whitespace; record evidence, complete the documentation item and commit locally.

## Validation

Compare translated files against Git HEAD for unchanged links and statuses; review
the complete diff for semantic preservation. Verify recommendation against the
delivery map. Runtime tests are not applicable to this documentation-only change.
ADR-0018 remains Proposed; full POC delivery is outside this recommendation.

## Evidence — 2026-09-25

- Recommended IOP-116 → IOP-125 → IOP-097 → IOP-096 as bounded visual/fixture
  slices; recorded runtime dependencies and the unaccepted ADR-0018 gate.
- Reviewed the complete translation diff: eight consulted stories retain meaning,
  status and scope. Python comparisons against HEAD confirmed identical link
  targets, story ID sequences and statuses; the Spanish-prose scan passed.
- Python local-link validation passed: 259 targets across 11 changed/new files.
- `git diff --check` passed. No application code changed; runtime tests not run.
- Only IOP-144 is completed; recommended and dependency story statuses are unchanged.

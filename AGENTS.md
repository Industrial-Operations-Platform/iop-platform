# Agent navigation

IOP is a generic modular platform. OIP is its Operational Intelligence module.
The local platform includes Data Analysis, local access administration, Shift
Handover, Workforce, Maintenance and Digital Asset Record through IOP-194. See the
delivery map and backlog for remaining scope and acceptance; health is process
liveness only.

1. Read [ARCHITECTURE.md](ARCHITECTURE.md) before architectural changes and relevant
   [ADRs](docs/architecture/adr/) before modifying boundaries. Proposed is not Accepted.
2. Resolve the requested ID in [backlog](docs/planning/backlog.md); read its
   permanent `docs/planning/items/` context and referenced ADRs.
3. Before changes, create/update `docs/planning/active/IOP-NNN-slug-plan.md` with
   scope, files, steps and validation. Follow [workflow](docs/planning/workflow.md)
   and Accepted [ADR-0007](docs/architecture/adr/ADR-0007-planned-workflow.md).
4. No unplanned edits, unrelated cleanup or scope expansion. For a new explicit
   request without an item, document that request as an item and plan first.
   Read-only inspection/explanation needs no plan. Do not self-assign adjacent work.
5. Document new architectural patterns in a Proposed ADR; pause dependent work
   until accepted. Do not request approval again for an already authorized decision.
6. Keep customer-specific logic, labels and source schemas in scoped configuration
   or integration adapters, outside the generic core.
7. Prefer small reviewable changes; preserve unrelated work and synchronize docs.
8. Run relevant tests before implementation is complete (`npm test` for the API);
   documentation work checks links, IDs, statuses and consistency.
9. Record evidence, update the item/backlog and move finished plans to
   `docs/planning/completed/`. Keep permanent contexts in `items/`; an unfinished
   parent task stays open even if a research slice is complete.

Use the [glossary](docs/product/glossary.md), [modules](docs/architecture/modules.md)
and [data model](docs/architecture/data-model.md). See [templates](docs/planning/templates/)
for task contexts and execution plans.

## Project language

Write all new or revised project-authored content in English, regardless of the
conversation language: code and identifiers, comments, documentation, task contexts,
plans, ADRs, tests, default UI text, errors/log messages, commit messages and PRs.
Conversation with the user may remain in their preferred language.

Preserve proper names, external source fields and customer-provided data faithfully;
these are data, not core terminology. Explicit localization resources may contain
their target languages; English remains the source/default language. This rule does
not select a programming language or require a repository-wide historical rewrite.
When reading a story containing Spanish prose, translate the entire story file
to English, preserving meaning, status, IDs and links. Include dependency stories
read during the task; record these translation-only edits in the current plan.
Do not automatically scan or translate the whole backlog. Never add new Spanish project prose merely because
the conversation is Spanish.

## Commit completion

After completing and validating a coherent set of authorized changes, create small,
logical commits without waiting for a separate commit request. Use English commit
messages and report the resulting hashes and working-tree status. Commit a completed
documentation increment even when the parent task remains open for user input.
Do not include unrelated user changes, infer acceptance of Proposed ADRs, or push,
publish or deploy without authorization. If validation or Git access blocks a commit,
report the pending changes and reason instead of silently leaving them uncommitted.

## Story branches and review

Use at least one temporary branch per story, including documentation. Before edits,
verify the branch and create/switch to `docs/IOP-NNN-slug`, `feature/IOP-NNN-slug`
or `fix/IOP-NNN-slug` from `develop`; record it in the execution plan. Do not mix
stories or commit directly to `master`, `develop` or `stage`.

The owner reviews and performs merges. The promotion path is story → develop →
stage → master; creating these branches does not configure deployment environments.
Do not merge, rebase, rewrite history or delete review branches on the owner's behalf
without an explicit request. Keep validated local commits automatic within scope.
At session end, ask whether to push, naming the branches and remote; wait for explicit
permission. Never infer push authorization from a commit or merge request.
See [ADR-0008](docs/architecture/adr/ADR-0008-story-branches.md).

## Concise documentation

Follow [the shared workflow](docs/planning/workflow.md). Keep only information needed
for execution, review and traceability. Omit irrelevant template sections; link to
canonical context, decisions and evidence instead of repeating them. Cite sources
when needed. This AGENTS.md is versioned and shared by macOS and Windows checkouts.
Keep instructions portable; machine-local paths, credentials and private data stay
outside shared guidance. The workflow and Accepted ADRs remain canonical.

## Publication approval convention

When requesting publication approval, name the story branch and state that approval
includes merging it into develop and pushing both branches to origin. The owner's
"yes" authorizes that complete sequence unless explicitly narrowed. Do not ask
again for that merge. This supersedes owner-only merging for the approved step;
stage/master promotion, force pushes, history rewrites and branch deletion still
require separate authorization. See the shared workflow and ADR-0008.

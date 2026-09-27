# IOP-151 — Documentation cleanup

Status: Completed
Branch: `docs/IOP-151-documentation-cleanup`, from clean develop at `f0dfa3d`.
Item: [IOP-151](../items/IOP-151-documentation-cleanup.md).

## Scope and steps

1. Compare current source/commands and IOP-149/150 delivery with root, product,
   development, application and infrastructure documentation.
2. Consolidate README/ROADMAP/ARCHITECTURE, scope-poc and poc-delivery as current
   entry points. Remove the redundant milestones summary, linking backlog instead.
   Move the dated readiness audit beside its completed execution record and repair
   references, preserving its unique historical findings.
3. Reduce API/web/Docker README duplication; update database migration/runtime
   guidance, source-reference handoffs and pilot-feedback status; correct stale configuration/security
   handoffs and old host paths. Keep optional native tooling instructions explicitly
   separate from the primary Docker workflow. Retain ADRs and permanent story items.
4. Check local Markdown links, referenced paths/commands, IDs/statuses and whitespace;
   run staged secret checks. No runtime changes or database operations are needed.
5. Record evidence, complete the item/backlog, archive this plan and commit locally.

Consulted IOP-029/130/146/147/150 contexts are English; no story translation was
needed. Removed the redundant mixed-language milestones summary in favor of the
existing English backlog. Permanent item edits only repair current handoffs/links.

## Outcome and validation

Current guides now lead with the delivered Docker workflow, Administrator, persistent
history, template filter policy and reusable hexagonal presentation boundaries.
Removed the redundant milestones document and extensive obsolete README walkthroughs.
Archived the dated readiness audit alongside IOP-146 evidence with repaired links.
Kept permanent story contexts, ADR decisions, unique audit evidence and optional
native/fixture tooling. Corrected stale migration counts, deferred runtime handoffs
and the already-recorded negative owner feedback; IOP-130 remains In progress.

- Checked 323 Markdown files: no missing local link targets or heading anchors.
- Checked 150 indexed task IDs for uniqueness and agreement with item statuses.
- Resolved 27 referenced npm script names against workspace manifests; compared
  current paths, composition and 11 migrations against the source tree.
- `git diff --check` passed. All changed files are Markdown; no application, private
  data, configuration, containers or database state was changed.
- Runtime tests were not rerun for this documentation-only change. Prior executable
  evidence remains linked rather than presented as new validation.

The initial status-check script treated the heading "Status and request" as a status;
corrected the checker and reran successfully, with no task status change to hide it.
`npm run check:secrets` passed for 523 indexed files; final staged diff/whitespace
review passed. The cleanup removes approximately 700 net documentation lines.
Publication of this story is separate from its local completion.

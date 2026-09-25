# IOP-143 — Concise workflow plan

Completed. Owner request: 2026-09-25. Branch: `docs/IOP-143-concise-workflow`,
from clean `develop`. Context: [IOP-143](../items/IOP-143-concise-workflow.md).

## Scope and steps

1. Keep AGENTS.md locally, remove it from Git tracking and ignore it.
2. Make workflow.md the tracked source for English authoring, translation on reading
   a story, and concise documentation. Shorten templates; fix README navigation and
   add an owner-approved superseding note to ADR-0007.
3. Record the owner's visual-first, functional POC delivery preference in the delivery
   map without activating CRUD or adjacent implementation stories.
4. Check links, ignore/tracking behavior, statuses and whitespace; commit locally.

Files: `.gitignore`, local `AGENTS.md`, `README.md`, planning workflow/templates,
backlog, this item/plan, `poc-delivery.md`, ADR-0007. Existing accepted technical
boundaries remain; no application/database changes or runtime tests are needed.

## Evidence

Validated relative links, status consistency and whitespace. AGENTS.md exists on
disk, is absent from the index and matches /AGENTS.md in .gitignore. No runtime
changes or tests. No push or merge is authorized for this new story.

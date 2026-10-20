# IOP-216 — Approved local develop integration

In progress. The owner's 2026-10-20 instruction explicitly authorizes merging all
pending commits from IOP-215 and IOP-216 into local `develop`.
Story branch: `feature/IOP-216-shell-branding`, originally from `develop` `0df0299`.
Reviewed implementation tip: `ac2c9a5` (1 pending implementation/planning commits).
[Permanent scope](../items/IOP-216-shell-branding.md).

## Changes and steps

1. Record this approval and plan on the existing story branch. Retain its completed
   implementation evidence and preserve both source branches.
2. Integrate IOP-215 first, then IOP-216 with explicit merge commits. Preserve both
   backlog rows, visual contracts, filter styles and search-panel positioning when
   resolving shared files. No new product behavior or architectural change.
3. Validate the combined tree with root `npm test` and the full web browser suite;
   check shared-file resolution, Markdown links, statuses and whitespace.
4. Record integration evidence in this plan and the permanent item/backlog on the
   source branch, then merge that documentation increment into develop. Verify
   both story tips are ancestors of develop and leave the main checkout clean.

This request specifies local merges. Publication of the source branches/develop
still requires explicit push approval under ADR-0008. Stage/master promotion,
history rewriting and branch deletion remain outside this request.

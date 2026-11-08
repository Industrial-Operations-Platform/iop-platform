# IOP-223 — Synchronize Mac source and share agent instructions

Completed. Authorized by the owner's 2026-11-08 request to update the Mac
checkout from the primary Windows development source and publish `AGENTS.md`.
The owner clarified that only source and instructions are in scope.
Story branch: `docs/IOP-223-shared-agent-instructions`, created from `develop`
after its fast-forward from `6e65e52` to `origin/develop` at `4a68dc1`.
[Permanent scope](../items/IOP-223-shared-agent-instructions.md).

## Changes and steps

1. Fetch origin and fast-forward local develop. Preserve the original
   `docs/IOP-222-windows-database-transfer` branch and its two unpublished commits;
   its transfer documentation is outside this story.
2. Remove the root `AGENTS.md` ignore rule and version the portable instructions,
   replacing only their local/untracked description. Preserve existing rules.
3. Synchronize the shared/local wording in `docs/planning/workflow.md` and append
   the explicit owner-authorized refinement to Accepted ADR-0007. No application
   architecture or ADR-0008 publication rules change.
4. Check documentation and the exact staged diff, commit locally, then publish
   this story and its integration into develop to origin under the owner's
   explicit publication request. Verify remote refs and the published file.

Expected files: `AGENTS.md`, `.gitignore`, `docs/planning/workflow.md`,
`docs/architecture/adr/ADR-0007-planned-workflow.md`, the item, backlog and this plan.
No application, dependency, database, Docker or Railway changes. No dependency
story requires translation; the inspected IOP-222 transfer context is English.

## Validation and evidence

- Check relative Markdown links, IOP-223 ID/status agreement and consistency of
  current guidance; retain historical records of previously local instructions.
- Confirm Git includes `AGENTS.md` without force-adding it and review its contents
  for private paths or credentials. Run the existing secret-hygiene guard and
  `git diff --check`.
- Verify the final story/develop refs against origin and confirm `AGENTS.md` is
  tracked there. API tests are unnecessary for this documentation-only change.

The documentation review passed: all 255 relative Markdown links resolve across
the six documents, IDs/statuses agree, and `git diff --check` passes. A second
agent reviewed the exact changes and found no actionable issues. `AGENTS.md` is
visible to Git without force-adding and contains no machine-local paths or secrets.
No application services or private configuration were changed.

## Closure

Commit `b1d587c` versions the instructions and synchronized workflow. The indexed
secret-hygiene guard passed for all 1,444 files. Integrated the story into develop
by fast-forward and pushed both refs atomically to origin on 2026-11-08.
`git ls-remote --heads origin develop docs/IOP-223-shared-agent-instructions`
confirmed both at `b1d587c01c220dc6ef31a72a1f34c74182dfd501`; local and both
remote-tracking `AGENTS.md` blobs match `fff3b4537e9dd8ff1de6371662a48e742186592f`.

Item/backlog are complete and this plan is in completed/. Publish this evidence
increment through the same story/develop refs. The earlier transfer branch and all
review branches remain intact. Windows retrieval is through a normal fast-forward
pull of develop; execution on that PC is not claimed.

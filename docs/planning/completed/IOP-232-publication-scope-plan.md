# IOP-232 — Forward-only publication correction

Completed correction and publication preparation. Authorized by the owner's affirmative answer to removing only the
extra additions with a normal corrective commit, retaining branches and history.
Branch: `fix/IOP-232-publication-scope`, from clean develop at `591737e`.
[Permanent scope](../items/IOP-232-publication-scope.md).

## Changes and steps

1. Remove `output/TRANSFERENCIA-IOP.md` and the superseded IOP-231 item/active plan
   added by the overly broad publication. The owner's explicit removal request
   supersedes normal permanent-context retention for that withdrawn increment;
   the original text remains available in Git history and its retained branch.
2. Remove its backlog entry and restore the IOP-226 row to its `7ad6b01` wording,
   rather than revising another story. Update only the logo/navigation publication
   wording to reflect the actual, corrected scope. Keep concise correction context.
3. Verify app/tooling/configuration/package trees remain identical to `7ad6b01`,
   removed paths and changed Markdown links/whitespace. Reuse that unchanged
   application's recorded successful build, 319 web unit tests and 35 browser cases.
4. Commit on this branch, fast-forward local develop and atomically push only
   `fix/IOP-232-publication-scope` and `develop` to origin. Verify their remote
   hashes, clean develop and unchanged tips for every other pre-existing remote
   branch. No force push, branch deletion or history rewrite.

## Initial evidence

Fetch succeeded; local/origin develop both resolve to `591737e`. Relative to the
approved `7ad6b01`, the unwanted publication changed only six documentation paths;
application and tooling content is unchanged. Existing published branch refs are
retained, including the historical review/transfer branches.

## Validation and closure

- App, scripts, infrastructure, configuration and package content exactly match
  `7ad6b01`; the logo, caption and both navigation animations remain unchanged.
- All three withdrawn note/item/plan paths are absent. Unrelated backlog wording
  matches the baseline; only the two approved publication statuses and this
  required correction record remain as new documentation.
- 250 changed-document Markdown targets resolve and `git diff --check` passes.
  No application retesting is needed for this documentation-only correction.
- Before pushing, a remote snapshot captured 166 branch tips at origin, with
  develop at `591737e`. Final verification compares all of those tips and permits
  only develop to advance plus the new corrective branch.

The correction is ready for one normal commit, approved integration into develop
and an atomic push of only the two named refs. The actual commit hash, remote
parity and unchanged-other-branch verification are reported in the session after
publication. Earlier merge ancestry and existing branch refs remain intact.

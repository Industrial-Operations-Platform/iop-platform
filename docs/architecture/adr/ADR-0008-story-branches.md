# ADR-0008: Story branches and owner-reviewed promotion

## Status

Accepted

Explicit owner instruction: principal branch master, integration develop, an
intermediate branch (named stage), temporary branches per story and no automatic push.

## Context

Documentation and implementation need isolated review before entering the principal
branch. Earlier work was committed on main; the owner now requests a branch-based
workflow while retaining control of merges and remote publication.

## Decision

Rename local main to master, preserving existing history. Create develop and stage
at the same baseline. Start new story work from develop on at least one temporary
branch per story: docs/IOP-NNN-slug, feature/IOP-NNN-slug or fix/IOP-NNN-slug.
Record the branch in its execution plan. Apply this to documentation as well as code.

The owner reviews and performs promotion through story → develop → stage → master.
Do not commit directly to long-lived branches or automatically merge/rebase/delete
review branches. Continue committing validated, authorized increments locally.
Ask at session end before pushing identified branches to the remote; no response
means no push. Do not change remote default-branch settings by inference.

## Consequences

Each story has a reviewable diff. Unmerged prerequisite work may require owner
integration before another story can depend on it. Separate local refs do not
configure CI, environments or remote protection. Existing commits remain on the
baseline rather than being destructively redistributed. The workflow applies to
new work from this point forward, not retroactively.

## Alternatives considered

- Continue direct principal-branch commits: conflicts with the requested review step.
- One shared temporary branch: mixes stories and complicates isolated review.
- Automatic merges or pushes: removes the owner's requested control.
- Rewrite existing history into story branches: unnecessary and not requested.

## Owner-approved publication convention — 2026-09-25

An affirmative answer to a publication request authorizes the agent to merge the
reviewed story into develop and push both refs to origin, unless the owner narrows
the request. State that complete destination when asking. This supersedes the
owner-performed merge requirement for that approved step only; stage/master,
force pushes, history rewrites and branch deletion need separate authorization.
See the [workflow](../../planning/workflow.md).

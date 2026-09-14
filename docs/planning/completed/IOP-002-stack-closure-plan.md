# IOP-002 — Accepted stack closure

## Status and authorization

Completed. The owner explicitly chose Jest for frontend/backend based on existing
experience, accepted the other decisions and authorized closing IOP-002 if its
design criteria are satisfied. Continue on `docs/IOP-002-reporting-context`, created
from develop at `87e9325`; starting HEAD is `f00f3a3`. No merge or push is inferred.

## Scope and files

Accept ADR-0009/0010, replace the proposed Vitest selection with Jest and explain
independent Jest/Vite configuration. Synchronize IOP-002 item and two current
reviews, ARCHITECTURE.md, README.md, ROADMAP.md, milestones.md and backlog.md.
Preserve prior completed plans as historical evidence. Archive this closure plan.

## Steps and validation

1. Record explicit acceptance and the maintainer-experience rationale for Jest.
2. Map all design acceptance criteria; mark command execution not yet applicable
   and hand it off to bootstrap stories without claiming runnable tooling.
3. Check local Markdown links, accepted statuses, stack consistency and whitespace.
4. Commit the completed documentation increment; leave publication for permission.

## Boundaries

No application, dependency manifest, Docker configuration, hook or test runner is
implemented. API/ORM/identity and detailed implementation choices remain separate
stories. Jest runs independently of Vite plugins; bootstrap must verify TS/JSX,
asset/alias handling, Node versus DOM environments and Nest decorator behavior.

## Acceptance mapping

Backend: ADR-0006 already Accepted. Frontend/tooling: owner accepted ADR-0009/0010
with Jest replacing Vitest. Commands: conditional criterion not applicable before
tooling exists, explicitly handed to IOP-015/016/017/020. Evidence: completed reviews
and this validated closure plan. IOP-001 and other stories retain their statuses.

## Completion evidence

Accepted ADR-0009/0010, recorded Jest for both components and independent Jest/Vite
configuration, and synchronized all ten planned existing documents. Conditional
commands are explicitly N/A at design closure with bootstrap ownership. Prior
completed evaluation plans remain historical records. Markdown link checks over
all changed documents, ADR status/section checks, item/backlog status checks and
`git diff --check` passed. No runtime tests apply to this documentation-only
repository. IOP-002 is Completed; IOP-001 and other story statuses are unchanged.
No merge, hook installation, Docker execution or push was performed.

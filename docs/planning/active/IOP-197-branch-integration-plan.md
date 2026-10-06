# IOP-197 — Branch integration execution plan

Status: In progress. Authorized by the owner's explicit 2026-10-06 request to
unify all branches into develop and origin.
Branch: `docs/IOP-197-branch-integration`, created from develop at `870b2b3`.
Scope: [permanent item](../items/IOP-197-branch-integration.md).

## Changes and steps

1. Refresh origin and audit all retained refs. Initial inventory: 132 local
   branches and 124 origin branches. Seven local tips are outside develop:
   `docs/IOP-001-persona-validation`, `docs/IOP-007-authentication-model`,
   `docs/IOP-009-audit-model`, `docs/IOP-136-poc-user-guide`,
   `docs/IOP-140-roadmap-read-translations`, `docs/IOP-144-poc-next-stories` and
   `feature/IOP-196-personal-operational-workflows`. Remote-only tips are already
   contained; origin/develop equals local develop.
2. Commit this bounded plan/context/index increment, then merge the seven branches
   on the integration story branch without rewriting history. Resolve old
   documentation against current accepted scope and delivery evidence, preserving
   unique historical proposals and execution records. All runtime changes belong
   to the already validated IOP-196 tree.
3. Update affected item/backlog and historical proposal/guide context where needed
   so earlier assumptions cannot replace current delivery. Expected files are
   documentation touched by the six older branches, IOP-196 publication context,
   this item/plan and the backlog. Record translation-only edits if a consulted
   story is still Spanish. No new architectural pattern or runtime feature.
4. Run typecheck, npm test, secret/diff hygiene, local link and item/backlog checks.
   Verify the runtime tree against IOP-196; reuse its database/browser evidence
   if runtime files are unchanged, otherwise test affected behavior again.
5. Merge the validated integration branch into develop and publish retained
   story refs plus develop to origin. Record actual publication evidence on the
   story branch, close this plan and publish that final documentation increment
   through the same authorization. Check every local/origin tip's ancestry,
   local/remote parity, retained review refs and a clean develop checkout.

No stage/master promotion, force push, rebase, branch deletion or Docker activation.

## Validation and evidence

`git fetch origin` succeeded; the initial checkout was clean. Ref inventory and
outstanding commit inspection are retained at `/tmp/iop-197-refs-before.json`.
The seven pending branches contain 11 unique commits; all other retained tips
are already ancestors of develop. Actual merge/test/publication results follow.

IOP-001 conflicts retain the later Completed baseline and current scope. Preserve
the earlier responsibility/CSV-port request as historical evidence; later source
review and accepted metrics supersede its uninspected-script/open-question wording.

IOP-007 conflicts retain the current Deferred shared-use parent. ADR-0015 remains
Proposed and explicitly historical; Accepted ADR-0035 controls delivered local
authentication. Retain both earlier design-only plans without changing runtime rules.

IOP-009 conflicts retain current module-owned revision coverage and add the
previously owner-accepted future Audit design/evidence. ADR-0017 is Accepted by
the earlier explicit decision; IOP-009 becomes Completed as design. IOP-023 remains
Proposed future implementation. Synchronize architecture/module/model/glossary,
scope and RBAC applicability without imposing general Audit on current operations.

IOP-136 conflicts retain current startup/delivery documentation and Completed local
guide status. Keep its earlier guide/preparation plan as explicitly historical
fixture-preview evidence, with the current operator guide as the canonical workflow.

IOP-140 translation conflicts retain the current complete English IOP-029/129
contexts and their later delivery evidence/statuses. Retain the earlier translation
record and its language-rule link. No new translation-only edits are needed.

IOP-144 conflicts likewise retain current English analytical/navigation/fixture
contexts and their later scope/statuses. Add the missing Completed recommendation
item/index row and its execution record, marking its dependency statuses as the
September 25 historical snapshot, superseded by current delivery evidence.

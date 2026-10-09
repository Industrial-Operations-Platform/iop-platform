# IOP-199 - Publication and local activation

Status: Completed
Authorization: owner approval on 2026-10-09 to merge the story into develop, push
both branches to origin and update the local Docker stack.
Branch: `feature/IOP-199-handover-category-workflows`, the reviewed story branch.
Scope: [completed implementation](../completed/IOP-199-handover-category-workflows-plan.md).

1. Verify a clean tree, current origin/develop and the approved story commits.
2. Merge into develop without rewriting history; push story and develop to origin.
3. Run `npm run local:up` without a backup argument, preserving existing volumes,
   credentials, configuration and business data.
4. Verify service state, HTTP response and current deployed source; inspect the
   running interface and compare database row counts before/after activation.
5. Record actual publication/activation evidence in this plan and the original
   completion record; commit on the story branch, integrate and publish the evidence
   through the already approved sequence. Keep stage/master and review refs intact.

Expected files: this plan, the completed IOP-199 implementation record and its item.
No feature edits, fixture writing, new grants, history rewrites or deployment beyond
the approved local stack. Validation reuses the completed implementation tests and
adds current remote refs, Docker/HTTP and retained-data checks.

## Evidence - 2026-10-09

- Clean starting tree; fetched origin/develop matched local develop. Approved
  implementation commits `5869a72`, `f20ea36`, `b2395cf` and plan `581435a`
  merged without conflicts as `bd600f0`. Both named refs pushed successfully;
  local remote-tracking refs matched their initial published tips.
- `npm run local:up` without a backup completed successfully. Existing credentials,
  configuration and the `iop-platform-local_platform-data` volume were retained.
  Seed reconciliation reported 78 unchanged dates, 42,220 rows, frequency 212,411
  and 56,391,042 exact seconds; zero dates imported.
- Before/after row counts matched exactly: Handover 67, Maintenance 34, Workforce
  1,606, Assets 5,655 and import attempts 104.
- All three services were healthy. Web and `/health` responded on localhost:8080;
  `/api/v1/demo/context` confirmed enabled password authentication. Health proves
  process response only. Running API inspection confirmed Information's Team
  Leader restriction and the new default-location/completion use cases.
- Current interactive browser inspection was unavailable: the computer-use tool
  exposed no browser surfaces. The implementation's 12 browser scenarios and
  desktop/narrow rendered checks remain the functional/visual evidence.

Closure evidence is committed on the story branch and integrated/pushed through
the same owner-approved sequence. No stage/master promotion, history rewrite,
branch deletion, fixture publication or shared deployment was performed.

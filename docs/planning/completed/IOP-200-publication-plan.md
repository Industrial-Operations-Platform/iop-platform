# IOP-200 - Approved publication

Status: Completed
Authorization: owner request on 2026-10-09 to merge the guide into develop and
publish to origin, following the previously named two-branch publication convention.
Branch: `docs/IOP-200-native-development-guide`.
Scope: [completed guide](../completed/IOP-200-native-development-guide-plan.md).

1. Verify the clean tree, current origin/develop and reviewed guide commits.
2. Merge the story into develop without rewriting history and push both branches
   to origin. Verify remote refs and the unchanged PDF blob.
3. Record actual publication evidence here and update the item/completed guide
   record. Commit evidence on the story, integrate it into develop and publish
   through the same approved sequence.

Expected files: this plan, the permanent IOP-200 item and completed guide plan.
Validation: Git ancestry/ref checks, unchanged PDF, Markdown links/statuses and
`git diff --check`. No PDF regeneration, application changes, Docker activation,
stage/master promotion, branch deletion or force push.

## Evidence - 2026-10-09

- Starting tree was clean; fetched origin/develop matched local develop.
- Reviewed guide commits `70b2532` and `aa21a9a`, plus publication plan `1d8e33a`,
  merged without conflicts into develop as `41383e3`.
- Both branches pushed successfully to origin. `git ls-remote --heads` confirmed
  initial published tips: develop `41383e3` and guide branch `1d8e33a`.
- The PDF blob matched its original reviewed artifact exactly:
  `b86797e571a21640f277a5592cc4933b7a1eae30`. No artifact regeneration occurred.
- Markdown links, completion states and whitespace checks passed. This evidence
  is committed on the story and integrated/pushed through the same approved sequence;
  final remote equality is verified after that push.

No application, private configuration, database or Docker changes were made.
Stage/master and both retained review branches remain outside this promotion.

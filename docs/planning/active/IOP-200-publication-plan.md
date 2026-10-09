# IOP-200 - Approved publication

Status: In progress
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

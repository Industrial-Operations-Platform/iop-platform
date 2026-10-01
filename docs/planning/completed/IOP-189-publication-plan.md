# IOP-189 — Approved documentation publication

Status: Completed

The owner approved merging `docs/IOP-189-local-test-passwords` into `develop`
and pushing both branches to `origin`. Branch: `docs/IOP-189-local-test-passwords`.
Scope: [IOP-189](../items/IOP-189-local-test-passwords.md), documentation only.
The password reset is already complete; no credential or runtime action is needed.
IOP-188 remains a separate pending review branch.

1. Verify clean Git state and fetched remote ancestry; validate documentation.
2. Commit this plan on the story branch, fast-forward develop and atomically push
   both approved refs. Preserve other branches and existing application data.
3. Record remote verification, archive this plan and publish the completion record
   through the same approved refs. Return to the prior IOP-188 working branch.

Expected files: this plan and the preceding IOP-189 execution record.
No application change; documentation checks replace code tests.

## Evidence

- Clean preflight: local/fetched develop matched `eb50f48`, an ancestor of the
  approved story. Fast-forwarded through `fd94172` to publication record `2574301`.
- Atomic origin push succeeded. `git ls-remote` confirmed both approved refs at
  `2574301acf461777699b77e3de70df5c08d1d91b`.
- Documentation links/statuses and `git diff --check` passed. This completion record
  follows the same authorized story/develop publication sequence.
- No application deployment, password reset, branch deletion or unrelated merge.
  The separate IOP-188 review branch is preserved and restored as the working branch.

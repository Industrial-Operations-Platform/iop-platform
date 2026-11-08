# IOP-230 — Publish the closing flicker fix

In progress. On 2026-11-08 the owner explicitly approved integrating
`fix/IOP-230-navigation-flicker` into develop and publishing both refs to origin.
[Permanent scope](../items/IOP-230-collapsed-navigation.md).

## Steps and validation

1. Fetch origin and verify clean branches and develop ancestry. Initial local and
   origin develop both resolve to `b5a3bc4`; the story adds validated `960eedf`.
2. Commit this approval record on the existing story branch and fast-forward
   develop. Atomically push only the story branch and develop; no other refs.
3. Verify remote hashes and unchanged pre-existing branch tips against a fresh
   snapshot. Record actual publication evidence, complete item/backlog and this
   plan on the story branch, then fast-forward/publish the documentation closure.

The implementation's successful build/design guards and 35 browser scenarios are
recorded in the [flicker plan](../completed/IOP-230-navigation-flicker-plan.md).
Verify application/tooling content stays identical to `960eedf`; documentation-only
publication needs link/whitespace and Git parity checks, not repeated UI tests.
Preserve all other branches and history; no force push, branch deletion,
stage/master promotion, database/account action or explicit deployment.

# IOP-173 execution plan

Status: Completed locally. Branch: `feature/IOP-173-handover-demo-data`, from develop
(`3346955`). Scope: [item](../items/IOP-173-handover-demo-data.md).

1. Add an explicit host launcher and local fixture adapter in `scripts/local/`,
   with representative scenarios isolated from product code. Use existing scoped
   application writes and imported equipment lookup; retain a private manifest.
2. Add focused tests for coverage, chronological history and safe repeat execution.
   Document the command and data marker in the handover operator guide; register
   the command in package.json. No application, schema or authorization changes.
3. Preview the configured dataset, record existing-data baselines, then insert the
   authorized examples into local Docker without rebuilding services. Verify current
   projections, histories, user/department coverage and unchanged original records.
4. Record validation, archive this plan and commit locally. Ask separately to publish.

Validation: fixture tests using existing application rules, API test suite, scoped
live queries before/after and a second seed run proving no duplicate or overwritten
entries. Documentation links, diff hygiene and staged secret check.

## Delivery and evidence

The explicit `local:handover-demo` command previews, applies and inspects a private
frozen manifest. Scenarios and operator composition live in three local scripts;
`infra/database/test/handover-demo.spec.cjs` tests real application behavior with
an in-memory storage port. No API, UI, schema, authentication or grant changes.

On 2026-09-29 the authorized local insertion created 60 marked examples: 12 per
department, 15 per current user, 10 per category, 30 for today and 30 dated 1–90 days
earlier. States: 15 open, 10 in progress, 15 resolved and 20 informational. Forty
reference imported equipment; ten are highlighted. There are 125 revisions,
including five complete open → in-progress → resolved → open histories.

- API build and all 325 API tests passed. The initial sandboxed test run could not
  bind listeners; rerunning with local listener permission passed all 21 suites.
- Four fixture tests passed: coverage/chronology, repeat execution/user edits,
  interrupted-prefix recovery and missing imported equipment.
- All 18 existing script tests passed.
- A second live apply preserved identical entry/history digests and counts.
- Application queries verified 15 My entries results per actor, six seed-day
  entries per department and five retained reopening histories.
- The three original entries and four revisions retained their exact digest.
  Analytics remained at 60,735 facts, frequency 316,864 and 79,968,310 seconds.
- Documentation links, diff whitespace and staged secret hygiene passed.

Local logs: `/tmp/iop173-api-tests.log`, `/tmp/iop173-demo-tests.log`,
`/tmp/iop173-helper-tests.log`, `/tmp/iop173-live-apply.log`,
`/tmp/iop173-live-repeat.log` and `/tmp/iop173-live-inspect.log`.
The manifest is private and ignored. No new users, credentials or sessions were
created. The running services were not rebuilt; IOP-172 remains separately pending
publication. This story's Git publication awaits owner approval.

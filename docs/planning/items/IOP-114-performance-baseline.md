# IOP-114 — Performance baseline

## Status

In progress

Reconciled on 2026-10-14 under the owner's delegated [IOP-203](IOP-203-platform-completion.md)
request and delivered [IOP-208](IOP-208-local-delivery-infrastructure.md).
The permanent context owns this story's remaining acceptance; software completion
is distinct from remote, operating, human and whole-platform release evidence.

## Milestone and goal

M14 — Security & Reliability. Measurement tooling delivered; agreed targets pending.

Measured targets for an agreed workload and environment.

## Current state

[IOP-208](IOP-208-local-delivery-infrastructure.md) under [IOP-203](IOP-203-platform-completion.md) delivers repeatable allowlisted validation
measurement with one to ten samples, wall-time distributions, host/Node facts,
exit results and private new-file reports. One observed complete typecheck sample
passed in 42.524 seconds. Reports explicitly retain `target: unagreed` and pending
release acceptance; this is synthetic repository validation, not a plant SLA.

## Requirements and delivery boundary

Measurement invokes only existing typecheck/unit/database/browser/build commands;
it accepts no arbitrary shell text, does not copy command logs into its report and
refuses an existing output. A single sample establishes an observation, not
statistical confidence, operational sizing or maximum recovery time.

## Acceptance criteria

- [x] Provide repeatable measurement tooling and record actual synthetic observations.
- [ ] Agree workload, environment, concurrency/data scale and measurable performance targets.
- [ ] Measure the agreed workload and compare results against those targets with independent evidence.

## Validation and evidence

The measurement guard tests pass and the recorded full-typecheck sample is actual.
See [local operating guide](../../development/local-operations.md) and [IOP-208 evidence](IOP-208-local-delivery-infrastructure.md).
Bounded import/query budgets remain controls, not agreed performance acceptance.

## Dependencies

[IOP-001](IOP-001-v1-personas-and-pilot-workflow.md), [IOP-013](IOP-013-observability-baseline.md), [IOP-089](IOP-089-analytics-query-layer.md).

Dependencies identify required contracts/capabilities, not numerical delivery order.
Their broader criteria are not closed by this bounded increment.

## Remaining work

Plant workload and thresholds, observed user concurrency, query/import/restore
objectives and human performance acceptance remain pending. No physical system
capacity or release pass is inferred from local validation timing.

## Documentation traceability

[IOP-208 completed plan](../completed/IOP-208-local-delivery-infrastructure-plan.md),
[IOP-203 execution](../completed/IOP-203-platform-completion-plan.md),
[backlog](../backlog.md) and [delivery map](../poc-delivery.md).

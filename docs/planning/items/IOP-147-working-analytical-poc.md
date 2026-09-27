# IOP-147 — Complete the working analytical POC

## Status

Completed — technical local POC, 2026-09-27. IOP-130 owner feedback remains open.

## Owner request — 2026-09-27

Finish a demonstrable platform where the operator enters, selects a demo user,
provides a supported CSV and analyzes that file and persisted historical imports.
Frontend and backend must implement one coherent workflow. Third-party login is
future work; isolate the temporary local user selector behind a replaceable
identity boundary. The owner authorizes necessary development decisions without
intermediate approval waits and consolidation of redundant planning for this work.

This request consolidates the missing runtime slices documented by
[IOP-146](../completed/IOP-146-poc-readiness-review.md). It preserves the [POC scope](../../product/scope-poc.md)
except for explicitly allowing selection among configured local demo users.
It does not authorize shared/public unauthenticated hosting or invented owner feedback.

## Acceptance

- [x] Documented commands start an explicitly local, persistent demonstration.
- [x] Configured demo users can switch; operations check current scoped permissions.
- [x] CSV upload retains originals, shows validation/duplicate outcomes and preserves
  exact normalized measures, provenance and frozen classification without partial data.
- [x] File and historical analysis share backend calculations, date/dimension filters,
  exclusions, coverage, overview/detail and contributing-record navigation.
- [x] Independent fixture totals, errors, denial/revision cases and browser behavior
  are verified through the actual API and database.
- [x] Dedicated demo reset safely preserves unrelated data and reproduces the baseline.
- [x] Instructions and story status reflect delivered evidence; redundant current
  handoffs are consolidated while permanent contexts/history are preserved.

Plan and evidence: [execution plan](../completed/IOP-147-working-analytical-poc-plan.md).

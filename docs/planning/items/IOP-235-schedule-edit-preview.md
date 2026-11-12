# IOP-235 — Edit assigned schedules and view proposals

## Status and goal

In progress. The owner reports editing/viewing weekly schedules failing in Railway
and supplied a valid configured shift change that returns the generic dependent
assignment conflict. Existing full-shift duties prevent the preview before the
calendar and workload comparison can render.

## Scope and acceptance

- [ ] Allow viewing the selected weekly schedule without editing a day.
- [ ] Preview configured shift changes with the corresponding full-shift duty
  moves, retaining their Halle, duty identity and phone responsibility. Show the
  proposed changes before an explicit atomic save by Team Leader/Administrator.
- [ ] Preview off/absence/training changes with the associated duty removals.
  Preserve prior revisions. Custom incompatible duties and genuine overlap/phone
  conflicts remain visible in the preview and prevent saving until resolved.
- [ ] Recheck schedule and dependent duty revisions on save. Offer clear recovery
  for stale saved schedules and retain drafts after a failed preview/save.
- [ ] Preserve the existing strict weekly-save/import contracts and scoped rights.
  Validate domain/application, HTTP, browser and PostgreSQL behavior, publish to
  develop and Railway under the owner's continuing online-fix authorization, and
  verify the served revision and original reported scenario without saving an
  unrequested real-person test change.

Reuse [IOP-233](IOP-233-schedule-preview.md), [Workforce](../../product/workforce.md)
and Accepted ADR-0032. The existing Workforce transaction owns atomic changes;
the browser renders the server-prepared proposal. No schema migration is required.

[Execution plan](../active/IOP-235-schedule-edit-preview-plan.md).

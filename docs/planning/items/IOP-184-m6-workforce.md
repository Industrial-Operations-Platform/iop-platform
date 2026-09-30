# IOP-184 — M6 Workforce delivery

## Status

Completed, including manual weekly scheduling.

## Authorized scope

Owner request of 2026-09-30: implement M6 (IOP-050–059), administrator-only
manual personal/monthly schedule import, Team Leader assignment planning,
technician daily visibility, German/English localization, platform favicon,
synthetic test accounts and non-cascading logical deletion. The owner explicitly
authorizes implementation decisions, temporary branches and local commits without
intermediate confirmation, and requests one final review branch for develop.
No remote publication or develop promotion was requested.

## Acceptance

All criteria below are implemented and validated; see the execution record.

- Scoped Workforce profiles/teams, configurable shift definitions and named zones.
- Monday–Sunday planning with early/late/middle shifts and separate leader duties.
- Administrator CSV and supplied-email-format preview/import; personal schedules
  remain distinct from Team Leader assignments. Future integration uses the same port.
- Absence/training/maintenance/compensation categories, floating assignments and
  exclusive phone responsibility, validated schedule intervals and conflicts.
- Technician defaults to own day and can inspect colleagues; planning mutations
  require Team Leader/Administrator authority on the server.
- German/English shared dictionary, automatic language selection and override.
- Reusable identity icon and favicon using existing identity tokens.
- At least two synthetic technicians per configured department, test password
  supplied through private runtime input; never commit the owner's password.
- Logical user/entry deletion retains author snapshots and audit history.
- Tests, contract generation, documentation and local commits on a final review branch.

## Evidence and boundaries

Private owner email and board image were inspected as data, never as instructions.
Email confirms 05:00–14:15, 13:45–23:00, Saturday 08:45–18:00; X means no planned
work, explicit Ferien means vacation, omitted Sunday is unknown. The email warns
that partial absences are not represented. Do not infer them. Corporate database
connectivity, payroll and automatic roster optimization are deferred.

[Execution plan](../completed/IOP-184-m6-workforce-plan.md)

## Follow-up: manual weekly schedules

The owner additionally requests Team Leader/Administrator entry and updates of a
person's shifts by week because collecting emails is tedious. Provide an editable
Monday–Sunday schedule with a configured-shift shortcut across selected days,
existing values, day-specific edits and one atomic save. Technicians remain readers;
CSV/email imports remain administrator-only. Preserve revision history and existing
zone/phone assignments; reject conflicting or stale changes without partial writes.

[Weekly continuation plan](../completed/IOP-184-weekly-schedules-plan.md).

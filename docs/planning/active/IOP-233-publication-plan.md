# IOP-233 — Authorized develop and Railway publication

Status: In progress. Branch: `feature/IOP-233-schedule-preview`.
[Implementation](../items/IOP-233-schedule-preview.md).

## Authorization and steps

The owner explicitly requested develop integration and Railway online activation
on 2026-11-12, in reply to the publication request naming this branch and both
origin refs. This authorizes merge and normal push of story/develop, and deployment
to the existing Railway development installation. No stage/master promotion.

1. Inspect origin tips and explicit Railway development target; retain a fresh
   remote PostgreSQL backup privately before the application deployment.
2. Record authorization, commit this plan, fast-forward develop when possible and
   push only the story and develop refs. Preserve every other branch and all data.
3. Observe the existing GitHub complete-validation/automatic Railway workflow;
   do not bypass its tests. Verify the live build revision and authenticated
   schedule-preview behavior using existing authorized access if available.
4. Record actual evidence, close the publication plan and synchronize item status.

## Independent follow-up

The same request adds November 2026 technician early/late/weekend schedules and
Task Force middle shifts on Railway. The owner selected the entire current month.
Track that data/configuration work separately after integrating this prerequisite;
preserve existing schedules, assignments, absences and accounts. It does not require
waiting for new publication permission.

## Validation

Reuse recorded local implementation evidence. Full Linux CI supplies the Docker
validation unavailable locally; inspect failures before any deployment. Backup
archive signature/hash and remote month counts must be verified; do not restore
over the live database. Record any unavailable restore or authenticated checks.

Pre-publication evidence: origin/develop is `6dfc5f7`; the selected Railway
project is IOP-development, environment development, with distinct iop/database
services. A protected custom PostgreSQL archive (30,319,415 bytes) was exported
and successfully inspected with remote `pg_restore --list`. Its private manifest
retains SHA-256 and counts: 167 analytical publications across May–November 2026,
2,019 Workforce records and 2,061 revisions. No isolated restore was executed
because this workstation has no container runtime. No remote data was changed.

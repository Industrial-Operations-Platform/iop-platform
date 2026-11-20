# IOP-241 — Approved publication and Railway verification

Status: In progress. Branch: `feature/IOP-241-scalable-month-picker`.
[Scope](../items/IOP-241-scalable-month-picker.md) and
[implementation evidence](../completed/IOP-241-scalable-month-picker-plan.md).

## Authorization and steps

On 2026-11-20 the owner approved the request naming this story, its merge into
develop, both pushes to origin and Railway verification.

1. Inspect origin refs and the configured Railway development target. Retain and
   verify a fresh private remote PostgreSQL backup before triggering deployment.
2. Commit publication authorization on the story, merge into develop and push both
   named refs atomically. Preserve other branches and all existing data.
3. Observe complete GitHub validation and automatic Railway publication; inspect
   failures without bypassing guards. Verify the exact HTTPS revision, anonymous
   access controls and delivered month-picker assets.
4. Run the existing 36-month/year-picker browser scenarios against the hosted
   frontend using intercepted fictional API fixtures. These do not authenticate
   against or mutate live business data. Compare remote table/import counts with
   the pre-release backup separately.
5. Record results, synchronize item/backlog, archive this plan and publish the
   documentation closure through the same approved story/develop sequence.

## Files and validation

Tracked edits are limited to this publication plan, the IOP-241 item and backlog.
Private helpers, backups, logs and browser artifacts stay under ignored `.railway/`.
Reuse successful implementation checks; verify integrated source equality,
links/statuses, whitespace, remote parity and a clean tree. No stage/master
promotion, history rewrite or branch deletion.

Initial inspection: clean tree; implementation `75f5e60`, local develop `23663dd`.
The implementation passed 38 focused web checks, 26 architecture checks, build/
typecheck, 9 browser scenarios and 6 repeated cross-year cases.

Origin inspection confirmed develop `23663dd` and no existing IOP-241 remote
story branch. Railway targets IOP-development/development with separate iop and
database services and automatic deployment enabled; HTTPS initially serves
`333508c`. A fresh protected PostgreSQL custom archive (32,435,596 bytes) was
retained privately and checked for signature, SHA-256 and required table-data
entries through remote `pg_restore --list`. Its manifest records 62 table counts
and 175 imports across May–November 2026, including 16 November dates. Counts were
stable during export; no remote write/restore or isolated restore was performed.

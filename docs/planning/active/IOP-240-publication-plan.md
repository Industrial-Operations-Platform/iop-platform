# IOP-240 — Approved publication and Railway verification

Status: In progress. Branch: `feature/IOP-240-focused-error-analysis`.
[Scope](../items/IOP-240-focused-error-analysis.md) and
[implementation evidence](../completed/IOP-240-focused-error-analysis-plan.md).

## Authorization and steps

On 2026-11-20 the owner approved the request naming this story branch, its merge
into develop, both pushes to origin and Railway verification.

1. Check origin refs and the configured Railway development target. Retain and
   verify a fresh private remote PostgreSQL backup before triggering deployment.
2. Commit this authorization on the story branch, merge into develop and push both
   named refs atomically. Preserve other branches and all existing data.
3. Observe the existing complete GitHub validation and automatic Railway workflow;
   inspect failures before deployment without bypassing guards. Verify the exact
   HTTPS build revision, anonymous access controls and delivered analytical assets.
4. Exercise the hosted frontend with the existing synthetic/intercepted browser
   fixtures for the one/two/three-error boundary and real point hover. This does
   not authenticate against, read or mutate live business data. Compare remote
   table/import counts with the pre-release backup separately.
5. Record actual results, synchronize item/backlog, archive this plan and commit/
   publish the documentation closure through the same approved sequence.

## Files and validation

Tracked changes are limited to this publication plan, the IOP-240 item and backlog.
Private operational helpers, backups, logs and browser artifacts remain under
ignored `.railway/`. Reuse the implementation's successful tests, verify integrated
application-source equality, links/statuses, whitespace, remote parity and a clean
working tree. No stage/master promotion, history rewrite or branch deletion.

Initial inspection: clean tree; story implementation `55d7e58`, local develop
`80060ee`. No unrelated work is pending. Source changes already passed 36 focused
web checks, 26 architecture checks, build/typecheck and 9 browser scenarios.

Origin inspection confirmed develop `80060ee` and no existing IOP-240 remote
story branch. Railway targets IOP-development/development with separate iop and
database services and automatic deployment enabled; HTTPS initially serves
`2539d82`. A fresh protected PostgreSQL custom archive (32,434,218 bytes) was
exported privately, checked for signature/SHA-256 and required table-data entries
through remote `pg_restore --list`. Its manifest records 62 table counts and 175
imports across May–November 2026, including 16 November dates. Counts remained
stable during export; no remote write/restore or isolated restore was performed.

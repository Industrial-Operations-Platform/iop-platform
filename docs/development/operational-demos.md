# Local operational demonstrations

[IOP-217](../planning/items/IOP-217-admin-configuration-demos.md) adds a bounded
exercise for Improvement Tracking, Formal Handover and the week of
**2026-10-19 through 2026-10-25**. Run against the password-authenticated local
Docker installation after the normal `npm run local:up` update:

```sh
npm run local:operational-demos -- --preview
npm run local:operational-demos -- --apply
npm run local:operational-demos -- --inspect
```

Preview reads current application data and freezes a private manifest at
`.local-platform/operational-demos-2026-10-19.json`; it writes no application
records. Keep this manifest to resume interrupted application and inspect later.
Do not delete it to bypass a conflict. The command checks exact local mode,
organization/site/source, a current Administrator and current application grants.
It uses the existing application operations and forced scoped runtime access.
It does not create accounts or change passwords, grants, source data or settings.

Every active scoped user receives any missing days in the requested week. Missing
weekdays use an available configured shift, and missing weekend days are off.
Existing availability, absences, assignments and retained logical deletions take
precedence. Deleted days or duties are never recreated on preparation or rerun;
inspection reports those retained deletion counts separately. Existing home
targets are retained when selecting missing zone assignments; Team Leaders receive
leader duties. An incompatible or unavailable interval remains unassigned.
The inspection reports scheduled, fully scheduled and assigned user counts,
working user-days, working user-days with assignments, and any remaining users
without assignments. Existing absences may legitimately prevent assignments. A changed
active directory after preview stops application rather than silently omitting users.

Improvement Tracking shows planned, in-progress, blocked, implemented, evaluated
and cancelled proposals. The evaluated example includes note and result evidence,
an append-only correction, a comparison preview and a retained comparison.
Comparison periods are selected from two actual eligible published source dates;
the application calculates values and coverage. The proposal and intervention are
explicitly fictional. Analytical observations are unchanged and establish no causal
effect. Existing synthetic asset/issue links are used when available. If all known
synthetic assets are retired, the Administrator registers one stable
`DEMO-IOP-217-GUIDE` training reference as Unverified, without source aliases or
survey validation. Every proposal links that same identity; retired originals
remain unchanged. Asset creation resumes by its retained request key.

Formal Handover shows a draft, published transfer, closed transfer and closed
transfer acknowledged by a different existing manager. Every example references
an exact real Workforce zone assignment interval. Two already started shifts and
four unoccupied shift/location combinations are required. Current-day choices are
preferred so examples appear in the default view; choose the full week in the
formal date controls to inspect the entire exercise. Existing synthetic
journal reports can be selected as evidence; closure also retains the actual
pending report snapshot without resolving live journal issues. Normal capacity,
current report revision and manager authorization checks apply.

Repeats preserve existing schedules and assignments and resume only an untouched
demo history prefix. User corrections to demo actions or formal records are
reported as preserved. Each use case remains its own authorized transaction;
failure can leave a partially completed exercise. Inspect and rerun with the same
manifest after resolving the reported prerequisite. No automatic overwrite or
bulk rollback is implied. Scoped original-data digests include unrelated Workforce,
Improvement, formal records, journal history and analytical source observations.
Concurrent user activity may change that digest and is reported explicitly.

Meaningful runner checks are in `scripts/operational-demos.spec.cjs`; run
`npm run test:secrets -- --testPathPatterns=operational-demos` and the normal
repository API/application checks before recording completion.

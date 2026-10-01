# Running and integrating Workforce

See the [product contract](../product/workforce.md), [local platform guide](running-poc.md)
and [IOP-184 execution](../planning/completed/IOP-184-m6-workforce-plan.md).

## Local operation

Use Node 24.21.x and npm 10. Migrations add Workforce records/revisions, scoped
reader/planner/administrator grants and a profile-deletion marker. Runtime retains
column-limited privileges and forced organization/site RLS; no DELETE permission.
`npm run local:up` builds the local images and applies setup migrations while
preserving existing data. This is a local runtime update, not remote publication.

To provision synthetic schedules and accounts, put the explicitly chosen test
password in a private file outside version control. The fixture process needs the
exclusive runtime lease, so stop the local API/web first and restart them afterward:

```sh
docker compose -f compose.platform.yaml stop web api
npm run local:workforce-demo -- /private/path/to/password.txt
docker compose -f compose.platform.yaml up -d --no-build api web
```

The explicit command creates two technicians per configured department, three
leaders and a floating technician. It fills the current and following month for
those fixture accounts without replacing existing schedules/assignments. It also
sets the supplied password for all local organization accounts and revokes existing
sessions, as requested for this testing increment. Credentials remain hashed; the
password travels through stdin, is never printed and is never a built-in default.
Do not use this fixture command as production provisioning. Existing private
handover/source data and original imports are preserved.

## Enter or update a week without files

Open **Workforce & shifts → Weekly schedules** (**Personal & Schichten →
Wochendienstplan** in German), choose any date in the required week and select a
person. Existing schedules appear Monday through Sunday. Choose a shift/status and
**Apply to selected days**, adjust exceptions, then **Save week**. Monday–Friday is
preselected; select the weekend only when needed. A shift preset skips weekdays on
which it is inactive. Unchanged and unknown days are left alone. **Edit week** on
an existing personal schedule opens that person's weekly editor.

Both Team Leader and Administrator may use this editor. The whole save fails on
stale revisions, overlapping availability or incompatible current assignments;
refresh stale data and correct the conflicting interval or have an Administrator
remove an incompatible assignment before replanning. A manual change records its
actor, revision and `manual` source, preserving older imported revisions. It does
not silently change zones or phone holders.

## Manual source contract

UTF-8 CSV uses this exact header and five unquoted, single-line columns:

```csv
userId,date,status,start,end
user-id,2026-10-01,work,05:00,14:15
user-id,2026-10-02,vacation,,
```

`userId` is the stable platform ID, available in Workforce configuration/import
context. The UI downloads a template with a real site user ID. Status identifiers
are `work`, `compensation`, `training`, `maintenance`, `vacation`, `accident`, `sick`
and `off`. Work/training/maintenance require local HH:mm intervals; other statuses
require empty hours. Dates use YYYY-MM-DD, with one schedule per person/day.
Files are bounded to 80,000 characters and 2,000 rows. Split larger monthly files.

Email import supports the inspected weekly-plan structure: German weekday/date
rows followed by an HH:mm–HH:mm interval, X or an explicit supported absence label.
The administrator explicitly chooses the target user; the greeting or sender is
never trusted to identify an account. Plain content, HTML text, quoted-printable
and base64 MIME parts are decoded without rendering HTML or fetching links.
Unknown rows/absence labels reject the import. Training/maintenance without hours
must be entered manually with an actual interval. The supplied real email produced
24 explicit rows: 10 work, 10 vacation and 4 off. Original private email bytes and
personal schedules are not committed as fixtures. Partial absences are unavailable
in that email source and must not be inferred.

Preview does not write. Commit re-decodes and validates the same input, checks
expected row revisions and commits atomically. Identical imports are no-ops;
conflicting changes never silently overwrite newer data or invalidate assignments.
Editing the input invalidates its browser preview. The original email/CSV is not
retained in Workforce; normalized values, source kind and every committed revision
are retained. This source adapter is distinct from analytical RAW import storage.

## Boundaries and API

- Workforce domain/application owns schedules, assignments, revision checks and
  ports. The site-clock adapter resolves local intervals into UTC, supports overnight
  work and rejects nonexistent/ambiguous DST wall times. No fixed UTC offset is assumed.
- Integrations owns the bounded CSV/email decoder. A future read-only corporate
  connector can fetch and normalize external schedules through this decoder/import
  boundary; no connection or background synchronization is configured now.
- PostgreSQL adapters serialize site changes, check current grants and persist
  typed Workforce records plus append-only revisions. Users/RBAC supplies a scoped
  directory through the host composition root. Board reads project current names by
  account ID for workers, schedules and assignments; changes need no reimport.
  Referenced disabled/deleted profiles remain named but are not active choices.
  Saved records and revisions retain original labels. Configuration records have stable
  IDs; retired targets remain visible on historical assignment cards.
- React and HTTP adapters depend on browser application/domain ports. The shell
  composes the feature and Start summary. Customer labels stay configured data.

POST routes under `/api/v1/workforce`: `board` (`from`, `to`, maximum 93 inclusive
days), `save` (`kind`, `id`, `expectedRevision`, `deleted`, kind-specific `data`),
`preview` (`format`, `text`, `userId`), `import` (`input`, `revisions`) and `history`
(`kind`, `id`). `schedules/week` accepts `userId`, Monday `weekStart` and 1–7
changed `days` containing `date`, `status`, `start`, `end`, `expectedRevision`. It
requires `workforce.plan` and returns changed/unchanged counts. Revision 0 means
no active schedule; recreating a logically deleted day continues its retained
revision sequence. Kinds: `settings`, `worker`, `schedule`, `assignment`. Settings contain
`shifts`, `targets`, `teams`; workers link a user to a team/home target; schedules
contain a person/date/status/local interval; assignments contain a person/date/shift/
zone/duty/phone/interval. Resolved instants and label snapshots are server-owned.
Settings use ID `site`, workers use user ID, schedules use `userId_YYYY-MM-DD` and
assignments use opaque IDs. Creation expects revision 0. Site scope and actor come
from the authenticated host, never from request data. Reviewed OpenAPI describes
transport envelopes; the domain types define kind-specific payload fields.

## Localization and identity

The shared `apps/web/src/localization/` dictionary uses English source keys and
German translations with English fallback. Browser language selects the initial
locale; the header/login selector persists an explicit choice and updates document
language. Date/number formatting uses the selected locale in localized controls and
charts. Stored notes, names, identifiers and external source text remain original.
A catalog test prevents untranslated literal `t()` calls. New UI text must use the
same dictionary. The connected-cell SVG mark is reused by the shell and favicon,
using the existing navy, white and blue palette.

## Verification

Run `npm run typecheck`, `npm test`, `npm run test:database` and relevant browser
checks. The Workforce unit suite checks no-write preview, atomic/idempotent import,
permissions, overlapping people/phones, stale revisions, deletion and DST. The
PostgreSQL handover integration fixture additionally checks M6 grants, forced RLS,
concurrent conflicts and non-cascading user/entry removal. Web tests verify role
views, import-preview invalidation, weekly preset/edit/save behavior and dictionary
coverage. Weekly application/SQL tests also prove atomic rollback, current planner
grants, unchanged-day idempotency and neighbor/batch overlap handling.

## M6 presentation and account refinement

Use the globe and DE/EN control at the upper right to switch language. Click your
name in the account header to edit it; administrators can also click a user's name
in Users & profiles to open full account details. The administrator-only
`POST /api/v1/users/details` saves `id`, `name`, `profile` and `active` in one
scoped transaction; username and stable user ID remain read-only.
`GET /api/v1/users/activity` returns up to 20 recent scoped account audit records,
including logically deleted profiles. `POST /api/v1/users/name` accepts only `id` and `name` and
requires self ownership or scoped administrator authority. Apply migration
`20261005000000-profile-display-name` with the migrator before activating the API.

Workforce details share the Shift Handover title/breadcrumb layout. Click the
section or preceding view name to return; clicking the active sidebar section also
returns without losing the selected date. Detail facts and history retain their
saved labels. The shared design controls enforce title-first pages, icon-only
reloads and the same department/Halle selector on Start and Shift Handover.

Weekly plan groups configured shifts beneath each date, preserving historical
shift/zone labels. The matrix scrolls inside its shared table viewport; shift labels
appear once per day, above all zone rows. My day groups leader cards by shift while
retaining their actual working hours. Configuration places Add beside each section
heading and Save in a separate footer. Weekly entry has selected-day styling and a
Cancel action for both new entry and Edit week; cancellation discards unsaved drafts
and returns to the role's landing view without a write. The section heading and
active sidebar item also return home, preserving the selected date.

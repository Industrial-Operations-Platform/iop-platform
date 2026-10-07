# IOP visual identity — v1

The owner selected **Meeting preparation** as the platform-wide visual reference
on 2026-09-29, refining the preserved analytical identity from 2026-09-27. Its font,
navy headings, muted labels, white bordered surfaces and restrained blue actions
apply to Start, Shift Handover, report details, Data Analysis, forms and administration.
New and generated code must reuse this identity. Change it only on explicit owner
request; record revisions here and inspect desktop and narrow layouts.

## Canonical implementation

[`identity.ts`](../../apps/web/src/design/identity.ts) is the single source for palette,
typography, spacing and card tokens. The shared `IdentityRoot` (also used by `AppShell`) exposes these as `--iop-*` CSS
variables; the ECharts adapter imports the same tokens. Both are outer adapters:
style choices do not enter domain/application code. Extend semantic tokens here
instead of adding disconnected literal colors to components or chart options.

| Role | Value |
| --- | --- |
| Canvas / surfaces | `#f3f6f9` / `#ffffff` |
| Primary text / secondary text | `#172b43` / `#64758b` |
| Borders / primary action | `#dce5ed` / `#087bd5` |
| Active navigation surface / text | `#e8f3fc` / `#096faf` |
| Frequency / duration charts | `#138df4` / `#164f84` |
| Comparison sequence | `#138df4`, `#2424a5`, `#f3773d`, `#147e8a`, `#a755ad` |
| Heatmap low / high | `#e8f4ff` / `#0875cc` |
| Better comparison ink / surface / border | `#18734a` / `#eef8f2` / `#b9dec8` |
| Worse comparison | Existing error ink / surface / border tokens |
| Warning metadata ink / surface | `#805500` / `#fff5d6` |
| Keyboard focus | `#edaa30` |
| Divided disclosure headings (preserved baseline) | `#174e69` |

Use Inter with system-ui/sans-serif fallback. Keep white, lightly bordered cards,
navy figures, muted labels, restrained blue actions, flat backgrounds and no gradients. Anchored account/activity popovers alone use
the subtle shared shadow introduced in IOP-192. Report cards use 8px corners; metric cards use 7px corners, 19px
padding, 29px figures at weight 650 and 14px gaps. Existing narrow-screen reductions
remain in the shared [component stylesheet](../../apps/web/src/design/components/components.css).

## Typography and hierarchy

Use the existing `Inter, system-ui, sans-serif` stack. Inter is not bundled; when it
is unavailable the same system fallback applies to every view. Do not load a
feature-specific typeface. Sizes below are CSS pixels before browser zoom.

| Semantic role | Token / value |
| --- | --- |
| Page title | `pageTitleSize`: 28px; `headingWeight`: 700 |
| Section / card heading | `sectionTitleSize`: 16px; `headingWeight`: 700 |
| Clickable entry-summary title | `bodySize`: 14px; `labelWeight`: 600; `link` ink |
| Body, actions and standard fields | `bodySize`: 14px |
| Meeting card metadata | `captionSize`: 12.8px; muted ink |
| Compact tables / filters | `compactSize`: 12px |
| Fine print / analytical labels | `smallSize`: 11px |
| Uppercase page context | `eyebrowSize`: 10px |
| Emphasized labels | `labelWeight`: 600 |
| Content panel padding / action separation | `panelPadding`: 20px / `sectionGap`: 16px |

Existing chart titles, brand and metric roles keep dedicated shared tokens rather
than becoming alternate module themes. All stylesheet font sizes, weights, families
and line heights must inherit or use canonical tokens. Colors must use semantic
palette tokens; blue identifies primary actions, links and active navigation, while
report text and section headings remain navy. Clickable entry-summary titles use
blue link ink and semibold weight to distinguish them from bold category headings.
Preserve meaning without depending on color alone.

Use `PageHeading` consistently in overview and detail screens. Detail navigation
includes the module, current tab and current-page label inside the same heading;
retain its context, type scale and description. The tab breadcrumb returns to that
view with its selection intact; the module action explicitly returns home. Use shared `Panel`, `Button`, `Field`
and `Disclosure` variants for report content, actions and history. The detail action
row keeps a visible gap after the latest-update divider. Journal and Meeting
preparation use one feature-owned summary-card component, with a bordered clickable
surface, semibold blue title and semibold muted department. This applies to Journal, Meeting
preparation, Daily overview and the meeting open-issues list. Do not recreate that presentation
as a blue-link list with separators in another tab.

The workspace shell supplies profile-aware navigation; features supply their content.
Start includes operational summaries and optional analytical evidence. Module tabs
use the shared bottom navigation; embedded summaries use its inline placement. This contract governs their appearance rather than
fixing a particular set of pages or permissions.

Verification includes stylesheet identity guards, architecture checks, browser
comparisons between Meeting preparation and detail, responsive overflow, actual
module navigation and manually inspected screenshots. The opt-in
legacy fixture preview is outside this identity baseline.

### Personal operational presentation — IOP-198

Start places Profile above Your assignment. Day/Week controls and the date field
share one toolbar; day/week switching reuses the loaded week and keeps the
department summary visible. Assigned maintenance is embedded below shifts,
using two desktop columns and one narrow column. Titles and repair/location
context stack above wrapping status/priority/date metadata; badges and dates
remain whole. The selected date-only due period retains overdue and undated work.
Technicians open assigned work through Start or notifications; their sidebar
does not include Maintenance. Other delivered profile navigation remains scoped.

Meeting category headings group label/count with an 8px gap and retain the add
action at the right. Empty sections size to their content. Activity notifications
group title/unread count and read/refresh actions above a separately scrollable
feed of bordered cards. The anchored panel remains viewport-bounded and preserves
Escape/focus return and native keyboard controls. Reuse existing tokens and
shared components throughout. See [IOP-198](../planning/items/IOP-198-start-assignment-layout.md)
for scope and desktop/narrow evidence.


## Reusable component contract

New frontend presentation must reuse the public
[component library](../../apps/web/src/design/components/README.md), now consumed
by both the active import screen and analytical reports. Controls, surfaces, metrics,
disclosures, tables and navigation own their appearance in that library; they must
not depend on analysis CSS classes or customer fields. Extend an existing semantic
variant before introducing a second style for the same UI purpose.

The library is a React presentation adapter within ADR-0032, not a domain or API
package. Feature adapters compose its slots and pass values/events; data fetching,
report policy, permission decisions and ECharts remain outside the shared library.
The analysis stylesheet now holds only feature arrangements and chart dimensions.

Executive Overview composes ranking/matrix above daily trend/comparison cards.
`ComparisonCard` uses the existing metric surface with semantic better/worse variants;
neutral and unavailable states keep the baseline. Always pair color with comparison
text. `MonthPicker` reuses labelled native select styling; KPI settings use the shared
collapsible panel and controls. These are stable additions to identity v1.

`SideNavigation` keeps the existing active surface/ink for the selected page.
`SortableHeader` uses a single text button in each table heading, with direction
and priority beside the label. Native month/message/file selects open from the full
field and support keyboard arrows and scrolling; do not replace them with manual
text entry. Source-row tables belong to administration, outside report templates.

## Operational hierarchy — IOP-180

The owner requested a more readable Start and Journal on 2026-09-29. Preserve the
palette and flat surfaces; use emphasis purposefully:

| Information | Reusable treatment |
| --- | --- |
| Selectable operational totals | `ViewNavigation placement="tabs"` combines labels and small count badges in an equal-width row with a blue active underline |
| Summary explanation | `iop-metric-description`: short muted caption under the figure |
| Department/location | Semibold muted caption, subordinate to the blue entry title |
| State and count | `Badge`: neutral, info, attention or success with explicit text; color never supplies the meaning alone |
| Equipment reference and due date | Semibold ink; dates retain labelled date-only values, with no browser-inferred overdue state |
| Supporting preview | Muted excerpt, at most two lines; full text remains available in Details |
| Embedded view selection | `ViewNavigation placement="inline"` for compact selectors; `summary` for descriptive selection cards, with an explicit selected outline and underlined label |
| Collection/history action | `CollectionAction` with visible label, count badge and directional cue |
| Manual reload | `RefreshButton` with icon, visible text, disabled/busy state and reduced-motion support |

Start uses the feature-owned `EntrySummaryCards` expanded variant. Journal and
Meeting keep the compact title/department variant. Both share title, location,
border, hover and keyboard-focus treatment. Do not create parallel preview-card
styles. Keep arbitrary report text intact rather than attempting to bold matching
customer words inside prose. Attention is a report-based signal, not equipment
health. Existing semantic error tokens provide restrained attention emphasis.

Show one Start collection at a time with at most three entries and an explicit
shown/total count. Open reports excludes attention entries under IOP-196; highlights
follow the assigned or explicitly browsed department. Empty collections show an explanatory state. Ordinary
buttons preserve Tab/Enter/Space navigation without claiming ARIA tab semantics.

## Operational collections — IOP-181

Start combines counts and navigation in three compact, equal-width tabs, without a
second row of duplicate metrics. Native department selection sits in a compact,
labelled filter surface. Tabs remain in one row on narrow screens, allowing their
contents to wrap while keeping all three choices visible. Neutral highlights do
not imply successful equipment health.

Department matrix uses a white bordered viewport, sticky muted column headings,
shared state/category badges, labelled date columns and bounded detail excerpts;
full prose remains available through the entry title. Keyboard users can focus and
scroll the viewport. My entries reuses expanded summary cards in a responsive grid,
with entry date, responsibility and due dates. Shared tokens supply all
colors and typography; no urgency is inferred from the browser clock.


## Entry detail and neutral selection — IOP-182

Start uses white surfaces and neutral counters; semantic urgency colors remain
on entry status badges. IOP-183 supersedes the original outlined selection cards
with compact tabs as specified below.

Entry details preserve the summary hierarchy through location, state/condition
badges and emphasized equipment codes with an explicit unverified label. Full
prose and challenge/cause/measure appear beside a neutral facts panel for ownership,
references and labelled dates; both stack on narrow screens. Recorded metadata is
muted, actions remain separated, and historical revisions use bordered disclosures
with the same complete content layout. Reuse shared tokens and components.

## Compact Start tabs — IOP-183

Use shared `ViewNavigation placement="tabs"` for the Start categories: one row
filling the available width, equal-width controls, standard body labels and small
count badges. Mark the active category with the shared blue bottom border and navy
text. Remove card descriptions and large figures. On narrow screens, wrap label
and count content within the row; preserve native button keyboard behavior and
visible focus. Counts continue to show the full existing collection totals.

## Platform mark and localization

IOP-184 adds the connected-cell [SVG mark](../../apps/web/public/iop-mark.svg),
reused by `PlatformMark` and the browser favicon. Its navy/white/blue colors come
from this identity. German and English interface text share the presentation
dictionary; localized text must use the same component hierarchy and tokens.

## Shared navigation and compact account controls — M6 refinement

All page titles start with the section name. Do not place platform/module labels
such as IOP or Operations above them. `PageHeading` deliberately has no eyebrow
property. Operational sections use shared `SectionHeading`: the section returns
home, the subsection returns to its collection and Details marks the current page.
Clicking the active sidebar section also leaves its detail view. Do not add a Close
button as the only navigation out of an operational detail page.

Use the shared icon-only `RefreshButton` for reload actions, with an accessible
name, hover title, disabled busy state and reduced-motion support. Keep date and
reload controls aligned. Account name and role occupy two readable lines inside the
opened menu. IOP-193 uses an initials-only trigger and compact DE/EN language/profile
selectors, with logout last in the anchored panel described below.

`DepartmentScope` is the common department/Halle selector for Start and Shift
Handover. Use its compact white bordered surface, muted inline label and semibold
value as specified in the IOP-191 control contract below; feature adapters supply
choices and filtering behavior. Use shared labelled facts
for Workforce details instead of concatenating all fields into a prose line.

## Administration and Workforce consistency — IOP-185

Action variants share spacing, radius, height and focus behavior; color expresses
priority or destructive intent. `DeleteButton` supplies a labelled trash icon.
Form footers use `iop-form-actions` to separate Cancel/Save from editing controls.
Use the common bordered, keyboard-scrollable `TableViewport`, muted sticky headers
and row hover/focus treatment across modules. Every column/group header, including
the first, centers horizontally and vertically. Body cells center vertically;
the first column aligns left, and the remaining cells/actions center horizontally
unless the owner explicitly specifies another alignment. Table prose uses shared
`TableText`: more than two rendered lines are justified, with the last line aligned
left; shorter text inherits its column's alignment. This responds to content and
width changes. Features may set column widths but should not recreate the table
theme. More than three tabs use a
horizontal viewport on narrow screens to prevent label collisions.

Keep logout last inside the account menu, after identity and language. Administration summarizes
persisted account activity and the latest source file; management belongs in its
own sections. Account details contain the editable fields; list rows keep compact
access actions. Workforce uses date groups with shift subcolumns and daily shift
headings above leader cards. Configuration Add actions sit beside section headings,
with Save in a separated footer. These refinements preserve identity v1 tokens.

IOP-186 corrects summary-card alignment: compact and expanded handover cards use
one full-width content column, aligned to the left padding, with bounded wrapping.
Daily leader shift headings center in both axes; personal schedule names use the
shared blue, semibold body role, with muted state badges and caption-sized data.

IOP-187 makes Weekly plan and the Other zones zone-by-shift matrix compact: each
assignment shows the person name and a small accessible phone icon only when a
phone is assigned. Hours, zone labels and phone details remain available through
the person action; matrix headings supply shared context. Users keeps bounded
name/profile column widths instead of stretching the gap across the screen.
Shared badges use 1px vertical and 3px horizontal padding, and operational summary
cards use a uniform light border without a darker top stripe.

The owner's IOP-187 refinement centers all headers, including Date and Zone.
Department matrix title buttons start at the left while their supporting metadata
stays centered; long details follow the shared prose rule, and status badges stack
vertically. Daily shift leaders show names only beneath their shift heading;
floating support/maintenance cards show name and shift, with full information in
Details. My entries emphasizes entry date and responsible name with semibold navy
text. Handover category badges use green for Successes, red for Problems, amber
for Safety and blue for Information/other configured categories. Stable IDs select
presentation tone in the Handover adapter; configured labels remain unchanged.


IOP-188 removes duplicate visible table captions where a section title already
identifies Department matrix, Users or Weekly plan; each table keeps an accessible
name. Standalone captions use section-title size, navy ink and section spacing.
Department matrix centers date values as an explicit first-column exception and
reserves compact widths for short metadata, giving narrative columns more room.
Users places name and username on adjacent lines, provides name/username search
and shared three-state sortable headings, and edits only through a labelled pencil
button next to Delete. Account-name self-editing in the shell remains separate.

IOP-190 places Meeting preparation first, followed by Journal, Department matrix
and My entries. Journal and meeting share the selected calendar day; carry-forward
Problems/Performance live in a separate Department status disclosure. Matrix headings
pair their centered label with a compact shared `FilterButton`, except What? and
Details. Active criteria remain visually marked and their controls stay available
when a selection returns no rows. Filter dialogs reuse the shared modal and form
controls, with each Clear filter action limited to that column.

User search uses the shared `SearchControl` beside the Users heading. The icon
reveals an aligned input with immediate keyboard focus; closing it or pressing Escape
clears the search and returns focus to the icon. It wraps below the heading when
needed on narrow screens. Sorting remains independent of search visibility.


## Mandatory compact controls — IOP-191

The owner refined the compact control style on 2026-10-02 using the supplied compact
interface image as inspiration. These rules supersede IOP-191's initial stacked date
caption and full-width department surface. The existing Inter/system font, navy ink,
white surfaces and blue navigation accents remain canonical; the reference does not
change the platform name, module structure or permissions.

- All calendar-day selection uses `DateField`, including filters and editing forms.
  The visible label sits to the left of the native date input, vertically centered.
  Keep calendar-day strings, native picker/keyboard editing, labels and constraints.
- `DateField` and `DepartmentScope` share `iop-context-field`: a content-sized white
  surface, light border, 8px corners, 44px minimum height, muted semibold caption and
  navy semibold value separated by a subtle divider. Department values are bounded
  to 16rem; date values to 10rem. Both may shrink within their container.
- Department selection must not stretch across the page, including when used alone
  on Start, My entries or Department matrix. Group department then date in
  `iop-scope-toolbar` with a 10px gap, without a second enclosing card. On narrow
  screens wrap whole fields to the next row while keeping each label beside its value.
- Add and refresh use the same neutral `IconButton` treatment: 44px square target,
  20px line icon, 1.7-unit rounded stroke, navy ink, white surface, light border and
  8px corners. `AddButton` shows a plus; `RefreshButton` shows a single circular
  arrow. Shared search uses the same treatment. Preserve accessible names, titles,
  disabled/busy state, keyboard focus and reduced-motion behavior. Blue filled
  buttons remain for explicit form submission and other primary text actions.
- Workforce's heading groups Date, refresh and the Assign plus with equal gaps and
  aligned centers. Do not add a stacked caption or a separate colored Assign button.
- Feature styles must not override compact-control selectors or recreate native date
  inputs. Reuse shared tokens and components. Change this contract only through an
  explicit owner-requested update with desktop/mobile evidence.

`npm run check:design --workspace @iop/web` enforces token use, shared dependency
boundaries, calendar-field reuse and ownership of compact-control styles. It is a
required part of `npm run build --workspace @iop/web`, including the Docker build.
Browser checks enforce bounded width, inline labels, adjacent department/date
controls, matching toolbar actions, overflow and keyboard behavior. Static checks
alone do not replace visual review.

Available profiles use four compact cards with navy role titles and muted capability
summaries. The labelled plus beside user search opens the shared modal with creation
guidance and inline failure feedback. Keep initial credentials visible after success
until dismissed. My day prioritizes assigned shift, duty and hours, with person,
zone and phone as supporting labelled facts. Retain separately labelled availability
when its hours differ or no assignment exists. Journal category collections keep
clickable section/view/category breadcrumbs through entry details, preserving day
and department on return. Forms use the common separated action footer.


## Operational cards and account menu — IOP-192

The owner's 2026-10-02 refinement uses one expanded entry-card design for Start and
My entries: three columns on wide desktops, two on medium screens and one on narrow
screens. Preserve bounded previews, full entry access and explicit totals. Category
and a directional cue lead the card, followed by the blue title, location, state,
equipment, excerpt, labelled date/responsibility and due/feedback footer. Use compact
spacing and semantic tokens; do not infer urgency from dates. Meeting category cards
retain the title/location variant within their own category columns.

All New entry launchers use `AddButton`; Search history uses `IconButton` with the
shared search glyph. Keep accessible labels/titles even though visible text is
removed. Form submission actions remain labelled. Do not recreate these actions
with filled text buttons in another view.

IOP-193 refines the account trigger to a circular initials-only avatar with a labelled
44px target. The name and actual role appear only inside the opened panel. `Popover`
provides a compact anchored white panel, light border,
8px corners and the shared `popoverShadow`; it never blurs or blocks the workspace.
Profile, language and authorized View as controls stay together, with logout last
and semantically red. Do not add a Settings item without an implemented destination.
Use ordinary button/select Tab navigation, initial focus, Escape restoration and
outside-click dismissal. The notification bell sits immediately before the account
trigger; its count has a textual accessible equivalent. Notification and account
panels use the same surface and typography. The source SVG mark/favicon uses a
simplified operational I glyph inside a blue hexagonal outline; IOP remains the name.

Department matrix uses shared `Table variant="records"`: quiet alternating surfaces,
a stronger sticky header, comfortable cell padding and hover/focus highlighting.
Preserve centered headings and date values, left-aligned title buttons, centered
supporting metadata and vertical state badges. Longer prose retains `TableText`
justification rules. Keep native semantic tables and keyboard-scrollable viewports.


## Compact account rows and operational matrix — IOP-193

The account panel is bounded to 19rem with 4px outer padding, a compact identity
header and 44px minimum interactive rows. Profile, language, authorized View as and
logout retain their order. Language shows only DE/EN; View as pairs a left label with
its current profile in a right-aligned native select. Opening the select offers all
existing authorized preview choices directly. Avoid a second disclosure button,
duplicate identity beside the avatar or full language names. Keep keyboard focus,
Escape/outside dismissal and visible sign-out semantics.

The matrix caption distinguishes pending work/today's updates from explicitly
searched history. Ordinary column filters keep the operational scope; Clear search
restores it after historical search. Table alignment and shared controls are unchanged.

## Personal Start and daily controls — IOP-196

Profile uses a token-based initials avatar, role badge, labelled department/team,
compact personal figures and accessible shift-share progress bars. Assignment uses
shared DateField/inline Day–Week navigation and dated duty surfaces. Administrative
Start retains its role-specific account/data summary alongside personal cards.

Assigned-department content has a separate Explore other departments disclosure.
Attention and Open reports are disjoint; highlights follow the same department.
Place the meeting/daily date beside its section heading, with Today's reset action.
Current pending topics remain in their separate disclosure. Category add icons and
Maintenance completion dialogs use shared controls, visible focus and narrow layouts.
Image previews preserve their aspect ratio and never widen their card/page.

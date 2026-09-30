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
| Keyboard focus | `#edaa30` |
| Divided disclosure headings (preserved baseline) | `#174e69` |

Use Inter with system-ui/sans-serif fallback. Keep white, lightly bordered cards,
navy figures, muted labels, restrained blue actions, flat backgrounds and no added
shadows/gradients. Report cards use 8px corners; metric cards use 7px corners, 19px
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
shown/total count. Open reports includes attention entries; site-wide highlights
retain their separate scope. Empty collections show an explanatory state. Ordinary
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
reload controls aligned. The top-right language control combines a globe with DE
or EN; language names are not repeated in the header. Account name and role occupy
two readable lines; the name opens profile editing. Logout is a quiet labelled
icon action, with its visible text retained when space allows.

`DepartmentScope` is the common department/Halle selector for Start and Shift
Handover. Use its white bordered surface and dark, semibold label/control text;
feature adapters supply choices and filtering behavior. Use shared labelled facts
for Workforce details instead of concatenating all fields into a prose line.

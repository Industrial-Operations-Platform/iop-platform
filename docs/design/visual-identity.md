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
report text and titles remain navy. Preserve meaning without depending on color alone.

Use `PageHeading` consistently in overview and detail screens. Detail navigation
includes the module, current tab and current-page label inside the same heading;
retain its context, type scale and description. The tab breadcrumb returns to that
view with its selection intact; the module action explicitly returns home. Use shared `Panel`, `Button`, `Field`
and `Disclosure` variants for report content, actions and history. The detail action
row keeps a visible gap after the latest-update divider. Journal and Meeting
preparation use one feature-owned summary-card component, with a bordered clickable
surface, bold navy title and muted department. Do not recreate that presentation
as a blue-link list with separators in another tab.

The workspace shell supplies profile-aware navigation; features supply their content.
Start includes operational summaries and optional analytical evidence. Module tabs
use the shared bottom navigation. This contract governs their appearance rather than
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

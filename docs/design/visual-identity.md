# IOP visual identity — v1

The owner explicitly requested preserving the existing analytical workspace's colors
and styles on 2026-09-27. This is the baseline for future iterations, not a theme to
regenerate with each feature. Change the identity only when explicitly requested;
record intentional revisions here and inspect desktop and narrow layouts.

## Canonical implementation

[`identity.ts`](../../apps/web/src/design/identity.ts) is the single source for palette,
font and card tokens. The shared `IdentityRoot` (also used by `AppShell`) exposes these as `--iop-*` CSS
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
| Keyboard focus | `#edaa30` |
| Divided disclosure headings (preserved baseline) | `#174e69` |

Use Inter with system-ui/sans-serif fallback. Keep white, lightly bordered cards,
navy figures, muted labels, restrained blue actions, flat backgrounds and no added
shadows/gradients. Report cards use 8px corners; metric cards use 7px corners, 19px
padding, 29px figures at weight 650 and 14px gaps. Existing narrow-screen reductions
remain in the shared [component stylesheet](../../apps/web/src/design/components/components.css).

The header contains only user selection. The left rail contains Data analysis.
Report templates sit along the bottom. Executive Overview alone contains analytical
KPI cards; investigation tabs prioritize charts and detail. File volumes use the
same card treatment within import review. Pareto is a future Overview function.

Verification includes browser checks for the card palette, responsive overflow,
actual import/analysis navigation and manually inspected screenshots. The opt-in
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

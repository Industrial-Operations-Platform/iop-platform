# Shared IOP presentation components

Use this public barrel for new React presentation adapters. Wrap a page in
`AppShell`, or wrap an embedded composition once in `IdentityRoot`. Both apply the
canonical [identity tokens](../identity.ts). Components contain no feature models,
HTTP requests, permissions, report calculations or chart-library dependencies.

| Components | Responsibility |
| --- | --- |
| `IdentityRoot`, `AppShell` | Identity variables, typography, header, rail, main content and skip link |
| `PageHeading`, `Actions` | Consistent title, context, description and action layout |
| `Button` | `primary`, `secondary`, `text`; native disabled and focus behavior |
| `Field`, `Input`, `Select`, `FieldRow` | Labelled native controls; stacked/inline fields and wrapping rows |
| `ValueFilter` | Editable column value with native suggestions, unique accessible hint IDs and caller-owned matching semantics |
| `FilterForm`, `Disclosure` | Form surface and native collapsible content; plain/panel/divided variants |
| `Panel` | Content, chart, empty and metric surface treatments |
| `MonthPicker` | Controlled calendar-month dropdown using shared native select styling |
| `ComparisonCard` | Shared metric surface with caller-supplied state, value and textual comparison |
| `MetricGrid`, `MetricCard` | Responsive shared metric appearance; callers supply label/value/content |
| `Table`, `TableViewport` | Semantic table appearance and bounded scrolling |
| `Alert` | Error announcement and consistent error surface |
| `SideNavigation` | Controlled page navigation with current-page semantics |
| `SortableHeader` | Clickable column heading with caller-owned direction/priority and aria-sort; table headings vertically center plain labels and buttons together |
| `ViewNavigation` | Typed controlled view selector with labelled navigation and pressed buttons |

```tsx
import { useState } from "react";
import {
  Button, Disclosure, Field, FieldRow, FilterForm, IdentityRoot, Input,
  MetricCard, MetricGrid,
} from "../../design/components";

export function ExampleSummary() {
  const [date, setDate] = useState("");
  return (
    <IdentityRoot>
      <FilterForm onSubmit={(event) => event.preventDefault()}>
        <Disclosure summary="Date range">
          <FieldRow>
            <Field>
              From
              <Input type="date" value={date}
                onChange={(event) => setDate(event.target.value)} />
            </Field>
            <Button type="submit">Apply</Button>
          </FieldRow>
        </Disclosure>
      </FilterForm>
      <MetricGrid>
        <MetricCard label="Open items" value="12">
          <small>Example feature content</small>
        </MetricCard>
      </MetricGrid>
    </IdentityRoot>
  );
}
```

Buttons default to `type="button"`; submit controls must explicitly use
`type="submit"`. Native props, events and refs are preserved by controls. Give each
control a visible `Field` label, or an explicit accessible name for compact controls.
Keep table captions and column/row headers in the caller's semantic markup.
`Disclosure` uses native `details/summary` keyboard behavior. View navigation uses
ordinary buttons; it does not claim the keyboard model of ARIA tabs.

Reuse variants before writing additional CSS. Keep colors, typefaces and surface
rules in the shared identity/component layer; feature CSS should arrange feature
content. Intentional identity changes require the owner's request and a documented
revision to the [visual identity](../../../../../docs/design/visual-identity.md).
Extend a shared component when several features need the same presentation pattern;
keep business-specific composites in their feature's React adapter. `ReportFilters`
and `Plot` illustrate this boundary: report policy and ECharts stay outside this
library. The existing optional fixture preview is a separate historical surface.

Validate changes with `npm test --workspace @iop/web`, the actual browser analytical
journey, and desktop/narrow layout inspection. The dependency check prevents this
library from importing features or transport adapters.

`ViewNavigation` keeps the selected button visible inside its horizontal viewport
on selection and window resize, without moving keyboard focus.

import { useState } from "react";
import {
  Button,
  Disclosure,
  Field,
  FieldRow,
  FilterForm,
  Input,
  Select,
} from "../../../../design/components";
import { changeSelection, reportViews } from "../../application/workspace";
import {
  dimensions,
  type Dimension,
  type Report,
  type ReportRequest,
} from "../../domain/models";
import { labels } from "./labels";
export function ReportFilters({
  selection,
  view,
  report,
  onApply,
}: {
  selection: ReportRequest;
  view: number;
  report: Report | null;
  onApply: (s: ReportRequest) => void;
}) {
  const [draft, setDraft] = useState(selection);
  return (
    <FilterForm
      className="analysis-filters"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(changeSelection(draft, {}));
      }}
    >
      <Disclosure
        className="analysis-filter-panel"
        variant="plain"
        summary={
          <>
            Date range{view > 1 ? " & filters" : ""} · {selection.from} –{" "}
            {new Date(Date.parse(selection.toExclusive) - 86400000)
              .toISOString()
              .slice(0, 10)}
            {Object.values(selection.filters ?? {}).flat().length > 0
              ? ` · ${Object.values(selection.filters ?? {}).flat().length} active`
              : ""}
          </>
        }
      >
        <FieldRow>
          <Field>
            From
            <Input
              type="date"
              required
              value={draft.from}
              onChange={(e) => setDraft({ ...draft, from: e.target.value })}
            />
          </Field>
          <Field>
            To (exclusive)
            <Input
              type="date"
              required
              value={draft.toExclusive}
              onChange={(e) =>
                setDraft({ ...draft, toExclusive: e.target.value })
              }
            />
          </Field>
          {view > 1 && (
            <>
              <Field>
                Group by
                <Select
                  aria-label="Group by"
                  value={draft.dimension}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      dimension: e.target.value as Dimension,
                    })
                  }
                >
                  {dimensions.map((d) => (
                    <option key={d} value={d}>
                      {labels[d]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field>
                Measure
                <Select
                  aria-label="Measure"
                  value={draft.metric}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      metric: e.target.value as ReportRequest["metric"],
                    })
                  }
                >
                  <option value="frequency">Frequency</option>
                  <option value="duration">Duration · minutes</option>
                </Select>
              </Field>
              <Field>
                Period
                <Select
                  aria-label="Period"
                  value={draft.period}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      period: e.target.value as ReportRequest["period"],
                    })
                  }
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </Select>
              </Field>
            </>
          )}
          <Button type="submit">Apply filters</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              onApply(changeSelection(selection, { filters: {}, search: "" }))
            }
          >
            Clear filters
          </Button>
        </FieldRow>
        {view > 1 && (
          <>
            <FieldRow>
              {reportViews[view].filters.map((d) => (
                <Field key={d}>
                  {labels[d]}
                  <Input
                    aria-label={labels[d] + " filter"}
                    list={"values-" + d}
                    value={draft.filters?.[d]?.[0] ?? ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        filters: {
                          ...draft.filters,
                          [d]: e.target.value ? [e.target.value] : [],
                        },
                      })
                    }
                  />
                  <datalist id={"values-" + d}>
                    {report?.options[d]?.map((v) => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                  <small>
                    {d === "duration" ? "Exact seconds for this filter. " : ""}
                    Type an exact value; up to 200 suggestions.
                  </small>
                </Field>
              ))}
            </FieldRow>
          </>
        )}
      </Disclosure>
    </FilterForm>
  );
}

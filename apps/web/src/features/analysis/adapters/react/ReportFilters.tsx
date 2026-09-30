import { t } from "../../../../localization/i18n";
import { useState } from "react";
import {
  Button,
  Disclosure,
  Field,
  FieldRow,
  FilterForm,
  MonthMultiPicker,
  Select,
  ValueFilter,
} from "../../../../design/components";
import {
  changeSelection,
  monthSelection,
  reportViews,
} from "../../application/workspace";
import {
  dimensions,
  type Dimension,
  type Report,
  type ReportRequest,
} from "../../domain/models";
import { labels } from "./labels";
export function ReportFilters({
  selection,
  months = [],
  view,
  report,
  onApply,
}: {
  selection: ReportRequest;
  months?: string[];
  view: number;
  report: Report | null;
  onApply: (s: ReportRequest) => void;
}) {
  const [draft, setDraft] = useState(selection);
  const appliedMonths = selection.months ?? [selection.from.slice(0, 7)];
  const [draftMonths, setDraftMonths] = useState(appliedMonths);
  const choices = [...new Set([...months, ...appliedMonths])].sort();
  const activeCount =
    Object.values(selection.filters ?? {}).flat().length +
    (selection.search ? 1 : 0) +
    (choices.some((month) => !appliedMonths.includes(month)) ? 1 : 0);
  const clear = () => {
    const cleared = changeSelection(selection, { filters: {}, search: "" });
    const next = monthSelection(cleared, choices);
    setDraft(next);
    setDraftMonths(next.months ?? appliedMonths);
    onApply(next);
  };
  return (
    <FilterForm
      className="analysis-filters"
      onSubmit={(e) => {
        e.preventDefault();
        if (!draftMonths.length) return;
        onApply(monthSelection(draft, draftMonths));
      }}
    >
      <Disclosure
        className="analysis-filter-panel"
        variant="plain"
        summary={
          <>
            {t("Months · ")}
            {appliedMonths.join(t(", "))}
            {activeCount > 0 ? t(" · {0} active", [activeCount]) : ""}
          </>
        }
      >
        <MonthMultiPicker
          value={draftMonths}
          months={choices}
          onChange={setDraftMonths}
        />
        <p>
          {t(
            "Select one or more months, then apply. Selected months stay active in all detail views. Clear filters restores all available months. ",
          )}
        </p>
        {!draftMonths.length && (
          <p role="alert">{t("Select at least one month.")}</p>
        )}
        <FieldRow>
          {view > 1 && (
            <>
              <Field>
                {t("Group by ")}
                <Select
                  aria-label={t("Group by")}
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
                {t("Measure ")}
                <Select
                  aria-label={t("Measure")}
                  value={draft.metric}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      metric: e.target.value as ReportRequest["metric"],
                    })
                  }
                >
                  <option value="frequency">{t("Frequency")}</option>
                  <option value="duration">{t("Duration · minutes")}</option>
                </Select>
              </Field>
              <Field>
                {t("Period ")}
                <Select
                  aria-label={t("Period")}
                  value={draft.period}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      period: e.target.value as ReportRequest["period"],
                    })
                  }
                >
                  <option value="day">{t("Daily")}</option>
                  <option value="week">{t("Weekly")}</option>
                  <option value="month">{t("Monthly")}</option>
                </Select>
              </Field>
            </>
          )}
          <Button type="submit" disabled={!draftMonths.length}>
            {t("Apply filters ")}
          </Button>
        </FieldRow>
        {view > 1 && (
          <>
            <FieldRow>
              {reportViews[view].filters.map((d) => (
                <ValueFilter
                  key={d}
                  label={labels[d]}
                  value={draft.filters?.[d]?.[0] ?? ""}
                  options={report?.options[d]}
                  hint={
                    d === "duration"
                      ? t(
                          "Exact seconds for this filter. Type an exact value; up to 200 suggestions.",
                        )
                      : undefined
                  }
                  onChange={(value) =>
                    setDraft({
                      ...draft,
                      filters: { ...draft.filters, [d]: value ? [value] : [] },
                    })
                  }
                />
              ))}
            </FieldRow>
          </>
        )}
      </Disclosure>
      <Button
        type="button"
        variant="secondary"
        className="analysis-clear-filters"
        onClick={clear}
      >
        {t("Clear filters ")}
      </Button>
    </FilterForm>
  );
}

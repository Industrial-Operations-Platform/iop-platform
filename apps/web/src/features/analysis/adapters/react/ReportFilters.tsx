import { t } from "../../../../localization/i18n";
import { useEffect, useState } from "react";
import { changeReportFilter } from "../../domain/report-filters";
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
  loadOptions,
  onApply,
}: {
  selection: ReportRequest;
  months?: string[];
  view: number;
  report: Report | null;
  loadOptions?: (selection: ReportRequest) => Promise<Report>;
  onApply: (s: ReportRequest) => void;
}) {
  const [draft, setDraft] = useState(selection);
  const appliedMonths = selection.months ?? [selection.from.slice(0, 7)];
  const [draftMonths, setDraftMonths] = useState(appliedMonths);
  const optionRequest = monthSelection(draft, draftMonths);
  const optionKey = JSON.stringify({
    months: optionRequest.months,
    filters: draft.filters ?? {},
  });
  const appliedKey = JSON.stringify({
    months: [...appliedMonths].sort(),
    filters: selection.filters ?? {},
  });
  const [preview, setPreview] = useState<{ key: string; report: Report }>();
  const [failedKey, setFailedKey] = useState<string>();
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!loadOptions || optionKey === appliedKey || !draftMonths.length) return;
    let active = true;
    const timer = setTimeout(() => {
      void loadOptions(optionRequest).then(
        (result) => {
          if (active) setPreview({ key: optionKey, report: result });
        },
        () => {
          if (active) setFailedKey(optionKey);
        },
      );
    }, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [optionKey, appliedKey, loadOptions, retry]);
  const pending = !!loadOptions && optionKey !== appliedKey &&
    preview?.key !== optionKey && failedKey !== optionKey;
  const failed = failedKey === optionKey && preview?.key !== optionKey;
  const optionsFor = (field: Dimension) => {
    const prefix = (request: ReportRequest) =>
      JSON.stringify({
        months: [...(request.months ?? [request.from.slice(0, 7)])].sort(),
        filters: dimensions.slice(0, dimensions.indexOf(field))
          .map((key) => request.filters?.[key] ?? []),
      });
    // Ancestors remain usable while a new descendant list is loading.
    const candidate = [preview?.report, report].find(
      (candidate) => candidate && prefix(candidate.selection) === prefix(optionRequest),
    );
    return candidate ? candidate.options[field] ?? [] : undefined;
  };
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
    setFailedKey(undefined);
    onApply(next);
  };
  return (
    <FilterForm
      className="analysis-filters"
      onSubmit={(e) => {
        e.preventDefault();
        if (!draftMonths.length || pending || failed) return;
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
          onChange={(value) => {
            setDraftMonths(value);
            setFailedKey(undefined);
          }}
        />
        <p>
          {t(
            "Select one or more months, then apply. Other filters stay selected. Selected months stay active in all detail views. Clear filters restores all available months.",
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
          <Button type="submit" disabled={!draftMonths.length || pending || failed}>
            {t("Apply filters ")}
          </Button>
        </FieldRow>
        {view > 1 && (
          <>
            <FieldRow>
              {reportViews[view].filters.map((d) => d !== "frequency" && d !== "duration" ? (
                <Field key={d}>
                  {labels[d]}
                  <Select
                    aria-label={labels[d] + t(" filter")}
                    value={draft.filters?.[d]?.[0] ?? ""}
                    disabled={!!loadOptions && !optionsFor(d)}
                    onChange={(event) => {
                      setFailedKey(undefined);
                      setDraft({
                        ...draft,
                        filters: changeReportFilter(draft.filters, d, event.target.value),
                      });
                    }}
                  >
                    <option value="">{t("All")}</option>
                    {[...new Set([...(optionsFor(d) ?? []), ...(draft.filters?.[d] ?? [])])].map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </Select>
                </Field>
              ) : (
                <ValueFilter
                  key={d}
                  label={labels[d]}
                  value={draft.filters?.[d]?.[0] ?? ""}
                  options={optionsFor(d)}
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
                      filters: changeReportFilter(draft.filters, d, value),
                    })
                  }
                />
              ))}
            </FieldRow>
            <p>
              {t("Choices follow the filters above. Changing a filter clears the following filters. ")}
            </p>
            {pending && <p role="status">{t("Updating compatible choices…")}</p>}
            {failed && (
              <p role="alert">
                {t("Could not validate these filters. Check the values and try again.")}
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFailedKey(undefined);
                    setRetry((value) => value + 1);
                  }}
                >
                  {t("Retry choices ")}
                </Button>
              </p>
            )}
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

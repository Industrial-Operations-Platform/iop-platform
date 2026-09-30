import { t } from "../../../../localization/i18n";
import { changeSourceFilter } from "../../domain/source-filters";
import { useEffect, useState } from "react";
import {
  Button,
  Disclosure,
  FieldRow,
  FilterForm,
  ValueFilter,
} from "../../../../design/components";
import type {
  SourceFilters,
  SourceFilterField,
  SourceSortField,
  SourceRowsResult,
} from "../../domain/models";

export const sourceSortColumns: { field: SourceSortField; label: string }[] = [
  { field: "sector", label: "Sector" },
  { field: "area", label: "Bereich" },
  { field: "equipment", label: "Betriebsmittelkennzeichen" },
  { field: "message", label: "Meldetext" },
  { field: "type", label: "Typ" },
  { field: "messageGroup", label: "Meldegruppe" },
];
const columns: { field: SourceFilterField; label: string }[] = [
  ...sourceSortColumns,
  { field: "line", label: "Line" },
  { field: "frequency", label: "Häufigkeit" },
  { field: "minutes", label: "Dauer · minutes" },
];
export function SourceFileFilters({
  filters,
  snapshot,
  loadPreview,
  onApply,
}: {
  filters?: SourceFilters;
  snapshot: SourceRowsResult | null;
  loadPreview: (filters: SourceFilters) => Promise<SourceRowsResult>;
  onApply: (filters: SourceFilters) => void;
}) {
  const [draft, setDraft] = useState<SourceFilters>(filters ?? {});
  useEffect(() => setDraft(filters ?? {}), [filters]);
  const draftKey = JSON.stringify(draft);
  const appliedKey = JSON.stringify(filters ?? {});
  const [preview, setPreview] = useState<{
    key: string;
    result?: SourceRowsResult;
    failed?: boolean;
  }>();
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (draftKey === appliedKey) return;
    let active = true;
    const timer = setTimeout(() => {
      void loadPreview(JSON.parse(draftKey) as SourceFilters).then(
        (result) => {
          if (active) setPreview({ key: draftKey, result });
        },
        () => {
          if (active) setPreview({ key: draftKey, failed: true });
        },
      );
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [draftKey, appliedKey, loadPreview, retry]);
  const current =
    draftKey === appliedKey && snapshot
      ? snapshot
      : preview?.key === draftKey
        ? preview.result
        : undefined;
  const failed = !current && preview?.key === draftKey && preview.failed;
  const pending = !current && !failed;
  const canApply = !!current && current.recordCount > 0;
  const count = Object.values(filters ?? {}).filter(Boolean).length;
  return (
    <FilterForm
      className="analysis-filters"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canApply) return;
        onApply(
          Object.fromEntries(
            Object.entries(draft).filter(([, value]) => value !== ""),
          ),
        );
      }}
    >
      <Disclosure
        className="analysis-filter-panel"
        variant="plain"
        summary={
          <>
            {t("Column filters")}
            {count ? t(" · {0} active", [count]) : ""}
            {draftKey !== appliedKey ? t(" · changes pending") : ""}
          </>
        }
      >
        <p>
          {t(
            "Choices follow the filters above. Changing a filter clears the following filters. ",
          )}
        </p>
        <FieldRow>
          {columns.map(({ field, label }) => (
            <ValueFilter
              key={field}
              label={t(label)}
              value={draft[field] ?? ""}
              options={current?.options?.[field]}
              inputMode={
                field === "minutes"
                  ? "decimal"
                  : field === "line" || field === "frequency"
                    ? "numeric"
                    : undefined
              }
              hint={
                field === "minutes"
                  ? t(
                      "Exact minutes, rounded to 2 decimals (for example, 1.25).",
                    )
                  : undefined
              }
              onChange={(value) => {
                setPreview(undefined);
                setDraft(changeSourceFilter(draft, field, value));
              }}
            />
          ))}
        </FieldRow>
        <p role="status">
          {pending
            ? t("Updating compatible choices…")
            : failed
              ? t(
                  "Could not validate these filters. Check the values and try again.",
                )
              : current?.recordCount === 0
                ? t(
                    "No matching combination. Choose a suggested value or clear the filters.",
                  )
                : t("{0} matching rows available.{1}", [
                    current?.recordCount,
                    draftKey !== appliedKey
                      ? t(" Apply filters to update the table.")
                      : "",
                  ])}
        </p>
        {failed && (
          <Button
            variant="secondary"
            onClick={() => {
              setPreview(undefined);
              setRetry((value) => value + 1);
            }}
          >
            {t("Retry choices ")}
          </Button>
        )}
        <FieldRow>
          <Button type="submit" disabled={!canApply}>
            {t("Apply filters ")}
          </Button>
          <Button variant="secondary" onClick={() => onApply({})}>
            {t("Clear filters ")}
          </Button>
        </FieldRow>
      </Disclosure>
    </FilterForm>
  );
}

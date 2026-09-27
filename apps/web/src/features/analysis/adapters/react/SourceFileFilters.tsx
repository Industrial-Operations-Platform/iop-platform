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
  options,
  onApply,
}: {
  filters?: SourceFilters;
  options?: Record<string, string[]>;
  onApply: (filters: SourceFilters) => void;
}) {
  const [draft, setDraft] = useState<SourceFilters>(filters ?? {});
  useEffect(() => setDraft(filters ?? {}), [filters]);
  const count = Object.values(filters ?? {}).filter(Boolean).length;
  return (
    <FilterForm
      className="analysis-filters"
      onSubmit={(event) => {
        event.preventDefault();
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
        summary={<>Column filters{count ? ` · ${count} active` : ""}</>}
      >
        <FieldRow>
          {columns.map(({ field, label }) => (
            <ValueFilter
              key={field}
              label={label}
              value={draft[field] ?? ""}
              options={options?.[field]}
              inputMode={
                field === "minutes"
                  ? "decimal"
                  : field === "line" || field === "frequency"
                    ? "numeric"
                    : undefined
              }
              hint={
                field === "minutes"
                  ? "Exact minutes, rounded to 2 decimals (for example, 1.25)."
                  : undefined
              }
              onChange={(value) => setDraft({ ...draft, [field]: value })}
            />
          ))}
        </FieldRow>
        <FieldRow>
          <Button type="submit">Apply filters</Button>
          <Button variant="secondary" onClick={() => onApply({})}>
            Clear filters
          </Button>
        </FieldRow>
      </Disclosure>
    </FilterForm>
  );
}

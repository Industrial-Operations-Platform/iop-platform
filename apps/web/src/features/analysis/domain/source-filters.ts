import type { SourceFilterField, SourceFilters } from "./models";

/** The presentation follows this cascade; a changed ancestor clears later criteria. */
export const sourceFilterOrder: readonly SourceFilterField[] = [
  "sector",
  "area",
  "equipment",
  "message",
  "type",
  "messageGroup",
  "line",
  "frequency",
  "minutes",
];
export function changeSourceFilter(
  filters: SourceFilters,
  field: SourceFilterField,
  value: string,
): SourceFilters {
  const next: SourceFilters = {};
  for (const key of sourceFilterOrder) {
    if (key === field) {
      if (value !== "") next[key] = value;
      break;
    }
    if (filters[key]) next[key] = filters[key];
  }
  return next;
}

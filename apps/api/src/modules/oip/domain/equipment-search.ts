import { AnalyticsError } from "./values";

export interface EquipmentChoice {
  code: string;
  sector: string;
  area: string;
}
export interface EquipmentSearchResult {
  values: EquipmentChoice[];
  more: boolean;
}
export function equipmentSearch(input: unknown): string {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new AnalyticsError("invalid_selection");
  const value = input as Record<string, unknown>;
  if (Object.keys(value).join() !== "search" ||
      typeof value.search !== "string" || value.search.length > 200 ||
      !value.search.trim() || /[\u0000-\u001f\u007f]/.test(value.search))
    throw new AnalyticsError("invalid_selection");
  return value.search.trim();
}

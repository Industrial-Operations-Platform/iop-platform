import { AnalyticsError } from "./values";
export const sourceSortFields = [
  "sector",
  "area",
  "equipment",
  "message",
  "type",
  "messageGroup",
] as const;
export const sourceFilterFields = [
  ...sourceSortFields,
  "line",
  "frequency",
  "minutes",
] as const;
export type SourceFilters = Partial<
  Record<(typeof sourceFilterFields)[number], string>
>;
export interface SourceSort {
  field: (typeof sourceSortFields)[number];
  direction: "asc" | "desc";
}
export interface SourceRowsRequest {
  importId: string;
  page: number;
  sort: SourceSort[];
  filters?: SourceFilters;
  revision?: string;
}
export interface SourceRowsResult {
  totalRecordCount?: number;
  options?: Record<string, string[]>;
  revision: string;
  records: Record<string, string | number>[];
  recordCount: number;
  page: number;
  pageCount: number;
}
export interface MessageCatalog {
  values: string[];
  nextCursor: string | null;
}
export function sourceRowsRequest(input: unknown): SourceRowsRequest {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new AnalyticsError("invalid_selection");
  const x = input as SourceRowsRequest;
  if (
    Object.keys(x).some(
      (k) => !["importId", "page", "sort", "revision", "filters"].includes(k),
    ) ||
    typeof x.importId !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      x.importId,
    ) ||
    !Number.isInteger(x.page) ||
    x.page < 1 ||
    x.page > 400000 ||
    !Array.isArray(x.sort) ||
    x.sort.length > 6 ||
    x.sort.some(
      (s) =>
        !s ||
        Object.keys(s).sort().join(",") !== "direction,field" ||
        !sourceSortFields.includes(s.field) ||
        !["asc", "desc"].includes(s.direction),
    ) ||
    new Set(x.sort.map((s) => s.field)).size !== x.sort.length ||
    (x.revision !== undefined &&
      (typeof x.revision !== "string" ||
        !/^a1\.[A-Za-z0-9_-]{43}$/.test(x.revision)))
  )
    throw new AnalyticsError("invalid_selection");
  const filters = x.filters ?? {};
  if (
    x.filters === null ||
    typeof filters !== "object" ||
    Array.isArray(filters) ||
    Object.entries(filters).some(
      ([key, value]) =>
        !sourceFilterFields.includes(
          key as (typeof sourceFilterFields)[number],
        ) ||
        typeof value !== "string" ||
        value.length > 4096 ||
        /[\x00-\x1f]/.test(value) ||
        (value !== "" &&
          ["line", "frequency", "minutes"].includes(key) &&
          (!(key === "minutes" ? /^\d{1,16}(\.\d{1,2})?$/ : /^\d{1,16}$/).test(
            value,
          ) ||
            Number(value) > Number.MAX_SAFE_INTEGER)),
    )
  )
    throw new AnalyticsError("invalid_selection");
  return {
    ...x,
    filters: Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== ""),
    ),
  };
}
export function messageCursor(input: unknown): string | null {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new AnalyticsError("invalid_selection");
  const x = input as Record<string, unknown>;
  if (
    Object.keys(x).some((k) => k !== "after") ||
    (x.after !== undefined &&
      (typeof x.after !== "string" ||
        x.after.length > 4096 ||
        /[\x00-\x1f]/.test(x.after)))
  )
    throw new AnalyticsError("invalid_selection");
  return (x.after as string | undefined) ?? null;
}

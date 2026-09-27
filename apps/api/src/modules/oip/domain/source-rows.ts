import { AnalyticsError } from "./values";
export const sourceSortFields = [
  "sector",
  "area",
  "equipment",
  "message",
  "type",
  "messageGroup",
] as const;
export interface SourceSort {
  field: (typeof sourceSortFields)[number];
  direction: "asc" | "desc";
}
export interface SourceRowsRequest {
  importId: string;
  page: number;
  sort: SourceSort[];
  revision?: string;
}
export interface SourceRowsResult {
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
      (k) => !["importId", "page", "sort", "revision"].includes(k),
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
  return x;
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

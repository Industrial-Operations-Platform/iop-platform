import { createHash } from "node:crypto";
import type { ImportSource } from "../integrations";

export type Dimension = "sector" | "area" | "equipment" | "message";
export const dimensions: Dimension[] = [
  "sector",
  "area",
  "equipment",
  "message",
];
export { AnalyticsError, exactTotal, dateLabel } from "./domain/values";
import { AnalyticsError, dateLabel } from "./domain/values";
export const digest = (value: unknown): string =>
  createHash("sha256")
    .update(JSON.stringify(value), "utf8")
    .digest("base64url");
export const scopeTuple = (s: ImportSource): string[] => [
  s.organizationId,
  s.siteId,
  s.sourceId,
];
export function dimensionReference(
  s: ImportSource,
  kind: Dimension,
  tuple: unknown[],
): string {
  return "d1." + digest([1, ...scopeTuple(s), kind, ...tuple]);
}
export interface Selection {
  from: string;
  toExclusive: string;
  sectors?: string[];
  areas?: string[];
  equipment?: string[];
  messages?: string[];
  excludedMessages?: string[];
}
export interface AnalyticalRequest extends Selection {
  revision: string;
  pageSize: number;
  cursor?: string;
}
const sets = [
  "sectors",
  "areas",
  "equipment",
  "messages",
  "excludedMessages",
] as const;
export function validateQuery(value: unknown): AnalyticalRequest {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new AnalyticsError("invalid_selection");
  const v = value as Record<string, unknown>;
  if (
    Object.keys(v).some(
      (k) =>
        ![
          "from",
          "toExclusive",
          ...sets,
          "revision",
          "pageSize",
          "cursor",
        ].includes(k),
    ) ||
    !dateLabel(v.from) ||
    !dateLabel(v.toExclusive) ||
    typeof v.revision !== "string" ||
    !/^r1\.[A-Za-z0-9_-]{43}$/.test(v.revision)
  )
    throw new AnalyticsError("invalid_selection");
  const days = (Date.parse(v.toExclusive) - Date.parse(v.from)) / 86400000;
  if (days < 1 || days > 366) throw new AnalyticsError("invalid_selection");
  const pageSize = v.pageSize === undefined ? 50 : v.pageSize;
  if (
    !Number.isInteger(pageSize) ||
    Number(pageSize) < 1 ||
    Number(pageSize) > 100
  )
    throw new AnalyticsError("invalid_selection");
  const result: AnalyticalRequest = {
    from: v.from,
    toExclusive: v.toExclusive,
    revision: v.revision,
    pageSize: Number(pageSize),
  };
  let total = 0;
  for (const key of sets) {
    if (v[key] === undefined) continue;
    const values = v[key];
    if (
      !Array.isArray(values) ||
      values.length < 1 ||
      values.length > 100 ||
      values.some(
        (x) => typeof x !== "string" || !/^d1\.[A-Za-z0-9_-]{43}$/.test(x),
      )
    )
      throw new AnalyticsError("invalid_selection");
    total += values.length;
    result[key] = [...new Set(values as string[])].sort();
  }
  if (
    total > 300 ||
    result.messages?.some((x) => result.excludedMessages?.includes(x))
  )
    throw new AnalyticsError("invalid_selection");
  if (v.cursor !== undefined) {
    if (
      typeof v.cursor !== "string" ||
      v.cursor.length > 4096 ||
      !/^[A-Za-z0-9_-]+$/.test(v.cursor)
    )
      throw new AnalyticsError("invalid_selection");
    result.cursor = v.cursor;
  }
  return result;
}
export function selectionOf(q: AnalyticalRequest): Selection {
  const result: Selection = { from: q.from, toExclusive: q.toExclusive };
  for (const key of sets) if (q[key]) result[key] = q[key];
  return result;
}
export interface Fact {
  importId: string;
  rawId: string;
  reportingDate: string;
  sourceRecordNumber: number;
  reportedFrequency: number;
  accumulatedAlarmSeconds: number;
  originalDuration: string;
  sourceArea: string;
  sourceEquipmentReference: string;
  sourceMessageText: string;
  sourceMessageType: string;
  sourceMessageGroup: string;
  repeatedTuple: boolean;
  classificationStatus: "mapped" | "unclassified";
  sectorKey: string | null;
  sectorLabel: string;
  sectorRef: string;
  areaRef: string;
  equipmentRef: string;
  messageRef: string;
  mappingRevision: string;
  adapterRevision: string;
  profileRevision: string;
  siteTimeZone: string;
}
export interface Group {
  reference: string;
  label: string;
  reportedFrequency: number;
  accumulatedAlarmSeconds: number;
  recordCount: number;
}
export interface Availability {
  revision: string;
  dates: string[];
  latestDate: string | null;
  siteTimeZone: string;
}
export interface Analysis {
  revision: string;
  selection: Selection;
  recordCount: number;
  reportedFrequency: number;
  accumulatedAlarmSeconds: number;
  admittedDates: string[];
  missingDates: string[];
  state: "no-imports" | "no-matches" | "ready";
  unclassifiedCount: number;
  repeatedCount: number;
  records: Fact[];
  nextCursor: string | null;
  groups: Record<Dimension, Group[]>;
  groupCounts: Record<Dimension, number>;
  reportingWindowStatus: "unknown";
}
export function decodeCursor(token: string): Record<string, unknown> {
  try {
    const bytes = Buffer.from(token, "base64url");
    if (bytes.toString("base64url") !== token) throw new Error();
    const value = JSON.parse(bytes.toString("utf8"));
    if (!value || Array.isArray(value) || typeof value !== "object")
      throw new Error();
    return value;
  } catch {
    throw new AnalyticsError("invalid_selection");
  }
}

import type { MonthlyExecutive } from "./executive";
import { AnalyticsError, dateLabel } from "./values";
import { reportDimensions, type ReportDimension } from "./reporting-profile";
export interface ReportRequest {
  months?: string[];
  executive?: boolean;
  from: string;
  toExclusive: string;
  dimension: ReportDimension;
  period: "day" | "week" | "month";
  metric: "frequency" | "duration";
  filters: Partial<Record<ReportDimension, string[]>>;
  search: string;
  page: number;
  revision?: string;
}
export interface ReportRow {
  key: string;
  frequency: number;
  seconds: number;
  minutes: number;
  records: number;
}
export interface ReportPoint extends ReportRow {
  period: string;
}
export interface ExecutiveLeader extends ReportRow {
  dimension: "sector" | "area" | "equipment" | "message";
  metric: "frequency" | "duration";
}
export interface ReportResult {
  excludedWeekdays?: number[];
  monthlyExecutive?: MonthlyExecutive;
  revision: string;
  profileVersion: string;
  selection: ReportRequest;
  totals: ReportRow;
  executive: ExecutiveLeader[];
  groups: ReportRow[];
  frequencyGroups: ReportRow[];
  durationGroups: ReportRow[];
  groupCount: number;
  timeline: ReportPoint[];
  series: ReportPoint[];
  monthly: ReportPoint[];
  options: Record<string, string[]>;
  optionCounts: Record<string, number>;
  dates: string[];
  records: Record<string, string | number>[];
  recordCount: number;
  page: number;
  pageCount: number;
  unclassifiedCount: number;
}
const obj = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
export function reportRequest(input: unknown): ReportRequest {
  if (
    !obj(input) ||
    Object.keys(input).some(
      (k) =>
        ![
          "executive",
          "months",
          "from",
          "toExclusive",
          "dimension",
          "period",
          "metric",
          "filters",
          "search",
          "page",
          "revision",
        ].includes(k),
    ) ||
    !dateLabel(input.from) ||
    !dateLabel(input.toExclusive) ||
    !(reportDimensions as readonly unknown[]).includes(input.dimension) ||
    typeof input.period !== "string" ||
    !["day", "week", "month"].includes(input.period) ||
    typeof input.metric !== "string" ||
    !["frequency", "duration"].includes(input.metric)
  )
    throw new AnalyticsError("invalid_selection");
  const days =
    (Date.parse(input.toExclusive) - Date.parse(input.from)) / 86400000;
  if (days < 1 || days > 3660) throw new AnalyticsError("invalid_selection");
  const months = input.months;
  const from = input.from,
    toExclusive = input.toExclusive;
  if (
    months !== undefined &&
    (!Array.isArray(months) ||
      months.length < 1 ||
      months.length > 120 ||
      months.some(
        (month) =>
          typeof month !== "string" ||
          !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
          !dateLabel(month + "-01") ||
          month + "-01" < from ||
          new Date(
            Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 1),
          )
            .toISOString()
            .slice(0, 10) > toExclusive,
      ) ||
      input.executive)
  )
    throw new AnalyticsError("invalid_selection");
  const filters = input.filters ?? {};
  if (
    !obj(filters) ||
    Object.keys(filters).some(
      (k) => !reportDimensions.includes(k as ReportDimension),
    )
  )
    throw new AnalyticsError("invalid_selection");
  let count = 0;
  for (const values of Object.values(filters)) {
    if (
      !Array.isArray(values) ||
      values.length > 50 ||
      values.some(
        (x) => typeof x !== "string" || x.length > 4096 || /[\0\r\n]/.test(x),
      )
    )
      throw new AnalyticsError("invalid_selection");
    count += values.length;
  }
  const search = input.search ?? "",
    page = input.page ?? 1;
  if (
    count > 200 ||
    typeof search !== "string" ||
    search.length > 200 ||
    !Number.isInteger(page) ||
    Number(page) < 1 ||
    Number(page) > 400000 ||
    (input.revision !== undefined &&
      (typeof input.revision !== "string" ||
        !/^a1\.[A-Za-z0-9_-]{43}$/.test(input.revision)))
  )
    throw new AnalyticsError("invalid_selection");
  if (input.executive !== undefined && typeof input.executive !== "boolean")
    throw new AnalyticsError("invalid_selection");
  if (
    input.executive &&
    (input.from.slice(8) !== "01" ||
      new Date(
        Date.UTC(
          Number(input.from.slice(0, 4)),
          Number(input.from.slice(5, 7)),
          1,
        ),
      )
        .toISOString()
        .slice(0, 10) !== input.toExclusive ||
      input.dimension !== "area" ||
      input.period !== "day" ||
      input.metric !== "frequency" ||
      count ||
      search)
  )
    throw new AnalyticsError("invalid_selection");
  return {
    ...(input.executive ? { executive: true } : {}),
    ...(months ? { months: [...new Set(months as string[])].sort() } : {}),
    from: input.from,
    toExclusive: input.toExclusive,
    dimension: input.dimension as ReportDimension,
    period: input.period as ReportRequest["period"],
    metric: input.metric as ReportRequest["metric"],
    filters: filters as ReportRequest["filters"],
    search,
    page: Number(page),
    ...(input.revision ? { revision: String(input.revision) } : {}),
  };
}

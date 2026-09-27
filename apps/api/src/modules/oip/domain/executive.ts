import { AnalyticsError } from "./values";

export interface ExecutiveKpiDefinition {
  id: string;
  label: string;
  message: string;
  metric: "frequency" | "duration";
  goal: number | null;
}
export interface ExecutiveKpi extends ExecutiveKpiDefinition {
  total: number;
  average: number | null;
  historicalAverage: number | null;
  reference: number | null;
  referenceKind: "goal" | "historical";
  changePercent: number | null;
  status: "better" | "worse" | "equal" | "unavailable";
}
export interface MonthlyExecutive {
  month: string;
  importedDays: number;
  calendarDays: number;
  analysisDays?: number;
  historicalDays: number;
  kpis: ExecutiveKpi[];
}
export function executiveDefinitions(value: unknown): ExecutiveKpiDefinition[] {
  if (!Array.isArray(value) || value.length > 8)
    throw new AnalyticsError("invalid_selection");
  const ids = new Set<string>();
  return value.map((v: unknown) => {
    if (!v || typeof v !== "object" || Array.isArray(v))
      throw new AnalyticsError("invalid_selection");
    const x = v as ExecutiveKpiDefinition;
    if (
      Object.keys(x).sort().join(",") !== "goal,id,label,message,metric" ||
      typeof x.id !== "string" ||
      !/^[a-zA-Z0-9_-]{1,64}$/.test(x.id) ||
      ids.has(x.id) ||
      typeof x.label !== "string" ||
      !x.label.trim() ||
      x.label.length > 160 ||
      /[\x00-\x1f]/.test(x.label) ||
      typeof x.message !== "string" ||
      !x.message.trim() ||
      x.message.length > 4096 ||
      /[\x00-\x1f]/.test(x.message) ||
      !["frequency", "duration"].includes(x.metric) ||
      (x.goal !== null &&
        (typeof x.goal !== "number" ||
          !Number.isFinite(x.goal) ||
          x.goal < 0 ||
          x.goal > Number.MAX_SAFE_INTEGER))
    )
      throw new AnalyticsError("invalid_selection");
    ids.add(x.id);
    return { ...x };
  });
}
/** Imported dates, including imported zero days, define comparable daily averages. */
export function compareExecutiveKpi(
  definition: ExecutiveKpiDefinition,
  total: number,
  historicalTotal: number,
  days: number,
  historicalDays: number,
): ExecutiveKpi {
  const average = days ? total / days : null;
  const historicalAverage = historicalDays
    ? historicalTotal / historicalDays
    : null;
  const reference = definition.goal ?? historicalAverage;
  const status =
    average === null || reference === null
      ? "unavailable"
      : average < reference
        ? "better"
        : average > reference
          ? "worse"
          : "equal";
  return {
    ...definition,
    total,
    average,
    historicalAverage,
    reference,
    referenceKind: definition.goal === null ? "historical" : "goal",
    status,
    changePercent:
      average === null || reference === null || reference === 0
        ? null
        : ((average - reference) / reference) * 100,
  };
}

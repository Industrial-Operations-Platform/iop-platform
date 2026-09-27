import type {
  Availability,
  DemoContext,
  Dimension,
  ImportReview,
  ImportSummary,
  ProfileResult,
  Report,
  ReportRequest,
} from "../domain/models";

export interface AnalysisGateway {
  context(): Promise<DemoContext>;
  chooseUser(id: string): Promise<DemoContext>;
  availability(): Promise<Availability>;
  report(selection: ReportRequest): Promise<Report>;
  profile(): Promise<ProfileResult>;
  saveProfile(profile: ProfileResult): Promise<ProfileResult>;
  history(): Promise<ImportSummary[]>;
  upload(filename: string, bytes: ArrayBuffer): Promise<ImportReview>;
  review(id: string, recover: boolean): Promise<ImportReview>;
  originalUrl(id: string): string;
}
export const nextDate = (date: string): string =>
  new Date(Date.parse(date) + 86400000).toISOString().slice(0, 10);
export function historySelection(dates: string[]): ReportRequest | null {
  if (!dates.length) return null;
  const sorted = [...dates].sort();
  return {
    from: sorted[0],
    toExclusive: nextDate(sorted[sorted.length - 1]),
    dimension: "sector",
    period: "day",
    metric: "frequency",
    filters: {},
    search: "",
    page: 1,
  };
}
/** Any changed selection starts at the first page; only pages pin the prior revision. */
export function changeSelection(
  current: ReportRequest,
  patch: Partial<ReportRequest>,
): ReportRequest {
  const { revision, ...selection } = current;
  return { ...selection, ...patch, page: 1 };
}
export function filterGroup(
  current: ReportRequest,
  dimension: Dimension,
  value: string,
): ReportRequest {
  return changeSelection(current, {
    filters: { ...current.filters, [dimension]: [value] },
  });
}
export class AnalysisWorkspace {
  constructor(readonly gateway: AnalysisGateway) {}
  async open(): Promise<DemoContext> {
    return this.gateway.context();
  }
  async loadHistory(
    canReview = false,
  ): Promise<{ selection: ReportRequest | null; history: ImportSummary[] }> {
    const [availability, history] = await Promise.all([
      this.gateway.availability(),
      canReview ? this.gateway.history() : Promise.resolve([]),
    ]);
    return { selection: historySelection(availability.dates), history };
  }
  report(selection: ReportRequest): Promise<Report> {
    const days =
      (Date.parse(selection.toExclusive) - Date.parse(selection.from)) /
      86400000;
    if (!Number.isFinite(days) || days < 1 || days > 3660)
      throw new Error("Choose a reporting range between 1 and 3660 days.");
    return this.gateway.report(selection);
  }
}

/** View constraints are independent from the dimension used to group results. */
export const reportViews = [
  { title: "Executive Overview", dimension: "sector", filters: [] },
  { title: "Halle analysis", dimension: "sector", filters: [] },
  { title: "Bereich analysis", dimension: "area", filters: ["sector", "area"] },
  {
    title: "Equipment analysis",
    dimension: "equipment",
    filters: ["sector", "area", "equipment"],
  },
  {
    title: "Error analysis",
    dimension: "message",
    filters: ["sector", "area", "equipment", "message", "type", "messageGroup"],
  },
  {
    title: "Daily / monthly",
    dimension: "area",
    filters: [
      "sector",
      "area",
      "equipment",
      "message",
      "type",
      "messageGroup",
      "frequency",
      "duration",
    ],
  },
] as const;
export function selectView(
  current: ReportRequest,
  view: number,
): ReportRequest {
  const policy = reportViews[view];
  const allowed: readonly string[] = policy.filters;
  return changeSelection(current, {
    dimension: policy.dimension,
    ...(view < 2
      ? { metric: "frequency" as const, period: "day" as const }
      : {}),
    filters: Object.fromEntries(
      Object.entries(current.filters ?? {}).filter(([key]) =>
        allowed.includes(key),
      ),
    ),
    search: "",
  });
}
export function drillInto(
  current: ReportRequest,
  view: number,
  dimension: Dimension,
  value: string,
) {
  const target = reportViews.findIndex(
    (policy, index) =>
      index >= view &&
      (policy.filters as readonly string[]).includes(dimension),
  );
  const next = target < 0 ? 5 : target;
  return {
    view: next,
    selection: filterGroup(
      next === view ? current : selectView(current, next),
      dimension,
      value,
    ),
  };
}

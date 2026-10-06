import type {
  SourceFilters,
  SourceRowsRequest,
  SourceRowsResult,
  MessageCatalog,
  SourceSort,
  SourceSortField,
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
  sourceRows(selection: SourceRowsRequest): Promise<SourceRowsResult>;
  messages(after?: string): Promise<MessageCatalog>;
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
  sourceEvidence(sourceId: string): Promise<SourceRowsResult> {
    const match =
      /^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}):(\d{1,16})$/i.exec(
        sourceId,
      );
    if (
      !match ||
      !Number.isSafeInteger(Number(match[2])) ||
      Number(match[2]) < 1
    )
      return Promise.reject(
        new Error("The analytical source reference is invalid."),
      );
    return this.gateway.sourceRows({
      importId: match[1],
      page: 1,
      sort: [],
      filters: { line: match[2] },
    });
  }

  previewSourceFilters(
    importId: string,
    filters: SourceFilters,
  ): Promise<SourceRowsResult> {
    return this.gateway.sourceRows({ importId, filters, page: 1, sort: [] });
  }

  constructor(readonly gateway: AnalysisGateway) {}
  async messageOptions(): Promise<string[]> {
    const values = new Set<string>();
    let after: string | undefined;
    do {
      const page = await this.gateway.messages(after);
      page.values.forEach((value) => values.add(value));
      if (page.nextCursor === after)
        throw new Error("Message choices could not be loaded. Try again.");
      after = page.nextCursor ?? undefined;
    } while (after !== undefined);
    return [...values];
  }
  async open(): Promise<DemoContext> {
    return this.gateway.context();
  }
  async loadHistory(canReview = false): Promise<{
    selection: ReportRequest | null;
    history: ImportSummary[];
    months: string[];
  }> {
    const [availability, history] = await Promise.all([
      this.gateway.availability(),
      canReview ? this.gateway.history() : Promise.resolve([]),
    ]);
    return {
      selection: historySelection(availability.dates),
      history,
      months: importedMonths(availability.dates),
    };
  }
  async report(selection: ReportRequest): Promise<Report> {
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
  { title: "Executive Overview", dimension: "area", filters: [] },
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
  availableMonths: string[] = [],
): ReportRequest {
  if (view === 0) return executiveSelection(current.from.slice(0, 7));
  const policy = reportViews[view];
  const allowed: readonly string[] = policy.filters;
  current = monthSelection(
    current,
    current.months ??
      availableMonths.filter(
        (month) =>
          month >= current.from.slice(0, 7) &&
          month + "-01" < current.toExclusive,
      ),
  );
  return changeSelection(current, {
    executive: false,
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

/** The executive report always represents one complete calendar month. */
export function executiveSelection(month: string): ReportRequest {
  const [year, index] = month.split("-").map(Number);
  return {
    from: month + "-01",
    toExclusive: new Date(Date.UTC(year, index, 1)).toISOString().slice(0, 10),
    executive: true,
    dimension: "area",
    metric: "frequency",
    period: "day",
    filters: {},
    search: "",
    page: 1,
  };
}

export function importedMonths(dates: string[]): string[] {
  return [...new Set(dates.map((date) => date.slice(0, 7)))].sort().reverse();
}
/** Sorting applies to the whole file; column click order determines priority. */
export function cycleSourceSort(
  sort: SourceSort[],
  field: SourceSortField,
): SourceSort[] {
  const current = sort.find((s) => s.field === field);
  return !current
    ? [...sort, { field, direction: "asc" }]
    : current.direction === "asc"
      ? sort.map((s) => (s.field === field ? { ...s, direction: "desc" } : s))
      : sort.filter((s) => s.field !== field);
}

/** Month comparisons retain their exact selection when drilling into other views. */
export function monthSelection(
  current: ReportRequest,
  months: string[],
): ReportRequest {
  const selected = [
    ...new Set(months.length ? months : [current.from.slice(0, 7)]),
  ].sort();
  const [year, month] = selected[selected.length - 1].split("-").map(Number);
  return changeSelection(current, {
    executive: false,
    months: selected,
    from: selected[0] + "-01",
    toExclusive: new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10),
  });
}

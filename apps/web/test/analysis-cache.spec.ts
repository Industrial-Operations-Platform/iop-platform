import { AnalysisReportCache, reportKey } from "../src/features/analysis/application/report-cache";
import { AnalysisWorkspace, type AnalysisGateway } from "../src/features/analysis/application/workspace";
import type { Availability, Report, ReportRequest } from "../src/features/analysis/domain/models";

const selection: ReportRequest = {
  from: "2026-07-01", toExclusive: "2026-08-01", dimension: "area",
  period: "day", metric: "frequency", filters: {},
};

function result(request = selection, revision = "r1"): Report {
  return {
    selection: request, revision, profileVersion: "1",
    totals: { key: "", frequency: 12, seconds: 60, minutes: 1, records: 2 },
    executive: [], groups: [], frequencyGroups: [], durationGroups: [], groupCount: 0,
    timeline: [], series: [], monthly: [], options: {}, optionCounts: {},
    dates: ["2026-07-01"], records: [], recordCount: 2, page: 1, pageCount: 1, unclassifiedCount: 0,
  };
}

function fixture(cache = new AnalysisReportCache()) {
  const report = jest.fn(async (request: ReportRequest) => result(request));
  const availability = jest.fn(async (): Promise<Availability> => ({ revision: "dates-1", dates: ["2026-07-01"], latestDate: "2026-07-01", siteTimeZone: "UTC" }));
  const app = new AnalysisWorkspace({ report, availability } as unknown as AnalysisGateway, cache);
  return { app, report, availability };
}

test("repeated and simultaneous equivalent selections reuse one read and retain independent cached values", async () => {
  const { app, report } = fixture();
  const request = { ...selection, months: ["2026-07", "2026-05"], filters: { area: ["B", "A"] } };
  const equivalent = { ...request, months: ["2026-05", "2026-07"], filters: { area: ["A", "B", "A"] }, page: 1 };
  await Promise.all([app.report(request), app.report(equivalent)]);
  const cached = await app.report(equivalent);
  cached.totals.frequency = 99;
  expect((await app.report(request)).totals.frequency).toBe(12);
  expect(app.cachedReport(equivalent)?.selection).toEqual(equivalent);
  expect(report).toHaveBeenCalledTimes(1);
});

test("keys distinguish all report controls and explicit pinned revisions", () => {
  const changes: Partial<ReportRequest>[] = [
    { from: "2026-07-02" }, { toExclusive: "2026-07-20" }, { dimension: "sector" },
    { period: "week" }, { metric: "duration" }, { executive: true }, { months: ["2026-07"] },
    { filters: { area: ["A,B"] } }, { filters: { area: ["A", "B"] } },
    { search: "alarm" }, { page: 2 }, { revision: "pinned" },
  ];
  const keys = [reportKey(selection), ...changes.map(change => reportKey({ ...selection, ...change }))];
  expect(new Set(keys).size).toBe(keys.length);
});

test("weekly reuse includes a daily timeline pinned to the same snapshot", async () => {
  const { app, report } = fixture();
  const weekly = { ...selection, period: "week" as const };
  const first = await app.report(weekly);
  expect(first.dailyTimeline).toEqual([]);
  expect(report.mock.calls[1][0]).toMatchObject({ period: "day", page: 1, revision: "r1" });
  expect(app.cachedReport(weekly)).toEqual(first);
  expect(await app.report(weekly)).toEqual(first);
  expect(report).toHaveBeenCalledTimes(2);
});

test("expiry triggers a fresh read while capacity, payload limits and LRU ordering bound memory", async () => {
  let now = 0;
  const cache = new AnalysisReportCache(() => now, 100, 2, 3000);
  const { app, report } = fixture(cache);
  await app.report(selection);
  now = 100;
  expect(app.cachedReport(selection)).toBeUndefined();
  await app.report(selection);
  expect(report).toHaveBeenCalledTimes(2);
  const second = { ...selection, search: "second" };
  const third = { ...selection, search: "third" };
  cache.set(second, result(second));
  cache.get(selection);
  cache.set(third, result(third));
  expect(cache.get(second)).toBeUndefined();
  expect(cache.get(selection)).toBeDefined();
  cache.set(second, { ...result(second), options: { message: ["x".repeat(3001)] } });
  expect(cache.get(second)).toBeUndefined();
  const bounded = new AnalysisReportCache(() => now, 100, 10, JSON.stringify(result()).length + 100);
  bounded.set(selection, result());
  bounded.set(second, result(second));
  expect(bounded.get(selection)).toBeUndefined();
  expect(bounded.get(second)).toBeDefined();
});

test("fresh revisions, availability changes and failures invalidate retained reports and allow retry", async () => {
  const { app, report, availability } = fixture();
  await app.loadHistory();
  await app.report(selection);
  report.mockImplementationOnce(async request => result(request, "r2"));
  await app.report({ ...selection, search: "other" });
  expect(app.cachedReport(selection)).toBeUndefined();
  await app.report(selection);
  availability.mockResolvedValueOnce({ revision: "dates-2", dates: [], latestDate: "2026-07-01", siteTimeZone: "UTC" });
  await app.loadHistory();
  expect(app.cachedReport(selection)).toBeUndefined();
  report.mockRejectedValueOnce(new Error("access denied"));
  await expect(app.report(selection)).rejects.toThrow("access denied");
  await expect(app.report(selection)).resolves.toMatchObject({ revision: "r1" });
});

test.each(["success", "failure"])("late %s cannot refill or clear a refreshed session", async outcome => {
  const { app, report } = fixture();
  let resolveOld!: (value: Report) => void;
  let rejectOld!: (error: Error) => void;
  report.mockImplementationOnce(() => new Promise<Report>((resolve, reject) => {
    resolveOld = resolve; rejectOld = reject;
  }));
  const old = app.report(selection).catch(() => undefined);
  app.invalidateReports();
  await app.report(selection);
  if (outcome === "success") resolveOld(result(selection, "old"));
  else rejectOld(new Error("late failure"));
  await old;
  expect(app.cachedReport(selection)?.revision).toBe("r1");
  await app.report(selection);
  expect(report).toHaveBeenCalledTimes(2);
});

test.each(["success", "failure"])("late availability %s cannot invalidate fresh reports", async outcome => {
  const { app, availability } = fixture();
  await app.loadHistory();
  let resolveOld!: (value: Availability) => void;
  let rejectOld!: (error: Error) => void;
  availability.mockImplementationOnce(() => new Promise<Availability>((resolve, reject) => {
    resolveOld = resolve; rejectOld = reject;
  }));
  const old = app.loadHistory().catch(() => undefined);
  app.invalidateReports();
  await app.report(selection);
  if (outcome === "success") resolveOld({ revision: "old-dates", dates: [], latestDate: null, siteTimeZone: "UTC" });
  else rejectOld(new Error("late availability failure"));
  await old;
  expect(app.cachedReport(selection)?.revision).toBe("r1");
});

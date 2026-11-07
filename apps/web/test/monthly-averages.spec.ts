import { monthlyAverages } from "../src/features/analysis/domain/monthly-averages";
import type { Report, ReportPoint } from "../src/features/analysis/domain/models";
import { AnalysisWorkspace, type AnalysisGateway } from "../src/features/analysis/application/workspace";

const point = (period: string, frequency: number, minutes: number): ReportPoint =>
  ({ period, frequency, minutes, seconds: minutes * 60, records: 1, key: "" });
const base = {
  selection: { from: "2026-08-01", toExclusive: "2026-10-01", period: "day", dimension: "area", metric: "frequency", filters: { area: ["A"] } },
  revision: "same", excludedWeekdays: [7],
  dates: ["2026-07-31", "2026-08-29", "2026-08-30", "2026-08-31", "2026-08-31", "2026-09-01", "2026-09-02", "2026-10-01"],
  timeline: [point("2026-08-29", 30, 10), point("2026-08-30", 999, 999), point("2026-09-01", 20, 6)],
  // Top-group monthly totals must not replace full filtered timeline totals.
  monthly: [point("2026-08", 2, 1)],
  profileVersion: "1", totals: point("", 50, 16), executive: [], groups: [],
  frequencyGroups: [], durationGroups: [], groupCount: 0, series: [], options: {}, optionCounts: {},
  records: [], recordCount: 0, page: 1, pageCount: 1, unclassifiedCount: 0,
} satisfies Report;

test("monthly means include imported zero days, omit missing/excluded dates and do not count dates twice", () => {
  expect(monthlyAverages(base)).toEqual([
    { month: "2026-08", days: 2, frequency: 15, minutes: 5 },
    { month: "2026-09", days: 2, frequency: 10, minutes: 3 },
  ]);
  expect(monthlyAverages({ ...base, selection: { ...base.selection, months: ["2026-09"] } }))
    .toEqual([{ month: "2026-09", days: 2, frequency: 10, minutes: 3 }]);
  expect(monthlyAverages({ ...base, dates: [] })).toEqual([]);
  expect(monthlyAverages({ ...base, timeline: [] }).map(x => x.frequency)).toEqual([0, 0]);
});

test("monthly and weekly chart resolutions retain the same daily monthly means", () => {
  const monthly = { ...base, selection: { ...base.selection, period: "month" as const },
    timeline: [point("2026-08-01", 30, 10), point("2026-09-01", 20, 6)] };
  expect(monthlyAverages(monthly)).toEqual(monthlyAverages(base));
  const weekly = { ...base, selection: { ...base.selection, period: "week" as const },
    timeline: [point("2026-08-31", 50, 16)] };
  expect(monthlyAverages(weekly)).toEqual([]);
  expect(monthlyAverages({ ...weekly, dailyTimeline: base.timeline })).toEqual(monthlyAverages(base));
});

test.each(["same", "new-import"])("weekly means use a daily request with the same filters and snapshot (%s)", async revision => {
  const gateway = { report: jest.fn().mockResolvedValueOnce(base).mockResolvedValueOnce({ ...base, revision }) };
  const app = new AnalysisWorkspace(gateway as unknown as AnalysisGateway);
  const selection = { ...base.selection, period: "week" as const };
  const result = await app.report(selection);
  expect(gateway.report.mock.calls[1][0]).toEqual({ ...selection, period: "day", page: 1, revision: "same" });
  expect(result.dailyTimeline).toEqual(revision === "same" ? base.timeline : undefined);
});

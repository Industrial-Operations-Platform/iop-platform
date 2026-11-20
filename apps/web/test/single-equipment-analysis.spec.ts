import { singleEquipmentAnalysis, selectedEquipment } from "../src/features/analysis/domain/single-equipment";
import type { Report, ReportPoint } from "../src/features/analysis/domain/models";

const point = (period: string, frequency: number, seconds: number): ReportPoint => ({
  key: "", period, frequency, seconds, minutes: seconds / 60, records: 1,
});
function report(): Report {
  return {
    selection: { from: "2026-05-01", toExclusive: "2026-08-01", months: ["2026-05", "2026-07"],
      dimension: "area", period: "day", metric: "duration", filters: { equipment: ["S-1"], message: ["Guard"] } },
    revision: "r1", profileVersion: "1", excludedWeekdays: [7],
    totals: { key: "", frequency: 20, seconds: 1500, minutes: 25, records: 200 },
    // These bounded/paginated values deliberately cannot reconstruct the totals.
    groups: [], frequencyGroups: [], durationGroups: [], groupCount: 110,
    records: [], recordCount: 200, page: 1, pageCount: 4, unclassifiedCount: 0,
    executive: [{ key: "Guard", frequency: 20, seconds: 1500, minutes: 25, records: 200,
      dimension: "message", metric: "frequency" }],
    timeline: [point("2026-05-01", 10, 300), point("2026-07-01", 10, 1200),
      point("2026-06-01", 99, 9999), point("2026-05-03", 99, 9999)],
    dates: ["2026-04-30", "2026-05-01", "2026-05-01", "2026-05-02", "2026-05-03",
      "2026-06-01", "2026-07-01", "2026-07-02", "2026-08-01"],
    series: [], monthly: [], options: {}, optionCounts: {},
  };
}

test("explicit single equipment selects detail, while one group or several equipment identifiers do not", () => {
  const r = report();
  expect(selectedEquipment(r.selection)).toBe("S-1");
  for (const equipment of [undefined, [], [""], ["S-1", "S-2"]]) {
    r.selection.filters = { equipment: equipment ?? [] };
    r.groupCount = 1;
    expect(singleEquipmentAnalysis(r)).toBeUndefined();
  }
});

test("full server totals and weighted ratios use eligible imported dates, including zeros and disjoint months", () => {
  const summary = singleEquipmentAnalysis(report())!;
  expect(summary).toMatchObject({ equipment: "S-1", frequency: 20, minutes: 25,
    importedDays: 4, frequencyPerDay: 5, minutesPerDay: 6.25, minutesPerOccurrence: 1.25,
    activeDays: 2, lastActivity: "2026-07-01",
    peakFrequency: { value: 10, dates: ["2026-05-01", "2026-07-01"] },
    peakMinutes: { value: 20, dates: ["2026-07-01"] },
    leadingMessage: { key: "Guard" },
  });
  expect(summary.days).toEqual([
    { date: "2026-05-01", frequency: 10, minutes: 5 },
    { date: "2026-05-02", frequency: 0, minutes: 0 },
    { date: "2026-07-01", frequency: 10, minutes: 20 },
    { date: "2026-07-02", frequency: 0, minutes: 0 },
  ]);
});

test.each(["week", "month"] as const)("%s resolution uses pinned daily details for peaks, activity and the latest date", period => {
  const r = report();
  r.selection.period = period;
  r.dailyTimeline = r.timeline;
  r.timeline = [point("2026-05-01", 20, 1500)];
  expect(singleEquipmentAnalysis(r)).toMatchObject({ activeDays: 2, lastActivity: "2026-07-01",
    peakMinutes: { value: 20, dates: ["2026-07-01"] } });
  delete r.dailyTimeline;
  expect(singleEquipmentAnalysis(r)).toMatchObject({ frequency: 20, importedDays: 4,
    activeDays: null, days: undefined, peakMinutes: null });
});

test("zero activity and absent imported coverage have no fabricated ratios or peaks", () => {
  const r = report();
  r.totals = { key: "", frequency: 0, seconds: 0, minutes: 0, records: 0 };
  r.timeline = [];
  expect(singleEquipmentAnalysis(r)).toMatchObject({ frequencyPerDay: 0, minutesPerDay: 0,
    minutesPerOccurrence: null, activeDays: 0, peakFrequency: null, peakMinutes: null, lastActivity: null });
  r.dates = [];
  expect(singleEquipmentAnalysis(r)).toMatchObject({ importedDays: 0, frequencyPerDay: null, minutesPerDay: null });
});

test("duration-only source activity remains visible without a frequency denominator", () => {
  const r = report();
  r.totals = { key: "", frequency: 0, seconds: 120, minutes: 2, records: 1 };
  r.timeline = [point("2026-07-02", 0, 120)];
  expect(singleEquipmentAnalysis(r)).toMatchObject({ minutesPerOccurrence: null, activeDays: 1,
    peakFrequency: null, peakMinutes: { value: 2 }, lastActivity: "2026-07-02" });
});

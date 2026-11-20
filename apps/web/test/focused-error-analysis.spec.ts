import { focusedErrorAnalysis, hasFewErrors } from "../src/features/analysis/domain/error-analysis";
import type { Report } from "../src/features/analysis/domain/models";

function report(count = 2): Report {
  const groups = [
    { key: "Guard blocked", frequency: 20, seconds: 1500, minutes: 25, records: 200 },
    { key: "Communication", frequency: 5, seconds: 900, minutes: 15, records: 50 },
    { key: "Other", frequency: 0, seconds: 0, minutes: 0, records: 1 },
  ].slice(0, count);
  return {
    selection: { from: "2026-10-01", toExclusive: "2026-12-01", months: ["2026-11"],
      dimension: "message", period: "month", metric: "duration", filters: { equipment: ["S-1"] } },
    revision: "r", profileVersion: "1", excludedWeekdays: [7],
    totals: { key: "", frequency: 25, seconds: 2400, minutes: 40, records: 250 },
    groups, frequencyGroups: groups, durationGroups: groups, groupCount: count,
    dates: ["2026-10-01", "2026-11-02", "2026-11-03", "2026-11-03", "2026-11-06", "2026-11-08", "2026-11-09"],
    executive: [], timeline: [], series: [], monthly: [], options: {}, optionCounts: {},
    // No row-page or per-group timeline is needed to calculate these summaries.
    records: [], recordCount: 250, page: 1, pageCount: 5, unclassifiedCount: 0,
  };
}

test.each([0, 1, 2, 3])("exactly one or two server-counted messages select the focused view: %i", count => {
  expect(hasFewErrors(report(count))).toBe(count === 1 || count === 2);
});

test("other grouping dimensions and truncated group lists never trigger focused error analysis", () => {
  const r = report();
  r.selection.dimension = "equipment";
  expect(focusedErrorAnalysis(r)).toBeUndefined();
  r.selection.dimension = "message";
  r.groupCount = 1000;
  expect(focusedErrorAnalysis(r)).toBeUndefined();
  r.groupCount = 1;
  expect(focusedErrorAnalysis(r)).toBeUndefined();
});

test("full filtered totals and per-error contributions use eligible imported coverage and weighted ratios", () => {
  const summary = focusedErrorAnalysis(report())!;
  expect(summary).toMatchObject({ frequency: 25, minutes: 40, importedDays: 4,
    frequencyPerDay: 6.25, minutesPerDay: 10, minutesPerOccurrence: 1.6 });
  expect(summary.errors[0]).toMatchObject({ key: "Guard blocked", frequency: 20, minutes: 25,
    frequencyPerDay: 5, minutesPerOccurrence: 1.25, frequencyShare: 80, durationShare: 62.5 });
  expect(summary.errors[1]).toMatchObject({ frequencyShare: 20, durationShare: 37.5 });
});

test("zero totals and missing coverage expose unavailable denominators, without losing valid zeros", () => {
  const r = report(1);
  r.totals = { key: "", frequency: 0, seconds: 0, minutes: 0, records: 1 };
  r.groups = [{ ...r.totals, key: "Guard blocked" }];
  expect(focusedErrorAnalysis(r)).toMatchObject({ frequencyPerDay: 0, minutesPerDay: 0,
    minutesPerOccurrence: null, errors: [{ frequencyShare: null, durationShare: null }] });
  r.dates = [];
  expect(focusedErrorAnalysis(r)).toMatchObject({ frequencyPerDay: null, minutesPerDay: null });
});

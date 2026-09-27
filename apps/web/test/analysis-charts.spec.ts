import {
  options,
  pareto,
} from "../src/features/analysis/adapters/echarts/charts";
import { identity } from "../src/design/identity";
import type { Report } from "../src/features/analysis/domain/models";

jest.mock("echarts/core", () => ({ use: jest.fn(), init: jest.fn() }));
jest.mock("echarts/charts", () => ({}));
jest.mock("echarts/components", () => ({}));
jest.mock("echarts/renderers", () => ({}));

const report = {
  selection: { dimension: "area", metric: "duration" },
  totals: { frequency: 100, minutes: 100, seconds: 6000 },
  groups: [
    { key: "Duration leader", frequency: 1, minutes: 25, seconds: 1500 },
  ],
  frequencyGroups: [
    { key: "Frequency leader", frequency: 60, minutes: 12.5 },
    { key: "Crossing group", frequency: 25, minutes: 5 },
    { key: "Remainder", frequency: 15, minutes: 1 },
  ],
  durationGroups: [
    { key: "Duration leader", frequency: 1, minutes: 25, seconds: 1500 },
  ],
} as Report;

test("frequency Pareto is independent of the comparison measure and includes the crossing group", () => {
  const chart = options("frequency", report);
  expect(chart).toMatchObject({
    xAxis: [{ name: "Frequency" }, { min: 0, max: 100 }],
    yAxis: {
      inverse: true,
      data: ["Frequency leader", "Crossing group", "Remainder"],
    },
    series: [
      {
        data: [
          { name: "Frequency leader", value: 60, itemStyle: { opacity: 1 } },
          { name: "Crossing group", value: 25, itemStyle: { opacity: 1 } },
          { name: "Remainder", value: 15, itemStyle: { opacity: 0.4 } },
        ],
        itemStyle: { color: identity.chartFrequency },
      },
      {
        xAxisIndex: 1,
        data: [
          { value: [60, "Frequency leader"] },
          { value: [85, "Crossing group"] },
          { value: [100, "Remainder"] },
        ],
        markLine: { data: [{ xAxis: 80 }] },
      },
    ],
  });
  expect(pareto(report, "frequency").summary).toContain(
    "first 2 groups contribute 85%",
  );
  expect(options("duration", report)).toMatchObject({
    xAxis: [{ name: "Minutes" }, { max: 100 }],
    series: [
      { data: [{ name: "Duration leader", value: 25 }] },
      { data: [{ value: [25, "Duration leader"] }] },
    ],
  });
});

test("Pareto retains full totals beyond the top 10 and handles exact thresholds and zero totals", () => {
  const many = {
    ...report,
    frequencyGroups: Array.from({ length: 100 }, (_, i) => ({
      ...report.frequencyGroups[0],
      key: `Group ${i}`,
      frequency: 1,
    })),
  };
  const result = pareto(many, "frequency");
  expect(result.points).toHaveLength(10);
  expect(result.points.at(-1)?.percent).toBe(10);
  expect(result.summary).toContain("reaching 80% requires additional groups");
  const exact = {
    ...report,
    frequencyGroups: [
      { ...report.frequencyGroups[0], frequency: 80 },
      { ...report.frequencyGroups[1], frequency: 20 },
    ],
  };
  expect(
    pareto(exact, "frequency").points.map((p) => p.inLeadingShare),
  ).toEqual([true, false]);
  const zero = {
    ...many,
    totals: { ...report.totals, frequency: 0 },
    frequencyGroups: many.frequencyGroups.map((row) => ({
      ...row,
      frequency: 0,
    })),
  };
  expect(pareto(zero, "frequency").points.every((p) => p.percent === 0)).toBe(
    true,
  );
  expect(pareto(zero, "frequency").summary).toContain("undefined");
  expect(pareto({ ...zero, frequencyGroups: [] }, "frequency").points).toEqual(
    [],
  );
});

test("scatter uses summed values and distinct colors for all 100 named components, stable under reordering", () => {
  const groups = Array.from({ length: 100 }, (_, i) => ({
    ...report.groups[0],
    key: `Group ${i}`,
    minutes: i * 2,
    frequency: i * 3,
  }));
  const data = (
    options("scatter", { ...report, groups }).series as {
      data: { name: string; value: number[]; itemStyle: { color: string } }[];
    }[]
  )[0].data;
  expect(new Set(data.map((p) => p.itemStyle.color)).size).toBe(100);
  expect(data[99]).toMatchObject({ name: "Group 99", value: [198, 297] });
  const reversed = (
    options("scatter", { ...report, groups: [...groups].reverse() }).series as {
      data: typeof data;
    }[]
  )[0].data;
  expect(reversed.reverse()).toEqual(data);
});

test("heatmap puts frequency leaders first even for duration-colored cells", () => {
  expect(
    options("heatmap", {
      ...report,
      series: [{ ...report.frequencyGroups[0], period: "2026-05-01" }],
    }),
  ).toMatchObject({
    yAxis: {
      inverse: true,
      data: ["Frequency leader", "Crossing group", "Remainder"],
    },
    series: [{ data: [[0, 0, 12.5]] }],
  });
});

test("executive charts share frequency ordering and distinguish missing dates from covered zero days", () => {
  const monthly = {
    ...report,
    selection: {
      from: "2026-07-01",
      toExclusive: "2026-08-01",
      period: "day",
      dimension: "area",
      metric: "frequency",
    },
    groups: [
      { key: "Highest", frequency: 10, minutes: 1 },
      { key: "Next", frequency: 3, minutes: 2 },
    ],
    dates: ["2026-07-01", "2026-07-03"],
    series: [{ key: "Highest", period: "2026-07-01", frequency: 10 }],
    timeline: [{ period: "2026-07-01", frequency: 10, minutes: 1 }],
  } as Report;
  expect(options("area-ranking", monthly)).toMatchObject({
    yAxis: { inverse: true, data: ["Highest", "Next"] },
  });
  const matrix = options("daily-matrix", monthly);
  expect(matrix).toMatchObject({
    yAxis: { inverse: true, data: ["Highest", "Next"] },
    series: [
      {
        data: [
          [0, 0, 10],
          [2, 0, 0],
          [0, 1, 0],
          [2, 1, 0],
        ],
      },
    ],
  });
  expect((matrix.xAxis as { data: string[] }).data).toHaveLength(31);
  const overlay = options("daily-overlay", monthly);
  expect(overlay).toMatchObject({
    yAxis: [{ name: "Frequency" }, { name: "Alarm minutes" }],
    series: [{ connectNulls: false }, { yAxisIndex: 1, connectNulls: false }],
  });
  const series = overlay.series as { data: (number | null)[] }[];
  expect(series[0].data.slice(0, 4)).toEqual([10, null, 0, null]);
  expect(series[1].data.slice(0, 4)).toEqual([1, null, 0, null]);
});

test("daily charts omit excluded weekdays without filling missing eligible dates or dropping period anchors", () => {
  const monthly = {
    ...report,
    excludedWeekdays: [7],
    selection: {
      from: "2026-07-01",
      toExclusive: "2026-08-01",
      period: "day",
      dimension: "area",
      metric: "frequency",
    },
    dates: ["2026-07-04", "2026-07-06"],
    timeline: [{ period: "2026-07-04", frequency: 9, minutes: 2 }],
    series: [],
  } as unknown as Report;
  for (const kind of ["daily-matrix", "daily-overlay", "trend"] as const) {
    const axis = options(kind, monthly).xAxis as { data: string[] };
    expect(axis.data).toHaveLength(27);
    expect(axis.data).not.toContain("2026-07-05");
    expect(axis.data[4]).toBe("2026-07-06");
  }
  const series = options("daily-overlay", monthly).series as {
    data: (number | null)[];
  }[];
  expect(series[0].data.slice(3, 6)).toEqual([9, 0, null]);
  const february = {
    ...monthly,
    selection: {
      ...monthly.selection,
      from: "2026-02-01",
      toExclusive: "2026-03-01",
      period: "month" as const,
    },
  };
  expect((options("trend", february).xAxis as { data: string[] }).data).toEqual(
    ["2026-02-01"],
  );
  const weekly = {
    ...monthly,
    selection: { ...monthly.selection, period: "week" as const },
  };
  expect((options("trend", weekly).xAxis as { data: string[] }).data[0]).toBe(
    "2026-06-29",
  );
});

test("month comparisons expose every selected month with distinct matching line and legend colors", () => {
  const months = [
    "2026-01",
    "2026-02",
    "2026-03",
    "2026-04",
    "2026-05",
    "2026-07",
  ];
  const chart = options("monthly", {
    ...report,
    selection: { ...report.selection, months },
    monthly: [
      {
        key: "Duration leader",
        period: "2026-01",
        frequency: 3,
        minutes: 12.5,
      },
    ],
  } as Report);
  expect(chart.legend).toMatchObject({ type: "scroll", data: months });
  const series = chart.series as {
    name: string;
    itemStyle: { color: string };
    lineStyle: { color: string };
    data: (number | null)[];
  }[];
  expect(series.map((s) => s.name)).toEqual(months);
  expect(new Set(series.map((s) => s.itemStyle.color)).size).toBe(
    months.length,
  );
  expect(series.every((s) => s.lineStyle.color === s.itemStyle.color)).toBe(
    true,
  );
  expect(series[1].data).toEqual([null]);
});

test("drill-down trends omit unselected months while retaining weeks crossing selected month boundaries", () => {
  const selected = {
    ...report,
    selection: {
      ...report.selection,
      from: "2026-05-01",
      toExclusive: "2026-08-01",
      months: ["2026-05", "2026-07"],
      period: "day",
    },
    timeline: [],
  } as Report;
  const days = (options("trend", selected).xAxis as { data: string[] }).data;
  expect(new Set(days.map((day) => day.slice(0, 7)))).toEqual(
    new Set(["2026-05", "2026-07"]),
  );
  const weekly = options("trend", {
    ...selected,
    selection: { ...selected.selection, period: "week" },
  });
  const weeks = (weekly.xAxis as { data: string[] }).data;
  expect(weeks).toContain("2026-06-29");
  expect(weeks).not.toContain("2026-06-08");
});

test("message month comparisons overlay separate lines instead of stacking totals", () => {
  const chart = options("messages", {
    ...report,
    selection: { ...report.selection, months: ["2026-05", "2026-07"] },
    monthly: [
      { ...report.groups[0], period: "2026-05", minutes: 10 },
      { ...report.groups[0], period: "2026-07", minutes: 15 },
    ],
  });
  expect(chart.series).toMatchObject([
    { type: "line", data: [10] },
    { type: "line", data: [15] },
  ]);
  expect((chart.series as object[]).every((s) => !("stack" in s))).toBe(true);
});

import { options } from "../src/features/analysis/adapters/echarts/charts";
import { identity } from "../src/design/identity";
import type { Report } from "../src/features/analysis/domain/models";

jest.mock("echarts/core", () => ({ use: jest.fn(), init: jest.fn() }));
jest.mock("echarts/charts", () => ({}));
jest.mock("echarts/components", () => ({}));
jest.mock("echarts/renderers", () => ({}));

const report = {
  selection: { dimension: "area", metric: "duration" },
  groups: [{ key: "Area, A", frequency: 3, minutes: 12.5 }],
  durationGroups: [{ key: "Area B", frequency: 1, minutes: 25 }],
} as Report;

test("selected-measure bars render duration values, units and identity when duration is selected", () => {
  expect(options("frequency", report)).toMatchObject({
    xAxis: { name: "Minutes" },
    series: [
      {
        data: [{ name: "Area, A", value: 12.5 }],
        itemStyle: { color: identity.chartDuration },
      },
    ],
  });
});
test("frequency selection and independent duration ranking retain their measures", () => {
  const frequency = {
    ...report,
    selection: { ...report.selection, metric: "frequency" as const },
  };
  expect(options("frequency", frequency)).toMatchObject({
    xAxis: { name: "Frequency" },
    series: [
      {
        data: [{ name: "Area, A", value: 3 }],
        itemStyle: { color: identity.chartFrequency },
      },
    ],
  });
  expect(options("duration", frequency)).toMatchObject({
    xAxis: { name: "Minutes" },
    series: [{ data: [{ name: "Area B", value: 25 }] }],
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

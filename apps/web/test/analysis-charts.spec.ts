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

import {
  compareExecutiveKpi,
  executiveDefinitions,
} from "../src/modules/oip/domain/executive";
import { reportRequest } from "../src/modules/oip/domain/report";

const definition = {
  id: "jam",
  label: "Jam",
  message: "Jam",
  metric: "frequency" as const,
  goal: null,
};
test("monthly comparison uses imported-date averages and lower is better", () => {
  expect(compareExecutiveKpi(definition, 9, 14, 2, 3)).toMatchObject({
    total: 9,
    average: 4.5,
    historicalAverage: 14 / 3,
    reference: 14 / 3,
    referenceKind: "historical",
    status: "better",
  });
  expect(compareExecutiveKpi(definition, 5, 14, 1, 3).status).toBe("worse");
  expect(compareExecutiveKpi(definition, 9, 9, 2, 2).status).toBe("equal");
});
test("explicit goals override history, including zero, without infinite percentages", () => {
  expect(
    compareExecutiveKpi({ ...definition, goal: 3 }, 9, 1000, 2, 3),
  ).toMatchObject({
    reference: 3,
    referenceKind: "goal",
    status: "worse",
    changePercent: 50,
  });
  expect(
    compareExecutiveKpi({ ...definition, goal: 0 }, 1, 1000, 1, 3),
  ).toMatchObject({
    reference: 0,
    status: "worse",
    changePercent: null,
  });
  expect(
    compareExecutiveKpi({ ...definition, goal: 0 }, 0, 1000, 1, 3).status,
  ).toBe("equal");
});
test("missing coverage differs from imported dates with no matching error", () => {
  expect(compareExecutiveKpi(definition, 0, 10, 0, 2)).toMatchObject({
    average: null,
    status: "unavailable",
  });
  expect(compareExecutiveKpi(definition, 0, 10, 1, 2)).toMatchObject({
    average: 0,
    status: "better",
    changePercent: -100,
  });
  expect(compareExecutiveKpi(definition, 0, 0, 0, 0)).toMatchObject({
    historicalAverage: null,
    reference: null,
    changePercent: null,
  });
});
test("definitions retain exact prepared messages and reject ambiguous or unbounded settings", () => {
  expect(
    executiveDefinitions([{ ...definition, message: "Müll, L5/6" }])[0].message,
  ).toBe("Müll, L5/6");
  expect(executiveDefinitions([])).toEqual([]);
  for (const value of [
    [definition, definition],
    Array(9).fill(definition),
    [{ ...definition, goal: -1 }],
    [{ ...definition, goal: Infinity }],
    [{ ...definition, message: null }],
    [{ ...definition, message: "" }],
    [{ ...definition, unexpected: true }],
  ]) {
    expect(() => executiveDefinitions(value)).toThrow("invalid_selection");
  }
});
test("executive requests enforce a complete calendar month and prevent hidden dimensional filters", () => {
  const query = {
    executive: true,
    from: "2024-02-01",
    toExclusive: "2024-03-01",
    dimension: "area",
    metric: "frequency",
    period: "day",
  };
  expect(reportRequest(query)).toMatchObject({
    executive: true,
    filters: {},
    search: "",
  });
  for (const patch of [
    { from: "2024-02-02" },
    { toExclusive: "2024-02-29" },
    { filters: { area: ["A"] } },
    { search: "Jam" },
    { dimension: "sector" },
    { metric: "duration" },
    { period: "month" },
    { executive: "true" },
  ]) {
    expect(() => reportRequest({ ...query, ...patch })).toThrow(
      "invalid_selection",
    );
  }
});

import {
  AnalysisWorkspace,
  historySelection,
  changeSelection,
  filterGroup,
  selectView,
  drillInto,
  type AnalysisGateway,
} from "../src/features/analysis/application/workspace";

test("history selection includes every imported date, not only the latest file", () => {
  expect(historySelection([])).toBeNull();
  expect(
    historySelection(["2026-07-07", "2026-05-01", "2026-07-01"]),
  ).toMatchObject({ from: "2026-05-01", toExclusive: "2026-07-08", page: 1 });
});
test("new group and filter selections reset paging and revision without splitting comma values", () => {
  const selection = {
    ...historySelection(["2026-07-01"])!,
    page: 3,
    revision: "old",
  };
  expect(filterGroup(selection, "area", "Kartonzuführung L,M,S")).toMatchObject(
    { page: 1, filters: { area: ["Kartonzuführung L,M,S"] } },
  );
  expect(
    changeSelection(selection, { dimension: "equipment" }),
  ).not.toHaveProperty("revision");
});
test("application rejects an invalid range before the HTTP port is called", async () => {
  const report = jest.fn();
  const app = new AnalysisWorkspace({ report } as unknown as AnalysisGateway);
  await expect(
    app.report({
      ...historySelection(["2026-07-01"])!,
      toExclusive: "2026-06-30",
    }),
  ).rejects.toThrow("Choose a reporting range");
  expect(report).not.toHaveBeenCalled();
});

test("progressive views discard incompatible filters and preserve dates", () => {
  const current = filterGroup(
    filterGroup(historySelection(["2026-07-01"])!, "sector", "Halle A T1"),
    "equipment",
    "=A+1",
  );
  expect(selectView(current, 2)).toMatchObject({
    from: current.from,
    dimension: "area",
    filters: { sector: ["Halle A T1"] },
  });
  expect(
    selectView({ ...current, metric: "duration", period: "month" }, 1),
  ).toMatchObject({ filters: {}, metric: "frequency", period: "day" });
  expect(selectView({ ...current, search: "hidden" }, 0)).toMatchObject({
    filters: {},
    search: "",
  });
});
test("drill-down carries location while grouping remains independent", () => {
  const hall = drillInto(
    historySelection(["2026-07-01"])!,
    1,
    "sector",
    "Halle A T1",
  );
  expect(hall.view).toBe(2);
  expect(hall.selection).toMatchObject({
    dimension: "area",
    filters: { sector: ["Halle A T1"] },
  });
  const equipment = drillInto(hall.selection, 2, "equipment", "=A+1");
  expect(equipment.view).toBe(3);
  const regrouped = changeSelection(equipment.selection, {
    dimension: "message",
  });
  expect(regrouped.filters).toEqual({
    sector: ["Halle A T1"],
    equipment: ["=A+1"],
  });
  expect(drillInto(regrouped, 3, "message", "Error").view).toBe(4);
});

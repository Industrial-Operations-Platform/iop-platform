import {
  AnalysisWorkspace,
  historySelection,
  changeSelection,
  filterGroup,
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
test("application rejects an invalid range before the HTTP port is called", () => {
  const report = jest.fn();
  const app = new AnalysisWorkspace({ report } as unknown as AnalysisGateway);
  expect(() =>
    app.report({
      ...historySelection(["2026-07-01"])!,
      toExclusive: "2026-06-30",
    }),
  ).toThrow("Choose a reporting range");
  expect(report).not.toHaveBeenCalled();
});

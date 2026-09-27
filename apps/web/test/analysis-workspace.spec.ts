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

test("Executive Overview rounds the current selection to one month and clears all hidden constraints", () => {
  expect(
    selectView(
      {
        ...historySelection(["2024-02-29"])!,
        filters: { message: ["Jam"] },
        metric: "duration",
        page: 4,
        search: "Jam",
      },
      0,
    ),
  ).toMatchObject({
    from: "2024-02-01",
    toExclusive: "2024-03-01",
    executive: true,
    dimension: "area",
    period: "day",
    metric: "frequency",
    filters: {},
    search: "",
    page: 1,
  });
  const executive = selectView(historySelection(["2026-12-31"])!, 0);
  expect(executive.toExclusive).toBe("2027-01-01");
  expect(drillInto(executive, 0, "area", "Area A")).toMatchObject({
    view: 2,
    selection: { executive: false, filters: { area: ["Area A"] } },
  });
});

test("catalog loading follows every cursor instead of truncating messages to report options", async () => {
  const messages = jest
    .fn()
    .mockResolvedValueOnce({ values: ["A", "B"], nextCursor: "B" })
    .mockResolvedValueOnce({ values: ["C"], nextCursor: null });
  const app = new AnalysisWorkspace({ messages } as unknown as AnalysisGateway);
  expect(await app.messageOptions()).toEqual(["A", "B", "C"]);
  expect(messages.mock.calls).toEqual([[undefined], ["B"]]);
});

test("Halle selects complete available months and drill-down preserves gaps", () => {
  const current = historySelection(["2024-02-29", "2024-04-02"])!;
  const hall = selectView(current, 1, ["2024-04", "2024-02"]);
  expect(hall).toMatchObject({
    from: "2024-02-01",
    toExclusive: "2024-05-01",
    months: ["2024-02", "2024-04"],
  });
  expect(drillInto(hall, 1, "sector", "A").selection.months).toEqual(
    hall.months,
  );
  expect(selectView(hall, 0)).not.toHaveProperty("months");
});

test.each([1, 2, 3, 4, 5])(
  "direct investigation view %i uses whole months and retains them downstream",
  (view) => {
    const current = historySelection(["2026-05-12", "2026-07-20"])!;
    const selected = selectView(current, view, ["2026-05", "2026-07"]);
    expect(selected).toMatchObject({
      months: ["2026-05", "2026-07"],
      from: "2026-05-01",
      toExclusive: "2026-08-01",
    });
    for (const next of [1, 2, 3, 4, 5])
      expect(selectView(selected, next).months).toEqual(selected.months);
  },
);

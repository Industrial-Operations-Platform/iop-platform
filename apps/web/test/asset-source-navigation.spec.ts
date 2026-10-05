import { AnalysisWorkspace } from "../src/features/analysis/application/workspace";

test("asset analytical evidence opens the exact contributing import and line", async () => {
  const sourceRows = jest.fn(async () => ({
    records: [],
    recordCount: 0,
    page: 1,
    pageCount: 0,
    revision: "revision",
  }));
  const application = new AnalysisWorkspace({ sourceRows } as never);
  await application.sourceEvidence("c7f1ed32-9833-4e01-adab-5e3a2d2c34c0:17");
  expect(sourceRows).toHaveBeenCalledWith({
    importId: "c7f1ed32-9833-4e01-adab-5e3a2d2c34c0",
    page: 1,
    sort: [],
    filters: { line: "17" },
  });
  for (const source of [
    "wrong",
    "c7f1ed32-9833-4e01-adab-5e3a2d2c34c0:0",
    "c7f1ed32-9833-4e01-adab-5e3a2d2c34c0:9999999999999999",
  ])
    await expect(application.sourceEvidence(source)).rejects.toThrow("invalid");
  expect(sourceRows).toHaveBeenCalledTimes(1);
});

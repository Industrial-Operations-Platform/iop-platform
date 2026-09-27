import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SourceFiles } from "../src/features/analysis/adapters/react/SourceFiles";
import {
  AnalysisWorkspace,
  cycleSourceSort,
  type AnalysisGateway,
} from "../src/features/analysis/application/workspace";
import type { ImportSummary } from "../src/features/analysis/domain/models";
jest.mock("../src/design/components/components.css", () => ({}));
jest.mock("../src/features/analysis/adapters/echarts/charts", () => ({
  number: String,
}));
test("header criteria cycle independently while preserving priority", () => {
  const first = cycleSourceSort([], "area"),
    second = cycleSourceSort(first, "message");
  expect(cycleSourceSort(second, "area")).toEqual([
    { field: "area", direction: "desc" },
    { field: "message", direction: "asc" },
  ]);
  expect(cycleSourceSort(cycleSourceSort(second, "area"), "area")).toEqual([
    { field: "message", direction: "asc" },
  ]);
});
test("file and header changes request a complete server sort and reset pagination", async () => {
  const sourceRows = jest
    .fn()
    .mockImplementation(async (x) => ({
      revision: "rev",
      records: [],
      recordCount: 120,
      page: x.page,
      pageCount: 3,
    }));
  const application = new AnalysisWorkspace({
    sourceRows,
    originalUrl: () => "/original",
  } as unknown as AnalysisGateway);
  const history = [
    {
      importId: "one",
      originalFilename: "one.csv",
      reportingDate: "2026-07-01",
      outcome: "succeeded",
    },
    {
      importId: "two",
      originalFilename: "two.csv",
      reportingDate: "2026-07-02",
      outcome: "succeeded",
    },
  ] as ImportSummary[];
  render(<SourceFiles application={application} history={history} />);
  fireEvent.click(await screen.findByRole("button", { name: "Next rows" }));
  await waitFor(() =>
    expect(sourceRows).toHaveBeenLastCalledWith({
      importId: "one",
      page: 2,
      sort: [],
      revision: "rev",
    }),
  );
  fireEvent.click(await screen.findByRole("button", { name: "Bereich" }));
  await waitFor(() =>
    expect(sourceRows).toHaveBeenLastCalledWith({
      importId: "one",
      page: 1,
      sort: [{ field: "area", direction: "asc" }],
    }),
  );
  expect(
    await screen.findByRole("columnheader", { name: "Bereich" }),
  ).toHaveAttribute("aria-sort", "ascending");
  fireEvent.change(screen.getByLabelText("Imported file"), {
    target: { value: "two" },
  });
  await waitFor(() =>
    expect(sourceRows).toHaveBeenLastCalledWith({
      importId: "two",
      page: 1,
      sort: [],
    }),
  );
});

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
  const sourceRows = jest.fn().mockImplementation(async (x) => ({
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

test("manual column filters apply across file pages, persist through sorting and reset for another file", async () => {
  const sourceRows = jest.fn(async (x) => ({
    revision: "rev",
    records: [],
    recordCount: x.filters?.message === "Absent" ? 0 : 60,
    totalRecordCount: 235,
    page: x.page,
    pageCount: x.filters?.message === "Absent" ? 0 : 2,
    options: { message: ["Müll, quoted"], type: ["001"] },
  }));
  const application = new AnalysisWorkspace({
    sourceRows,
    originalUrl: () => "/original",
  } as unknown as AnalysisGateway);
  const history = ["one", "two"].map((importId) => ({
    importId,
    originalFilename: importId + ".csv",
    reportingDate: "2026-07-05",
    outcome: "succeeded",
  })) as ImportSummary[];
  render(<SourceFiles application={application} history={history} />);
  await screen.findByRole("button", { name: "Next rows" });
  fireEvent.click(screen.getByText("Column filters"));
  expect(screen.getAllByRole("combobox")).toHaveLength(10);
  fireEvent.change(screen.getByLabelText("Meldetext filter"), {
    target: { value: "Müll, quoted" },
  });
  fireEvent.change(screen.getByLabelText("Typ filter"), {
    target: { value: "001" },
  });
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Apply filters" })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  await waitFor(() =>
    expect(sourceRows).toHaveBeenLastCalledWith({
      importId: "one",
      page: 1,
      sort: [],
      filters: { message: "Müll, quoted", type: "001" },
    }),
  );
  fireEvent.click(await screen.findByRole("button", { name: "Next rows" }));
  await waitFor(() =>
    expect(sourceRows).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 2,
        filters: { message: "Müll, quoted", type: "001" },
      }),
    ),
  );
  fireEvent.click(await screen.findByRole("button", { name: "Bereich" }));
  await waitFor(() =>
    expect(sourceRows).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 1,
        sort: [{ field: "area", direction: "asc" }],
        filters: { message: "Müll, quoted", type: "001" },
      }),
    ),
  );
  fireEvent.change(screen.getByLabelText("Meldetext filter"), {
    target: { value: "Absent" },
  });
  await screen.findByText(
    "No matching combination. Choose a suggested value or clear the filters.",
  );
  expect(screen.getByRole("button", { name: "Apply filters" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  await waitFor(() =>
    expect(sourceRows).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, filters: {} }),
    ),
  );
  expect(screen.getByLabelText("Meldetext filter")).toHaveValue("");
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

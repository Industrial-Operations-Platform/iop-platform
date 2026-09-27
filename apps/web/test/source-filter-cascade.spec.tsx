import { act, fireEvent, render, screen } from "@testing-library/react";
import { SourceFileFilters } from "../src/features/analysis/adapters/react/SourceFileFilters";
import { changeSourceFilter } from "../src/features/analysis/domain/source-filters";
import type { SourceRowsResult } from "../src/features/analysis/domain/models";
jest.mock("../src/design/components/components.css", () => ({}));
const snapshot: SourceRowsResult = {
  revision: "r",
  records: [],
  recordCount: 3,
  page: 1,
  pageCount: 1,
  options: { sector: ["A", "B"], area: ["Area A", "Area B"] },
};
const choices = (label: string) => {
  const input = screen.getByLabelText(label + " filter");
  const list = document.getElementById(input.getAttribute("list")!)!;
  return [...list.querySelectorAll("option")].map((option) => option.value);
};
test("cascade changes retain ancestors and clear descendants, including clearing a selected ancestor", () => {
  const initial = {
    sector: "A",
    area: "Area A",
    equipment: "EQ",
    message: "Jam",
    minutes: "2",
  };
  expect(changeSourceFilter(initial, "area", "Area C")).toEqual({
    sector: "A",
    area: "Area C",
  });
  expect(changeSourceFilter(initial, "sector", "B")).toEqual({ sector: "B" });
  expect(changeSourceFilter(initial, "area", "")).toEqual({ sector: "A" });
  expect(initial.equipment).toBe("EQ");
});
test("draft choices refresh before Apply and ignore late responses after a new ancestor selection", async () => {
  jest.useFakeTimers();
  try {
    const resolve: Record<string, (value: SourceRowsResult) => void> = {};
    const loadPreview = jest.fn(
      (filters) =>
        new Promise<SourceRowsResult>((done) => {
          resolve[filters.sector] = done;
        }),
    );
    const onApply = jest.fn();
    render(
      <SourceFileFilters
        filters={{}}
        snapshot={snapshot}
        loadPreview={loadPreview}
        onApply={onApply}
      />,
    );
    fireEvent.click(screen.getByText("Column filters"));
    fireEvent.change(screen.getByLabelText("Sector filter"), {
      target: { value: "A" },
    });
    expect(
      screen.getByRole("button", { name: "Apply filters" }),
    ).toBeDisabled();
    expect(choices("Bereich")).toEqual([]);
    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    fireEvent.change(screen.getByLabelText("Sector filter"), {
      target: { value: "B" },
    });
    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    await act(async () => {
      resolve.B({
        ...snapshot,
        options: { sector: ["A", "B"], area: ["Area B"] },
      });
    });
    expect(choices("Bereich")).toEqual(["Area B"]);
    await act(async () => {
      resolve.A({ ...snapshot, options: { area: ["Area A"] } });
    });
    expect(choices("Bereich")).toEqual(["Area B"]);
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(onApply).toHaveBeenCalledWith({ sector: "B" });
    fireEvent.change(screen.getByLabelText("Bereich filter"), {
      target: { value: "Area B" },
    });
    fireEvent.change(screen.getByLabelText("Sector filter"), {
      target: { value: "A" },
    });
    expect(screen.getByLabelText("Bereich filter")).toHaveValue("");
  } finally {
    jest.useRealTimers();
  }
});
test("failed previews can be retried; zero candidates cannot be applied; manual values beyond suggestions can", async () => {
  jest.useFakeTimers();
  try {
    const loadPreview = jest
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ ...snapshot, recordCount: 0 })
      .mockResolvedValueOnce({
        ...snapshot,
        recordCount: 1,
        options: { message: ["First suggestion"] },
      });
    const onApply = jest.fn();
    render(
      <SourceFileFilters
        filters={{}}
        snapshot={snapshot}
        loadPreview={loadPreview}
        onApply={onApply}
      />,
    );
    fireEvent.click(screen.getByText("Column filters"));
    fireEvent.change(screen.getByLabelText("Meldetext filter"), {
      target: { value: "Unknown" },
    });
    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    expect(
      screen.getByRole("button", { name: "Apply filters" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Retry choices" }));
    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    expect(
      screen.getByText(
        "No matching combination. Choose a suggested value or clear the filters.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Apply filters" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Meldetext filter"), {
      target: { value: "Value beyond suggestion 200" },
    });
    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(onApply).toHaveBeenCalledWith({
      message: "Value beyond suggestion 200",
    });
  } finally {
    jest.useRealTimers();
  }
});

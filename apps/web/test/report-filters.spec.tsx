import { fireEvent, render, screen } from "@testing-library/react";
import { ReportFilters } from "../src/features/analysis/adapters/react/ReportFilters";
import { historySelection } from "../src/features/analysis/application/workspace";

jest.mock("../src/design/components/components.css", () => ({}));

const selection = { ...historySelection(["2026-07-01"])!, months: ["2026-07"] };
const months = ["2026-05", "2026-06", "2026-07"];

test.each([1, 2, 3, 4, 5])(
  "view %i compares nonconsecutive months and prevents empty selection",
  (view) => {
    const onApply = jest.fn();
    const { container } = render(
      <ReportFilters
        selection={selection}
        months={months}
        view={view}
        report={null}
        onApply={onApply}
      />,
    );
    container.querySelector("details")!.open = true;
    expect(container.querySelector('input[type="date"]')).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "May 2026" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(onApply).toHaveBeenLastCalledWith(
      expect.objectContaining({
        months: ["2026-05", "2026-07"],
        from: "2026-05-01",
        toExclusive: "2026-08-01",
      }),
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "May 2026" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "July 2026" }));
    expect(
      screen.getByRole("button", { name: "Apply filters" }),
    ).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Select at least one month",
    );
  },
);

test("clear is outside the collapsed panel and resets month, dimension and draft filters", () => {
  const onApply = jest.fn();
  const { container } = render(
    <ReportFilters
      selection={{ ...selection, search: "Jam", filters: { sector: ["A"] } }}
      months={months}
      view={2}
      report={null}
      onApply={onApply}
    />,
  );
  const details = container.querySelector("details")!;
  const clear = screen.getByRole("button", { name: "Clear filters" });
  expect(details.open).toBe(false);
  expect(details.contains(clear)).toBe(false);
  expect(clear).toBeVisible();
  fireEvent.click(clear);
  expect(details.open).toBe(false);
  expect(onApply).toHaveBeenLastCalledWith(
    expect.objectContaining({ months, filters: {}, search: "", page: 1 }),
  );
  details.open = true;
  expect(
    screen
      .getAllByRole("checkbox")
      .every((input) => (input as HTMLInputElement).checked),
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  expect(onApply).toHaveBeenLastCalledWith(
    expect.objectContaining({ months, filters: {}, search: "" }),
  );
});

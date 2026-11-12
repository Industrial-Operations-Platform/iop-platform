import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { Report, ReportRequest } from "../src/features/analysis/domain/models";
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

function reportFor(request: ReportRequest, options: Report["options"]): Report {
  return { selection: request, options } as Report;
}

test("selecting equipment fills its unique draft parents, revalidates choices and applies explicitly", async () => {
  jest.useFakeTimers();
  try {
    const initial = { ...selection, filters: {} };
    const options = { sector: ["A", "B"], area: ["Area A", "Area B"], equipment: ["=EQ"], message: ["Alarm"] };
    const loadOptions = jest.fn(async (request: ReportRequest) => ({ ...reportFor(request, options),
      filterAncestors: request.filters?.sector ? {} : { sector: ["A"], area: ["Area A"] },
    }));
    const onApply = jest.fn();
    const { container } = render(<ReportFilters selection={initial} months={months} view={4}
      report={reportFor(initial, options)} loadOptions={loadOptions} onApply={onApply} />);
    container.querySelector("details")!.open = true;
    fireEvent.change(dropdown("Betriebsmittelkennzeichen"), { target: { value: "=EQ" } });
    await act(async () => { jest.advanceTimersByTime(150); });
    expect(dropdown("Sector / Halle")).toHaveValue("A");
    expect(dropdown("Bereich")).toHaveValue("Area A");
    expect(dropdown("Meldetext")).toHaveValue("");
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Apply filters" })).toBeDisabled();
    await act(async () => { jest.advanceTimersByTime(150); });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ filters: { sector: ["A"], area: ["Area A"], equipment: ["=EQ"] } }));
    expect(loadOptions).toHaveBeenCalledTimes(2);
    fireEvent.change(dropdown("Sector / Halle"), { target: { value: "B" } });
    expect(dropdown("Bereich")).toHaveValue("");
    expect(dropdown("Betriebsmittelkennzeichen")).toHaveValue("");
  } finally { jest.useRealTimers(); }
});

test("ambiguous areas keep Halle unrestricted and stale ancestor completions cannot overwrite newer choices", async () => {
  jest.useFakeTimers();
  try {
    const initial = { ...selection, filters: {} };
    const options = { sector: ["A", "B", "C"], area: ["Shared", "Area B", "Area C"] };
    const pending: { request: ReportRequest; resolve: (report: Report) => void }[] = [];
    const loadOptions = jest.fn((request: ReportRequest) => new Promise<Report>(resolve => pending.push({ request, resolve })));
    const onApply = jest.fn();
    const { container } = render(<ReportFilters selection={initial} months={months} view={2}
      report={reportFor(initial, options)} loadOptions={loadOptions} onApply={onApply} />);
    container.querySelector("details")!.open = true;
    fireEvent.change(dropdown("Bereich"), { target: { value: "Shared" } });
    await act(async () => { jest.advanceTimersByTime(150); });
    await act(async () => { pending[0].resolve({ ...reportFor(pending[0].request, options), filterAncestors: {} }); });
    expect(dropdown("Sector / Halle")).toHaveValue("");
    fireEvent.change(dropdown("Bereich"), { target: { value: "Area B" } });
    await act(async () => { jest.advanceTimersByTime(150); });
    fireEvent.change(dropdown("Bereich"), { target: { value: "Area C" } });
    await act(async () => { jest.advanceTimersByTime(150); });
    await act(async () => { pending[2].resolve({ ...reportFor(pending[2].request, options), filterAncestors: { sector: ["C"] } }); });
    await act(async () => { pending[1].resolve({ ...reportFor(pending[1].request, options), filterAncestors: { sector: ["B"] } }); });
    expect(dropdown("Sector / Halle")).toHaveValue("C");
    expect(dropdown("Bereich")).toHaveValue("Area C");
    expect(onApply).not.toHaveBeenCalled();
    await act(async () => { jest.advanceTimersByTime(150); });
    await act(async () => { pending[3].resolve({ ...reportFor(pending[3].request, options), filterAncestors: {} }); });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ filters: { sector: ["C"], area: ["Area C"] } }));
  } finally { jest.useRealTimers(); }
});
const dropdown = (field: string) => screen.getByRole("combobox", { name: field + " filter" });
const values = (field: string) => within(dropdown(field)).getAllByRole("option").map((option) => (option as HTMLOptionElement).value);

test("dropdown choices follow draft ancestors, clear descendants and ignore out-of-order responses before Apply", async () => {
  jest.useFakeTimers();
  try {
    const initial = { ...selection, filters: { sector: ["A"], area: ["Area A"], equipment: ["=A"], message: ["Jam"], type: ["01"] } };
    const pending: { request: ReportRequest; resolve: (report: Report) => void }[] = [];
    const loadOptions = jest.fn((request: ReportRequest) => new Promise<Report>((resolve) => pending.push({ request, resolve })));
    const onApply = jest.fn();
    const { container } = render(<ReportFilters selection={initial} months={months} view={4}
      report={reportFor(initial, { sector: ["A", "B", "C"], area: ["Area A"], equipment: ["=A"], message: ["Jam"], type: ["01"], messageGroup: ["001"] })}
      loadOptions={loadOptions} onApply={onApply} />);
    container.querySelector("details")!.open = true;
    expect(container.querySelector("datalist")).toBeNull();
    fireEvent.change(dropdown("Sector / Halle"), { target: { value: "B" } });
    for (const field of ["Bereich", "Betriebsmittelkennzeichen", "Meldetext", "Typ"]) expect(dropdown(field)).toHaveValue("");
    expect(dropdown("Bereich")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Apply filters" })).toBeDisabled();
    await act(async () => { jest.advanceTimersByTime(150); });
    fireEvent.change(dropdown("Sector / Halle"), { target: { value: "C" } });
    await act(async () => { jest.advanceTimersByTime(150); });
    await act(async () => { pending[1].resolve(reportFor(pending[1].request, { sector: ["A", "B", "C"], area: ["Area C"], equipment: ["=C"], message: ["Alarm"], type: ["02"] })); });
    await act(async () => { pending[0].resolve(reportFor(pending[0].request, { area: ["Area B"] })); });
    expect(values("Bereich")).toEqual(["", "Area C"]);
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.change(dropdown("Bereich"), { target: { value: "Area C" } });
    expect(dropdown("Betriebsmittelkennzeichen")).toBeDisabled();
    await act(async () => { jest.advanceTimersByTime(150); });
    await act(async () => { pending[2].resolve(reportFor(pending[2].request, { sector: ["A", "B", "C"], area: ["Area C"], equipment: ["=C"], message: ["Alarm"], type: ["02"] })); });
    expect(values("Betriebsmittelkennzeichen")).toEqual(["", "=C"]);
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ filters: { sector: ["C"], area: ["Area C"] }, months: ["2026-07"] }));
  } finally { jest.useRealTimers(); }
});

test("failed choices can be retried and changing months reloads choices without old descendants", async () => {
  jest.useFakeTimers();
  try {
    const initial = { ...selection, filters: { sector: ["A"], area: ["Area A"] } };
    const loadOptions = jest.fn<Promise<Report>, [ReportRequest]>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockImplementation(async (request) => reportFor(request, { sector: ["B"], area: ["Area B"] }));
    const onApply = jest.fn();
    const { container } = render(<ReportFilters selection={initial} months={months} view={2}
      report={reportFor(initial, { sector: ["A"], area: ["Area A"] })} loadOptions={loadOptions} onApply={onApply} />);
    container.querySelector("details")!.open = true;
    fireEvent.click(screen.getByRole("checkbox", { name: "May 2026" }));
    expect(dropdown("Sector / Halle")).toHaveValue("");
    await act(async () => { jest.advanceTimersByTime(150); });
    expect(screen.getByRole("alert")).toHaveTextContent("Could not validate");
    expect(screen.getByRole("button", { name: "Apply filters" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Retry choices" }));
    await act(async () => { jest.advanceTimersByTime(150); });
    expect(values("Bereich")).toEqual(["", "Area B"]);
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ months: ["2026-05", "2026-07"], filters: {} }));
  } finally { jest.useRealTimers(); }
});

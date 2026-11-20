import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MonthMultiPicker, monthSelectionSummary } from "../src/design/components/MonthMultiPicker";
import { setLanguage } from "../src/localization/i18n";

const history = Array.from({ length: 36 }, (_, index) =>
  `${2024 + Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, "0")}`);
function Controlled({ months = history, initial = ["2026-07"] }: { months?: string[]; initial?: string[] }) {
  const [value, setValue] = useState(initial);
  return <><MonthMultiPicker months={months} value={value} onChange={setValue} />
    <output data-testid="selection">{JSON.stringify(value)}</output></>;
}
const selection = () => JSON.parse(screen.getByTestId("selection").textContent!);
const open = () => fireEvent.click(screen.getByRole("button", { name: "Choose months" }));
afterEach(() => setLanguage("en"));

test("36 months stay in a twelve-month grid and selecting across years retains every choice", () => {
  render(<Controlled />);
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  open();
  expect(within(screen.getByRole("group", { name: "Months in 2026" })).getAllByRole("checkbox")).toHaveLength(12);
  fireEvent.click(screen.getByRole("checkbox", { name: "January 2026" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Year" }), { target: { value: "2024" } });
  expect(selection()).toEqual(["2026-01", "2026-07"]);
  fireEvent.click(screen.getByRole("checkbox", { name: "May 2024" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Year" }), { target: { value: "2026" } });
  expect(screen.getByRole("checkbox", { name: "January 2026" })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "July 2026" })).toBeChecked();
  expect(selection()).toEqual(["2024-05", "2026-01", "2026-07"]);
});

test("mixed-year and global bulk actions retain unrelated years without duplicates", () => {
  render(<Controlled months={["2025-01", "2025-02", "2026-03", "2026-11"]} initial={["2025-01", "2026-03"]} />);
  open();
  const year = () => screen.getByRole("checkbox", { name: "Select all months in 2026" });
  expect(year()).toBePartiallyChecked();
  fireEvent.click(year());
  expect(selection()).toEqual(["2025-01", "2026-03", "2026-11"]);
  expect(year()).toBeChecked();
  fireEvent.click(year());
  expect(selection()).toEqual(["2025-01"]);
  fireEvent.click(screen.getByRole("button", { name: "Select all months" }));
  expect(selection()).toEqual(["2025-01", "2025-02", "2026-03", "2026-11"]);
  fireEvent.click(screen.getByRole("button", { name: "Clear month selection" }));
  expect(selection()).toEqual([]);
  fireEvent.click(screen.getByRole("checkbox", { name: "November 2026" }));
  expect(selection()).toEqual(["2026-11"]);
});

test("unavailable months are disabled while a retained selection remains inspectable and removable", () => {
  render(<Controlled months={["2026-01"]} initial={["2025-12"]} />);
  open();
  expect(screen.getByRole("checkbox", { name: "December 2025" })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "January 2025" })).toBeDisabled();
  fireEvent.change(screen.getByRole("combobox", { name: "Year" }), { target: { value: "2026" } });
  expect(screen.getByRole("checkbox", { name: "January 2026" })).toBeEnabled();
  expect(screen.getByRole("checkbox", { name: "February 2026" })).toBeDisabled();
  expect(selection()).toEqual(["2025-12"]);
});

test("Escape restores trigger focus without discarding the caller's draft selection", () => {
  render(<Controlled />);
  open();
  expect(screen.getByRole("combobox", { name: "Year" })).toHaveFocus();
  fireEvent.click(screen.getByRole("checkbox", { name: "January 2026" }));
  fireEvent.keyDown(screen.getByRole("dialog", { name: "Choose months" }), { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Choose months" })).toHaveFocus();
  expect(selection()).toEqual(["2026-01", "2026-07"]);
  open();
  expect(screen.getByRole("checkbox", { name: "January 2026" })).toBeChecked();
});

test("empty, small and large summaries stay concise, deduplicated and localized", () => {
  expect(monthSelectionSummary([])).toBe("No months selected");
  expect(monthSelectionSummary(["2026-07", "2025-01", "2026-07"])).toBe("2025-01, 2026-07");
  expect(monthSelectionSummary(history)).toBe("36 months selected · 2024, 2025, 2026");
  setLanguage("de");
  expect(monthSelectionSummary(history)).toBe("36 Monate ausgewählt · 2024, 2025, 2026");
  render(<Controlled initial={[]} />);
  fireEvent.click(screen.getByRole("button", { name: "Monate auswählen" }));
  expect(screen.getByRole("combobox", { name: "Jahr" })).toHaveValue("2026");
  expect(screen.getByRole("checkbox", { name: "März 2026" })).toBeEnabled();
});

test("empty availability has an explicit state without generating invalid calendar dates", () => {
  render(<Controlled months={[]} initial={[]} />);
  expect(screen.getByText("No available months")).toBeVisible();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

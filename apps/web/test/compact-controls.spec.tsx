import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Button, CompactSelect, DepartmentScope, FilterForm, SearchControl } from "../src/design/components";

test("compact selection preserves native choice values, a distinct accessible name and disabled behavior", () => {
  const changed = jest.fn();
  const props = {
    caption: "Owner",
    label: "Action owner",
    value: "",
    emptyLabel: "All owners",
    choices: [{ id: "person", label: "Status" }],
    onChange: changed,
  };
  const { rerender } = render(<CompactSelect {...props} />);
  const select = screen.getByRole("combobox", { name: "Action owner" });
  expect(select.tagName).toBe("SELECT");
  expect(screen.getByText("Owner")).toBeVisible();
  expect(within(select).getByRole("option", { name: "All owners" })).toHaveValue("");
  expect(within(select).getByRole("option", { name: "Status" })).toHaveValue("person");
  fireEvent.change(select, { target: { value: "person" } });
  expect(changed).toHaveBeenLastCalledWith("person");
  rerender(<CompactSelect {...props} value="person" disabled />);
  expect(select).toHaveValue("person");
  expect(select).toBeDisabled();
});

test("department selection retains its existing defaults and nested location contract", () => {
  const changed = jest.fn();
  const props = { value: "", onChange: changed, choices: [{ id: "area", label: "Assembly" }] };
  const { rerender } = render(<DepartmentScope {...props} />);
  const department = screen.getByRole("combobox", { name: "Selected department" });
  expect(department.closest("label")).toHaveClass("iop-department-scope", "iop-compact-select");
  expect(screen.getByText("Department / Halle")).toBeVisible();
  expect(within(department).getByRole("option", { name: "All departments" })).toHaveValue("");
  fireEvent.change(department, { target: { value: "area" } });
  expect(changed).toHaveBeenLastCalledWith("area");
  rerender(<DepartmentScope {...props} value="area" caption="Area / location" label="Selected area / location" emptyLabel="All locations" />);
  expect(screen.getByRole("combobox", { name: "Selected area / location" })).toHaveValue("area");
  expect(screen.getByText("Area / location")).toBeVisible();
  expect(screen.getByRole("option", { name: "All locations" })).toHaveValue("");
});

test("compact search preserves disclosure, controlled changes, Escape clearing and explicit form submission", () => {
  const submit = jest.fn();
  function Example() {
    const [search, setSearch] = useState("");
    return <FilterForm variant="plain" onSubmit={event => { event.preventDefault(); submit(search); }}>
      <SearchControl caption="Search" label="Search actions" placeholder="Title or goal" value={search} onChange={setSearch} />
      <Button type="submit">Apply filters</Button>
    </FilterForm>;
  }
  render(<Example />);
  expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  const toggle = screen.getByRole("button", { name: "Search actions" });
  expect(toggle).toHaveAttribute("type", "button");
  expect(toggle.closest("form")).toHaveClass("iop-filter-form--plain");
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(toggle);
  const input = screen.getByRole("searchbox", { name: "Search actions" });
  expect(input).toHaveAttribute("type", "search");
  expect(input).toHaveFocus();
  expect(toggle).toHaveAttribute("aria-controls", input.id);
  expect(input.closest("label")).toHaveClass("iop-context-field");
  expect(screen.getByText("Search")).toBeVisible();
  fireEvent.change(input, { target: { value: "drive" } });
  expect(input).toHaveValue("drive");
  expect(submit).not.toHaveBeenCalled();
  expect(fireEvent.keyDown(input, { key: "Enter" })).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  expect(submit).toHaveBeenLastCalledWith("drive");
  expect(fireEvent.keyDown(input, { key: "Escape" })).toBe(false);
  expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  expect(toggle).toHaveFocus();
  fireEvent.click(toggle);
  expect(screen.getByRole("searchbox", { name: "Search actions" })).toHaveValue("");
  fireEvent.click(screen.getByRole("button", { name: "Close search" }));
  expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  expect(submit).toHaveBeenCalledTimes(1);
});

test("ordinary search remains available without the compact caption wrapper", () => {
  const changed = jest.fn();
  render(<SearchControl label="Search records" placeholder="Record title" value="existing" onChange={changed} />);
  const input = screen.getByRole("searchbox", { name: "Search records" });
  expect(input).toHaveValue("existing");
  expect(input).toHaveFocus();
  expect(input.closest("label")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Close search" }));
  expect(changed).toHaveBeenLastCalledWith("");
  expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
});

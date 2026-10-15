import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { HandoverWorkspace } from "../src/features/shift-handover/adapters/react/HandoverWorkspace";
import { HandoverApplication, type Gateway } from "../src/features/shift-handover/application/handover";
import type { Context } from "../src/features/shift-handover/domain/models";

function fixture() {
  const context: Context = { actorId: "actor", canCoordinate: true, people: [], categories: [], timeZone: "UTC", externalSystemLabel: "Work reference",
    locations: [{ id: "department", label: "Selected Halle", parentId: "", role: "department", sectorKey: "" }] };
  const gateway: Gateway = { context: jest.fn(async () => context), list: jest.fn(async () => ({ entries: [], total: 0, nextCursor: "" })),
    equipment: jest.fn(), history: jest.fn(), create: jest.fn(), change: jest.fn() };
  return { gateway, application: new HandoverApplication(gateway, () => "fixture-key") };
}

test("authorized journal navigation opens Shift records while preserving the selected department and ordinary Journal behavior", async () => {
  const f = fixture(), records = jest.fn();
  render(<HandoverWorkspace application={f.application} departmentId="department" onShiftRecords={records} />);
  const navigation = screen.getByRole("navigation", { name: "Handover views" });
  const recordsButton = within(navigation).getByRole("button", { name: "Shift records" });
  await waitFor(() => expect(recordsButton).toBeEnabled());
  fireEvent.click(recordsButton);
  expect(records).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(within(navigation).getByRole("button", { name: "Journal" })).toBeEnabled());
  fireEvent.click(within(navigation).getByRole("button", { name: "Journal" }));
  await waitFor(() => expect(f.gateway.list).toHaveBeenLastCalledWith(expect.objectContaining({ mine: true, departmentId: "department" })));
  expect(screen.getByRole("combobox", { name: "Selected department" })).toHaveValue("department");
  expect(within(navigation).getByRole("button", { name: "Journal" })).toHaveAttribute("aria-pressed", "true");
});

test("ordinary journal users receive no new formal action and explicit journal-view entry retains its query semantics", async () => {
  const f = fixture();
  render(<HandoverWorkspace application={f.application} departmentId="department" initialView="matrix" />);
  await waitFor(() => expect(f.gateway.list).toHaveBeenCalledWith(expect.objectContaining({ departmentId: "department", departmentMatrix: true })));
  expect(screen.queryByRole("button", { name: "Shift records" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Department matrix" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Journal" }));
  await waitFor(() => expect(f.gateway.list).toHaveBeenLastCalledWith(expect.objectContaining({ mine: true })));
});

test("formal navigation retains its independent entry point when ordinary journal context fails", async () => {
  const f = fixture(), records = jest.fn();
  (f.gateway.context as jest.Mock).mockRejectedValue(new Error("Journal source unavailable"));
  render(<HandoverWorkspace application={f.application} onShiftRecords={records} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Journal source unavailable");
  const navigation = within(screen.getByRole("navigation", { name: "Handover views" }));
  expect(navigation.getByRole("button", { name: "Journal" })).toBeDisabled();
  expect(navigation.getByRole("button", { name: "Shift records" })).toBeEnabled();
  fireEvent.click(navigation.getByRole("button", { name: "Shift records" }));
  expect(records).toHaveBeenCalledTimes(1);
});

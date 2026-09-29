import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HandoverHighlights } from "../src/features/shift-handover/adapters/react/HandoverHighlights";
import {
  HandoverApplication,
  type Gateway,
} from "../src/features/shift-handover/application/handover";
import type { Entry } from "../src/features/shift-handover/domain/models";

const entry = {
  id: "issue",
  departmentLabel: "Workshop",
  categoryLabel: "Safety",
  issueState: "open",
  content: {
    summary: "Guard inspection",
    details: "Check mounting",
    dueDate: "2026-09-30",
  },
} as Entry;

function setup() {
  const list = jest
    .fn<ReturnType<Gateway["list"]>, Parameters<Gateway["list"]>>()
    .mockImplementation(async (selection) => ({
      entries: selection.highlights ? [] : [entry],
      total: selection.highlights ? 0 : 8,
      nextCursor: "next",
    }));
  const context = jest.fn().mockResolvedValue({ locations: [] });
  const application = new HandoverApplication(
    { list, context } as unknown as Gateway,
    () => "key",
  );
  const open = jest.fn();
  render(
    <HandoverHighlights
      application={application}
      departmentId="workshop"
      onDepartmentChange={jest.fn()}
      open={open}
    />,
  );
  return { list, open };
}

test("Start shows one preview, retains overlapping open issues and exposes full attention selection", async () => {
  const { open } = setup();
  await screen.findByRole("button", { name: /Guard inspection/ });
  expect(screen.getAllByText("Guard inspection")).toHaveLength(1);
  fireEvent.click(
    screen.getByRole("button", { name: /View all attention items/ }),
  );
  expect(open).toHaveBeenLastCalledWith(undefined, "attention");
  fireEvent.click(screen.getByRole("button", { name: /Open reports/ }));
  expect(screen.getByText("Guard inspection")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: /View all open issues/ }));
  expect(open).toHaveBeenLastCalledWith(undefined, "pending");
  fireEvent.click(screen.getByRole("button", { name: /Guard inspection/ }));
  expect(open).toHaveBeenLastCalledWith("issue");
  fireEvent.click(screen.getByRole("button", { name: /^Shift Handover/ }));
  expect(screen.getByText("No active highlights.")).toBeVisible();
  expect(screen.queryByText("Guard inspection")).not.toBeInTheDocument();
});

test("refresh announces loading, permits retry after failure and preserves selected view", async () => {
  const { list } = setup();
  await screen.findByRole("button", { name: /Guard inspection/ });
  fireEvent.click(screen.getByRole("button", { name: /Open reports/ }));
  list.mockRejectedValueOnce(new Error("Updates unavailable"));
  fireEvent.click(screen.getByRole("button", { name: "Refresh updates" }));
  expect(
    screen.getByRole("button", { name: "Refresh updates" }),
  ).toBeDisabled();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Updates unavailable",
  );
  fireEvent.click(screen.getByRole("button", { name: "Refresh updates" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: /Open reports/ }),
    ).toHaveAttribute("aria-pressed", "true"),
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(list).toHaveBeenCalledWith(
    expect.objectContaining({ departmentId: "workshop", attention: true }),
  );
  expect(list).toHaveBeenCalledWith(
    expect.objectContaining({ departmentId: "", highlights: true }),
  );
});

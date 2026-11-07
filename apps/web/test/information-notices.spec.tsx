import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { InformationNotices } from "../src/features/shift-handover/adapters/react/InformationNotices";
import { HandoverApplication, type Gateway } from "../src/features/shift-handover/application/handover";
import type { Entry } from "../src/features/shift-handover/domain/models";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});

function entry(index: number): Entry {
  return { id: `notice-${index}`, departmentLabel: `Halle ${index}`, categoryLabel: "Information", issueState: "none",
    content: { summary: `Notice ${index}`, details: `Original instructions ${index}`, date: "2026-11-07", displayUntil: "2026-11-15", categoryId: "information" },
    latestUpdate: { note: "Correction audit reason", actorName: "Mike", at: "2026-11-07T12:00:00Z" } } as Entry;
}

function setup() {
  const list = jest.fn().mockResolvedValue({ entries: [0,1,2,3,4].map(entry), total: 6, nextCursor: "next" });
  const context = jest.fn().mockResolvedValue({ timeZone: "Europe/Zurich", categories: [{ id: "information", label: "Information", workflow: "information" }] });
  const application = new HandoverApplication({ context, list } as unknown as Gateway, () => "unused");
  const open = jest.fn();
  render(<InformationNotices application={application} open={open} />);
  return { list, context, open };
}

test("shows three original previews and opens the paginated collection and exact entry", async () => {
  const { list, open } = setup();
  const region = await screen.findByRole("region", { name: "Active information" });
  await screen.findByText("Showing 3 of 6 notices.");
  expect(within(region).getAllByRole("button", { name: /Notice/ })).toHaveLength(3);
  expect(screen.queryByText("Correction audit reason")).not.toBeInTheDocument();
  expect(screen.getAllByText("Display through")).toHaveLength(3);
  expect(list).toHaveBeenCalledWith(expect.objectContaining({ categoryId: "information", displayOn: expect.any(String), departmentId: "" }));
  fireEvent.click(screen.getByRole("button", { name: /All information/ }));
  const dialog = screen.getByRole("dialog", { name: "All information" });
  expect(within(dialog).getAllByRole("button", { name: /Notice/ })).toHaveLength(5);
  list.mockResolvedValueOnce({ entries: [entry(4), entry(5)], total: 6, nextCursor: "" });
  fireEvent.click(within(dialog).getByRole("button", { name: "More information" }));
  await waitFor(() => expect(within(dialog).getAllByRole("button", { name: /Notice/ })).toHaveLength(6));
  expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: "next", categoryId: "information", departmentId: "" }));
  fireEvent.click(within(dialog).getByRole("button", { name: /Notice 5/ }));
  expect(open).toHaveBeenCalledWith("notice-5");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("a failed refresh preserves notices and can recover through the refresh action", async () => {
  const { context } = setup();
  await screen.findByText("Showing 3 of 6 notices.");
  context.mockRejectedValueOnce(new Error("Information is unavailable."));
  fireEvent.click(screen.getByRole("button", { name: "Refresh information" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Information is unavailable.");
  expect(screen.getByText("Notice 0")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Refresh information" }));
  await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
});

test("automatic refresh discards an older in-flight page response", async () => {
  jest.useFakeTimers();
  try {
    const { list } = setup();
    await screen.findByText("Showing 3 of 6 notices.");
    fireEvent.click(screen.getByRole("button", { name: /All information/ }));
    let finish!: (value: unknown) => void;
    list.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    fireEvent.click(screen.getByRole("button", { name: "More information" }));
    list.mockResolvedValueOnce({ entries: [entry(8)], total: 1, nextCursor: "" });
    await act(async () => { jest.advanceTimersByTime(30_000); });
    await act(async () => { finish({ entries: [entry(9)], total: 7, nextCursor: "" }); });
    expect(screen.getAllByText("Notice 8")).toHaveLength(2);
    expect(screen.queryByText("Notice 9")).not.toBeInTheDocument();
  } finally { jest.useRealTimers(); }
});

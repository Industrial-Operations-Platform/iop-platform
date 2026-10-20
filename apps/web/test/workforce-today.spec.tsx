import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { WorkforceToday } from "../src/features/workforce/adapters/react/WorkforceToday";
import type { WorkforceApplication } from "../src/features/workforce/application/workforce";
import type { Board } from "../src/features/workforce/domain/models";

const board: Board = {
  actorId: "worker", timeZone: "UTC", canPlan: false, canAdminister: false,
  people: [], settings: { shifts: [], targets: [], teams: [] }, records: [],
};
beforeEach(() => jest.useFakeTimers({ now: new Date("2026-10-06T08:00:00Z"), doNotFake: ["setTimeout", "setInterval"] }));
afterEach(() => jest.useRealTimers());

test("day/week browsing reuses a loaded week and changes the related-work period immediately", async () => {
  const load = jest.fn(async () => board);
  const related = jest.fn((_period: { from: string; to: string; today: string }) => <p>Assigned maintenance</p>);
  render(<WorkforceToday application={{ board: load } as unknown as WorkforceApplication}
    timeZone="UTC" open={jest.fn()} relatedWork={related} />);
  await screen.findByText("No schedule yet");
  const firstRange = related.mock.calls.at(-1)![0];
  fireEvent.click(screen.getByRole("button", { name: "Week" }));
  expect(screen.getAllByText("No schedule yet")).toHaveLength(7);
  const weekRange = related.mock.calls.at(-1)![0];
  expect(weekRange.from <= firstRange.from && weekRange.to >= firstRange.to).toBe(true);
  expect(load).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Day" }));
  expect(screen.getAllByText("No schedule yet")).toHaveLength(1);
  expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
  expect(load).toHaveBeenCalledTimes(1);
});

test("slow or failed date requests retain the loaded content and obsolete responses cannot replace the latest week", async () => {
  const requests: { resolve: (value: Board) => void; reject: (error: Error) => void }[] = [];
  const load = jest.fn(() => new Promise<Board>((resolve, reject) => requests.push({ resolve, reject })));
  const { container } = render(<WorkforceToday
    application={{ board: load } as unknown as WorkforceApplication}
    timeZone="UTC" open={jest.fn()} />);
  await act(async () => requests[0].resolve(board));
  fireEvent.change(screen.getByLabelText("Assignment date"), { target: { value: "2026-10-07" } });
  expect(screen.getByText("2026-10-07", { exact: true })).toBeVisible();
  expect(load).toHaveBeenCalledTimes(1);
  const original = container.querySelector(".workforce-start-day")!.textContent;
  fireEvent.change(screen.getByLabelText("Assignment date"), { target: { value: "2026-10-19" } });
  await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
  expect(container.querySelector(".workforce-start-day")!.textContent).toBe(original);
  expect(screen.getByText("Updating assignments…")).toBeVisible();
  fireEvent.change(screen.getByLabelText("Assignment date"), { target: { value: "2026-10-26" } });
  await waitFor(() => expect(load).toHaveBeenCalledTimes(3));
  await act(async () => requests[2].resolve(board));
  expect(screen.getByText("2026-10-26", { exact: true })).toBeVisible();
  await act(async () => requests[1].resolve(board));
  expect(screen.getByText("2026-10-26", { exact: true })).toBeVisible();
  fireEvent.change(screen.getByLabelText("Assignment date"), { target: { value: "2026-11-02" } });
  await waitFor(() => expect(load).toHaveBeenCalledTimes(4));
  await act(async () => requests[3].reject(new Error("Assignments unavailable")));
  expect(screen.getByRole("alert")).toHaveTextContent("Assignments unavailable");
  expect(screen.getByText("2026-10-26", { exact: true })).toBeVisible();
});

test("the weekly grid keeps seven dated days with minimal shift and zone context", async () => {
  const scheduled: Board = { ...board, settings: { shifts: [{ id: "early", label: "Early", start: "05:00", end: "14:15", days: [0, 1, 2, 3, 4, 5, 6] }], targets: [{ id: "zone", label: "North zone", phone: "" }], teams: [] }, records: [
    { id: "assignment", kind: "assignment", revision: 1, deleted: false, personName: "Worker", data: { userId: "worker", date: "2026-10-06", shiftId: "early", targetId: "zone", duty: "zone", phone: "", start: "05:00", end: "14:15", startsAt: "2026-10-06T05:00:00Z", endsAt: "2026-10-06T14:15:00Z" } },
    { id: "schedule", kind: "schedule", revision: 1, deleted: false, personName: "Worker", data: { userId: "worker", date: "2026-10-06", status: "work", start: "05:00", end: "14:15", startsAt: "2026-10-06T05:00:00Z", endsAt: "2026-10-06T14:15:00Z", source: "manual" } },
  ] };
  const load = jest.fn(async () => scheduled);
  const { container } = render(<WorkforceToday application={{ board: load } as unknown as WorkforceApplication} timeZone="UTC" open={jest.fn()} />);
  await screen.findByText("North zone");
  fireEvent.click(screen.getByRole("button", { name: "Week" }));
  const grid = screen.getByLabelText("Weekly assignments");
  expect(grid.querySelectorAll("section")).toHaveLength(7);
  expect(grid.querySelectorAll("time")).toHaveLength(7);
  expect(container.querySelector(".workforce-start-days--week")).toBe(grid);
  expect(screen.getAllByText("Early")).toHaveLength(1);
  expect(screen.getByText("North zone")).toBeVisible();
  expect(load).toHaveBeenCalledTimes(1);
});

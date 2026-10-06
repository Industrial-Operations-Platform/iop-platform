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

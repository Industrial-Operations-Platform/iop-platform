import { fireEvent, render, screen, within } from "@testing-library/react";
import { ShiftLeaders } from "../src/features/workforce/adapters/react/ShiftLeaders";
import { Configuration } from "../src/features/workforce/adapters/react/Configuration";
import type { Board } from "../src/features/workforce/domain/models";
import { deserialize, serialize } from "node:v8";

beforeAll(() => { globalThis.structuredClone ??= (value) => deserialize(serialize(value)); });

const board: Board = {
  actorId: "worker", timeZone: "Europe/Zurich", canPlan: false, canAdminister: false,
  people: [{ id: "worker", name: "Worker", profile: "task-force" }, { id: "leader", name: "Shift Leader", profile: "team-leader" }],
  settings: {
    shifts: [{ id: "night", label: "Night", start: "22:00", end: "06:00", days: [0, 1, 2, 3, 4, 5, 6] }],
    targets: [{ id: "home", label: "Home zone", phone: "" }],
    teams: [{ id: "primary", label: "Primary group", leaderId: "leader" }],
    technicalLevels: [{ id: "operator", label: "Technical Operator" }, { id: "maintainer", label: "Maintenance Technician" }],
  },
  records: [
    { kind: "assignment", id: "night-leader", revision: 1, deleted: false, personName: "Shift Leader", data: { userId: "leader", date: "2026-10-19", shiftId: "night", targetId: "", duty: "leader", phone: "", start: "22:00", end: "06:00", startsAt: "2026-10-19T20:00:00Z", endsAt: "2026-10-20T04:00:00Z" } },
    { kind: "schedule", id: "worker_2026-10-20", revision: 1, deleted: false, personName: "Worker", data: { userId: "worker", date: "2026-10-20", status: "work", start: "05:00", end: "14:15", startsAt: "2026-10-20T03:00:00Z", endsAt: "2026-10-20T12:15:00Z", source: "manual" } },
    { kind: "worker", id: "worker", revision: 2, deleted: false, personName: "Worker", data: { userId: "worker", teamId: "primary", homeTargetId: "home", technicalLevelId: "operator", technicalLevelLabel: "Technical Operator" } },
  ],
};

test("the selected day shows an overnight leader, availability text and the primary team without changing authority", () => {
  jest.useFakeTimers({ now: new Date("2026-10-20T01:00:00Z") });
  try {
    const select = jest.fn();
    render(<ShiftLeaders board={board} date="2026-10-20" select={select} />);
    expect(screen.getByText("Available now")).toBeVisible();
    expect(screen.getByText("During your shift")).toBeVisible();
    fireEvent.click(screen.getByText("Primary group · 1"));
    expect(screen.getByText("Worker")).toBeVisible();
    expect(screen.getByText("Technical Operator")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Shift Leader" }));
    expect(select).toHaveBeenCalledWith(board.records[0]);
  } finally { jest.useRealTimers(); }
});

test("administrators can edit a task-force worker's primary group and technical level while retaining their home zone", () => {
  const save = jest.fn();
  render(<Configuration board={{ ...board, canAdminister: true }} save={save} pending={false} />);
  const roster = screen.getByRole("heading", { name: "Primary group · Shift Leader" }).closest("section")!;
  fireEvent.click(within(roster).getByRole("button", { name: "Worker" }));
  expect(screen.getByLabelText("Home zone")).toHaveValue("home");
  expect(screen.getByLabelText("Primary team")).toHaveValue("primary");
  fireEvent.change(screen.getByLabelText("Technical level"), { target: { value: "maintainer" } });
  fireEvent.click(screen.getByRole("button", { name: "Save worker profile" }));
  expect(save).toHaveBeenCalledWith({ kind: "worker", id: "worker", expectedRevision: 2, deleted: false,
    data: { userId: "worker", teamId: "primary", homeTargetId: "home", technicalLevelId: "maintainer" } });
});

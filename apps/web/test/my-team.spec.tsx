import { fireEvent, render, screen, within } from "@testing-library/react";
import { MyTeam } from "../src/features/workforce/adapters/react/MyTeam";
import { WorkforceWorkspace } from "../src/features/workforce/adapters/react/WorkforceWorkspace";
import { WorkforceApplication, type Gateway } from "../src/features/workforce/application/workforce";
import { setLanguage } from "../src/localization/i18n";
import { teamBoard, teamDates, teamAssignment, teamSchedule } from "./fixtures/team-distribution";

afterEach(() => setLanguage("en"));

test("a full-day allocation shows the shift, hours and area once", () => {
  const board = teamBoard();
  board.records = board.records.filter((record) => record.kind !== "assignment");
  board.records.push(teamAssignment("full-day", "alice", teamDates[0]));
  render(<MyTeam board={board} dates={[teamDates[0]]} date={teamDates[0]} select={jest.fn()} />);
  const row = screen.getByRole("row", { name: /Alice Current/ });
  expect(within(row).getAllByText("Early shift")).toHaveLength(1);
  expect(within(row).getAllByText("05:00–14:15")).toHaveLength(1);
  expect(within(row).getAllByText("Assembly")).toHaveLength(1);
  expect(within(row).queryByText("Work")).toBeNull();
  expect(within(row).queryByText("Zone coverage")).toBeNull();
  expect(within(row).getByRole("button")).toHaveAccessibleName(/Early shift, Assembly, Zone coverage, 05:00–14:15/);
});

test("split allocations retain their distinct hours without repeating the daily shift", () => {
  render(<MyTeam board={teamBoard()} dates={[teamDates[0]]} date={teamDates[0]} select={jest.fn()} />);
  const row = screen.getByRole("row", { name: /Alice Current/ });
  expect(within(row).getAllByText("Early shift")).toHaveLength(1);
  for (const hours of ["05:00–14:15", "05:00–08:00", "08:00–14:15"]) {
    expect(within(row).getByText(hours)).toBeVisible();
  }
});

test("a different assigned shift and an allocation without a schedule retain their context", () => {
  const board = teamBoard();
  board.records.push(teamAssignment("different-shift", "bob", teamDates[0], { shiftId: "night", start: "22:00", end: "06:00", startsAt: teamDates[0] + "T22:00:00Z", endsAt: teamDates[1] + "T06:00:00Z" }),
    teamAssignment("unknown-day", "unknown", teamDates[0]));
  render(<MyTeam board={board} dates={[teamDates[0]]} date={teamDates[0]} select={jest.fn()} />);
  const bob = screen.getByRole("row", { name: /Bob Technician/ });
  expect(within(bob).getByText("Early shift")).toBeVisible();
  expect(within(bob).getByText("Night shift")).toBeVisible();
  expect(within(bob).getByText("22:00–06:00")).toBeVisible();
  const unknown = screen.getByRole("row", { name: /Unknown Schedule/ });
  for (const label of ["No schedule yet", "Early shift", "05:00–14:15", "Assembly"]) {
    expect(within(unknown).getByText(label)).toBeVisible();
  }
});

test("a continuation keeps its hours when the new day's schedule has matching clock times", () => {
  const board = teamBoard();
  board.records.push(teamSchedule("unknown", teamDates[1], "work", "22:00", "06:00"),
    teamAssignment("unknown-night", "unknown", teamDates[0], { shiftId: "night", start: "22:00", end: "06:00", startsAt: teamDates[0] + "T22:00:00Z", endsAt: teamDates[1] + "T06:00:00Z" }));
  render(<MyTeam board={board} dates={[teamDates[1]]} date={teamDates[1]} select={jest.fn()} />);
  const row = screen.getByRole("row", { name: /Unknown Schedule/ });
  expect(within(within(row).getByRole("button")).getByText("22:00–06:00")).toBeVisible();
  expect(within(row).getByText("Continues from 2026-10-19")).toBeVisible();
});

test("the weekly team view shows absences and allocations without requiring an on-duty leader", () => {
  const select = jest.fn();
  render(<MyTeam board={teamBoard()} dates={teamDates} date={teamDates[1]} select={select} />);
  const team = screen.getByRole("table", { name: "Team distribution for Primary operations" });
  const alice = within(team).getByRole("row", { name: /Alice Current/ });
  for (const label of ["Vacation", "Sick leave", "Training", "Compensation", "Accident", "Off", "Assembly", "Floating support"]) {
    expect(within(alice).getByText(label)).toBeVisible();
  }
  expect(within(alice).queryByText("Not assigned")).toBeNull();
  expect(within(team).getByText("Technical Operator")).toBeVisible();
  expect(screen.queryByText("Other Leader's Worker")).toBeNull();
  expect(screen.queryByText("Old alice")).toBeNull();
  expect(within(team).getByRole("row", { name: /Unknown Schedule/ }).textContent).toContain("No schedule yet");
  expect(within(team).getByRole("row", { name: /Bob Technician/ }).textContent).toContain("Not assigned");
  expect(within(team).getByText("Continues from 2026-10-19")).toBeVisible();
  const assignment = within(alice).getAllByRole("button")[0];
  expect(assignment).toHaveAccessibleName("View assignment for Alice Current on 2026-10-19: Early shift, Assembly, Zone coverage, 05:00–08:00");
  expect(within(alice).getAllByRole("button")[1]).toHaveAccessibleName("View assignment for Alice Current on 2026-10-19: Early shift, Floating support, 08:00–14:15");
  fireEvent.click(assignment);
  expect(select).toHaveBeenCalledWith(expect.objectContaining({ id: "alice-assembly" }));
});

test("non-working status hides conflicting hours while retaining allocation evidence", () => {
  const board = teamBoard();
  const schedule = board.records.find((entry) => entry.id === "alice_2026-10-21")!;
  Object.assign(schedule.data, { start: "05:00", end: "14:15" });
  board.records.push(teamAssignment("contradiction", "alice", teamDates[2]));
  render(<MyTeam board={board} dates={[teamDates[2]]} date={teamDates[2]} select={jest.fn()} />);
  const row = screen.getByRole("row", { name: /Alice Current/ });
  expect(within(row).getByText("Sick leave")).toBeVisible();
  expect(row.querySelector(".workforce-team-hours")).toBeNull();
  expect(within(row).getByText("Assembly")).toBeVisible();
});

test("German labels include an explicit empty team state", () => {
  setLanguage("de");
  render(<MyTeam board={{ ...teamBoard(), actorId: "unassigned-leader" }} dates={teamDates} date={teamDates[1]} select={jest.fn()} />);
  expect(screen.getByRole("heading", { name: "Mein Team" })).toBeVisible();
  expect(screen.getByText("Dir ist kein Stammteam zugewiesen.")).toBeVisible();
});

test("team navigation preserves site-wide planning and Administrator-only configuration", async () => {
  const board = teamBoard();
  const gateway: Gateway = { board: jest.fn(async () => board), save: jest.fn(), saveWeek: jest.fn(), preview: jest.fn(), commit: jest.fn(), history: jest.fn() };
  render(<WorkforceWorkspace application={new WorkforceApplication(gateway, () => "id")} profile="team-leader" timeZone="UTC" />);
  fireEvent.click(await screen.findByRole("button", { name: "My team" }));
  expect(screen.getByRole("table", { name: "Team distribution for Primary operations" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Configuration" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Schedule import" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Weekly plan" }));
  expect(screen.getByRole("table", { name: "Weekly plan" })).toBeVisible();
  expect(gateway.save).not.toHaveBeenCalled();
  expect(gateway.saveWeek).not.toHaveBeenCalled();
});

test.each(["team-leader", "administrator"])("the %s presentation cannot expose team planning without the current grant", async (profile) => {
  const board = { ...teamBoard(), canPlan: false };
  const gateway: Gateway = { board: jest.fn(async () => board), save: jest.fn(), saveWeek: jest.fn(), preview: jest.fn(), commit: jest.fn(), history: jest.fn() };
  render(<WorkforceWorkspace application={new WorkforceApplication(gateway, () => "id")} profile={profile} timeZone="UTC" />);
  await screen.findByRole("button", { name: "My day" });
  expect(screen.queryByRole("button", { name: "My team" })).toBeNull();
});

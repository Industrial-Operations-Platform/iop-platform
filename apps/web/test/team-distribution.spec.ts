import { teamDistribution } from "../src/features/workforce/domain/team-distribution";
import { teamBoard, teamDates } from "./fixtures/team-distribution";

test("primary teams use current directory names and memberships even while their leader is absent", () => {
  const board = teamBoard();
  const before = JSON.stringify(board);
  const teams = teamDistribution(board, teamDates);
  expect(teams.map((team) => team.id)).toEqual(["alpha", "beta"]);
  expect(teams[0].members.map((member) => member.person.name)).toEqual(["Alice Current", "Bob Technician", "Casey Technician", "Unknown Schedule"]);
  expect(teams[0].members[0].technicalLevel).toBe("Technical Operator");
  expect(teams[0].members[2].technicalLevel).toBe("Retained qualification");
  expect(teams[1].members[0].person.id).toBe("dana");
  expect(JSON.stringify(board)).toBe(before);
  expect(teamDistribution({ ...board, actorId: "outside" }, teamDates)).toEqual([]);
  board.settings.teams[0].leaderId = "other-leader";
  expect(teamDistribution(board, teamDates).map((team) => team.id)).toEqual(["beta"]);
  const bob = board.records.find((entry) => entry.kind === "worker" && entry.id === "bob")!;
  Object.assign(bob.data, { teamId: "beta" });
  expect(teamDistribution(board, teamDates)[0].members.map((member) => member.person.id)).toEqual(["bob", "dana"]);
});

test("unknown, absent, training and unassigned work remain distinct", () => {
  const [team, support] = teamDistribution(teamBoard(), teamDates);
  const alice = team.members.find((member) => member.person.id === "alice")!;
  expect(alice.days.map((day) => day.schedule?.data.status)).toEqual(["work", "vacation", "sick", "training", "compensation", "accident", "off"]);
  expect(alice.days.every((day) => !day.unassigned)).toBe(true);
  expect(alice.days[3].schedule?.data.start).toBe("05:00");
  expect(team.members.find((member) => member.person.id === "bob")!.days[1]).toMatchObject({ unassigned: true, assignments: [] });
  expect(team.members.find((member) => member.person.id === "unknown")!.days[1]).toMatchObject({ schedule: undefined, unassigned: false, assignments: [] });
  expect(support.members[0].days[1]).toMatchObject({ unassigned: true, schedule: { data: { status: "maintenance" } } });
});

test("all split and overnight duties remain visible without covering a new day's unassigned schedule", () => {
  const team = teamDistribution(teamBoard(), teamDates)[0];
  expect(team.members[0].days[0].assignments.map((entry) => entry.id)).toEqual(["alice-assembly", "alice-floating"]);
  const casey = team.members.find((member) => member.person.id === "casey")!;
  expect(casey.days[0].assignments.map((entry) => entry.id)).toEqual(["casey-night"]);
  expect(casey.days[1]).toMatchObject({ unassigned: true, assignments: [{ id: "casey-night", data: { shiftLabel: "Retained night", targetLabel: "Retained zone" } }] });
  expect(casey.days[2].assignments).toEqual([]);
});

test("schedule shift names respect configured weekdays and overnight visibility follows the site zone with exclusive ends", () => {
  const board = teamBoard();
  board.timeZone = "Europe/Zurich";
  board.settings.shifts[0].days = [1];
  const assignment = board.records.find((entry) => entry.id === "casey-night")!;
  Object.assign(assignment.data, { startsAt: "2026-10-19T20:00:00Z", endsAt: "2026-10-19T22:00:00Z" });
  const members = teamDistribution(board, teamDates)[0].members;
  const bob = members.find((member) => member.person.id === "bob")!;
  expect(bob.days[0].shiftLabel).toBe("Early shift");
  expect(bob.days[1].shiftLabel).toBe("");
  expect(members.find((member) => member.person.id === "casey")!.days[1].assignments).toEqual([]);
});

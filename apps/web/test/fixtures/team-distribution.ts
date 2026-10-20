import type { Assignment, Board, RecordEntry, Schedule } from "../../src/features/workforce/domain/models";

export const teamDates = ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"];
export function teamSchedule(userId: string, date: string, status = "work", start = "05:00", end = "14:15"): RecordEntry<"schedule"> {
  const working = ["work", "maintenance", "training"].includes(status);
  const data: Schedule = { userId, date, status, start: working ? start : "", end: working ? end : "", startsAt: working ? `${date}T${start}:00Z` : "", endsAt: working ? `${date}T${end}:00Z` : "", source: "manual" };
  return { id: `${userId}_${date}`, kind: "schedule", revision: 1, deleted: false, personName: `Old ${userId}`, data };
}
export function teamAssignment(id: string, userId: string, date: string, changes: Partial<Assignment> = {}): RecordEntry<"assignment"> {
  return { id, kind: "assignment", revision: 1, deleted: false, personName: `Old ${userId}`, data: {
    userId, date, duty: "zone", shiftId: "early", targetId: "assembly", phone: "", start: "05:00", end: "14:15", startsAt: `${date}T05:00:00Z`, endsAt: `${date}T14:15:00Z`, ...changes,
  } };
}
export function teamBoard(): Board {
  const people = [
    { id: "leader", name: "Morgan Leader", profile: "team-leader" },
    { id: "alice", name: "Alice Current", profile: "technician" },
    { id: "bob", name: "Bob Technician", profile: "technician" },
    { id: "casey", name: "Casey Technician", profile: "technician" },
    { id: "unknown", name: "Unknown Schedule", profile: "technician" },
    { id: "dana", name: "Dana Technician", profile: "task-force" },
    { id: "outside", name: "Other Leader's Worker", profile: "technician" },
    { id: "deleted", name: "Deleted Membership", profile: "technician" },
  ];
  return {
    actorId: "leader", timeZone: "UTC", canPlan: true, canAdminister: false, people,
    settings: {
      shifts: [
        { id: "early", label: "Early shift", start: "05:00", end: "14:15", days: [0, 1, 2, 3, 4, 5, 6] },
        { id: "night", label: "Night shift", start: "22:00", end: "06:00", days: [0, 1, 2, 3, 4, 5, 6] },
      ],
      targets: [{ id: "assembly", label: "Assembly", phone: "" }],
      teams: [{ id: "alpha", label: "Primary operations", leaderId: "leader" }, { id: "beta", label: "Support team", leaderId: "leader" }, { id: "other", label: "Another team", leaderId: "other-leader" }],
      technicalLevels: [{ id: "operator", label: "Technical Operator" }],
    },
    records: [
      ...["alice", "bob", "casey", "unknown", "removed-directory", "dana", "outside", "deleted"].map((userId): RecordEntry<"worker"> => ({
        id: userId, kind: "worker", revision: 1, deleted: userId === "deleted", personName: `Old ${userId}`,
        data: { userId, teamId: userId === "dana" ? "beta" : userId === "outside" ? "other" : "alpha", homeTargetId: "assembly", technicalLevelId: userId === "alice" ? "operator" : "retired", technicalLevelLabel: userId === "casey" ? "Retained qualification" : "" },
      })),
      ...["work", "vacation", "sick", "training", "compensation", "accident", "off"].map((status, index) => teamSchedule("alice", teamDates[index], status)),
      ...teamDates.map((date) => teamSchedule("bob", date, "work")),
      teamSchedule("casey", teamDates[1]),
      teamSchedule("dana", teamDates[1], "maintenance"),
      teamSchedule("leader", teamDates[1], "vacation"),
      { ...teamSchedule("unknown", teamDates[1]), deleted: true },
      teamAssignment("alice-assembly", "alice", teamDates[0], { end: "08:00", endsAt: teamDates[0] + "T08:00:00Z" }),
      teamAssignment("alice-floating", "alice", teamDates[0], { duty: "floating", targetId: "", start: "08:00", startsAt: teamDates[0] + "T08:00:00Z" }),
      teamAssignment("casey-night", "casey", teamDates[0], { shiftId: "retired-night", shiftLabel: "Retained night", targetId: "retired-zone", targetLabel: "Retained zone", start: "22:00", end: "06:00", startsAt: teamDates[0] + "T22:00:00Z", endsAt: teamDates[1] + "T06:00:00Z" }),
      { ...teamAssignment("deleted-assignment", "bob", teamDates[1]), deleted: true },
    ],
  };
}

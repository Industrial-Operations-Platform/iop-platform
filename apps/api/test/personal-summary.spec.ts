import {
  personalMonths,
  personalSummary,
} from "../src/modules/workforce/domain/personal-summary";
import type {
  RecordEntry,
  Settings,
} from "../src/modules/workforce/domain/workforce";
const settings: Settings = {
  shifts: [
    { id: "early", label: "Early", start: "05:00", end: "14:00", days: [1] },
    { id: "late", label: "Late", start: "14:00", end: "23:00", days: [1] },
  ],
  targets: [{ id: "hall", label: "Home hall", phone: "" }],
  teams: [{ id: "team", label: "Operations", leaderId: "actor" }],
};
const schedule = (
  date: string,
  status = "work",
  start = "05:00",
  end = "14:00",
  userId = "actor",
) =>
  ({
    id: date,
    kind: "schedule",
    deleted: false,
    data: { date, status, start, end, userId },
  }) as RecordEntry;
const assignment = (date: string, shiftId: string, duty = "zone") =>
  ({
    id: `${date}:${shiftId}:${duty}`,
    kind: "assignment",
    deleted: false,
    data: { date, shiftId, duty, userId: "actor" },
  }) as RecordEntry;
test("personal calendar bounds handle January rollover and leap-year months", () => {
  expect(personalMonths("2027-01-02")).toEqual({
    currentFrom: "2027-01-01",
    previousFrom: "2026-12-01",
    previousTo: "2026-12-31",
  });
  expect(personalMonths("2028-03-01").previousTo).toBe("2028-02-29");
});
test("shift shares deduplicate repeated duties and weekend totals count scheduled days only through today", () => {
  const result = personalSummary(
    "actor",
    "2026-10-06",
    [
      {
        id: "actor",
        kind: "worker",
        deleted: false,
        data: { userId: "actor", homeTargetId: "hall", teamId: "team" },
      } as RecordEntry,
      schedule("2026-09-01"),
      assignment("2026-09-01", "early"),
      assignment("2026-09-01", "early", "leader"),
      schedule("2026-09-02", "work", "14:00", "23:00"),
      schedule("2026-09-03", "vacation"),
      schedule("2026-09-04", "work", "05:00", "14:00", "other"),
      schedule("2026-10-03"),
      assignment("2026-10-03", "early"),
      schedule("2026-10-04", "training"),
      schedule("2026-10-10"),
      { ...schedule("2026-10-05"), deleted: true },
    ],
    settings,
  );
  expect(result).toMatchObject({
    homeTargetId: "hall",
    teamLabel: "Operations",
    scheduledDays: 2,
    saturdays: 1,
    sundays: 1,
  });
  expect(result.shifts).toEqual([
    { id: "early", label: "Early", count: 1, percentage: 50 },
    { id: "late", label: "Late", count: 1, percentage: 50 },
  ]);
});

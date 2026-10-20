import { leaderAvailability, touchesDate } from "../src/features/workforce/domain/leader-availability";
import type { Assignment } from "../src/features/workforce/domain/models";

const leader: Assignment = { userId: "leader", date: "2026-10-19", shiftId: "night", targetId: "", duty: "leader", phone: "", start: "22:00", end: "06:00", startsAt: "2026-10-19T20:00:00Z", endsAt: "2026-10-20T04:00:00Z" };
test("overnight leaders remain available after midnight and use exclusive ends", () => {
  expect(touchesDate(leader, "2026-10-20", "Europe/Zurich")).toBe(true);
  expect(leaderAvailability(leader, [], "2026-10-19T20:00:00.000Z").availableNow).toBe(true);
  expect(leaderAvailability(leader, [], "2026-10-20T01:00:00.000Z").availableNow).toBe(true);
  expect(leaderAvailability(leader, [], "2026-10-20T04:00:00.000Z").availableNow).toBe(false);
  expect(touchesDate({ ...leader, endsAt: "2026-10-19T22:00:00Z" }, "2026-10-20", "Europe/Zurich")).toBe(false);
});
test("shift overlap is independent of present availability and touching intervals do not overlap", () => {
  expect(leaderAvailability(leader, [{ ...leader, userId: "worker", startsAt: "2026-10-20T03:00:00Z", endsAt: "2026-10-20T12:00:00Z" }], "2026-10-21T00:00:00Z"))
    .toEqual({ availableNow: false, duringOwnShift: true });
  expect(leaderAvailability(leader, [{ ...leader, startsAt: leader.endsAt, endsAt: "2026-10-20T12:00:00Z" }], "2026-10-20T01:00:00Z").duringOwnShift).toBe(false);
  expect(leaderAvailability({ ...leader, startsAt: "", endsAt: "" }, [], "2026-10-20T01:00:00Z").availableNow).toBe(false);
});

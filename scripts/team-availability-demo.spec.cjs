const { prepareChanges, validChanges, changeState, applyChange, snapshot, finalSchedule, removedAssignment } = require("./local/team-availability-demo-runner.cjs");
const clock = { interval: (date, start, end) => ({ startsAt: `${date}T${start}:00.000Z`, endsAt: `${date}T${end}:00.000Z` }) };
function fixture() {
  const teams = Array.from({ length: 4 }, (_, index) => ({ id: `team-${index}`, label: `Team ${index}`, leaderId: `lead-${index}` }));
  const board = { timeZone: "UTC", people: teams.map(team => ({ id: team.leaderId, profile: "team-leader" })), settings: { teams }, records: [] };
  const original = { week: { schedules: [], assignments: [] } }, histories = {};
  for (const team of teams) for (let index = 0; index < 3; index++) {
    const userId = `${team.id}-worker-${index}`;
    board.people.push({ id: userId, name: userId, profile: "technician" });
    board.records.push({ kind: "worker", id: userId, revision: 3, deleted: false, data: { userId, teamId: team.id, homeTargetId: "zone" } });
    const days = ["2026-10-21", "2026-10-22"].map(date => ({ date, status: "work", start: "08:00", end: "17:00", expectedRevision: 0 }));
    if (index < 2) original.week.schedules.push({ userId, weekStart: "2026-10-19", days });
    for (const day of days) {
      const { expectedRevision, ...data } = day;
      const schedule = { kind: "schedule", id: `${userId}_${day.date}`, revision: 1, deleted: false,
        data: { ...data, userId, ...clock.interval(day.date, day.start, day.end), source: "manual" } };
      const assignment = { kind: "assignment", id: `${index < 2 ? "iop217" : "unrelated"}-${userId}-${day.date}`, revision: 1, deleted: false,
        data: { userId, date: day.date, shiftId: "day", targetId: "zone", duty: "zone", phone: "", start: day.start, end: day.end,
          ...clock.interval(day.date, day.start, day.end), shiftLabel: "Day", targetLabel: "Zone", phoneLabel: "" } };
      board.records.push(schedule, assignment);
      if (index < 2) original.week.assignments.push(structuredClone(assignment));
      for (const record of [schedule, assignment]) histories[`${record.kind}/${record.id}`] = [{ record: structuredClone(record), actorId: "admin", action: "saved" }];
    }
  }
  const formal = [{ shift: { date: "2026-10-20", assignments: [] } }];
  const prepared = prepareChanges(board, original, { teams }, clock, formal);
  return { board, original, teams, histories, formal, ...prepared };
}
const state = (f, change = f.changes[0]) => changeState(f.board, change, f.histories, f.formal, "admin", f.teams.find(team => team.id === change.teamId));
function recordRevision(f, record, action) {
  const index = f.board.records.findIndex(item => item.kind === record.kind && item.id === record.id);
  f.board.records[index] = structuredClone(record);
  f.histories[`${record.kind}/${record.id}`].push({ actorId: "admin", action, record: structuredClone(record) });
}
const application = f => ({
  save: jest.fn(async (actor, input) => {
    const before = f.board.records.find(record => record.kind === input.kind && record.id === input.id);
    if (before.revision !== input.expectedRevision) throw new Error("workforce_conflict");
    recordRevision(f, { ...before, revision: before.revision + 1, deleted: true }, "deleted");
  }),
  saveWeek: jest.fn(async (actor, input) => {
    const change = f.changes.find(change => change.userId === input.userId && change.date === input.days[0].date);
    const before = f.board.records.find(record => record.kind === "schedule" && record.id === change.before.id);
    if (before.revision !== input.days[0].expectedRevision) throw new Error("workforce_conflict");
    recordRevision(f, finalSchedule(change), "saved");
    return { changed: 1 };
  }),
});

test("bounded preparation adds vacation and sickness to every group and covers six states without changing inputs", () => {
  const f = fixture(), before = structuredClone({ board: f.board, original: f.original });
  const prepared = prepareChanges(f.board, f.original, { teams: f.teams }, clock, f.formal);
  expect(prepared.changes).toHaveLength(12);
  expect(prepared.changes.filter(change => change.removeAssignment)).toHaveLength(11);
  expect(new Set(prepared.changes.map(change => change.status))).toEqual(new Set(["vacation", "sick", "training", "compensation", "accident", "maintenance"]));
  for (const team of f.teams) expect(prepared.changes.filter(change => change.teamId === team.id && change.date === "2026-10-21").map(change => change.status)).toEqual(["vacation", "sick"]);
  expect(prepared.changes.every(change => change.before.revision === 1 && change.assignment.id.startsWith("iop217-") && !change.userId.endsWith("worker-2"))).toBe(true);
  expect({ board: f.board, original: f.original }).toEqual(before);
});

test.each(["changed schedule", "changed duty", "deleted day", "non-demo duty", "extra duty"])("preparation preserves %s instead of broadening eligible workers", reason => {
  const f = fixture(), userId = f.changes[0].userId;
  const schedule = f.board.records.find(record => record.kind === "schedule" && record.data.userId === userId);
  const assignment = f.board.records.find(record => record.kind === "assignment" && record.data.userId === userId);
  if (reason === "changed schedule") schedule.data.start = "09:00";
  if (reason === "changed duty") assignment.revision++;
  if (reason === "deleted day") schedule.deleted = true;
  if (reason === "non-demo duty") assignment.id = "owner-duty";
  if (reason === "extra duty") f.board.records.push({ ...assignment, id: "extra-duty" });
  expect(() => prepareChanges(f.board, f.original, { teams: f.teams }, clock, f.formal)).toThrow("two untouched");
});

test("an existing Formal Handover on a demo date prevents preparation", () => {
  const f = fixture();
  expect(() => prepareChanges(f.board, f.original, { teams: f.teams }, clock, [{ shift: { date: "2026-10-21", assignments: [] } }])).toThrow("Formal Handover binding");
});

test.each(["scope expansion", "arbitrary hours", "wrong absence", "replaced assignment", "duplicate day", "missing row"])("a retained manifest rejects %s", reason => {
  const f = fixture(), manifest = { teams: f.teams, changes: structuredClone(f.changes) };
  expect(validChanges(manifest, f.original, clock, "UTC")).toBe(true);
  if (reason === "scope expansion") manifest.changes[0].userId = "other-worker";
  if (reason === "arbitrary hours") manifest.changes[0].after.start = "12:00";
  if (reason === "wrong absence") manifest.changes[0].status = "work";
  if (reason === "replaced assignment") manifest.changes[0].assignment.id = "unrelated-duty";
  if (reason === "duplicate day") manifest.changes[1] = structuredClone(manifest.changes[0]);
  if (reason === "missing row") manifest.changes.pop();
  expect(validChanges(manifest, f.original, clock, "UTC")).toBe(false);
});

test("apply removes only the owned incompatible duty, retains history and becomes a no-op on rerun", async () => {
  const f = fixture(), change = f.changes[0], app = application(f), original = structuredClone(f.board.records);
  expect(await applyChange(app, "admin", change, async () => state(f))).toMatchObject({ state: "completed", schedulesChanged: 1, assignmentsRemoved: 1 });
  expect(state(f)).toEqual({ state: "completed" });
  expect(await applyChange(app, "admin", change, async () => state(f))).toMatchObject({ schedulesChanged: 0, assignmentsRemoved: 0 });
  expect(app.save).toHaveBeenCalledTimes(1);
  expect(app.saveWeek).toHaveBeenCalledTimes(1);
  expect(f.histories[`assignment/${change.assignment.id}`].map(revision => revision.action)).toEqual(["saved", "deleted"]);
  expect(f.board.records.filter(record => ![change.before.id, change.assignment.id].includes(record.id)))
    .toEqual(original.filter(record => ![change.before.id, change.assignment.id].includes(record.id)));
});

test("an interruption after retained duty removal resumes without deleting again", async () => {
  const f = fixture(), change = f.changes[0], app = application(f);
  app.saveWeek.mockRejectedValueOnce(new Error("Interrupted"));
  await expect(applyChange(app, "admin", change, async () => state(f))).rejects.toThrow("Interrupted");
  expect(state(f)).toEqual({ state: "resumable" });
  expect(await applyChange(app, "admin", change, async () => state(f))).toMatchObject({ state: "completed", schedulesChanged: 1, assignmentsRemoved: 0 });
  expect(app.save).toHaveBeenCalledTimes(1);
});

test("maintenance keeps its exact compatible assignment and training keeps scheduled hours", async () => {
  const f = fixture(), maintenance = f.changes.find(change => change.status === "maintenance"), training = f.changes.find(change => change.status === "training"), app = application(f);
  expect(training.after).toMatchObject({ start: "08:00", end: "17:00", startsAt: training.before.data.startsAt, endsAt: training.before.data.endsAt });
  expect(await applyChange(app, "admin", maintenance, async () => state(f, maintenance))).toMatchObject({ state: "completed", assignmentsRemoved: 0 });
  expect(snapshot(f.board.records.find(record => record.id === maintenance.assignment.id))).toEqual(maintenance.assignment);
  expect(app.save).not.toHaveBeenCalled();
});

test.each(["schedule", "assignment", "history", "membership", "formal", "extra duty"])("later %s changes are preserved before any demo write", async reason => {
  const f = fixture(), change = f.changes[0], app = application(f);
  if (reason === "schedule") f.board.records.find(record => record.id === change.before.id).revision++;
  if (reason === "assignment") f.board.records.find(record => record.id === change.assignment.id).deleted = true;
  if (reason === "history") f.histories[`schedule/${change.before.id}`][0].actorId = "owner";
  if (reason === "membership") f.board.records.find(record => record.id === change.userId).data.teamId = "new-team";
  if (reason === "formal") f.formal.push({ shift: { date: change.date, assignments: [] } });
  if (reason === "extra duty") f.board.records.push({ ...change.assignment, id: "owner-duty" });
  expect(await applyChange(app, "admin", change, async () => state(f))).toMatchObject({ state: "preserved", schedulesChanged: 0, assignmentsRemoved: 0 });
  expect(app.save).not.toHaveBeenCalled();
  expect(app.saveWeek).not.toHaveBeenCalled();
});

test("an edit between deletion and availability save is preserved without overwriting the user", async () => {
  const f = fixture(), change = f.changes[0], app = application(f);
  const readState = async () => {
    if (app.save.mock.calls.length) f.board.records.find(record => record.id === change.before.id).revision = 3;
    return state(f);
  };
  expect(await applyChange(app, "admin", change, readState)).toMatchObject({ state: "preserved", schedulesChanged: 0, assignmentsRemoved: 1 });
  expect(app.saveWeek).not.toHaveBeenCalled();
});

test("completed demos with later user corrections or a different tombstone history remain authoritative", () => {
  const f = fixture(), change = f.changes[0];
  recordRevision(f, removedAssignment(change), "deleted");
  recordRevision(f, finalSchedule(change), "saved");
  expect(state(f)).toEqual({ state: "completed" });
  f.histories[`assignment/${change.assignment.id}`][1].actorId = "owner";
  expect(state(f).state).toBe("preserved");
  f.histories[`assignment/${change.assignment.id}`][1].actorId = "admin";
  recordRevision(f, { ...finalSchedule(change), revision: 3, data: { ...change.after, status: "off" } }, "saved");
  expect(state(f).state).toBe("preserved");
});

const { prepareWeek, improvementScenarios, withAsset, resumeImprovement, resumeFormal, prefix, weekStart } = require("./local/operational-demos-runner.cjs");
const clock = { interval: (date, start, end) => ({ startsAt: `${date}T${start}:00.000Z`, endsAt: `${date}T${end}:00.000Z` }) };
const fixture = () => ({ timeZone: "UTC", people: [{ id: "technician", profile: "technician" }, { id: "leader", profile: "team-leader" }, { id: "admin", profile: "administrator" }],
  settings: { shifts: [{ id: "early", label: "Early", start: "05:00", end: "14:15", days: [0,1,2,3,4,5,6] }], targets: [{ id: "zone", label: "Zone" }] }, records: [] });
const identity = value => prefix + value.replaceAll("/", "-");
test("weekly preparation covers every active user while retaining existing absences and duties", () => {
  const board = fixture();
  board.records.push({ kind: "schedule", id: `technician_${weekStart}`, revision: 4, data: { userId: "technician", date: weekStart, status: "vacation", start: "", end: "", startsAt: "", endsAt: "" } });
  const before = structuredClone(board), result = prepareWeek(board, clock, identity);
  expect(result.people).toHaveLength(3);
  expect(result.schedules.reduce((total, week) => total + week.days.length, 0)).toBe(20);
  expect(result.schedules.find(week => week.userId === "technician").days.some(day => day.date === weekStart)).toBe(false);
  expect(result.assignments.some(record => record.data.userId === "technician" && record.data.date === weekStart)).toBe(false);
  expect(result.assignments.filter(record => record.data.userId === "leader").every(record => record.data.duty === "leader" && !record.data.targetId)).toBe(true);
  expect(board).toEqual(before);
});
test("weekly rerun prepares no schedules or assignments and never modifies configured choices", () => {
  const board = fixture(), first = prepareWeek(board, clock, identity);
  for (const week of first.schedules) for (const day of week.days) board.records.push({ kind: "schedule", id: `${week.userId}_${day.date}`, revision: 1,
    data: { ...day, userId: week.userId, ...(day.start ? clock.interval(day.date, day.start, day.end) : { startsAt: "", endsAt: "" }) } });
  board.records.push(...first.assignments);
  expect(prepareWeek(board, clock, identity)).toMatchObject({ schedules: [], assignments: [] });
});
test("neighbor overnight availability prevents an overlapping synthetic weekday", () => {
  const board = fixture();
  board.records.push({ kind: "schedule", id: "prior", data: { userId: "technician", date: "2026-10-18", startsAt: "2026-10-18T23:00:00.000Z", endsAt: "2026-10-19T09:00:00.000Z" } });
  expect(prepareWeek(board, clock, identity).schedules.find(week => week.userId === "technician").days[0].status).toBe("off");
});
test("existing working intervals and partial assignments remain authoritative", () => {
  const board = fixture();
  board.records.push({ kind: "schedule", id: `technician_${weekStart}`, revision: 2,
    data: { userId: "technician", date: weekStart, status: "work", start: "05:00", end: "14:15", ...clock.interval(weekStart, "05:00", "14:15") } });
  board.records.push({ kind: "assignment", id: "owner-duty", revision: 5,
    data: { userId: "technician", date: weekStart, duty: "floating", start: "08:00", end: "09:00", ...clock.interval(weekStart, "08:00", "09:00") } });
  const before = structuredClone(board), prepared = prepareWeek(board, clock, identity);
  expect(prepared.schedules.find(week => week.userId === "technician").days.some(day => day.date === weekStart)).toBe(false);
  expect(prepared.assignments.some(record => record.data.userId === "technician" && record.data.date === weekStart)).toBe(false);
  expect(board).toEqual(before);
});
test("retained schedule and assignment tombstones remain authoritative on preparation and repeat", () => {
  const board = fixture(), date = "2026-10-20";
  board.records.push({ kind: "schedule", id: `technician_${weekStart}`, revision: 4, deleted: true,
    data: { userId: "technician", date: weekStart, status: "work", ...clock.interval(weekStart, "05:00", "14:15") } });
  board.records.push({ kind: "schedule", id: `technician_${date}`, revision: 1, deleted: false,
    data: { userId: "technician", date, status: "work", ...clock.interval(date, "05:00", "14:15") } });
  board.records.push({ kind: "assignment", id: identity(`technician/${date}`), revision: 2, deleted: true,
    data: { userId: "technician", date, duty: "zone", ...clock.interval(date, "05:00", "14:15") } });
  for (let repeat = 0; repeat < 2; repeat++) {
    const prepared = prepareWeek(board, clock, identity);
    expect(prepared.schedules.find(week => week.userId === "technician").days.some(day => [weekStart, date].includes(day.date))).toBe(false);
    expect(prepared.assignments.some(record => record.data.userId === "technician" && [weekStart, date].includes(record.data.date))).toBe(false);
  }
  expect(board.records.map(record => record.revision)).toEqual([4, 1, 2]);
});
const scenarios = () => improvementScenarios({ locationId: "zone", assetId: "", issueId: "", ownerId: "admin", comparison: { before: { from: "2026-07-01", toExclusive: "2026-07-02" }, after: { from: "2026-07-03", toExclusive: "2026-07-04" }, scope: "selection", filters: { sector: "Zone", area: "", equipment: "", message: "" } } });
test("Improvement scenarios cover all states and retained evidence/correction with actual selected periods", () => {
  const all = scenarios();
  expect(all.map(scenario => scenario.steps.filter(step => step.type === "save").at(-1)?.data.status ?? "planned")).toEqual(["planned", "in-progress", "blocked", "implemented", "evaluated", "cancelled"]);
  const evaluated = all.find(scenario => scenario.id === prefix + "evaluated");
  expect(evaluated.steps.filter(step => step.type === "evidence").map(step => step.kind)).toEqual(["note", "result", "result"]);
  expect(evaluated.steps.at(-2).supersedesId).toBe(prefix + "result");
  expect(evaluated.steps.at(-1)).toMatchObject({ type: "comparison", selection: { before: { from: "2026-07-01" } } });
});
test("the same retained synthetic Asset identity is linked throughout each lifecycle without changing the private template", () => {
  const scenario = scenarios().find(scenario => scenario.id === prefix + "evaluated"), before = structuredClone(scenario);
  const linked = withAsset(scenario, "registered-demo-asset");
  expect(linked.data.assetId).toBe("registered-demo-asset");
  expect(linked.steps.filter(step => step.type === "save").every(step => step.data.assetId === "registered-demo-asset")).toBe(true);
  expect(scenario).toEqual(before);
});
test("a later Improvement correction is preserved instead of replaying scenario transitions", async () => {
  const scenario = scenarios()[1], changed = { id: scenario.id, revision: 2, data: { ...scenario.data, title: "Owner changed this proposal" } };
  const app = { save: jest.fn().mockResolvedValue(changed), history: jest.fn().mockResolvedValue({ revisions: [{ actorId: "admin", action: changed, reason: "Owner correction", referenceId: "" }], nextBefore: 0 }) };
  expect(await resumeImprovement(app, "admin", scenario)).toEqual({ id: scenario.id, result: "preserved" });
  expect(app.save).toHaveBeenCalledTimes(1);
});
test("an untouched Improvement prefix resumes across PostgreSQL JSON key ordering and then becomes a no-op", async () => {
  const scenario = scenarios()[1], reordered = Object.fromEntries(Object.entries(scenario.data).reverse());
  let action = { id: scenario.id, revision: 1, data: reordered };
  const revisions = [{ actorId: "admin", action, reason: scenario.reason, referenceId: "" }];
  const app = { save: jest.fn(async inputActor => action), history: jest.fn(async () => ({ revisions: revisions.slice().reverse(), nextBefore: 0 })) };
  app.save.mockImplementation(async (actor, input) => {
    if (!input.expectedRevision) return action;
    action = { ...action, data: input.data, revision: 2 };
    revisions.push({ actorId: actor, action, reason: input.reason, referenceId: "" });
    return action;
  });
  expect(await resumeImprovement(app, "admin", scenario)).toMatchObject({ result: "completed", status: "in-progress" });
  expect(await resumeImprovement(app, "admin", scenario)).toMatchObject({ result: "unchanged" });
});
test("a completed formal lifecycle is a no-op and user corrections stop replay", async () => {
  const scenario = { key: "demo", state: "closed", content: {} }, record = { id: "formal", revision: 3, state: "closed", acknowledgements: [] };
  const app = { save: jest.fn().mockResolvedValue(record), transition: jest.fn(), history: jest.fn().mockResolvedValue({ nextBefore: 0, revisions: [
    { action: "closed", actorId: "admin", note: "[DEMO] Fictional transfer completed; pending reports are retained without resolving live journal issues." },
    { action: "published", actorId: "admin", note: "[DEMO] Reviewed the selected report snapshots for training." }, { action: "created" }] }) };
  expect(await resumeFormal(app, "admin", "leader", scenario)).toMatchObject({ result: "unchanged", state: "closed" });
  expect(app.transition).not.toHaveBeenCalled();
  app.history.mockResolvedValue({ nextBefore: 0, revisions: [{ action: "corrected", actorId: "leader", note: "Owner changed content" }, { action: "created" }] });
  expect(await resumeFormal(app, "admin", "leader", scenario)).toEqual({ id: "formal", result: "preserved" });
});

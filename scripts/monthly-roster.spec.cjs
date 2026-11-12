const { prepareMonthlyRoster } = require("./railway/monthly-roster-plan.cjs");
const { pinnedWorkforcePort } = require("./railway/monthly-roster-runner.cjs");
const clock = { interval: (date, start, end) => ({ startsAt: `${date}T${start}:00Z`, endsAt: `${date}T${end}:00Z` }) };
function board() {
  return { timeZone: "UTC", people: [
    { id: "tech", profile: "technician" }, { id: "task", profile: "task-force" }, { id: "lead", profile: "team-leader" },
  ], settings: { shifts: [
    { id: "early", start: "05:00", end: "14:15", days: [0, 1, 2, 3, 4, 5, 6] },
    { id: "late", start: "13:45", end: "23:00", days: [0, 1, 2, 3, 4, 5, 6] },
    { id: "middle", start: "08:45", end: "18:00", days: [0, 1, 2, 3, 4, 5, 6] },
  ], targets: [{ id: "zone" }] }, records: [
    { kind: "worker", id: "tech", deleted: false, data: { homeTargetId: "zone" } },
  ] };
}
test("November evaluation covers every date, technician shifts and weekends, with Task Force middle weekdays", () => {
  const before = board();
  const plan = prepareMonthlyRoster(before, { month: "2026-11" }, clock);
  expect(plan).toEqual(prepareMonthlyRoster(before, { month: "2026-11" }, clock));
  expect(plan.weeks.flatMap(week => week.days)).toHaveLength(60);
  expect(plan.weeks.some(week => week.userId === "lead")).toBe(false);
  const technical = plan.weeks.filter(week => week.userId === "tech");
  expect(new Set(technical.flatMap(week => week.assignments.map(row => row.data.shiftId)))).toEqual(new Set(["early", "late", "middle"]));
  for (const weekend of [0, 6]) expect(technical.flatMap(week => week.assignments).some(row => new Date(row.data.date).getUTCDay() === weekend)).toBe(true);
  for (const row of technical.flatMap(week => week.assignments)) expect(row.data).toMatchObject({ targetId: "zone", duty: "zone", phone: "" });
  const task = plan.weeks.filter(week => week.userId === "task");
  for (const row of task.flatMap(week => week.assignments)) expect(row.data).toMatchObject({ shiftId: "middle", duty: "floating", phone: "" });
  for (const day of task.flatMap(week => week.days).filter(day => [0, 6].includes(new Date(day.date).getUTCDay()))) expect(day.status).toBe("off");
});
test("existing schedules, tombstones and duty dates stay untouched and rerunning a filled plan is a no-op", () => {
  const original = board();
  original.records.push(
    { kind: "schedule", id: "tech_2026-11-02", revision: 3, data: { userId: "tech", date: "2026-11-02", status: "vacation" } },
    { kind: "schedule", id: "tech_2026-11-03", revision: 2, deleted: true, data: { userId: "tech", date: "2026-11-03" } },
    { kind: "assignment", id: "duty", revision: 1, deleted: true, data: { userId: "tech", date: "2026-11-04" } },
  );
  const snapshot = structuredClone(original);
  const plan = prepareMonthlyRoster(original, { month: "2026-11" }, clock);
  expect(original).toEqual(snapshot);
  expect(plan.preserved).toHaveLength(3);
  expect(plan.weeks.flatMap(week => week.days)).toHaveLength(57);
  for (const week of plan.weeks) for (const day of week.days) original.records.push({
    kind: "schedule", id: `${week.userId}_${day.date}`, revision: 1, deleted: false, data: { ...day, userId: week.userId },
  });
  expect(prepareMonthlyRoster(original, { month: "2026-11" }, clock).weeks).toEqual([]);
});
test("invalid month, missing active-day configuration and retained overlapping hours reject preparation", () => {
  for (const month of ["", "2026-00", "2026-13", "2026-11-01"])
    expect(() => prepareMonthlyRoster(board(), { month }, clock)).toThrow("YYYY-MM");
  const configured = board(); configured.settings.shifts[0].days = [1, 2, 3, 4, 5];
  expect(() => prepareMonthlyRoster(configured, { month: "2026-11" }, clock)).toThrow("all seven");
  const overlap = board();
  overlap.records.push({ kind: "schedule", id: "tech_2026-10-31", data: { userId: "tech", date: "2026-10-31", startsAt: "2026-10-31T22:00:00Z", endsAt: "2026-11-02T23:00:00Z" } });
  expect(() => prepareMonthlyRoster(overlap, { month: "2026-11" }, clock)).toThrow("overlaps");
});

test("all technician rotations retain every shift and both weekend days even when the existing week is preserved", () => {
  const current = board();
  current.people = Array.from({ length: 17 }, (_, i) => ({ id: `technician-${i}`, profile: "technician" }));
  for (const person of current.people) for (let day = 9; day <= 15; day++) current.records.push({
    kind: "schedule", id: `${person.id}_2026-11-${day.toString().padStart(2, "0")}`,
    data: { userId: person.id, date: `2026-11-${day.toString().padStart(2, "0")}`, status: "off" },
  });
  const plan = prepareMonthlyRoster(current, { month: "2026-11" }, clock);
  for (const person of current.people) {
    const duties = plan.weeks.filter(week => week.userId === person.id).flatMap(week => week.assignments);
    expect(new Set(duties.map(row => row.data.shiftId))).toEqual(new Set(["early", "late", "middle"]));
    for (const weekend of [0, 6]) expect(duties.some(row => new Date(row.data.date).getUTCDay() === weekend)).toBe(true);
  }
});

test("Task Force conversion is explicit, retains identities and duties, and rejects custom intervals", () => {
  const current = board();
  const schedule = { kind: "schedule", id: "task_2026-11-09", revision: 4, deleted: false,
    data: { userId: "task", date: "2026-11-09", status: "work", start: "05:00", end: "14:15" } };
  const duty = { kind: "assignment", id: "existing-task-duty", revision: 2, deleted: false,
    data: { userId: "task", date: "2026-11-09", shiftId: "early", start: "05:00", end: "14:15", targetId: "zone", duty: "zone", phone: "zone" } };
  current.records.push(schedule, duty);
  expect(prepareMonthlyRoster(current, { month: "2026-11" }, clock).conversions).toEqual([]);
  const snapshot = structuredClone(current);
  const plan = prepareMonthlyRoster(current, { month: "2026-11", convertTaskForce: true }, clock);
  expect(current).toEqual(snapshot);
  expect(plan.conversions).toHaveLength(1);
  expect(plan.conversions[0]).toMatchObject({ before: schedule, duties: [duty],
    day: { date: "2026-11-09", start: "08:45", end: "18:00", expectedRevision: 4 },
    assignments: [{ id: duty.id, expectedRevision: 3, data: { targetId: "zone", duty: "zone", phone: "zone", shiftId: "middle", start: "08:45", end: "18:00" } }],
  });
  duty.data.start = "06:00";
  expect(() => prepareMonthlyRoster(current, { month: "2026-11", convertTaskForce: true }, clock)).toThrow("custom or removed");
});

test("pinned application permissions use Workforce flags without requiring a SQL transaction", async () => {
  const tx = { canPlan: true, canAdminister: true };
  const useCase = jest.fn(async supplied => supplied);
  expect(await pinnedWorkforcePort(tx, "actor").run("actor", "workforce.plan", useCase)).toBe(tx);
  expect(await pinnedWorkforcePort(tx, "actor").run("actor", "workforce.administer", useCase)).toBe(tx);
  await expect(pinnedWorkforcePort(tx, "actor").run("other", "workforce.plan", useCase)).rejects.toThrow("authorization");
  await expect(pinnedWorkforcePort({ canPlan: false }, "actor").run("actor", "workforce.plan", useCase)).rejects.toThrow("authorization");
  await expect(pinnedWorkforcePort({ canAdminister: false }, "actor").run("actor", "workforce.administer", useCase)).rejects.toThrow("authorization");
  expect(useCase).toHaveBeenCalledTimes(2);
});

test("the retained current week balances every working date and gives every technician early and late shifts", () => {
  const current = board();
  current.people = Array.from({ length: 17 }, (_, index) => ({ id: `technician-${index}`, profile: "technician" }));
  current.people.push({ id: "task", profile: "task-force" });
  for (const person of current.people) {
    for (let day = 9; day <= 15; day++) {
      const date = `2026-11-${String(day).padStart(2, "0")}`;
      const working = day < 15;
      const middle = person.profile === "task-force";
      let start = "";
      let end = "";
      if (working) {
        const shift = current.settings.shifts[middle ? 2 : 0];
        start = shift.start;
        end = shift.end;
      }
      current.records.push({
        kind: "schedule", id: `${person.id}_${date}`, revision: 1, deleted: false,
        data: { userId: person.id, date, status: working ? "work" : "off", start, end },
      });
      if (working) current.records.push({
        kind: "assignment", id: `${person.id}_duty_${date}`, revision: 1, deleted: false,
        data: { userId: person.id, date, shiftId: middle ? "middle" : "early", start, end, targetId: "zone", duty: "zone", phone: "" },
      });
    }
  }
  const before = structuredClone(current);
  const input = { month: "2026-11", balanceTechnicianWeek: "2026-11-09" };
  const plan = prepareMonthlyRoster(current, input, clock);
  expect(current).toEqual(before);
  expect(plan.conversions).toHaveLength(51);
  expect(plan.weeks).toEqual([]);
  expect(plan.conversions.some(change => change.userId === "task" || change.day.date === "2026-11-15")).toBe(false);
  for (const change of plan.conversions) {
    current.records.find(row => row.kind === "schedule" && row.id === change.before.id).data = {
      ...change.before.data, start: change.day.start, end: change.day.end,
    };
    const duty = current.records.find(row => row.kind === "assignment" && row.id === change.duties[0].id);
    duty.data = change.assignments[0].data;
    expect(duty.data).toMatchObject({ shiftId: "late", targetId: "zone", duty: "zone", phone: "" });
  }
  for (let day = 9; day < 15; day++) {
    const date = `2026-11-${String(day).padStart(2, "0")}`;
    const schedules = current.records.filter(row => row.kind === "schedule" && row.data.date === date && row.data.userId !== "task");
    const late = schedules.filter(row => row.data.start === "13:45").length;
    expect([8, 9]).toContain(late);
    expect(Math.abs(late - (schedules.length - late))).toBe(1);
  }
  for (const person of current.people.filter(person => person.profile === "technician"))
    expect(current.records.filter(row => row.kind === "schedule" && row.data.userId === person.id && row.data.start === "13:45")).toHaveLength(3);
  expect(prepareMonthlyRoster(current, input, clock).conversions).toEqual([]);
  expect(() => prepareMonthlyRoster(current, { month: "2026-11", balanceTechnicianWeek: "2026-11-08" }, clock)).toThrow("Monday");
  expect(() => prepareMonthlyRoster(current, { month: "2026-11", balanceTechnicianWeek: "2026-11-30" }, clock)).toThrow("complete technician week");
});

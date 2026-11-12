const { prepareHalleCoverage } = require("./railway/halle-coverage-plan.cjs");

const clock = {
  interval: (date, start, end) => ({ startsAt: `${date}T${start}:00Z`, endsAt: `${date}T${end}:00Z` }),
};

function fixture() {
  const people = Array.from({ length: 17 }, (_, index) => ({ id: `tech-${String(index).padStart(2, "0")}`, profile: "technician" }));
  people.push({ id: "task", profile: "task-force" });
  const targets = Array.from({ length: 5 }, (_, index) => ({ id: `halle-${index}`, label: `Halle ${index}`, phone: `phone-${index}` }));
  const shifts = [
    { id: "early", start: "05:00", end: "14:15", days: [0, 1, 2, 3, 4, 5, 6] },
    { id: "late", start: "13:45", end: "23:00", days: [0, 1, 2, 3, 4, 5, 6] },
    { id: "middle", start: "08:45", end: "18:00", days: [0, 1, 2, 3, 4, 5, 6] },
  ];
  const records = [];
  for (const [index, person] of people.entries()) {
    const targetIndex = [5, 9, 13, 16, 17].findIndex(limit => index < limit);
    const target = targets[targetIndex] ?? targets[0];
    records.push({ kind: "worker", id: person.id, data: { userId: person.id, homeTargetId: target.id } });
    for (let day = 1; day <= 30; day++) {
      const date = `2026-11-${String(day).padStart(2, "0")}`;
      const working = person.profile === "task-force" || (index < 12 && day !== 15);
      const shift = person.profile === "task-force" ? shifts[2] : shifts[0];
      const hours = working ? { start: shift.start, end: shift.end } : { start: "", end: "" };
      records.push({ kind: "schedule", id: `${person.id}_${date}`, revision: 1, deleted: false,
        data: { userId: person.id, date, status: working ? "work" : "off", ...hours } });
      if (working) records.push({ kind: "assignment", id: `${person.id}_duty_${date}`, revision: 1, deleted: false,
        data: { userId: person.id, date, shiftId: shift.id, targetId: target.id, duty: "zone", phone: "", ...hours } });
    }
  }
  return { timeZone: "UTC", settings: { targets, shifts }, people, records };
}

function project(board, plan) {
  for (const change of plan.conversions) {
    const schedule = board.records.find(record => record.kind === "schedule" && record.id === change.before.id);
    const changedHours = ["status", "start", "end"].some(field => schedule.data[field] !== change.day[field]);
    schedule.revision += Number(changedHours);
    schedule.data = { ...schedule.data, ...change.day, ...clock.interval(change.day.date, change.day.start, change.day.end) };
    for (const assignment of change.assignments) {
      const next = { ...assignment, revision: assignment.expectedRevision + 1,
        data: { ...assignment.data, ...clock.interval(assignment.data.date, assignment.data.start, assignment.data.end) } };
      const index = board.records.findIndex(record => record.kind === "assignment" && record.id === assignment.id);
      if (index < 0) board.records.push(next);
      else board.records[index] = next;
    }
  }
}

test.each([["early", "late"], ["early", "late", "middle"]])("every dated Halle/shift is covered for %j", (...shiftIds) => {
  const board = fixture();
  const before = structuredClone(board);
  const input = { month: "2026-11", coverageShiftIds: shiftIds };
  const plan = prepareHalleCoverage(board, input, clock);
  expect(board).toEqual(before);
  expect(plan.coverage).toHaveLength(30 * 5 * shiftIds.length);
  expect(plan.coverage.every(cell => cell.count > 0)).toBe(true);
  expect(plan.activatedOffDays).toBe(shiftIds.length === 2 ? 10 : 102);
  expect(plan.conversions.some(change => change.userId === "task")).toBe(false);
  project(board, plan);
  for (const cell of plan.coverage) {
    const actual = board.records.filter(record => record.kind === "assignment" && record.data.date === cell.date &&
      record.data.targetId === cell.targetId && record.data.shiftId === cell.shiftId && record.data.userId !== "task");
    expect(actual).toHaveLength(cell.count);
    for (const assignment of actual) {
      const schedule = board.records.find(record => record.kind === "schedule" && record.id === `${assignment.data.userId}_${cell.date}`);
      expect(schedule.data).toMatchObject({ status: "work", start: assignment.data.start, end: assignment.data.end });
    }
  }
  const datedPeople = board.records.filter(record => record.kind === "assignment" && record.data.userId !== "task")
    .map(record => record.data.userId + "/" + record.data.date);
  expect(new Set(datedPeople).size).toBe(datedPeople.length);
  const repeated = prepareHalleCoverage(board, input, clock);
  expect(repeated.conversions).toEqual([]);
  expect(repeated.activatedOffDays).toBe(0);
});

test("existing phone responsibility remains bound to its Halle and full interval", () => {
  const board = fixture();
  const phone = board.records.find(record => record.kind === "assignment" && record.id === "tech-00_duty_2026-11-01");
  phone.data.phone = phone.data.targetId;
  const plan = prepareHalleCoverage(board, { month: "2026-11", coverageShiftIds: ["early", "late"] }, clock);
  const change = plan.conversions.find(change => change.duties.some(duty => duty.id === phone.id));
  if (change) expect(change.assignments[0].data).toMatchObject({ phone: phone.data.phone, targetId: phone.data.targetId });
  project(board, plan);
  expect(board.records.find(record => record.kind === "assignment" && record.id === phone.id).data)
    .toMatchObject({ phone: phone.data.phone, targetId: phone.data.targetId, start: "05:00", end: "14:15" });
});

test("capacity and configured-day checks stop incomplete coverage while retaining absence data", () => {
  const board = fixture();
  for (const record of board.records) if (record.kind === "schedule" && record.data.date === "2026-11-01" &&
      record.data.userId.startsWith("tech-") && Number(record.data.userId.slice(5)) >= 9) record.data.status = "vacation";
  const before = structuredClone(board);
  expect(() => prepareHalleCoverage(board, { month: "2026-11", coverageShiftIds: ["early", "late"] }, clock)).toThrow("Required 10, available 9");
  expect(board).toEqual(before);
  expect(() => prepareHalleCoverage(fixture(), { month: "2026-11", coverageShiftIds: ["early", "early"] }, clock)).toThrow("distinct");
  expect(() => prepareHalleCoverage(fixture(), { month: "2026-11", coverageShiftIds: ["missing"] }, clock)).toThrow("configured");
  const weekdays = fixture();
  weekdays.settings.shifts[0].days = [1, 2, 3, 4, 5];
  expect(() => prepareHalleCoverage(weekdays, { month: "2026-11", coverageShiftIds: ["early", "late"] }, clock)).toThrow("inactive");
});

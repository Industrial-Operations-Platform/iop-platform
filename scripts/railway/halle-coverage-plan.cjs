/** Prepare the explicitly requested evaluation coverage using configured site identities. */
function prepareHalleCoverage(board, input, clock) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(input?.month ?? ""))
    throw new Error("Choose an explicit YYYY-MM coverage month.");
  if (!Array.isArray(input.coverageShiftIds) || !input.coverageShiftIds.length ||
      new Set(input.coverageShiftIds).size !== input.coverageShiftIds.length)
    throw new Error("Choose distinct configured coverage shifts.");
  const from = input.month + "-01";
  const last = new Date(from + "T00:00:00Z");
  last.setUTCMonth(last.getUTCMonth() + 1);
  last.setUTCDate(0);
  const to = last.toISOString().slice(0, 10);
  const shifts = input.coverageShiftIds.map(id => board.settings.shifts.find(shift => shift.id === id));
  const targets = board.settings.targets;
  if (!targets.length || shifts.some(shift => !shift))
    throw new Error("Coverage needs configured Halles and shifts.");
  const technicians = board.people.filter(person => person.profile === "technician")
    .sort((a, b) => a.id.localeCompare(b.id));
  const people = board.people.filter(person => ["technician", "task-force"].includes(person.profile))
    .map(person => ({ id: person.id, profile: person.profile }));
  const schedules = new Map();
  const duties = new Map();
  const homes = new Map();
  const workload = new Map(technicians.map(person => [person.id, 0]));
  for (const record of board.records) {
    const key = record.data.userId + "/" + record.data.date;
    if (record.kind === "schedule") {
      schedules.set(key, record);
      if (!record.deleted && record.data.status === "work" && record.data.date >= from && record.data.date <= to && workload.has(record.data.userId))
        workload.set(record.data.userId, workload.get(record.data.userId) + 1);
    }
    if (record.kind === "assignment") {
      if (!duties.has(key)) duties.set(key, []);
      duties.get(key).push(record);
    }
    if (record.kind === "worker" && !record.deleted) homes.set(record.id, record.data.homeTargetId);
  }
  const conversions = [];
  const coverage = [];
  let activatedOffDays = 0;
  function monday(date) {
    const value = new Date(date + "T12:00:00Z");
    value.setUTCDate(value.getUTCDate() - (value.getUTCDay() + 6) % 7);
    return value.toISOString().slice(0, 10);
  }
  for (let time = Date.parse(from), dayIndex = 0; time <= Date.parse(to); time += 86400000, dayIndex++) {
    const date = new Date(time).toISOString().slice(0, 10);
    const weekday = new Date(time).getUTCDay();
    if (shifts.some(shift => !shift.days.includes(weekday)))
      throw new Error("A requested coverage shift is inactive on a selected date.");
    const cells = targets.flatMap(target => shifts.map(shift => ({ target, shift, people: [] })));
    const candidates = [];
    for (const [index, person] of technicians.entries()) {
      const before = schedules.get(person.id + "/" + date);
      const assignments = duties.get(person.id + "/" + date) ?? [];
      if (!before || before.deleted || !["work", "off"].includes(before.data.status)) continue;
      if (assignments.length > 1 || assignments.some(duty => duty.deleted)) continue;
      const duty = assignments[0];
      if (before.data.status === "off" && duty) continue;
      if (before.data.status === "work" && !board.settings.shifts.some(shift =>
        shift.start === before.data.start && shift.end === before.data.end)) continue;
      if (duty && (duty.data.start !== before.data.start || duty.data.end !== before.data.end)) continue;
      candidates.push({ person, before, assignments, duty, index,
        targetId: duty?.data.targetId || homes.get(person.id) || "",
        shiftId: duty?.data.shiftId || board.settings.shifts.find(shift =>
          shift.start === before.data.start && shift.end === before.data.end)?.id || "" });
    }
    if (candidates.length < cells.length)
      throw new Error(`Insufficient eligible technicians for ${date}. Required ${cells.length}, available ${candidates.length}.`);
    const working = candidates.filter(candidate => candidate.before.data.status === "work");
    const assigned = new Map();
    function place(candidate, cell) {
      cell.people.push(candidate.person.id);
      assigned.set(candidate.person.id, { candidate, cell });
    }
    function currentCell(candidate) {
      return cells.find(cell => cell.target.id === candidate.targetId && cell.shift.id === candidate.shiftId);
    }
    const complete = cells.every(cell => working.some(candidate =>
      candidate.duty?.data.duty === "zone" && currentCell(candidate) === cell));
    if (complete && working.every(candidate => candidate.duty?.data.duty === "zone" && currentCell(candidate))) {
      for (const candidate of working) place(candidate, currentCell(candidate));
    } else {
      for (const candidate of working.filter(candidate => candidate.duty?.data.phone)) {
        const cell = currentCell(candidate);
        if (!cell) throw new Error("A phone holder needs a shift outside the requested coverage. Review that duty separately.");
        place(candidate, cell);
      }
      for (const cell of cells) {
        if (cell.people.length) continue;
        const existing = working.find(candidate => !assigned.has(candidate.person.id) && currentCell(candidate) === cell);
        if (existing) place(existing, cell);
      }
      for (const cell of cells) {
        if (cell.people.length) continue;
        const available = candidates.filter(candidate => !assigned.has(candidate.person.id));
        const cost = candidate => {
          const off = candidate.before.data.status === "off" ? 100 : 0;
          const target = candidate.targetId === cell.target.id ? 0 : 4;
          const shift = candidate.shiftId === cell.shift.id ? 0 : 2;
          return off + target + shift;
        };
        available.sort((a, b) => cost(a) - cost(b) || workload.get(a.person.id) - workload.get(b.person.id) ||
          (a.index + dayIndex) % technicians.length - (b.index + dayIndex) % technicians.length);
        place(available[0], cell);
      }
      for (const candidate of working.filter(candidate => !assigned.has(candidate.person.id))) {
        const local = cells.filter(cell => cell.target.id === candidate.targetId);
        const choices = local.length ? local : cells;
        const shiftTotal = id => cells.filter(cell => cell.shift.id === id).reduce((sum, cell) => sum + cell.people.length, 0);
        choices.sort((a, b) => a.people.length - b.people.length || shiftTotal(a.shift.id) - shiftTotal(b.shift.id) ||
          Number(b.shift.id === candidate.shiftId) - Number(a.shift.id === candidate.shiftId));
        place(candidate, choices[0]);
      }
    }
    for (const { candidate, cell } of assigned.values()) {
      const { before, assignments, duty, person } = candidate;
      const interval = clock.interval(date, cell.shift.start, cell.shift.end, board.timeZone);
      if (board.records.some(record => record.kind === "schedule" && !record.deleted && record.data.userId === person.id &&
          record.data.date !== date && record.data.startsAt && record.data.startsAt < interval.endsAt && record.data.endsAt > interval.startsAt))
        throw new Error("A coverage shift conflicts with retained neighboring availability.");
      const data = { userId: person.id, date, shiftId: cell.shift.id, targetId: cell.target.id, duty: "zone",
        phone: duty?.data.phone ?? "", start: cell.shift.start, end: cell.shift.end, startsAt: "", endsAt: "" };
      const changed = before.data.status !== "work" || before.data.start !== data.start || before.data.end !== data.end ||
        !duty || ["shiftId", "targetId", "duty", "phone", "start", "end"].some(field => duty.data[field] !== data[field]);
      if (!changed) continue;
      if (before.data.status === "off") {
        activatedOffDays++;
        workload.set(person.id, workload.get(person.id) + 1);
      }
      const identity = require("node:crypto").createHash("sha256").update(person.id).digest("hex").slice(0, 24);
      conversions.push({ userId: person.id, weekStart: monday(date), before, duties: assignments,
        day: { date, status: "work", start: data.start, end: data.end, expectedRevision: before.revision },
        assignments: [{ kind: "assignment", id: duty?.id ?? `iop234-coverage-${date}-${identity}`,
          deleted: false, expectedRevision: duty ? duty.revision + 1 : 0, data }] });
    }
    for (const cell of cells) coverage.push({ date, targetId: cell.target.id, shiftId: cell.shift.id, count: cell.people.length });
  }
  return { month: input.month, from, to, people, weeks: [], conversions, preserved: [], activatedOffDays, coverage };
}
module.exports = { prepareHalleCoverage };

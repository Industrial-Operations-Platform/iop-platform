/** Explicit evaluation-data preparation; existing site schedules remain authoritative. */
function prepareMonthlyRoster(board, input, clock) {
  if (!input || !/^\d{4}-(0[1-9]|1[0-2])$/.test(input.month))
    throw new Error("Choose an explicit YYYY-MM evaluation month.");
  const from = input.month + "-01";
  const to = new Date(Date.UTC(Number(input.month.slice(0, 4)), Number(input.month.slice(5, 7)), 0)).toISOString().slice(0, 10);
  const monday = value => {
    const day = new Date(value + "T12:00:00Z");
    day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
    return day.toISOString().slice(0, 10);
  };
  const firstMonday = monday(from);
  const shifts = ["early", "late", "middle"].map(id => board.settings.shifts.find(shift => shift.id === id));
  if (shifts.some(shift => !shift || ![0, 1, 2, 3, 4, 5, 6].every(day => shift.days.includes(day))))
    throw new Error("Configure early, late and middle shifts for all seven weekdays before preparing this evaluation.");
  const people = board.people.filter(person => ["technician", "task-force"].includes(person.profile))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (!people.length || people.length > 100) throw new Error("The evaluation requires 1–100 active technicians or Task Force users.");
  const plans = new Map();
  const preserved = [];
  for (const [index, person] of people.entries()) {
    for (let time = Date.parse(from); time <= Date.parse(to); time += 86400000) {
      const date = new Date(time).toISOString().slice(0, 10);
      const existing = board.records.find(record => record.kind === "schedule" && record.id === `${person.id}_${date}`);
      const duties = board.records.filter(record => record.kind === "assignment" && record.data.userId === person.id && record.data.date === date);
      if (existing || duties.length) { preserved.push({ userId: person.id, date }); continue; }
      const weekday = (new Date(date).getUTCDay() + 6) % 7;
      const week = Math.floor((time - Date.parse(firstMonday)) / (7 * 86400000));
      const offStart = (index + week) % 7;
      const working = person.profile === "task-force" ? weekday < 5 : ![offStart, (offStart + 1) % 7].includes(weekday);
      const rotation = Math.floor((time - Date.parse(from)) / (2 * 86400000));
      const shift = working ? shifts[person.profile === "task-force" ? 2 : (index + rotation) % 3] : undefined;
      const day = { date, status: working ? "work" : "off", start: shift?.start ?? "", end: shift?.end ?? "", expectedRevision: 0 };
      if (shift) {
        const interval = clock.interval(date, shift.start, shift.end, board.timeZone);
        if (board.records.some(record => !record.deleted && record.kind === "schedule" && record.data.userId === person.id &&
          record.data.startsAt && record.data.endsAt > interval.startsAt && record.data.startsAt < interval.endsAt))
          throw new Error("A proposed day overlaps retained availability; inspect the evaluation preview.");
      }
      const key = person.id + "/" + monday(date);
      if (!plans.has(key)) plans.set(key, { userId: person.id, weekStart: monday(date), days: [], assignments: [] });
      const plan = plans.get(key);
      plan.days.push(day);
      if (shift) {
        const worker = board.records.find(record => record.kind === "worker" && record.id === person.id && !record.deleted);
        const targetId = board.settings.targets.some(target => target.id === worker?.data.homeTargetId) ? worker.data.homeTargetId : "";
        const identity = require("node:crypto").createHash("sha256").update(person.id).digest("hex").slice(0, 24);
        plan.assignments.push({ kind: "assignment", id: `iop234-${date}-${identity}`, expectedRevision: 0, deleted: false,
          data: { userId: person.id, date, shiftId: shift.id, targetId, duty: targetId ? "zone" : "floating", phone: "",
            start: shift.start, end: shift.end, startsAt: "", endsAt: "" } });
      }
    }
  }
  return { month: input.month, from, to, people: people.map(person => ({ id: person.id, profile: person.profile })),
    weeks: [...plans.values()], preserved };
}
module.exports = { prepareMonthlyRoster };

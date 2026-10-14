import { FormalHandover, type FormalTransaction } from "../src/modules/shift-handover/application/formal-records";
import type { FormalRecord, FormalRevision, RecordContent, ShiftReference } from "../src/modules/shift-handover/domain/formal-record";
import { HandoverError, type Entry, type Location } from "../src/modules/shift-handover/domain/handover";
import { projectShifts } from "../src/modules/workforce/domain/shift-reference";
import type { RecordEntry, Assignment } from "../src/modules/workforce/domain/workforce";
const locations: Location[] = [{ id: "dept", label: "Department", parentId: "", role: "department", sectorKey: "" },
  { id: "area", label: "Area", parentId: "dept", role: "area", sectorKey: "" }];
const current: ShiftReference = { id: "late", date: "2026-10-14", shiftTypeId: "late", label: "Late", targetId: "dept", targetLabel: "Department",
  startsAt: "2026-10-14T13:45:00.000Z", endsAt: "2026-10-14T23:00:00.000Z", assignments: [{ id: "assignment", revision: 1 }] };
const prior: ShiftReference = { ...current, id: "early", shiftTypeId: "early", label: "Early", startsAt: "2026-10-14T05:00:00.000Z", endsAt: "2026-10-14T14:15:00.000Z" };
function entry(id = "report", patch: Partial<Entry> = {}): Entry {
  return { id, authorId: "tech", authorName: "Technician", createdAt: "2026-10-14T10:00:00.000Z", updatedAt: "2026-10-14T10:00:00.000Z", revision: 1,
    content: { date: "2026-10-14", categoryId: "problems", summary: "Guard issue", details: "Inspect the guard", departmentId: "dept", areaId: "area",
      equipmentCode: "0001", equipmentNamespace: "site-equipment", condition: "inspection-needed", externalReference: "", challenge: "", cause: "",
      measure: "", dueDate: "", feedbackDueDate: "", discuss: true },
    departmentLabel: "Department", areaLabel: "Area", categoryLabel: "Problems", equipmentReferenceId: "source-reference", responsibleId: "tech", responsibleName: "Technician",
    issueState: "open", highlighted: false, highlightedAt: "", ...patch };
}
const content = (): RecordContent => ({ shiftId: "late", shiftDate: "2026-10-14", departmentId: "dept", areaId: "area", title: "Late transfer", summary: "Review the guard", entryIds: ["report"] });
function fixture() {
  let records = new Map<string, FormalRecord>(), revisions: FormalRevision[] = [], requests = new Map<string, { fingerprint: string; record: FormalRecord }>();
  const journal = new Map([ ["report", entry()], ["unselected", entry("unselected")] ]), source = [prior, current];
  let actor = "", at = "2026-10-14T23:00:00.000Z", sequence = 0;
  const tx: FormalTransaction = {
    actorName: async () => actor === "lead" ? "Leader" : "Task Force", shifts: async (from, to) => source.filter((shift) => shift.date >= from && shift.date <= to),
    get: async (id) => structuredClone(records.get(id) ?? null), byShift: async (shiftId, departmentId, areaId) => structuredClone([...records.values()].find((r) => r.shift.id === shiftId && r.content.departmentId === departmentId && r.content.areaId === areaId) ?? null),
    prior: async (key) => requests.get(actor + key) ?? null,
    save: async (record, event, request) => { records.set(record.id, structuredClone(record)); revisions.push(structuredClone(event));
      if (request) requests.set(actor + request.key, { fingerprint: request.fingerprint, record: structuredClone(record) }); },
    records: async () => ({ records: [...records.values()], total: records.size, nextCursor: "" }),
    history: async (record, before) => ({ record, revisions: revisions.filter((r) => r.record.id === record.id && (!before || r.record.revision < before)).slice().reverse(), nextBefore: 0 }),
    entries: async (ids) => ids.flatMap((id) => journal.has(id) ? [structuredClone(journal.get(id)!)] : []),
    candidates: async () => ({ entries: [...journal.values()], total: journal.size }),
    pending: async () => { const entries = [...journal.values()].filter((e) => ["open", "in-progress"].includes(e.issueState)); return { entries: structuredClone(entries), total: entries.length }; },
  };
  const app = new FormalHandover({ run: async (who, _write, work) => {
    if (!["lead", "task", "admin"].includes(who)) throw new HandoverError("handover_denied");
    actor = who; const backup = structuredClone(records), events = structuredClone(revisions), keys = structuredClone(requests);
    try { return await work(tx); } catch (e) { records = backup; revisions = events; requests = keys; throw e; }
  } }, locations, "UTC", () => `record-${++sequence}`, () => at);
  const save = (value = content(), id = "", expectedRevision = 0, key = "key") => app.save("lead", { key: id ? "" : key, id, expectedRevision, content: value, note: id ? "Reviewed corrections" : "" });
  return { app, tx, journal, source, save, revisions: () => revisions, at: (instant: string) => { at = instant; } };
}
test("draft idempotency preserves one record and rejects altered request reuse or a second record for the same shift/location", async () => {
  const f = fixture(), first = await f.save();
  expect(first.state).toBe("draft"); expect(await f.save()).toEqual(first); expect(f.revisions()).toHaveLength(1);
  await expect(f.save({ ...content(), title: "Changed" })).rejects.toMatchObject({ code: "handover_conflict" });
  await expect(f.save(content(), "", 0, "different-key")).rejects.toMatchObject({ code: "handover_conflict" });
});
test("closure retains selected and pending snapshots while receiving acknowledgement is separate and issues remain open", async () => {
  const f = fixture(), draft = await f.save(), open = await f.app.transition("lead", { id: draft.id, expectedRevision: 1, action: "publish", note: "Ready for transfer" });
  const closed = await f.app.transition("lead", { id: draft.id, expectedRevision: 2, action: "close", note: "Guard inspection carries forward" });
  expect(open.state).toBe("open"); expect(closed).toMatchObject({ state: "closed", entries: [{ id: "report", revision: 1 }], pending: [{ issueState: "open" }, { issueState: "open" }] });
  expect(f.journal.get("report")!.issueState).toBe("open");
  const live = f.journal.get("report")!; live.issueState = "resolved"; live.revision++; live.content.summary = "Guard repaired";
  const ack = await f.app.transition("task", { id: draft.id, expectedRevision: 3, action: "acknowledge", note: "Incoming team reviewed the transfer" });
  expect(ack.entries[0].content.summary).toBe("Guard issue"); expect(ack.pending[0].issueState).toBe("open"); expect(ack.acknowledgements[0].actorId).toBe("task");
  expect((await f.app.history("admin", draft.id)).revisions.map((r) => r.action)).toEqual(["acknowledged", "closed", "published", "created"]);
  await expect(f.save(content(), draft.id, ack.revision)).rejects.toMatchObject({ code: "handover_conflict" });
  await expect(f.app.transition("task", { id: draft.id, expectedRevision: ack.revision, action: "acknowledge", note: "Again" })).rejects.toMatchObject({ code: "handover_conflict" });
});
test("closed records require a different receiving actor and stale revisions fail without extra history", async () => {
  const f = fixture(), draft = await f.save();
  await expect(f.app.transition("lead", { id: draft.id, expectedRevision: 1, action: "close", note: "Premature" })).rejects.toThrow("handover_conflict");
  const open = await f.app.transition("lead", { id: draft.id, expectedRevision: 1, action: "publish", note: "Published" });
  await expect(f.app.transition("lead", { id: draft.id, expectedRevision: 1, action: "close", note: "Stale" })).rejects.toThrow("handover_conflict");
  const closed = await f.app.transition("lead", { id: draft.id, expectedRevision: open.revision, action: "close", note: "Closed" });
  await expect(f.app.transition("lead", { id: draft.id, expectedRevision: closed.revision, action: "acknowledge", note: "Own receipt" })).rejects.toThrow("handover_conflict");
  expect(f.revisions()).toHaveLength(3);
});
test("selected report changes require renewed review before publication or closure", async () => {
  const f = fixture(), draft = await f.save(); f.journal.get("report")!.revision++;
  await expect(f.app.transition("lead", { id: draft.id, expectedRevision: 1, action: "publish", note: "Ready" })).rejects.toThrow("handover_conflict");
  const reviewed = await f.save(content(), draft.id, 1);
  const open = await f.app.transition("lead", { id: draft.id, expectedRevision: reviewed.revision, action: "publish", note: "Reviewed" });
  f.journal.get("report")!.revision++;
  await expect(f.app.transition("lead", { id: draft.id, expectedRevision: open.revision, action: "close", note: "Close" })).rejects.toThrow("handover_conflict");
  expect(f.revisions()).toHaveLength(3);
});
test("previous selection uses UTC starts, handles same-day overlap/overnight, and distinguishes missing formal evidence", async () => {
  const f = fixture(), late = await f.save();
  const previous = await f.app.previous("task", { id: late.id });
  expect(previous).toMatchObject({ shift: { id: "early" }, record: null, overlaps: true, pendingTotal: 2 });
  f.source.splice(0, 1, { ...prior, id: "night", date: "2026-10-13", startsAt: "2026-10-13T22:00:00.000Z", endsAt: "2026-10-14T06:00:00.000Z" });
  expect((await f.app.previous("task", { id: late.id })).shift?.id).toBe("night");
  f.source.splice(0, 1); expect((await f.app.previous("task", { id: late.id })).shift).toBeNull();
});
test("unplanned shifts, foreign report locations and unauthorized profile access fail explicitly", async () => {
  const f = fixture();
  await expect(f.save({ ...content(), shiftId: "fabricated" })).rejects.toThrow("handover_shift_unavailable");
  f.journal.get("report")!.content.departmentId = "foreign";
  await expect(f.save()).rejects.toThrow("handover_conflict");
  await expect(f.app.context("tech")).rejects.toThrow("handover_denied");
  await expect(f.app.query("tech", { from: "2026-10-14", to: "2026-10-14", departmentId: "dept", areaId: "", cursor: "" })).rejects.toThrow("handover_denied");
  expect(f.revisions()).toHaveLength(0);
});
test("Workforce shift projection groups actual exact intervals and omits floating/deleted assignments", () => {
  const assignment = (id: string, endsAt = "2026-10-14T14:15:00.000Z", duty: Assignment["duty"] = "zone") => ({ id, kind: "assignment", revision: 1, deleted: false, personName: id,
    data: { userId: id, date: current.date, shiftId: "early", targetId: "dept", targetLabel: "Department", shiftLabel: "Early", duty, startsAt: prior.startsAt, endsAt } }) as RecordEntry<"assignment">;
  const shifts = projectShifts([assignment("a"), assignment("b"), assignment("partial", "2026-10-14T12:00:00.000Z"), assignment("floating", undefined, "floating"), { ...assignment("deleted"), deleted: true }]);
  expect(shifts).toHaveLength(2); expect(shifts.map((shift) => shift.assignments.length).sort()).toEqual([1, 2]);
  expect(shifts.find((shift) => shift.assignments.length === 1)?.endsAt).toBe("2026-10-14T12:00:00.000Z");
});

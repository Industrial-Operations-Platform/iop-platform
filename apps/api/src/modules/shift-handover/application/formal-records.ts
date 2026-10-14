import { HandoverError, exact, text, withinLocation, type Location, type Entry } from "../domain/handover";
import { identifier, revision, recordContent, selection, validateLocation, entryEvidence,
  type FormalRecord, type FormalRevision, type ShiftReference, type SaveRecord, type TransitionRecord,
  type RecordSelection, type RecordPage, type RecordHistory, type PreviousShift } from "../domain/formal-record";

export interface FormalTransaction {
  actorName(): Promise<string>;
  shifts(from: string, to: string): Promise<ShiftReference[]>;
  get(id: string): Promise<FormalRecord | null>;
  byShift(shiftId: string, departmentId: string, areaId: string): Promise<FormalRecord | null>;
  prior(key: string): Promise<{ fingerprint: string; record: FormalRecord } | null>;
  save(record: FormalRecord, event: FormalRevision, request?: { key: string; fingerprint: string }): Promise<void>;
  records(input: RecordSelection): Promise<RecordPage>;
  history(record: FormalRecord, before: number): Promise<RecordHistory>;
  entries(ids: string[]): Promise<Entry[]>;
  candidates(departmentId: string, areaId: string, through: string): Promise<{ entries: Entry[]; total: number }>;
  pending(departmentId: string, areaId: string, through: string): Promise<{ entries: Entry[]; total: number }>;
}
export interface FormalStore {
  run<T>(actor: string, write: boolean, work: (tx: FormalTransaction) => Promise<T>): Promise<T>;
}
/** Formal transfer is independent of issue resolution and date-based journal views. */
export class FormalHandover {
  constructor(private readonly store: FormalStore, private readonly locations: Location[],
    private readonly timeZone: string, private readonly ids: () => string, private readonly now: () => string) {}
  context(actor: string) {
    return this.store.run(actor, false, async () => ({ actorId: actor, canManageRecords: true,
      locations: this.locations, timeZone: this.timeZone }));
  }
  shifts(actor: string, input: RecordSelection) {
    const query = selection(input, this.locations);
    if (query.cursor) throw new HandoverError("invalid_handover");
    return this.store.run(actor, false, async (tx) => ({ shifts: (await tx.shifts(query.from, query.to))
      .filter((shift) => this.inLocation(shift, query.departmentId, query.areaId)), coverage: "planned-assignments" as const }));
  }
  query(actor: string, input: RecordSelection) {
    const query = selection(input, this.locations);
    return this.store.run(actor, false, (tx) => tx.records(query));
  }
  history(actor: string, id: string, before = 0) {
    identifier(id, true);
    if (!Number.isSafeInteger(before) || before < 0) throw new HandoverError("invalid_handover");
    return this.store.run(actor, false, async (tx) => tx.history(await this.existing(tx, id), before));
  }
  candidates(actor: string, input: { departmentId: string; areaId: string; through: string }) {
    exact(input, ["departmentId", "areaId", "through"]);
    const query = selection({ from: input.through, to: input.through, departmentId: input.departmentId,
      areaId: input.areaId, cursor: "" }, this.locations);
    validateLocation(query.departmentId, query.areaId, this.locations);
    return this.store.run(actor, false, async (tx) => {
      const page = await tx.candidates(query.departmentId, query.areaId, query.to);
      return { entries: page.entries.map(entryEvidence), total: page.total };
    });
  }
  async save(actor: string, input: SaveRecord): Promise<FormalRecord> {
    exact(input, ["key", "id", "expectedRevision", "content", "note"]);
    const id = identifier(input.id), key = identifier(input.key, !id),
      content = recordContent(input.content, this.locations), note = text(input.note, 2000, !!id);
    if ((id && key) || (!id && input.expectedRevision !== 0)) throw new HandoverError("invalid_handover");
    const fingerprint = JSON.stringify({ content, note });
    return this.store.run(actor, true, async (tx) => {
      if (!id) {
        const prior = await tx.prior(key);
        if (prior) {
          if (prior.fingerprint !== fingerprint) throw new HandoverError("handover_conflict");
          return prior.record;
        }
      }
      const current = id ? await this.existing(tx, id) : null;
      revision(input.expectedRevision, current?.revision ?? 0);
      if (current?.state === "closed") throw new HandoverError("handover_conflict");
      if (current && (current.content.shiftId !== content.shiftId || current.content.shiftDate !== content.shiftDate || current.content.departmentId !== content.departmentId ||
        current.content.areaId !== content.areaId)) throw new HandoverError("handover_conflict");
      const shift = await this.shift(tx, content.shiftId, content.departmentId, content.areaId, content.shiftDate);
      const selected = await this.selectedEntries(tx, content.entryIds, content.departmentId, content.areaId);
      const actorName = await tx.actorName(), at = this.now();
      const record: FormalRecord = current ? { ...current, content, shift, entries: selected.map(entryEvidence), updatedAt: at, revision: current.revision + 1 } : {
        id: this.ids(), revision: 1, state: "draft", authorId: actor, authorName: actorName, createdAt: at, updatedAt: at,
        content, shift, departmentLabel: this.locations.find((l) => l.id === content.departmentId)!.label,
        areaLabel: this.locations.find((l) => l.id === content.areaId)?.label ?? "", closedBy: "", closedByName: "",
        closedAt: "", outcome: "", entries: selected.map(entryEvidence), pending: [], acknowledgements: [],
      };
      if (!current && await tx.byShift(shift.id, content.departmentId, content.areaId)) throw new HandoverError("handover_conflict");
      await tx.save(record, { record, actorId: actor, actorName, at, action: current ? "corrected" : "created", note },
        current ? undefined : { key, fingerprint });
      return record;
    });
  }
  transition(actor: string, input: TransitionRecord): Promise<FormalRecord> {
    exact(input, ["id", "expectedRevision", "action", "note"]);
    identifier(input.id, true);
    const note = text(input.note, 4000, true);
    if (!["publish", "close", "acknowledge"].includes(input.action)) throw new HandoverError("invalid_handover");
    return this.store.run(actor, true, async (tx) => {
      const current = await this.existing(tx, input.id);
      revision(input.expectedRevision, current.revision);
      const record = structuredClone(current), at = this.now(), actorName = await tx.actorName();
      if (input.action === "publish") {
        if (record.state !== "draft") throw new HandoverError("handover_conflict");
        record.shift = await this.shift(tx, record.shift.id, record.content.departmentId, record.content.areaId, record.shift.date);
        await this.requireReviewedEntries(tx, record);
        record.state = "open";
      } else if (input.action === "close") {
        if (record.state !== "open" || at < record.shift.startsAt) throw new HandoverError("handover_conflict");
        record.entries = (await this.requireReviewedEntries(tx, record)).map(entryEvidence);
        const pending = await tx.pending(record.content.departmentId, record.content.areaId, record.shift.date);
        if (pending.total > 100) throw new HandoverError("handover_capacity");
        record.pending = pending.entries.map(entryEvidence);
        record.state = "closed";
        record.closedBy = actor; record.closedByName = actorName; record.closedAt = at; record.outcome = note;
      } else {
        if (record.state !== "closed" || record.closedBy === actor || record.acknowledgements.some((a) => a.actorId === actor))
          throw new HandoverError("handover_conflict");
        record.acknowledgements.push({ actorId: actor, actorName, at, note });
        if (record.acknowledgements.length > 100) throw new HandoverError("handover_capacity");
      }
      record.updatedAt = at; record.revision++;
      const action = input.action === "publish" ? "published" : input.action === "close" ? "closed" : "acknowledged";
      await tx.save(record, { record, actorId: actor, actorName, at, action, note });
      return record;
    });
  }
  previous(actor: string, input: { id: string }): Promise<PreviousShift> {
    exact(input, ["id"]); identifier(input.id, true);
    return this.store.run(actor, false, async (tx) => {
      const current = await this.existing(tx, input.id), through = current.shift.date;
      const from = new Date(Date.parse(through) - 92 * 86400000).toISOString().slice(0, 10);
      const shifts = (await tx.shifts(from, through)).filter((shift) =>
        shift.startsAt < current.shift.startsAt && this.inLocation(shift, current.content.departmentId, current.content.areaId));
      const shift = shifts.sort((a, b) => b.startsAt.localeCompare(a.startsAt) || b.id.localeCompare(a.id))[0] ?? null;
      const pending = await tx.pending(current.content.departmentId, current.content.areaId, through);
      return { shift, record: shift ? await tx.byShift(shift.id, current.content.departmentId, current.content.areaId) : null,
        overlaps: !!shift && shift.endsAt > current.shift.startsAt, pending: pending.entries.map(entryEvidence), pendingTotal: pending.total };
    });
  }
  private inLocation(shift: ShiftReference, departmentId: string, areaId: string) {
    return (!departmentId || withinLocation(shift.targetId, departmentId, this.locations)) &&
      (!areaId || shift.targetId === departmentId || withinLocation(shift.targetId, areaId, this.locations));
  }
  private async shift(tx: FormalTransaction, id: string, departmentId: string, areaId: string, day?: string) {
    if (!day) throw new HandoverError("invalid_handover");
    const from = day, to = day;
    const result = (await tx.shifts(from, to)).find((shift) => shift.id === id && this.inLocation(shift, departmentId, areaId));
    if (!result) throw new HandoverError("handover_shift_unavailable");
    return result;
  }
  private async selectedEntries(tx: FormalTransaction, ids: string[], departmentId: string, areaId: string) {
    const entries = await tx.entries(ids);
    if (entries.length !== ids.length || entries.some((e) => e.deleted || e.content.departmentId !== departmentId ||
      (areaId && e.content.areaId !== areaId))) throw new HandoverError("handover_conflict");
    return ids.map((id) => entries.find((e) => e.id === id)!);
  }
  private async requireReviewedEntries(tx: FormalTransaction, record: FormalRecord) {
    const entries = await this.selectedEntries(tx, record.content.entryIds, record.content.departmentId, record.content.areaId);
    if (entries.some((entry) => record.entries.find((evidence) => evidence.id === entry.id)?.revision !== entry.revision))
      throw new HandoverError("handover_conflict");
    return entries;
  }
  private async existing(tx: FormalTransaction, id: string) {
    const record = await tx.get(id);
    if (!record) throw new HandoverError("handover_missing");
    return record;
  }
}

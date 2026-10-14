import type { FormalContext, ShiftReference, RecordSelection, RecordPage, SaveRecord,
  TransitionRecord, FormalRecord, RecordHistory, PreviousShift, CandidatePage } from "../domain/formal-models";
export interface FormalGateway {
  context(): Promise<FormalContext>;
  shifts(input: RecordSelection): Promise<{ shifts: ShiftReference[]; coverage: "planned-assignments" }>;
  query(input: RecordSelection): Promise<RecordPage>;
  save(input: SaveRecord): Promise<FormalRecord>;
  transition(input: TransitionRecord): Promise<FormalRecord>;
  history(id: string, before: number): Promise<RecordHistory>;
  previous(id: string): Promise<PreviousShift>;
  candidates(departmentId: string, areaId: string, through: string): Promise<CandidatePage>;
}
export class FormalHandoverApplication {
  private attempts = new Map<string, string>();
  constructor(private readonly gateway: FormalGateway, private readonly newKey: () => string) {}
  context() { return this.gateway.context(); }
  shifts(input: RecordSelection) { return this.gateway.shifts(input); }
  query(input: RecordSelection) { return this.gateway.query(input); }
  history(id: string, before = 0) { return this.gateway.history(id, before); }
  previous(id: string) { return this.gateway.previous(id); }
  candidates(departmentId: string, areaId: string, through: string) { return this.gateway.candidates(departmentId, areaId, through); }
  transition(record: FormalRecord, action: TransitionRecord["action"], note: string) {
    return this.gateway.transition({ id: record.id, expectedRevision: record.revision, action, note });
  }
  async save(input: Omit<SaveRecord, "key">) {
    const fingerprint = JSON.stringify(input);
    const key = input.id ? "" : this.attempts.get(fingerprint) ?? this.newKey();
    if (!input.id) this.attempts.set(fingerprint, key);
    const record = await this.gateway.save({ ...input, key });
    this.attempts.delete(fingerprint);
    return record;
  }
}

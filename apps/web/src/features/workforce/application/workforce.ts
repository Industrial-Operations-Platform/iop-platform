import type { WeeklyScheduleInput } from "../domain/weekly-schedule";
import type {
  Board,
  ImportInput,
  Kind,
  Preview,
  RecordEntry,
  Revision,
  SaveInput,
} from "../domain/models";
export interface Gateway {
  board(from: string, to: string): Promise<Board>;
  saveWeek(
    input: WeeklyScheduleInput,
  ): Promise<{ changed: number; unchanged: number }>;
  save(input: SaveInput): Promise<RecordEntry>;
  preview(input: ImportInput): Promise<Preview[]>;
  commit(
    input: ImportInput,
    revisions: { id: string; expectedRevision: number }[],
  ): Promise<{ changed: number; unchanged: number }>;
  history(kind: Kind, id: string): Promise<Revision[]>;
}
export class WorkforceApplication {
  constructor(
    private readonly gateway: Gateway,
    private readonly ids: () => string,
  ) {}
  board(from: string, to: string) {
    return this.gateway.board(from, to);
  }
  saveWeek(input: WeeklyScheduleInput) {
    return this.gateway.saveWeek(input);
  }
  save(input: Omit<SaveInput, "id"> & { id?: string }) {
    return this.gateway.save({ ...input, id: input.id || this.ids() });
  }
  remove(record: RecordEntry) {
    return this.gateway.save({
      kind: record.kind,
      id: record.id,
      data: record.data,
      expectedRevision: record.revision,
      deleted: true,
    });
  }
  preview(input: ImportInput) {
    return this.gateway.preview(input);
  }
  commit(input: ImportInput, preview: Preview[]) {
    return this.gateway.commit(
      input,
      preview.map(({ id, expectedRevision }) => ({ id, expectedRevision })),
    );
  }
  history(record: RecordEntry) {
    return this.gateway.history(record.kind, record.id);
  }
}

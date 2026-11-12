import type { WeeklyScheduleInput } from "../domain/weekly-schedule";
import type { ScheduleProposal, ScheduleProposalPreview, ScheduleProposalPreviewRequest } from "../domain/schedule-proposal";
import type {
  Board,
  PersonalSummary,
  ImportInput,
  Kind,
  Preview,
  RecordEntry,
  Revision,
  SaveInput,
} from "../domain/models";
export interface Gateway {
  previewProposal?(input: ScheduleProposalPreviewRequest): Promise<ScheduleProposalPreview>;
  saveProposal?(input: ScheduleProposal): Promise<{ changed: number; unchanged: number }>;
  summary?(): Promise<PersonalSummary>;
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
  summary() {
    if (!this.gateway.summary) return Promise.reject(new Error("Personal summary is unavailable."));
    return this.gateway.summary();
  }
  board(from: string, to: string) {
    return this.gateway.board(from, to);
  }
  saveWeek(input: WeeklyScheduleInput) {
    return this.gateway.saveWeek(input);
  }
  previewProposal(input: ScheduleProposalPreviewRequest) {
    if (!this.gateway.previewProposal) return Promise.reject(new Error("Schedule preview is unavailable."));
    return this.gateway.previewProposal(input);
  }
  saveProposal(input: ScheduleProposal) {
    if (!this.gateway.saveProposal) return Promise.reject(new Error("Schedule preview is unavailable."));
    return this.gateway.saveProposal(input);
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

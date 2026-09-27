import {
  ImportBusyError,
  ImportOutcomeUnknownError,
  type BatchStatus,
  type Inspection,
} from "../domain/imports";

export interface ImportGateway<Publication> {
  validateFilename(filename: string): void;
  receive(actor: string, filename: string, bytes: Uint8Array): Promise<string>;
  prepare(
    filename: string,
    bytes: Uint8Array,
  ): { inspection: Inspection; publication: Publication | null };
  reject(actor: string, id: string, inspection: Inspection): Promise<void>;
  publish(
    actor: string,
    id: string,
    inspection: Inspection,
    publication: Publication,
    deadline: number,
  ): Promise<void>;
  review(actor: string, id: string): Promise<BatchStatus>;
  reconcile(actor: string, id: string): Promise<void>;
  now(): number;
}
/** Coordinates durable phases. Retrying an uncertain acknowledgement never replays bytes. */
export class ImportWorkflow<Publication> {
  private busy = false;
  constructor(private readonly gateway: ImportGateway<Publication>) {}
  get isBusy(): boolean {
    return this.busy;
  }
  async submit(
    actor: string,
    filename: string,
    bytes: Uint8Array,
  ): Promise<BatchStatus> {
    if (this.busy) throw new ImportBusyError();
    this.busy = true;
    const deadline = this.gateway.now() + 30000;
    let id: string | undefined;
    try {
      this.gateway.validateFilename(filename);
      id = await this.gateway.receive(actor, filename, bytes);
      const prepared = this.gateway.prepare(filename, bytes);
      if (prepared.publication === null)
        await this.gateway.reject(actor, id, prepared.inspection);
      else
        await this.gateway.publish(
          actor,
          id,
          prepared.inspection,
          prepared.publication,
          deadline,
        );
      return await this.gateway.review(actor, id);
    } catch (error) {
      if (error instanceof ImportOutcomeUnknownError) {
        try {
          await this.gateway.reconcile(actor, error.importId);
          return await this.gateway.review(actor, error.importId);
        } catch {
          throw new ImportOutcomeUnknownError(error.importId);
        }
      }
      if (id) await this.gateway.reconcile(actor, id).catch(() => undefined);
      throw error;
    } finally {
      this.busy = false;
    }
  }
  async recover(actor: string, id: string): Promise<BatchStatus> {
    if (this.busy) throw new ImportBusyError();
    await this.gateway.reconcile(actor, id);
    return this.gateway.review(actor, id);
  }
}

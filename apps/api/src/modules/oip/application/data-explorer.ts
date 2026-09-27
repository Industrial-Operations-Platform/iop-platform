import { messageCursor, sourceRowsRequest } from "../domain/source-rows";
import { AnalyticsError } from "../domain/values";
import type { DataExplorerRepository } from "./ports";
export class DataExplorer {
  constructor(private readonly repository: DataExplorerRepository) {}
  messages(actor: string, input: unknown) {
    return this.repository.messages(actor, messageCursor(input));
  }
  async sourceRows(actor: string, input: unknown) {
    const selection = sourceRowsRequest(input);
    const result = await this.repository.sourceRows(actor, selection);
    if (selection.revision && selection.revision !== result.revision)
      throw new AnalyticsError("analytics_revision_changed");
    return result;
  }
}

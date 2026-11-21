import { messageCursor, sourceRowsRequest } from "../domain/source-rows";
import { AnalyticsError } from "../domain/values";
import type { DataExplorerRepository } from "./ports";
import { equipmentSearch } from "../domain/equipment-search";
export class DataExplorer {
  constructor(private readonly repository: DataExplorerRepository) {}
  equipment(actor: string, input: unknown) {
    return this.repository.equipment(actor, equipmentSearch(input));
  }
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

import type {
  CompiledProfile,
  ProfileResult,
} from "../domain/reporting-profile";
import type { ReportRequest, ReportResult } from "../domain/report";

/** Implementations must check current actor permissions in the configured scope. */
export interface ReportingProfileRepository {
  get(actor: string): Promise<ProfileResult>;
  save(
    actor: string,
    expectedVersion: string,
    profile: CompiledProfile,
  ): Promise<ProfileResult>;
}
/** A result and its revision must come from one authorized snapshot. */
export interface ReportRepository {
  query(actor: string, selection: ReportRequest): Promise<ReportResult>;
}

export interface DataExplorerRepository {
  sourceRows(
    actor: string,
    selection: import("../domain/source-rows").SourceRowsRequest,
  ): Promise<import("../domain/source-rows").SourceRowsResult>;
  messages(
    actor: string,
    after: string | null,
  ): Promise<import("../domain/source-rows").MessageCatalog>;
}

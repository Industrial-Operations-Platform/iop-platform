import { AnalyticsError } from "../domain/values";
import {
  compileProfile,
  type ProfileResult,
} from "../domain/reporting-profile";
import { reportRequest, type ReportResult } from "../domain/report";
import type { ReportingProfileRepository, ReportRepository } from "./ports";

export class ReportingProfiles {
  constructor(private readonly repository: ReportingProfileRepository) {}
  get(actor: string): Promise<ProfileResult> {
    return this.repository.get(actor);
  }
  save(actor: string, input: unknown): Promise<ProfileResult> {
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new AnalyticsError("invalid_selection");
    const value = input as Record<string, unknown>;
    if (
      Object.keys(value).sort().join(",") !== "profile,version" ||
      typeof value.version !== "string" ||
      !value.version ||
      value.version.length > 100
    )
      throw new AnalyticsError("invalid_selection");
    return this.repository.save(
      actor,
      value.version,
      compileProfile(value.profile),
    );
  }
}
export class OipReports {
  constructor(private readonly repository: ReportRepository) {}
  async query(actor: string, input: unknown): Promise<ReportResult> {
    const selection = reportRequest(input);
    const result = await this.repository.query(actor, selection);
    if (selection.revision && selection.revision !== result.revision)
      throw new AnalyticsError("analytics_revision_changed");
    return result;
  }
}

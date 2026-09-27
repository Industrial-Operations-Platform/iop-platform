import { lockHitliste, projectHitliste } from "./hitliste-projection";
import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import {
  runSiteOperation,
  type SiteTransaction,
} from "../../../../persistence/site-operation";
import type { ImportSource } from "../../../integrations";
import { digest, scopeTuple } from "../../analytics";
import { AnalyticsError } from "../../domain/values";
import {
  compileProfile,
  type CompiledProfile,
  type ProfileResult,
  type ReportingProfile,
} from "../../domain/reporting-profile";
import type { ReportingProfileRepository } from "../../application/ports";

export class PgReportingProfiles implements ReportingProfileRepository {
  readonly initial: CompiledProfile;
  readonly initialVersion: string;
  constructor(
    private readonly pool: Pick<Pool, "connect">,
    readonly source: ImportSource,
    profile: ReportingProfile,
  ) {
    this.initial = compileProfile(profile);
    this.initialVersion = "default." + digest(this.initial);
  }
  run<T>(
    actor: string,
    write: boolean,
    fn: (tx: SiteTransaction) => Promise<T>,
  ): Promise<T> {
    return runSiteOperation(
      this.pool,
      {
        userId: actor,
        organizationId: this.source.organizationId,
        siteId: this.source.siteId,
        permissions: [write ? "imports.submit" : "analytics.read"],
      },
      fn,
    );
  }
  async project(tx: SiteTransaction, importId?: string): Promise<void> {
    await lockHitliste(tx, this.source);
    const result = await tx.query(
      "SELECT version::text,config FROM oip.reporting_profiles WHERE organization_id=$1 AND site_id=$2 AND source_id=$3",
      scopeTuple(this.source),
    );
    const row = result.rows[0];
    await projectHitliste(
      tx,
      this.source,
      row ? (row.config as CompiledProfile) : this.initial,
      row ? String(row.version) : this.initialVersion,
      importId,
    );
  }
  prepare(actor: string): Promise<void> {
    return this.run(actor, true, (tx) => this.project(tx));
  }
  private clean(config: CompiledProfile): ReportingProfile {
    const { compiled, ...profile } = config;
    return {
      ...profile,
      executiveKpis: profile.executiveKpis ?? this.initial.executiveKpis ?? [],
    };
  }
  get(actor: string): Promise<ProfileResult> {
    return this.run(actor, false, async (tx) => {
      const result = await tx.query(
        "SELECT version::text,config FROM oip.reporting_profiles WHERE organization_id=$1 AND site_id=$2 AND source_id=$3",
        scopeTuple(this.source),
      );
      const row = result.rows[0];
      return {
        version: row ? String(row.version) : this.initialVersion,
        profile: this.clean(
          row ? (row.config as CompiledProfile) : this.initial,
        ),
      };
    });
  }
  save(
    actor: string,
    expected: string,
    profile: CompiledProfile,
  ): Promise<ProfileResult> {
    return this.run(actor, true, async (tx) => {
      await lockHitliste(tx, this.source);
      const version = randomUUID();
      const result =
        expected === this.initialVersion
          ? await tx.query(
              "INSERT INTO oip.reporting_profiles(organization_id,site_id,source_id,version,config) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING version",
              [...scopeTuple(this.source), version, JSON.stringify(profile)],
            )
          : await tx.query(
              "UPDATE oip.reporting_profiles SET version=$4,config=$5 WHERE organization_id=$1 AND site_id=$2 AND source_id=$3 AND version::text=$6 RETURNING version",
              [
                ...scopeTuple(this.source),
                version,
                JSON.stringify(profile),
                expected,
              ],
            );
      if (result.rows.length !== 1)
        throw new AnalyticsError("analytics_revision_changed");
      await projectHitliste(tx, this.source, profile, version);
      return { version, profile: this.clean(profile) };
    });
  }
}

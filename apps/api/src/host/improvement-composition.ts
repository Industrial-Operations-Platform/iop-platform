import { siteMaterialAudit } from "../modules/audit/adapters/postgres/site-material";
import type { Pool } from "pg";
import type { ImportSource } from "../modules/integrations";
import { evaluateSiteAccess } from "../modules/users-rbac";
import { sitePersonNames, sitePersonProfile } from "../modules/users-rbac/adapters/postgres/site-people";
import { improvementPeople } from "../modules/users-rbac/adapters/postgres/improvement-people";
import { Improvements } from "../modules/improvement-tracking/application/improvement";
import { PgImprovements } from "../modules/improvement-tracking/adapters/postgres/store";
import type { Location } from "../modules/improvement-tracking/domain/improvement";
import { improvementAsset, improvementAssets } from "../modules/assets/adapters/postgres/improvement-reference";
import { improvementIssue, improvementIssues } from "../modules/shift-handover/adapters/postgres/improvement-reference";
import { improvementComparison } from "../modules/oip/adapters/postgres/improvement-comparison";
import { AnalysisCalendar } from "../modules/oip/domain/analysis-calendar";
/** Composition is host-owned; domain/application ports contain no SQL handles. */
export function composeImprovements(pool: Pool, source: ImportSource, locations: Location[], initialProfileVersion: string, calendar = new AnalysisCalendar(), now = () => new Date().toISOString()) {
  const {
    organizationId,
    siteId
  } = source;
  return new Improvements(new PgImprovements(pool, source, {
    audit: siteMaterialAudit,
    allowed: (tx, actor, permission) => evaluateSiteAccess(tx, {
      ...source,
      userId: actor,
      permissions: [permission]
    }).then(r => r.allowed),
    profile: (tx, actor) => sitePersonProfile(tx, organizationId, siteId, actor),
    people: tx => improvementPeople(tx, organizationId, siteId),
    names: (tx, ids) => sitePersonNames(tx, organizationId, siteId, ids),
    asset: (tx, id) => improvementAsset(tx, source, id),
    assets: tx => improvementAssets(tx, source),
    issue: (tx, id) => improvementIssue(tx, source, id),
    issues: (tx, search, cursor) => improvementIssues(tx, source, search, cursor),
    measure: (tx, selection, asset) => improvementComparison(tx, source, selection, asset, initialProfileVersion, calendar)
  }), locations, now);
}

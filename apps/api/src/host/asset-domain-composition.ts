import { siteMaterialAudit } from "../modules/audit/adapters/postgres/site-material";
import type { Pool } from "pg";
import type { ImportSource } from "../modules/integrations";
import { AssetDomain } from "../modules/assets/application/enrichment";
import { PgAssetDomain, assetPublicationMappingDecisions } from "../modules/assets/adapters/postgres/enrichment";
import { AnalysisCalendar } from "../modules/oip/domain/analysis-calendar";
import { projectCanonicalAssetLinks, publishCanonicalAssetLinks, canonicalSourceCandidates, canonicalAssetPareto } from "../modules/oip/adapters/postgres/canonical-assets";
import type { SiteTransaction } from "../persistence/site-operation";
export function composeAssetDomain(pool: Pool, source: ImportSource, calendar = new AnalysisCalendar(), now = () => new Date().toISOString()) {
  const domain = new AssetDomain(new PgAssetDomain(pool, source, {
    audit: siteMaterialAudit,
    materialize: (tx, decisions) => projectCanonicalAssetLinks(tx, source, decisions),
    candidates: (tx, search, cursor) => canonicalSourceCandidates(tx, source, search, cursor),
    pareto: (tx, selection) => canonicalAssetPareto(tx, source, selection, calendar)
  }), source.sourceId, now);
  return {
    domain,
    published: async (tx: SiteTransaction, importId: string) => {
      await tx.query("SELECT pg_advisory_xact_lock_shared(hashtext('iop-access'),hashtext($1))", [source.organizationId]);
      await tx.query("SELECT pg_advisory_xact_lock(hashtext('iop-assets'),hashtext($1))", [source.organizationId + ":" + source.siteId]);
      await publishCanonicalAssetLinks(tx, source, await assetPublicationMappingDecisions(tx, source, source.sourceId), importId);
    }
  };
}

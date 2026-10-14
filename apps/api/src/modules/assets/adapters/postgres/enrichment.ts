import type { SiteMaterialAudit } from "../../../audit";
import type { Pool } from "pg";
import { createHash } from "node:crypto";
import { runSiteOperation, SiteAccessDeniedError, type SiteTransaction } from "../../../../persistence/site-operation";
import { evaluateSiteAccess } from "../../../users-rbac";
import { sitePersonNames, sitePersonProfile } from "../../../users-rbac/adapters/postgres/site-people";
import { assetReference } from "./store";
import { assert, sourceKey, decision, type Enrichment, type EnrichmentRevision, type TypeCatalog, type Mapping, type MappingRevision, type MappingData, type MappingDecision, type ParetoSelection, type CanonicalPareto, type SourceCandidate, type RegistryReference, type EnrichmentData, type DomainQuery, type ReferencePage, type MappingPage } from "../../domain/enrichment";
import type { DomainStore, DomainTransaction } from "../../application/enrichment";
export interface DomainScope {
  organizationId: string;
  siteId: string;
}
export interface SourceDomainPorts {
  audit?: SiteMaterialAudit;
  materialize(tx: SiteTransaction, decisions: MappingDecision[]): Promise<void>;
  candidates(tx: SiteTransaction, search: string, cursor: string): Promise<{
    candidates: SourceCandidate[];
    nextCursor: string;
  }>;
  pareto(tx: SiteTransaction, selection: ParetoSelection): Promise<CanonicalPareto>;
}
export class PgAssetDomain implements DomainStore {
  constructor(private readonly pool: Pool, private readonly scope: DomainScope, private readonly source: SourceDomainPorts) {}
  run<T>(actor: string, permission: "assets.read" | "assets.manage", work: (tx: DomainTransaction) => Promise<T>) {
    return runSiteOperation(this.pool, {
      ...this.scope,
      userId: actor,
      permissions: [permission]
    }, async tx => {
      await tx.query("SELECT pg_advisory_xact_lock_shared(hashtext('iop-access'),hashtext($1))", [this.scope.organizationId]);
      assert(["administrator", "team-leader", "task-force"].includes(await sitePersonProfile(tx, this.scope.organizationId, this.scope.siteId, actor)), "asset_domain_denied");
      if (!(await evaluateSiteAccess(tx, {
        ...this.scope,
        userId: actor,
        permissions: [permission]
      })).allowed) throw new SiteAccessDeniedError();
      await tx.query("SELECT pg_advisory_xact_lock(hashtext('iop-assets'),hashtext($1))", [this.scope.organizationId + ":" + this.scope.siteId]);
      await tx.query("SET LOCAL statement_timeout='30s'");
      return work(new PgDomainTransaction(tx, this.scope, (await evaluateSiteAccess(tx, {
        ...this.scope,
        userId: actor,
        permissions: ["assets.manage"]
      })).allowed, this.source));
    });
  }
}
class PgDomainTransaction implements DomainTransaction {
  constructor(private readonly tx: SiteTransaction, private readonly scope: DomainScope, readonly canManage: boolean, private readonly source: SourceDomainPorts) {}
  private get selectors() {
    return [this.scope.organizationId, this.scope.siteId];
  }
  async assetNames(ids: string[]) {
    if (!ids.length) return new Map<string, string>();
    const r = await this.tx.query("SELECT id,code FROM assets.records WHERE organization_id=$1 AND site_id=$2 AND id=ANY($3::text[])", [...this.selectors, ids]);
    return new Map(r.rows.map(row => [String(row.id), String(row.code)]));
  }
  async name(actor: string) {
    const names = await sitePersonNames(this.tx, this.scope.organizationId, this.scope.siteId, [actor]);
    const name = names.get(actor);
    assert(name, "asset_domain_denied");
    return name;
  }
  async references(query: DomainQuery): Promise<ReferencePage> {
    const anchor = query.cursor ? decode(query.cursor) : ["", ""];
    const r = await this.tx.query(`WITH matching AS MATERIALIZED (SELECT a.id,a.code,a.status,a.snapshot->'content'->>'name' AS name,e.revision AS model_revision,e.type_id,e.parent_id,e.survey_status FROM assets.records a LEFT JOIN assets.enrichments e ON (e.organization_id,e.site_id,e.asset_id)=(a.organization_id,a.site_id,a.id) WHERE a.organization_id=$1 AND a.site_id=$2 AND a.status<>'retired' AND ($3='' OR strpos(lower(concat_ws(' ',a.code,a.snapshot->'content'->>'name')),lower($3))>0)), page AS (SELECT * FROM matching WHERE $4='' OR (code COLLATE "C",id COLLATE "C")>($4 COLLATE "C",$5 COLLATE "C") ORDER BY code COLLATE "C",id COLLATE "C" LIMIT $6) SELECT (SELECT count(*)::integer FROM matching) AS total,coalesce((SELECT jsonb_agg(page ORDER BY code COLLATE "C",id COLLATE "C") FROM page),'[]'::jsonb) AS records`, [...this.selectors, query.search ?? "", anchor[0], anchor[1], (query.limit ?? 30) + 1]);
    const rows = r.rows[0].records as {
      id: string;
      code: string;
      status: RegistryReference["status"];
      name: string;
      model_revision: number | null;
      type_id: string;
      parent_id: string | null;
      survey_status: EnrichmentData["survey"]["status"];
    }[];
    const shown = rows.slice(0, query.limit ?? 30),
      last = shown.at(-1);
    return {
      assets: shown.map(row => ({
        id: row.id,
        code: row.code,
        name: row.name,
        status: row.status
      })),
      enrichments: shown.filter(row => row.model_revision !== null).map(row => ({
        assetId: row.id,
        revision: row.model_revision!,
        typeId: row.type_id,
        parentId: row.parent_id ?? "",
        surveyStatus: row.survey_status
      })),
      total: Number(r.rows[0].total),
      nextCursor: rows.length > (query.limit ?? 30) && last ? encode([last.code, last.id]) : ""
    };
  }
  async mappingQuery(query: DomainQuery): Promise<MappingPage> {
    const anchor = query.cursor ? decode(query.cursor) : ["", ""];
    const r = await this.tx.query(`WITH matching AS MATERIALIZED (SELECT id,source_key,snapshot FROM assets.source_mappings WHERE organization_id=$1 AND site_id=$2 AND ($3='' OR strpos(lower(concat_ws(' ',snapshot->'data'->'source'->>'area',snapshot->'data'->'source'->>'code')),lower($3))>0)), page AS (SELECT * FROM matching WHERE $4='' OR (source_key,id)>($4,$5) ORDER BY source_key,id LIMIT $6) SELECT (SELECT count(*)::integer FROM matching) AS total,coalesce((SELECT jsonb_agg(page ORDER BY source_key,id) FROM page),'[]'::jsonb) AS records`, [...this.selectors, query.search ?? "", anchor[0], anchor[1], (query.limit ?? 30) + 1]);
    const rows = r.rows[0].records as {
        id: string;
        source_key: string;
        snapshot: Mapping;
      }[],
      shown = rows.slice(0, query.limit ?? 30),
      last = shown.at(-1);
    return {
      mappings: shown.map(r => r.snapshot),
      total: Number(r.rows[0].total),
      nextCursor: rows.length > (query.limit ?? 30) && last ? encode([last.source_key, last.id]) : ""
    };
  }
  asset(id: string) {
    return assetReference(this.tx, this.scope, id);
  }
  async catalog(): Promise<TypeCatalog | null> {
    const r = await this.tx.query("SELECT snapshot FROM assets.model_catalog WHERE organization_id=$1 AND site_id=$2", this.selectors);
    return r.rows[0]?.snapshot as TypeCatalog ?? null;
  }
  async saveCatalog(c: TypeCatalog, actor: string, name: string, at: string) {
    const before = this.source.audit ? await this.catalog() : null;
    await this.tx.query("INSERT INTO assets.model_catalog(organization_id,site_id,revision,snapshot) VALUES($1,$2,$3,$4) ON CONFLICT(organization_id,site_id) DO UPDATE SET revision=EXCLUDED.revision,snapshot=EXCLUDED.snapshot", [...this.selectors, c.revision, JSON.stringify(c)]);
    await this.tx.query("INSERT INTO assets.model_catalog_revisions(organization_id,site_id,revision,actor_id,at,snapshot) VALUES($1,$2,$3,$4,$5,$6)", [...this.selectors, c.revision, actor, at, JSON.stringify({
      catalog: c,
      actorId: actor,
      actorName: name,
      at
    })]);
    await this.source.audit?.(this.tx,{subjectType:"asset-model-catalog",id:"catalog",action:c.revision===1?"created":"changed",revision:c.revision,beforeRevision:before?.revision??0,state:"configured",beforeState:before?"configured":"",occurredAt:at});
  }
  async enrichments() {
    const r = await this.tx.query("SELECT snapshot FROM assets.enrichments WHERE organization_id=$1 AND site_id=$2 ORDER BY asset_id LIMIT 10001", this.selectors);
    assert(r.rows.length <= 10000, "asset_domain_capacity");
    return r.rows.map(r => r.snapshot as Enrichment);
  }
  async get(assetId: string): Promise<Enrichment | null> {
    const r = await this.tx.query("SELECT snapshot FROM assets.enrichments WHERE organization_id=$1 AND site_id=$2 AND asset_id=$3", [...this.selectors, assetId]);
    return r.rows[0]?.snapshot as Enrichment ?? null;
  }
  async save(e: Enrichment, r: EnrichmentRevision) {
    const before = this.source.audit ? await this.get(e.assetId) : null;
    await this.tx.query("INSERT INTO assets.enrichments(organization_id,site_id,asset_id,revision,type_id,parent_id,survey_status,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(organization_id,site_id,asset_id) DO UPDATE SET revision=EXCLUDED.revision,type_id=EXCLUDED.type_id,parent_id=EXCLUDED.parent_id,survey_status=EXCLUDED.survey_status,snapshot=EXCLUDED.snapshot", [...this.selectors, e.assetId, e.revision, e.data.typeId, e.data.parentId || null, e.data.survey.status, JSON.stringify(e)]);
    await this.tx.query("UPDATE assets.controller_links SET is_active=false WHERE organization_id=$1 AND site_id=$2 AND asset_id=$3", [...this.selectors, e.assetId]);
    for (const relation of e.data.controllers) await this.tx.query("INSERT INTO assets.controller_links(organization_id,site_id,asset_id,target_id,kind,channel,is_active) VALUES($1,$2,$3,$4,$5,$6,true) ON CONFLICT(organization_id,site_id,asset_id,target_id,channel) DO UPDATE SET is_active=true", [...this.selectors, e.assetId, relation.targetId, relation.kind, relation.channel]);
    await this.tx.query("INSERT INTO assets.enrichment_revisions(organization_id,site_id,asset_id,revision,actor_id,at,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7)", [...this.selectors, e.assetId, e.revision, r.actorId, r.at, JSON.stringify(r)]);
    await this.source.audit?.(this.tx,{subjectType:"asset-enrichment",id:e.assetId,action:e.revision===1?"created":"changed",revision:e.revision,beforeRevision:before?.revision??0,state:e.data.survey.status,beforeState:before?.data.survey.status??"",occurredAt:r.at});
  }
  async history(assetId: string, before: number) {
    const r = await this.tx.query("SELECT snapshot FROM assets.enrichment_revisions WHERE organization_id=$1 AND site_id=$2 AND asset_id=$3 AND ($4::integer=0 OR revision<$4) ORDER BY revision DESC LIMIT 31", [...this.selectors, assetId, before]);
    const revisions = r.rows.slice(0, 30).map(r => r.snapshot as EnrichmentRevision);
    return {
      revisions,
      nextBefore: r.rows.length > 30 ? revisions.at(-1)!.enrichment.revision : 0
    };
  }
  async mapping(id: string): Promise<Mapping | null> {
    const r = await this.tx.query("SELECT snapshot FROM assets.source_mappings WHERE organization_id=$1 AND site_id=$2 AND id=$3", [...this.selectors, id]);
    return r.rows[0]?.snapshot as Mapping ?? null;
  }
  mappings() {
    return assetMappingCatalog(this.tx, this.scope);
  }
  async mappingBySource(source: MappingData["source"]): Promise<Mapping | null> {
    const r = await this.tx.query("SELECT snapshot FROM assets.source_mappings WHERE organization_id=$1 AND site_id=$2 AND source_key=$3", [...this.selectors, digest(sourceKey(source))]);
    const mapping = r.rows[0]?.snapshot as Mapping ?? null;
    assert(!mapping || sourceKey(mapping.data.source) === sourceKey(source), "asset_domain_conflict");
    return mapping;
  }
  async saveMapping(m: Mapping, r: MappingRevision) {
    const before = this.source.audit ? await this.mapping(m.id) : null;
    await this.tx.query("INSERT INTO assets.source_mappings(organization_id,site_id,id,revision,source_key,snapshot) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(organization_id,site_id,id) DO UPDATE SET revision=EXCLUDED.revision,snapshot=EXCLUDED.snapshot", [...this.selectors, m.id, m.revision, digest(sourceKey(m.data.source)), JSON.stringify(m)]);
    await this.tx.query("INSERT INTO assets.source_mapping_revisions(organization_id,site_id,mapping_id,revision,actor_id,at,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7)", [...this.selectors, m.id, m.revision, r.actorId, r.at, JSON.stringify(r)]);
    await this.source.audit?.(this.tx,{subjectType:"asset-source-mapping",id:m.id,action:m.revision===1?"created":"changed",revision:m.revision,beforeRevision:before?.revision??0,state:m.data.status,beforeState:before?.data.status??"",occurredAt:r.at});
  }
  async mappingHistory(id: string, before: number) {
    const r = await this.tx.query("SELECT snapshot FROM assets.source_mapping_revisions WHERE organization_id=$1 AND site_id=$2 AND mapping_id=$3 AND ($4::integer=0 OR revision<$4) ORDER BY revision DESC LIMIT 31", [...this.selectors, id, before]);
    const revisions = r.rows.slice(0, 30).map(r => r.snapshot as MappingRevision);
    return {
      revisions,
      nextBefore: r.rows.length > 30 ? revisions.at(-1)!.mapping.revision : 0
    };
  }
  materialize(decisions: MappingDecision[]) {
    return this.source.materialize(this.tx, decisions);
  }
  candidates(search: string, cursor: string) {
    return this.source.candidates(this.tx, search, cursor);
  }
  pareto(selection: ParetoSelection) {
    return this.source.pareto(this.tx, selection);
  }
}
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
/** Explicit source decisions only; importing a code never creates canonical identity. */
export async function assetMappingCatalog(tx: SiteTransaction, scope: DomainScope) {
  if (tx.context.organizationId !== scope.organizationId || tx.context.siteId !== scope.siteId || !(await evaluateSiteAccess(tx, {
    ...scope,
    userId: tx.context.userId,
    permissions: ["assets.read"]
  })).allowed) throw new SiteAccessDeniedError();
  const r = await tx.query("SELECT snapshot FROM assets.source_mappings WHERE organization_id=$1 AND site_id=$2 ORDER BY id LIMIT 10001", [scope.organizationId, scope.siteId]);
  assert(r.rows.length <= 10000, "asset_domain_capacity");
  return r.rows.map(r => r.snapshot as Mapping);
}
export async function assetMappingDecisions(tx: SiteTransaction, scope: DomainScope, sourceId: string) {
  if (tx.context.organizationId !== scope.organizationId || tx.context.siteId !== scope.siteId || !(await evaluateSiteAccess(tx, {
    ...scope,
    userId: tx.context.userId,
    permissions: ["assets.read"]
  })).allowed) throw new SiteAccessDeniedError();
  return readMappingDecisions(tx, scope, sourceId);
}
/** Receiving-owned import preparation; exposes no registry directory or public response. */
export async function assetPublicationMappingDecisions(tx: SiteTransaction, scope: DomainScope, sourceId: string) {
  if (tx.context.organizationId !== scope.organizationId || tx.context.siteId !== scope.siteId || !(await evaluateSiteAccess(tx, {
    ...scope,
    userId: tx.context.userId,
    permissions: ["imports.submit"]
  })).allowed) throw new SiteAccessDeniedError();
  return readMappingDecisions(tx, scope, sourceId);
}
async function readMappingDecisions(tx: SiteTransaction, scope: DomainScope, sourceId: string) {
  const r = await tx.query(`SELECT m.id,m.revision,m.snapshot->'data'->'source' AS source,m.snapshot->'data'->>'status' AS status,m.snapshot->'data'->'candidateIds' AS candidates,a.status AS asset_status FROM assets.source_mappings m LEFT JOIN assets.records a ON a.organization_id=m.organization_id AND a.site_id=m.site_id AND a.id=m.snapshot->'data'->'candidateIds'->>0 WHERE m.organization_id=$1 AND m.site_id=$2 AND m.snapshot->'data'->'source'->>'sourceId'=$3 ORDER BY m.id LIMIT 30001`, [scope.organizationId, scope.siteId, sourceId]);
  assert(r.rows.length <= 30000, "asset_domain_capacity");
  return r.rows.map(row => {
    const candidates = row.candidates as string[];
    const state: MappingDecision["state"] = row.status === "approved" && row.asset_status === "validated" ? "mapped" : row.status === "rejected" ? "rejected" : candidates.length > 1 ? "ambiguous" : "pending";
    return {
      id: String(row.id),
      revision: Number(row.revision),
      source: row.source as MappingData["source"],
      state,
      assetId: state === "mapped" ? candidates[0] : "",
      candidateIds: candidates
    };
  });
}
const encode = (v: string[]) => Buffer.from(JSON.stringify(v)).toString("base64url");
function decode(token: string): string[] {
  try {
    const bytes = Buffer.from(token, "base64url");
    assert(bytes.toString("base64url") === token);
    const v = JSON.parse(bytes.toString("utf8"));
    assert(Array.isArray(v) && v.length === 2 && v.every(x => typeof x === "string" && x.length <= 160));
    return v;
  } catch {
    assert(false);
  }
}

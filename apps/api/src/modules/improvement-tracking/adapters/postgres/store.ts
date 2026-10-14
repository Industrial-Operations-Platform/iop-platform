import type { SiteMaterialAudit } from "../../../audit";
import type { Pool } from "pg";
import { runSiteOperation, SiteAccessDeniedError, type SiteTransaction } from "../../../../persistence/site-operation";
import type { Store, Transaction } from "../../application/improvement";
import { assert, statuses, type Action, type AssetReference, type IssueReference, type Person, type Evidence, type Revision, type Selection, type SavedComparison, type Measurement, type ComparisonSelection } from "../../domain/improvement";
export interface Scope {
  organizationId: string;
  siteId: string;
}
export interface Directory {
  audit?: SiteMaterialAudit;
  allowed(tx: SiteTransaction, actor: string, permission: string): Promise<boolean>;
  profile(tx: SiteTransaction, actor: string): Promise<string>;
  people(tx: SiteTransaction): Promise<Person[]>;
  names(tx: SiteTransaction, ids: string[]): Promise<Map<string, string>>;
  assets(tx: SiteTransaction): Promise<AssetReference[]>;
  asset(tx: SiteTransaction, id: string): Promise<AssetReference | null>;
  issues(tx: SiteTransaction, search: string, cursor: string): Promise<{
    issues: IssueReference[];
    nextCursor: string;
  }>;
  issue(tx: SiteTransaction, id: string): Promise<IssueReference | null>;
  measure(tx: SiteTransaction, selection: ComparisonSelection, asset: AssetReference | null): Promise<Measurement>;
}
const eligibleProfiles = ["administrator", "team-leader", "task-force"];
export class PgImprovements implements Store {
  constructor(private readonly pool: Pool, private readonly scope: Scope, private readonly directory: Directory) {}
  run<T>(actor: string, permission: Parameters<Store["run"]>[1], work: (tx: Transaction) => Promise<T>): Promise<T> {
    return runSiteOperation(this.pool, {
      ...this.scope,
      userId: actor,
      permissions: [permission]
    }, async tx => {
      await tx.query("SELECT pg_advisory_xact_lock_shared(hashtext('iop-access'),hashtext($1))", [this.scope.organizationId]);
      if (!eligibleProfiles.includes(await this.directory.profile(tx, actor)) || !(await this.directory.allowed(tx, actor, permission))) throw new SiteAccessDeniedError();
      await tx.query("SELECT pg_advisory_xact_lock(hashtext('iop-improvement'),hashtext($1))", [this.scope.organizationId + ":" + this.scope.siteId]);
      await tx.query("SET LOCAL statement_timeout='30s'");
      return work(new PgImprovementTransaction(tx, this.scope, this.directory, await this.directory.allowed(tx, actor, "improvement.contribute"), await this.directory.allowed(tx, actor, "improvement.coordinate")));
    });
  }
}
class PgImprovementTransaction implements Transaction {
  constructor(private readonly tx: SiteTransaction, private readonly scope: Scope, private readonly directory: Directory, readonly canContribute: boolean, readonly canCoordinate: boolean) {}
  private get selectors() {
    return [this.scope.organizationId, this.scope.siteId];
  }
  people() {
    return this.directory.people(this.tx);
  }
  names(ids: string[]) {
    return this.directory.names(this.tx, ids);
  }
  assets() {
    return this.directory.assets(this.tx);
  }
  asset(id: string) {
    return this.directory.asset(this.tx, id);
  }
  issues(search: string, cursor: string) {
    return this.directory.issues(this.tx, search, cursor);
  }
  issue(id: string) {
    return this.directory.issue(this.tx, id);
  }
  measure(selection: ComparisonSelection, asset: AssetReference | null) {
    return this.directory.measure(this.tx, selection, asset);
  }
  private async snapshot<T>(table: "actions" | "evidence" | "comparisons", id: string): Promise<T | null> {
    const result = await this.tx.query(`SELECT snapshot FROM improvement.${table} WHERE organization_id=$1 AND site_id=$2 AND id=$3`, [...this.selectors, id]);
    return result.rows[0]?.snapshot as T | undefined ?? null;
  }
  get(id: string) {
    return this.snapshot<Action>("actions", id);
  }
  evidence(id: string) {
    return this.snapshot<Evidence>("evidence", id);
  }
  comparison(id: string) {
    return this.snapshot<SavedComparison>("comparisons", id);
  }
  async creation(id: string): Promise<Revision | null> {
    const r = await this.tx.query("SELECT snapshot FROM improvement.revisions WHERE organization_id=$1 AND site_id=$2 AND action_id=$3 AND revision=1", [...this.selectors, id]);
    return r.rows[0]?.snapshot as Revision | undefined ?? null;
  }
  async save(action: Action, revision: Revision) {
    const before = this.directory.audit ? await this.get(action.id) : null;
    await this.tx.query(`INSERT INTO improvement.actions(organization_id,site_id,id,revision,status,location_id,asset_id,owner_id,author_id,updated_at,snapshot)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT(organization_id,site_id,id) DO UPDATE SET revision=EXCLUDED.revision,status=EXCLUDED.status,location_id=EXCLUDED.location_id,asset_id=EXCLUDED.asset_id,owner_id=EXCLUDED.owner_id,updated_at=EXCLUDED.updated_at,snapshot=EXCLUDED.snapshot`, [...this.selectors, action.id, action.revision, action.data.status, action.data.locationId, action.data.assetId || null, action.data.ownerId || null, action.authorId, action.updatedAt, JSON.stringify(action)]);
    await this.tx.query("INSERT INTO improvement.revisions(organization_id,site_id,action_id,revision,actor_id,at,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7)", [...this.selectors, action.id, action.revision, revision.actorId, revision.at, JSON.stringify(revision)]);
    await this.directory.audit?.(this.tx,{subjectType:"improvement-action",id:action.id,action:action.revision===1?"created":revision.change==="evidence-added"?"evidence-added":revision.change==="comparison-saved"?"comparison-saved":"changed",revision:action.revision,beforeRevision:before?.revision??0,state:action.data.status,beforeState:before?.data.status??"",occurredAt:revision.at});
  }
  async query(input: Selection, locations: string[]) {
    const values: unknown[] = [...this.selectors];
    const clauses = ["organization_id=$1", "site_id=$2"];
    const bind = (v: unknown) => {
      values.push(v);
      return "$" + values.length;
    };
    if (input.ownerId) clauses.push(`owner_id=${bind(input.ownerId)}`);
    if (input.assetId) clauses.push(`asset_id=${bind(input.assetId)}`);
    if (locations.length) clauses.push(`location_id=ANY(${bind(locations)}::text[])`);
    if (input.search) clauses.push(`strpos(lower(concat_ws(' ',snapshot->'data'->>'title',snapshot->'data'->>'hypothesis',snapshot->'data'->'target'->>'objective',snapshot->>'assetName',snapshot->>'issueTitle',snapshot->>'ownerName')),lower(${bind(input.search)}))>0`);
    const counts = await this.tx.query(`SELECT status,count(*)::integer AS count FROM improvement.actions WHERE ${clauses.join(" AND ")} GROUP BY status`, values);
    const statusCounts = Object.fromEntries(statuses.map(s => [s, 0])) as Record<typeof statuses[number], number>;
    for (const r of counts.rows) statusCounts[r.status as typeof statuses[number]] = Number(r.count);
    const total = input.status ? statusCounts[input.status] : Object.values(statusCounts).reduce((a, b) => a + b, 0);
    if (input.status) clauses.push(`status=${bind(input.status)}`);
    if (input.cursor) {
      const c = cursor(input.cursor);
      clauses.push(`(updated_at,id)<(${bind(c.at)}::timestamptz,${bind(c.id)}::text)`);
    }
    const limit = input.limit ?? 20;
    const result = await this.tx.query(`SELECT snapshot FROM improvement.actions WHERE ${clauses.join(" AND ")} ORDER BY updated_at DESC,id DESC LIMIT ${bind(limit + 1)}`, values);
    const actions = result.rows.slice(0, limit).map(r => r.snapshot as Action);
    const last = actions.at(-1);
    return {
      actions,
      total,
      statusCounts,
      nextCursor: result.rows.length > limit && last ? last.updatedAt + "|" + last.id : ""
    };
  }
  async history(id: string, before: number, limit: number) {
    const r = await this.tx.query("SELECT snapshot FROM improvement.revisions WHERE organization_id=$1 AND site_id=$2 AND action_id=$3 AND ($4::integer=0 OR revision<$4) ORDER BY revision DESC LIMIT $5", [...this.selectors, id, before, limit + 1]);
    const revisions = r.rows.slice(0, limit).map(r => r.snapshot as Revision);
    return {
      revisions,
      nextBefore: r.rows.length > limit ? revisions.at(-1)!.action.revision : 0
    };
  }
  async correctionExists(id: string) {
    const r = await this.tx.query("SELECT 1 FROM improvement.evidence WHERE organization_id=$1 AND site_id=$2 AND supersedes_id=$3 LIMIT 1", [...this.selectors, id]);
    return !!r.rows.length;
  }
  async addEvidence(e: Evidence) {
    await this.tx.query("INSERT INTO improvement.evidence(organization_id,site_id,id,action_id,action_revision,actor_id,at,supersedes_id,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)", [...this.selectors, e.id, e.actionId, e.actionRevision, e.actorId, e.at, e.supersedesId || null, JSON.stringify(e)]);
    await this.directory.audit?.(this.tx,{subjectType:"improvement-evidence",id:e.id,action:e.supersedesId?"corrected":"created",revision:1,beforeRevision:0,state:e.supersedesId?"corrected":"retained",beforeState:"",occurredAt:e.at});
  }
  async addComparison(c: SavedComparison) {
    await this.tx.query("INSERT INTO improvement.comparisons(organization_id,site_id,id,action_id,action_revision,actor_id,at,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7,$8)", [...this.selectors, c.id, c.actionId, c.actionRevision, c.actorId, c.at, JSON.stringify(c)]);
    await this.directory.audit?.(this.tx,{subjectType:"improvement-comparison",id:c.id,action:"created",revision:1,beforeRevision:0,state:"retained",beforeState:"",occurredAt:c.at});
  }
  private async collection<T extends {
    id: string;
    at: string;
  }>(table: "evidence" | "comparisons", id: string, token: string, limit: number) {
    const anchor = token ? cursor(token) : {
      at: "",
      id: ""
    };
    const r = await this.tx.query(`SELECT snapshot FROM improvement.${table} WHERE organization_id=$1 AND site_id=$2 AND action_id=$3 AND ($4='' OR (at,id)<(NULLIF($4,'')::timestamptz,$5::text)) ORDER BY at DESC,id DESC LIMIT $6`, [...this.selectors, id, anchor.at, anchor.id, limit + 1]);
    const records = r.rows.slice(0, limit).map(r => r.snapshot as T);
    const last = records.at(-1);
    return {
      records,
      nextCursor: r.rows.length > limit && last ? last.at + "|" + last.id : ""
    };
  }
  async evidencePage(id: string, token: string, limit: number) {
    const r = await this.collection<Evidence>("evidence", id, token, limit);
    return {
      evidence: r.records,
      nextCursor: r.nextCursor
    };
  }
  async comparisonPage(id: string, token: string, limit: number) {
    const r = await this.collection<SavedComparison>("comparisons", id, token, limit);
    return {
      comparisons: r.records,
      nextCursor: r.nextCursor
    };
  }
}
function cursor(token: string) {
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\|([A-Za-z0-9][A-Za-z0-9_-]{0,100})$/.exec(token);
  assert(match && Number.isFinite(Date.parse(match[1])) && new Date(match[1]).toISOString() === match[1]);
  return {
    at: match[1],
    id: match[2]
  };
}

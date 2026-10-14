import type { SiteMaterialAudit } from "../../../audit";
import type { Pool } from "pg";
import { runSiteOperation, SiteAccessDeniedError, type SiteTransaction } from "../../../../persistence/site-operation";
import { HandoverError, type Entry } from "../../domain/handover";
import type { FormalStore, FormalTransaction } from "../../application/formal-records";
import type { FormalRecord, FormalRevision, ShiftReference, RecordSelection, RecordHistory, RecordPage } from "../../domain/formal-record";

export interface FormalScope { organizationId: string; siteId: string }
export interface FormalLookup {
  audit?: SiteMaterialAudit;
  allowed(tx: SiteTransaction, actor: string, permission: string): Promise<boolean>;
  profile(tx: SiteTransaction, actor: string): Promise<string>;
  name(tx: SiteTransaction, actor: string): Promise<string>;
  shifts(tx: SiteTransaction, actor: string, from: string, to: string): Promise<ShiftReference[]>;
}
export class PgFormalHandover implements FormalStore {
  constructor(private readonly pool: Pool, private readonly scope: FormalScope, private readonly lookup: FormalLookup) {}
  run<T>(actor: string, write: boolean, work: (tx: FormalTransaction) => Promise<T>): Promise<T> {
    return runSiteOperation(this.pool, { ...this.scope, userId: actor, permissions: ["handover.records.manage"] }, async (tx) => {
      await tx.query("SELECT pg_advisory_xact_lock_shared(hashtext('iop-access'),hashtext($1))", [this.scope.organizationId]);
      if (!(await this.lookup.allowed(tx, actor, "handover.records.manage")) ||
        !(await this.lookup.allowed(tx, actor, "handover.read")) ||
        !["administrator", "team-leader", "task-force"].includes(await this.lookup.profile(tx, actor))) throw new SiteAccessDeniedError();
      if (write) await tx.query("SELECT pg_advisory_xact_lock(hashtext('iop-handover-maintenance'),hashtext($1))",
        [this.scope.organizationId + ":" + this.scope.siteId]);
      return work(new PgFormalTransaction(tx, this.scope, actor, this.lookup));
    });
  }
}
class PgFormalTransaction implements FormalTransaction {
  constructor(private readonly tx: SiteTransaction, private readonly scope: FormalScope,
    private readonly actor: string, private readonly lookup: FormalLookup) {}
  private get scopeValues() { return [this.scope.organizationId, this.scope.siteId]; }
  actorName() { return this.lookup.name(this.tx, this.actor); }
  shifts(from: string, to: string) { return this.lookup.shifts(this.tx, this.actor, from, to); }
  async get(id: string): Promise<FormalRecord | null> {
    const result = await this.tx.query("SELECT snapshot FROM shift_handover.records WHERE organization_id=$1 AND site_id=$2 AND id=$3 FOR UPDATE", [...this.scopeValues, id]);
    return result.rows[0]?.snapshot as FormalRecord ?? null;
  }
  async byShift(id: string, departmentId: string, areaId: string): Promise<FormalRecord | null> {
    const result = await this.tx.query("SELECT snapshot FROM shift_handover.records WHERE organization_id=$1 AND site_id=$2 AND shift_id=$3 AND department_id=$4 AND area_id=$5 FOR UPDATE", [...this.scopeValues, id, departmentId, areaId]);
    return result.rows[0]?.snapshot as FormalRecord ?? null;
  }
  async prior(key: string) {
    await this.tx.query("SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))", [this.scopeValues.join(":"), "formal:" + this.actor + ":" + key]);
    const result = await this.tx.query("SELECT snapshot,fingerprint FROM shift_handover.records WHERE organization_id=$1 AND site_id=$2 AND author_id=$3 AND request_key=$4", [...this.scopeValues, this.actor, key]);
    return result.rows[0] ? { record: result.rows[0].snapshot as FormalRecord, fingerprint: String(result.rows[0].fingerprint) } : null;
  }
  async save(record: FormalRecord, event: FormalRevision, request?: { key: string; fingerprint: string }) {
    const before = this.lookup.audit && !request ? await this.get(record.id) : null;
    const snapshot = JSON.stringify(record), evidence = JSON.stringify(event);
    if (Buffer.byteLength(snapshot) > 2097152 || Buffer.byteLength(evidence) > 2162688) throw new HandoverError("handover_capacity");
    if (request) {
      await this.tx.query(`INSERT INTO shift_handover.records(organization_id,site_id,id,shift_id,business_date,starts_at,department_id,area_id,
        author_id,created_at,revision,snapshot,request_key,fingerprint) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [...this.scopeValues, record.id, record.shift.id, record.shift.date, record.shift.startsAt, record.content.departmentId,
          record.content.areaId, record.authorId, record.createdAt, record.revision, snapshot, request.key, request.fingerprint]);
    } else {
      await this.tx.query("UPDATE shift_handover.records SET revision=$4,snapshot=$5 WHERE organization_id=$1 AND site_id=$2 AND id=$3", [...this.scopeValues, record.id, record.revision, snapshot]);
    }
    await this.tx.query(`INSERT INTO shift_handover.record_revisions(organization_id,site_id,record_id,revision,actor_id,recorded_at,snapshot)
      VALUES($1,$2,$3,$4,$5,$6,$7)`, [...this.scopeValues, record.id, record.revision, event.actorId, event.at, evidence]);
    await this.lookup.audit?.(this.tx,{subjectType:"handover-record",id:record.id,action:event.action,revision:record.revision,beforeRevision:before?.revision??0,state:record.state,beforeState:before?.state??"",occurredAt:event.at});
  }
  async records(input: RecordSelection): Promise<RecordPage> {
    const [instant = "", id = ""] = input.cursor.split("|");
    const result = await this.tx.query(`WITH matching AS MATERIALIZED (
      SELECT id,starts_at,snapshot FROM shift_handover.records WHERE organization_id=$1 AND site_id=$2
      AND business_date BETWEEN $3::date AND $4::date AND ($5='' OR department_id=$5) AND ($6='' OR area_id=$6)
    ), page AS (SELECT * FROM matching WHERE $7='' OR (starts_at,id)<(NULLIF($7,'')::timestamptz,$8)
      ORDER BY starts_at DESC,id DESC LIMIT 21)
    SELECT (SELECT count(*)::integer FROM matching) AS total,
      coalesce((SELECT jsonb_agg(snapshot ORDER BY starts_at DESC,id DESC) FROM page),'[]'::jsonb) AS records`,
      [...this.scopeValues, input.from, input.to, input.departmentId, input.areaId, instant, id]);
    const all = result.rows[0].records as FormalRecord[];
    return { records: all.slice(0, 20), total: Number(result.rows[0].total),
      nextCursor: all.length > 20 ? all[19].shift.startsAt + "|" + all[19].id : "" };
  }
  async history(record: FormalRecord, before: number): Promise<RecordHistory> {
    const result = await this.tx.query("SELECT snapshot FROM shift_handover.record_revisions WHERE organization_id=$1 AND site_id=$2 AND record_id=$3 AND ($4=0 OR revision<$4) ORDER BY revision DESC LIMIT 26", [...this.scopeValues, record.id, before]);
    const all = result.rows.map((row) => row.snapshot as FormalRevision);
    return { record, revisions: all.slice(0, 25), nextBefore: all.length > 25 ? all[24].record.revision : 0 };
  }
  async entries(ids: string[]): Promise<Entry[]> {
    if (!ids.length) return [];
    const result = await this.tx.query("SELECT snapshot FROM shift_handover.entries WHERE organization_id=$1 AND site_id=$2 AND id=ANY($3::text[]) ORDER BY id FOR SHARE", [...this.scopeValues, ids]);
    return result.rows.map((row) => row.snapshot as Entry);
  }
  candidates(departmentId: string, areaId: string, through: string) {
    return this.entryPage(departmentId, areaId, through, true);
  }
  pending(departmentId: string, areaId: string, through: string) {
    return this.entryPage(departmentId, areaId, through, false);
  }
  private async entryPage(departmentId: string, areaId: string, through: string, includeDaily: boolean) {
    const result = await this.tx.query(`WITH matching AS MATERIALIZED (
      SELECT id,occurrence_date,created_at,snapshot FROM shift_handover.entries WHERE organization_id=$1 AND site_id=$2
      AND snapshot->'content'->>'departmentId'=$3 AND ($4='' OR snapshot->'content'->>'areaId'=$4)
      AND occurrence_date<=$5::date AND (snapshot->>'issueState' IN ('open','in-progress') OR ($6 AND occurrence_date=$5::date)) AND coalesce(snapshot->>'deleted','false')<>'true'
    ), page AS (SELECT * FROM matching ORDER BY occurrence_date DESC,created_at DESC,id DESC LIMIT 100)
    SELECT (SELECT count(*)::integer FROM matching) AS total,
      coalesce((SELECT jsonb_agg(snapshot ORDER BY occurrence_date DESC,created_at DESC,id DESC) FROM page),'[]'::jsonb) AS entries`,
      [...this.scopeValues, departmentId, areaId, through, includeDaily]);
    return { entries: result.rows[0].entries as Entry[], total: Number(result.rows[0].total) };
  }
}

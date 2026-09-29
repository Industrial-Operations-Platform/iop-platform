import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import {
  runSiteOperation,
  SiteAccessDeniedError,
  type SiteTransaction,
} from "../../../../persistence/site-operation";
import type {
  Store,
  Transaction,
  EquipmentLookup,
} from "../../application/handover";
import type {
  Entry,
  Content,
  Revision,
  Selection,
  Page,
  History,
  Person,
} from "../../domain/handover";
export interface Scope {
  organizationId: string;
  siteId: string;
}
export interface AccessLookup {
  allowed(
    tx: SiteTransaction,
    actor: string,
    permission: string,
  ): Promise<boolean>;
  people(tx: SiteTransaction): Promise<Person[]>;
  equipment(
    tx: SiteTransaction,
    ...args: Parameters<EquipmentLookup["search"]>
  ): ReturnType<EquipmentLookup["search"]>;
}
export class PgHandover implements Store {
  constructor(
    private readonly pool: Pool,
    private readonly scope: Scope,
    private readonly lookup: AccessLookup,
  ) {}
  run<T>(
    actor: string,
    permission: "handover.read" | "handover.contribute",
    work: (tx: Transaction) => Promise<T>,
  ): Promise<T> {
    return runSiteOperation(
      this.pool,
      { ...this.scope, userId: actor, permissions: [permission] },
      async (tx) => {
        // Serialize against access administration and recheck after acquiring its shared lease.
        await tx.query(
          "SELECT pg_advisory_xact_lock_shared(hashtext('iop-access'),hashtext($1))",
          [this.scope.organizationId],
        );
        if (!(await this.lookup.allowed(tx, actor, permission)))
          throw new SiteAccessDeniedError();
        const coordinator = await this.lookup.allowed(
          tx,
          actor,
          "handover.coordinate",
        );
        return work(
          new PgTransaction(
            tx,
            this.scope,
            actor,
            coordinator,
            () => this.lookup.people(tx),
            (...args) => this.lookup.equipment(tx, ...args),
          ),
        );
      },
    );
  }
}
class PgTransaction implements Transaction {
  constructor(
    private readonly tx: SiteTransaction,
    private readonly scope: Scope,
    private readonly actor: string,
    readonly coordinator: boolean,
    readonly people: () => Promise<Person[]>,
    readonly equipment: EquipmentLookup["search"],
  ) {}
  private get selectors() {
    return [this.scope.organizationId, this.scope.siteId];
  }
  async get(id: string): Promise<Entry | null> {
    const r = await this.tx.query(
      "SELECT snapshot FROM shift_handover.entries WHERE organization_id=$1 AND site_id=$2 AND id=$3 FOR UPDATE",
      [...this.selectors, id],
    );
    return (r.rows[0]?.snapshot as Entry) ?? null;
  }
  async prior(key: string) {
    await this.tx.query(
      "SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))",
      [this.selectors.join(":"), this.actor + ":" + key],
    );
    const r = await this.tx.query(
      "SELECT snapshot,fingerprint FROM shift_handover.entries WHERE organization_id=$1 AND site_id=$2 AND author_id=$3 AND request_key=$4",
      [...this.selectors, this.actor, key],
    );
    return r.rows[0]
      ? {
          entry: r.rows[0].snapshot as Entry,
          fingerprint: r.rows[0].fingerprint as string,
        }
      : null;
  }
  async reference(content: Content): Promise<string> {
    if (!content.equipmentCode) return "";
    const values = [
      ...this.selectors,
      content.equipmentNamespace,
      content.equipmentCode,
      content.departmentId,
      content.areaId,
    ];
    await this.tx.query(
      `INSERT INTO shift_handover.equipment_references(organization_id,site_id,namespace,code,department_id,area_id,id)
      VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
      [...values, randomUUID()],
    );
    const r = await this.tx.query(
      `SELECT id FROM shift_handover.equipment_references WHERE organization_id=$1 AND site_id=$2 AND namespace=$3 AND code=$4 AND department_id=$5 AND area_id=$6`,
      values,
    );
    return r.rows[0].id as string;
  }
  async save(
    entry: Entry,
    revision: Revision,
    request?: { key: string; fingerprint: string },
  ) {
    const values = [
      ...this.selectors,
      entry.id,
      entry.responsibleId || null,
      entry.equipmentReferenceId || null,
      entry.content.date,
      entry.revision,
      JSON.stringify(entry),
    ];
    if (request)
      await this.tx.query(
        `INSERT INTO shift_handover.entries(organization_id,site_id,id,responsible_id,equipment_id,occurrence_date,revision,snapshot,author_id,created_at,request_key,fingerprint)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          ...values,
          entry.authorId,
          entry.createdAt,
          request.key,
          request.fingerprint,
        ],
      );
    else
      await this.tx.query(
        `UPDATE shift_handover.entries SET responsible_id=$4,equipment_id=$5,occurrence_date=$6,revision=$7,snapshot=$8 WHERE organization_id=$1 AND site_id=$2 AND id=$3`,
        values,
      );
    await this.tx.query(
      `INSERT INTO shift_handover.revisions(organization_id,site_id,entry_id,revision,actor_id,recorded_at,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7)`,
      [
        ...this.selectors,
        entry.id,
        entry.revision,
        revision.actorId,
        revision.at,
        JSON.stringify(revision),
      ],
    );
  }
  async list(s: Selection): Promise<Page> {
    const [cursorDate, cursorId] = s.cursor.split("|");
    const values: unknown[] = [
      ...this.selectors,
      s.from,
      s.to,
      s.departmentId,
      s.areaId,
      s.equipmentReferenceId,
      s.categoryId,
      s.state,
      s.search,
      s.highlights,
      cursorDate ?? "",
      cursorId ?? "",
      s.mine ? this.actor : "",
      s.attention ?? false,
    ];
    const r = await this.tx.query(
      `WITH matching AS (
      SELECT id,snapshot,CASE WHEN $11 THEN snapshot->>'highlightedAt' ELSE occurrence_date::text || '/' || (snapshot->>'createdAt') END AS sort_key
      FROM shift_handover.entries WHERE organization_id=$1 AND site_id=$2
      AND ($3='' OR occurrence_date >= NULLIF($3,'')::date) AND ($4='' OR occurrence_date <= NULLIF($4,'')::date)
      AND ($5='' OR snapshot->'content'->>'departmentId'=$5) AND ($6='' OR snapshot->'content'->>'areaId'=$6)
      AND ($7='' OR equipment_id=$7) AND ($8='' OR snapshot->'content'->>'categoryId'=$8)
      AND ($9='' OR ($9='pending' AND snapshot->>'issueState' IN ('open','in-progress')) OR snapshot->>'issueState'=$9)
      AND ($10='' OR strpos(lower(concat_ws(' ',snapshot->'content'->>'summary',snapshot->'content'->>'details',snapshot->'content'->>'equipmentCode',snapshot->'content'->>'externalReference',snapshot->'content'->>'challenge',snapshot->'content'->>'cause',snapshot->'content'->>'measure',snapshot->>'departmentLabel',snapshot->>'areaLabel',snapshot->'latestUpdate'->>'note',snapshot->>'authorName')),lower($10))>0)
      AND (NOT $11 OR snapshot->>'highlighted'='true')
      AND ($14='' OR author_id=$14)
      AND (NOT $15 OR (snapshot->>'issueState' IN ('open','in-progress') AND
        (snapshot->'content'->>'condition'='blocked'
        OR NULLIF(snapshot->'content'->>'dueDate','')::date < (CURRENT_TIMESTAMP AT TIME ZONE (SELECT time_zone FROM platform_core.sites WHERE organization_id=$1 AND site_id=$2))::date
        OR NULLIF(snapshot->'content'->>'feedbackDueDate','')::date < (CURRENT_TIMESTAMP AT TIME ZONE (SELECT time_zone FROM platform_core.sites WHERE organization_id=$1 AND site_id=$2))::date)))
    ), page AS (SELECT * FROM matching WHERE $12='' OR (sort_key,id)<($12,$13) ORDER BY sort_key DESC,id DESC LIMIT 21)
    SELECT (SELECT count(*)::integer FROM matching) AS total,coalesce((SELECT jsonb_agg(jsonb_build_object('entry',snapshot,'sort',sort_key) ORDER BY sort_key DESC,id DESC) FROM page),'[]'::jsonb) AS results`,
      values,
    );
    const rows = r.rows[0].results as { entry: Entry; sort: string }[],
      shown = rows.slice(0, 20),
      last = shown.at(-1);
    return {
      entries: shown.map((r) => r.entry),
      total: r.rows[0].total as number,
      nextCursor:
        rows.length > 20 && last ? last.sort + "|" + last.entry.id : "",
    };
  }
  async history(entry: Entry, before: number): Promise<History> {
    const r = await this.tx.query(
      `SELECT snapshot FROM shift_handover.revisions WHERE organization_id=$1 AND site_id=$2 AND entry_id=$3 AND ($4=0 OR revision<$4) ORDER BY revision DESC LIMIT 26`,
      [...this.selectors, entry.id, before],
    );
    const revisions = r.rows.slice(0, 25).map((r) => r.snapshot as Revision);
    return {
      entry,
      revisions,
      nextBefore: r.rows.length > 25 ? revisions.at(-1)!.entry.revision : 0,
    };
  }
}

import type { Pool } from "pg";
import {
  runSiteOperation,
  SiteAccessDeniedError,
  type SiteTransaction,
} from "../../../../persistence/site-operation";
import type { Store, Transaction } from "../../application/maintenance";
import {
  assert,
  type AssetReference,
  type MaintenanceRecord,
  type Page,
  type Person,
  type Revision,
  type Selection,
  type Settings,
  type Team,
} from "../../domain/maintenance";
export interface Scope {
  organizationId: string;
  siteId: string;
}
export interface Directory {
  allowed(
    tx: SiteTransaction,
    actor: string,
    permission: string,
  ): Promise<boolean>;
  people(tx: SiteTransaction): Promise<Person[]>;
  names(tx: SiteTransaction, ids: string[]): Promise<Map<string, string>>;
  teams(tx: SiteTransaction): Promise<Team[]>;
  assets(tx: SiteTransaction): Promise<AssetReference[]>;
  asset(tx: SiteTransaction, id: string): Promise<AssetReference | null>;
}
export class PgMaintenance implements Store {
  constructor(
    private readonly pool: Pool,
    private readonly scope: Scope,
    private readonly directory: Directory,
  ) {}
  run<T>(
    actor: string,
    permission: Parameters<Store["run"]>[1],
    work: (tx: Transaction) => Promise<T>,
  ): Promise<T> {
    return runSiteOperation(
      this.pool,
      { ...this.scope, userId: actor, permissions: [permission] },
      async (tx) => {
        await tx.query(
          "SELECT pg_advisory_xact_lock_shared(hashtext('iop-access'),hashtext($1))",
          [this.scope.organizationId],
        );
        if (!(await this.directory.allowed(tx, actor, permission)))
          throw new SiteAccessDeniedError();
        // Serializing the site makes optimistic checks and both retained snapshots atomic.
        await tx.query(
          "SELECT pg_advisory_xact_lock(hashtext('iop-maintenance'),hashtext($1))",
          [this.scope.organizationId + ":" + this.scope.siteId],
        );
        return work(
          new PgMaintenanceTransaction(
            tx,
            this.scope,
            {
              canContribute: await this.directory.allowed(
                tx,
                actor,
                "maintenance.contribute",
              ),
              canCoordinate: await this.directory.allowed(
                tx,
                actor,
                "maintenance.coordinate",
              ),
              canAdminister: await this.directory.allowed(
                tx,
                actor,
                "maintenance.administer",
              ),
            },
            this.directory,
          ),
        );
      },
    );
  }
}
class PgMaintenanceTransaction implements Transaction {
  readonly canContribute: boolean;
  readonly canCoordinate: boolean;
  readonly canAdminister: boolean;
  constructor(
    private readonly tx: SiteTransaction,
    private readonly scope: Scope,
    flags: Pick<
      Transaction,
      "canContribute" | "canCoordinate" | "canAdminister"
    >,
    private readonly directory: Directory,
  ) {
    this.canContribute = flags.canContribute;
    this.canCoordinate = flags.canCoordinate;
    this.canAdminister = flags.canAdminister;
  }
  private get selectors() {
    return [this.scope.organizationId, this.scope.siteId];
  }
  people() {
    return this.directory.people(this.tx);
  }
  names(ids: string[]) {
    return this.directory.names(this.tx, ids);
  }
  teams() {
    return this.directory.teams(this.tx);
  }
  assets() {
    return this.directory.assets(this.tx);
  }
  asset(id: string) {
    return this.directory.asset(this.tx, id);
  }
  async settings(): Promise<Settings | null> {
    const result = await this.tx.query(
      "SELECT snapshot FROM maintenance.settings WHERE organization_id=$1 AND site_id=$2",
      this.selectors,
    );
    return (result.rows[0]?.snapshot as Settings | undefined) ?? null;
  }
  async saveSettings(settings: Settings, actor: string, at: string) {
    await this.tx.query(
      `INSERT INTO maintenance.settings(organization_id,site_id,revision,snapshot) VALUES($1,$2,$3,$4)
      ON CONFLICT(organization_id,site_id) DO UPDATE SET revision=EXCLUDED.revision,snapshot=EXCLUDED.snapshot`,
      [...this.selectors, settings.revision, JSON.stringify(settings)],
    );
    await this.tx.query(
      "INSERT INTO maintenance.settings_revisions(organization_id,site_id,revision,actor_id,at,snapshot) VALUES($1,$2,$3,$4,$5,$6)",
      [
        ...this.selectors,
        settings.revision,
        actor,
        at,
        JSON.stringify(settings),
      ],
    );
  }
  async priorityUsed(ids: string[]) {
    const result = await this.tx.query(
      "SELECT 1 FROM maintenance.records WHERE organization_id=$1 AND site_id=$2 AND priority_id=ANY($3::text[]) LIMIT 1",
      [...this.selectors, ids],
    );
    return result.rows.length > 0;
  }
  async get(id: string): Promise<MaintenanceRecord | null> {
    const result = await this.tx.query(
      "SELECT snapshot FROM maintenance.records WHERE organization_id=$1 AND site_id=$2 AND id=$3",
      [...this.selectors, id],
    );
    return (result.rows[0]?.snapshot as MaintenanceRecord | undefined) ?? null;
  }
  async creation(id: string): Promise<Revision | null> {
    const result = await this.tx.query(
      "SELECT snapshot FROM maintenance.revisions WHERE organization_id=$1 AND site_id=$2 AND id=$3 AND revision=1",
      [...this.selectors, id],
    );
    return (result.rows[0]?.snapshot as Revision | undefined) ?? null;
  }
  async save(record: MaintenanceRecord, revision: Revision) {
    const d = record.data;
    await this.tx.query(
      `INSERT INTO maintenance.records(organization_id,site_id,id,revision,status,priority_id,location_id,asset_id,assignee_id,team_id,due_date,updated_at,snapshot,author_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT(organization_id,site_id,id) DO UPDATE SET revision=EXCLUDED.revision,status=EXCLUDED.status,priority_id=EXCLUDED.priority_id,location_id=EXCLUDED.location_id,asset_id=EXCLUDED.asset_id,assignee_id=EXCLUDED.assignee_id,team_id=EXCLUDED.team_id,due_date=EXCLUDED.due_date,updated_at=EXCLUDED.updated_at,snapshot=EXCLUDED.snapshot`,
      [
        ...this.selectors,
        record.id,
        record.revision,
        d.status,
        d.priorityId,
        d.locationId,
        d.assetId || null,
        d.assigneeId || null,
        d.teamId,
        d.dueDate || null,
        record.updatedAt,
        JSON.stringify(record),
        record.authorId,
      ],
    );
    await this.tx.query(
      "INSERT INTO maintenance.revisions(organization_id,site_id,id,revision,asset_id,actor_id,at,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
      [
        ...this.selectors,
        record.id,
        record.revision,
        d.assetId || null,
        revision.actorId,
        revision.at,
        JSON.stringify(revision),
      ],
    );
  }
  async query(input: Selection, locationIds: string[]): Promise<Page> {
    const values: unknown[] = [...this.selectors];
    const clauses = ["organization_id=$1", "site_id=$2"];
    const bind = (value: unknown) => {
      values.push(value);
      return "$" + values.length;
    };
    for (const [key, column] of [
      ["priorityId", "priority_id"],
      ["assetId", "asset_id"],
      ["assigneeId", "assignee_id"],
      ["teamId", "team_id"],
    ] as const)
      if (input[key]) clauses.push(`${column}=${bind(input[key])}`);
    if (locationIds.length)
      clauses.push(`location_id=ANY(${bind(locationIds)}::text[])`);
    if (input.dueFrom) clauses.push(`due_date>=${bind(input.dueFrom)}::date`);
    if (input.dueTo) clauses.push(`due_date<=${bind(input.dueTo)}::date`);
    if (input.search)
      clauses.push(
        `strpos(lower(concat_ws(' ',snapshot->'data'->>'title',snapshot->'data'->>'details',snapshot->'data'->>'externalReference',snapshot->>'assetName')),lower(${bind(input.search)}))>0`,
      );
    const count = await this.tx.query(
      `SELECT status,count(*)::integer AS count FROM maintenance.records WHERE ${clauses.join(" AND ")} GROUP BY status`,
      values,
    );
    const statusCounts: Page["statusCounts"] = {
      open: 0,
      "in-progress": 0,
      blocked: 0,
      done: 0,
    };
    for (const row of count.rows)
      statusCounts[row.status as keyof typeof statusCounts] = Number(row.count);
    const total = input.status
      ? statusCounts[input.status]
      : Object.values(statusCounts).reduce((a, b) => a + b, 0);
    if (input.status) clauses.push(`status=${bind(input.status)}`);
    if (input.cursor) {
      const match =
        /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\|([A-Za-z0-9][A-Za-z0-9_-]{0,100})$/.exec(
          input.cursor,
        );
      assert(
        match &&
          Number.isFinite(Date.parse(match[1])) &&
          new Date(match[1]).toISOString() === match[1],
      );
      clauses.push(
        `(updated_at,id)<(${bind(match[1])}::timestamptz,${bind(match[2])}::text)`,
      );
    }
    const limit = input.limit ?? 20;
    const result = await this.tx.query(
      `SELECT snapshot FROM maintenance.records WHERE ${clauses.join(" AND ")} ORDER BY updated_at DESC,id DESC LIMIT ${bind(limit + 1)}`,
      values,
    );
    const records = result.rows
      .slice(0, limit)
      .map((r) => r.snapshot as MaintenanceRecord);
    const last = records.at(-1);
    return {
      records,
      total,
      statusCounts,
      nextCursor:
        result.rows.length > limit && last
          ? last.updatedAt + "|" + last.id
          : "",
    };
  }
  async history(id: string, before: number, limit: number) {
    const result = await this.tx.query(
      "SELECT snapshot FROM maintenance.revisions WHERE organization_id=$1 AND site_id=$2 AND id=$3 AND ($4::integer=0 OR revision<$4) ORDER BY revision DESC LIMIT $5",
      [...this.selectors, id, before, limit + 1],
    );
    const revisions = result.rows
      .slice(0, limit)
      .map((r) => r.snapshot as Revision);
    return {
      revisions,
      nextBefore:
        result.rows.length > limit ? revisions.at(-1)!.record.revision : 0,
    };
  }
}

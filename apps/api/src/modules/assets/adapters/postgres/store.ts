import type { Pool } from "pg";
import {
  runSiteOperation,
  SiteAccessDeniedError,
  AuthorizationUnavailableError,
  type SiteTransaction,
} from "../../../../persistence/site-operation";
import type { Store, Transaction } from "../../application/assets";
import {
  AssetError,
  aliasKey,
  cursorValue,
  encodeCursor,
  exact,
  text,
  type Asset,
  type AssetReference,
  type AssetRevision,
  type AssetSelection,
  type AssetPage,
  type AssetHistory,
  type TimelineKind,
  type SourceQuery,
  type SourceResult,
  type TimelineCoverage,
  type TimelineAsset,
} from "../../domain/assets";
export interface Scope {
  organizationId: string;
  siteId: string;
}
export interface AssetSource {
  kind: TimelineKind;
  permission: string;
  read(
    tx: SiteTransaction,
    asset: TimelineAsset,
    query: SourceQuery,
  ): Promise<SourceResult>;
}
export interface Lookup {
  allowed(
    tx: SiteTransaction,
    actor: string,
    permission: string,
  ): Promise<boolean>;
  names(tx: SiteTransaction, ids: string[]): Promise<Map<string, string>>;
  sources: AssetSource[];
}
export class PgAssets implements Store {
  constructor(
    private readonly pool: Pool,
    private readonly scope: Scope,
    private readonly lookup: Lookup,
  ) {}
  run<T>(
    actor: string,
    permission: "assets.read" | "assets.manage",
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
        if (!(await this.lookup.allowed(tx, actor, permission)))
          throw new SiteAccessDeniedError();
        if (permission === "assets.manage")
          await tx.query(
            "SELECT pg_advisory_xact_lock(hashtext('iop-assets'),hashtext($1))",
            [this.scope.organizationId + ":" + this.scope.siteId],
          );
        return work(
          new PgAssetTransaction(
            tx,
            this.scope,
            actor,
            await this.lookup.allowed(tx, actor, "assets.manage"),
            this.lookup,
          ),
        );
      },
    );
  }
}
class PgAssetTransaction implements Transaction {
  constructor(
    private readonly tx: SiteTransaction,
    private readonly scope: Scope,
    private readonly actor: string,
    readonly canManage: boolean,
    private readonly lookup: Lookup,
  ) {}
  private get selectors() {
    return [this.scope.organizationId, this.scope.siteId];
  }
  async name(actor: string): Promise<string> {
    return (await this.lookup.names(this.tx, [actor])).get(actor) ?? actor;
  }
  async get(id: string): Promise<Asset | null> {
    const result = await this.tx.query(
      "SELECT snapshot FROM assets.records WHERE organization_id=$1 AND site_id=$2 AND id=$3 FOR UPDATE",
      [...this.selectors, id],
    );
    return (result.rows[0]?.snapshot as Asset) ?? null;
  }
  async prior(key: string) {
    await this.tx.query(
      "SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))",
      [this.selectors.join(":"), "asset:" + this.actor + ":" + key],
    );
    const result = await this.tx.query(
      "SELECT fingerprint,snapshot FROM assets.records WHERE organization_id=$1 AND site_id=$2 AND author_id=$3 AND request_key=$4",
      [...this.selectors, this.actor, key],
    );
    return result.rows[0]
      ? {
          fingerprint: String(result.rows[0].fingerprint),
          asset: result.rows[0].snapshot as Asset,
        }
      : null;
  }
  async save(
    asset: Asset,
    revision: AssetRevision,
    request?: { key: string; fingerprint: string },
  ): Promise<void> {
    // The site lease makes explicit code/alias conflicts deterministic without swallowing database failures.
    if (request) {
      const capacity = await this.tx.query(
        "SELECT count(*)::integer AS total FROM assets.records WHERE organization_id=$1 AND site_id=$2",
        this.selectors,
      );
      if (Number(capacity.rows[0].total) >= 500)
        throw new AssetError("asset_capacity");
    }
    const code = await this.tx.query(
      "SELECT id FROM assets.records WHERE organization_id=$1 AND site_id=$2 AND code=$3 AND id<>$4",
      [...this.selectors, asset.content.code, asset.id],
    );
    if (code.rows.length) throw new AssetError("asset_conflict");
    const keys = asset.content.aliases.map(aliasKey);
    if (keys.length) {
      const aliases = await this.tx.query(
        "SELECT asset_id FROM assets.aliases WHERE organization_id=$1 AND site_id=$2 AND active AND alias_key=ANY($3::text[]) AND asset_id<>$4",
        [...this.selectors, keys, asset.id],
      );
      if (aliases.rows.length) throw new AssetError("asset_alias_conflict");
    }
    const values = [
      ...this.selectors,
      asset.id,
      asset.content.code,
      asset.content.status,
      asset.content.locationId,
      asset.revision,
      JSON.stringify(asset),
    ];
    if (request)
      await this.tx.query(
        `INSERT INTO assets.records(organization_id,site_id,id,code,status,location_id,revision,snapshot,author_id,created_at,request_key,fingerprint)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          ...values,
          asset.authorId,
          asset.createdAt,
          request.key,
          request.fingerprint,
        ],
      );
    else
      await this.tx.query(
        "UPDATE assets.records SET code=$4,status=$5,location_id=$6,revision=$7,snapshot=$8 WHERE organization_id=$1 AND site_id=$2 AND id=$3",
        values,
      );
    await this.tx.query(
      "UPDATE assets.aliases SET active=false WHERE organization_id=$1 AND site_id=$2 AND asset_id=$3 AND active",
      [...this.selectors, asset.id],
    );
    for (const alias of asset.content.aliases)
      await this.tx.query(
        `INSERT INTO assets.aliases(organization_id,site_id,asset_id,alias_key,active)
      VALUES($1,$2,$3,$4,true) ON CONFLICT(organization_id,site_id,asset_id,alias_key) DO UPDATE SET active=true`,
        [...this.selectors, asset.id, aliasKey(alias)],
      );
    await this.tx.query(
      "INSERT INTO assets.revisions(organization_id,site_id,asset_id,revision,recorded_at,snapshot) VALUES($1,$2,$3,$4,$5,$6)",
      [
        ...this.selectors,
        asset.id,
        asset.revision,
        revision.at,
        JSON.stringify(revision),
      ],
    );
  }
  async list(selection: AssetSelection): Promise<AssetPage> {
    let cursorCode = "",
      cursorId = "";
    if (selection.cursor) {
      const cursor = cursorValue(selection.cursor);
      exact(cursor, ["v", "search", "status", "locationId", "code", "id"]);
      if (
        cursor.v !== 1 ||
        cursor.search !== selection.search ||
        cursor.status !== selection.status ||
        cursor.locationId !== selection.locationId
      )
        throw new AssetError("invalid_asset");
      cursorCode = text(cursor.code, 160, true);
      cursorId = text(cursor.id, 64, true);
    }
    const result = await this.tx.query(
      `WITH matching AS MATERIALIZED (
      SELECT id,code,snapshot FROM assets.records WHERE organization_id=$1 AND site_id=$2
      AND ($3='' OR strpos(lower(concat_ws(' ',code,snapshot->'content'->>'name',snapshot->'content'->>'type',snapshot->'content'->>'description',snapshot->'content'->>'aliases')),lower($3))>0)
      AND ($4='' OR status=$4) AND ($5='' OR location_id=$5)
    ), page AS (SELECT * FROM matching WHERE $6='' OR (code COLLATE "C",id COLLATE "C")>($6 COLLATE "C",$7 COLLATE "C") ORDER BY code COLLATE "C",id COLLATE "C" LIMIT 26)
    SELECT (SELECT count(*)::integer FROM matching) AS total,coalesce((SELECT jsonb_agg(snapshot ORDER BY code COLLATE "C",id COLLATE "C") FROM page),'[]'::jsonb) AS records`,
      [
        ...this.selectors,
        selection.search,
        selection.status,
        selection.locationId,
        cursorCode,
        cursorId,
      ],
    );
    const records = result.rows[0].records as Asset[],
      assets = records.slice(0, 25),
      last = assets.at(-1);
    return {
      assets,
      total: Number(result.rows[0].total),
      nextCursor:
        records.length > 25 && last
          ? encodeCursor({
              v: 1,
              search: selection.search,
              status: selection.status,
              locationId: selection.locationId,
              code: last.content.code,
              id: last.id,
            })
          : "",
    };
  }
  async history(asset: Asset, before: number): Promise<AssetHistory> {
    const result = await this.tx.query(
      "SELECT snapshot FROM assets.revisions WHERE organization_id=$1 AND site_id=$2 AND asset_id=$3 AND ($4=0 OR revision<$4) ORDER BY revision DESC LIMIT 26",
      [...this.selectors, asset.id, before],
    );
    const revisions = result.rows
      .slice(0, 25)
      .map((row) => row.snapshot as AssetRevision);
    return {
      asset,
      revisions,
      nextBefore:
        result.rows.length > 25 ? revisions.at(-1)!.asset.revision : 0,
    };
  }
  async sources(asset: Asset, query: SourceQuery) {
    const results: {
      kind: TimelineKind;
      result?: SourceResult;
      status: TimelineCoverage["status"];
    }[] = [];
    for (const source of this.lookup.sources) {
      if (
        !(await this.lookup.allowed(this.tx, this.actor, source.permission))
      ) {
        results.push({ kind: source.kind, status: "not-authorized" });
        continue;
      }
      try {
        const result = await source.read(
          this.tx,
          { id: asset.id, aliases: asset.content.aliases },
          query,
        );
        results.push({
          kind: source.kind,
          result,
          status: result.unmapped ? "unmapped" : "available",
        });
      } catch (error) {
        // SQL/connection faults must roll back the complete operation. Only non-SQL
        // source failures can be represented as unavailable on this transaction.
        if (
          error instanceof AuthorizationUnavailableError ||
          error instanceof SiteAccessDeniedError
        )
          throw error;
        results.push({ kind: source.kind, status: "unavailable" });
      }
    }
    return results;
  }
}
/** Narrow owner contract: stable scoped identity only, never asset storage models. */
export async function assetReference(
  tx: SiteTransaction,
  scope: Scope,
  id: string,
): Promise<AssetReference | null> {
  requireScope(tx, scope);
  const result = await tx.query(
    "SELECT id,code,status,location_id,snapshot FROM assets.records WHERE organization_id=$1 AND site_id=$2 AND id=$3 FOR SHARE",
    [scope.organizationId, scope.siteId, id],
  );
  return result.rows[0] ? reference(result.rows[0]) : null;
}
export async function assetReferences(
  tx: SiteTransaction,
  scope: Scope,
  search = "",
  includeRetired = false,
): Promise<AssetReference[]> {
  requireScope(tx, scope);
  const result = await tx.query(
    `SELECT id,code,status,location_id,snapshot FROM assets.records WHERE organization_id=$1 AND site_id=$2
    AND ($3='' OR strpos(lower(concat_ws(' ',code,snapshot->'content'->>'name')),lower($3))>0)
    AND ($4 OR status<>'retired') ORDER BY code COLLATE "C",id COLLATE "C" LIMIT 501`,
    [scope.organizationId, scope.siteId, search, includeRetired],
  );
  if (result.rows.length > 500) throw new AssetError("asset_capacity");
  return result.rows.map(reference);
}
function reference(row: Record<string, unknown>): AssetReference {
  return {
    id: String(row.id),
    code: String(row.code),
    name: (row.snapshot as Asset).content.name,
    locationId: String(row.location_id),
    status: row.status as AssetReference["status"],
  };
}
function requireScope(tx: SiteTransaction, scope: Scope): void {
  if (
    tx.context.organizationId !== scope.organizationId ||
    tx.context.siteId !== scope.siteId
  )
    throw new SiteAccessDeniedError();
}

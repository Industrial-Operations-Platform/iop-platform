import type { SiteMaterialAudit } from "../../../audit";
import type { Pool } from 'pg';
import { runSiteOperation, SiteAccessDeniedError, type SiteTransaction } from '../../../../persistence/site-operation';
import { LocatorError, type Scene, type Revision, type Asset, type Problems } from '../../domain/locator';
import type { Store, Transaction } from '../../application/locator';
export interface LocatorLookups {
  audit?: SiteMaterialAudit;
  allowed(tx: SiteTransaction, actor: string, permission: string): Promise<boolean>;
  profile(tx: SiteTransaction, actor: string): Promise<string>;
  asset(tx: SiteTransaction, id: string): Promise<Asset | null>;
  assets(tx: SiteTransaction, search: string): Promise<Asset[]>;
  problems(tx: SiteTransaction, ids: string[]): Promise<Problems>;
}
export class PgLocator implements Store {
  constructor(private readonly pool: Pool, private readonly scope: {
    organizationId: string;
    siteId: string;
  }, private readonly lookups: LocatorLookups) { }
  run<T>(actor: string, permission: 'locator.read' | 'locator.manage', work: (tx: Transaction) => Promise<T>): Promise<T> {
    return runSiteOperation(this.pool, { ...this.scope, userId: actor, permissions: [permission] }, async (tx) => {
      await tx.query("SELECT pg_advisory_xact_lock_shared(hashtext('iop-access'),hashtext($1))", [this.scope.organizationId]);
      if (!['administrator', 'team-leader', 'task-force'].includes(await this.lookups.profile(tx, actor)) || !(await this.lookups.allowed(tx, actor, permission)))
        throw new SiteAccessDeniedError();
      if (permission === 'locator.manage')
        await tx.query("SELECT pg_advisory_xact_lock(hashtext('iop-locator'),hashtext($1))", [this.scope.organizationId + ':' + this.scope.siteId]);
      return work(new PgLocatorTransaction(tx, await this.lookups.allowed(tx, actor, 'locator.manage'), this.lookups));
    });
  }
}
class PgLocatorTransaction implements Transaction {
  constructor(private readonly tx: SiteTransaction, readonly canManage: boolean, private readonly lookups: LocatorLookups) { }
  private get scope() { return [this.tx.context.organizationId, this.tx.context.siteId]; }
  async scenes(): Promise<Scene[]> { const result = await this.tx.query('SELECT snapshot FROM asset_locator.scenes WHERE organization_id=$1 AND site_id=$2 ORDER BY id LIMIT 251', this.scope); if (result.rows.length > 250 || result.rows.reduce((bytes, row) => bytes + Buffer.byteLength(JSON.stringify(row.snapshot)), 0) > 16777216)
    throw new LocatorError('locator_capacity'); return result.rows.map(r => r.snapshot as Scene); }
  async get(id: string): Promise<Scene | null> { const result = await this.tx.query('SELECT snapshot FROM asset_locator.scenes WHERE organization_id=$1 AND site_id=$2 AND id=$3', [...this.scope, id]); return (result.rows[0]?.snapshot as Scene) ?? null; }
  async save(scene: Scene, revision: Revision): Promise<void> {
    const prior = await this.get(scene.id);
    if (prior && scene.revision !== prior.revision + 1)
      throw new LocatorError('locator_conflict');
    if (!prior && (await this.scenes()).length >= 250)
      throw new LocatorError('locator_capacity');
    const snapshot = JSON.stringify(scene);
    if (Buffer.byteLength(snapshot) > 1048576)
      throw new LocatorError('locator_capacity');
    await this.tx.query('INSERT INTO asset_locator.scenes(organization_id,site_id,id,revision,snapshot) VALUES($1,$2,$3,$4,$5::jsonb) ON CONFLICT(organization_id,site_id,id) DO UPDATE SET revision=EXCLUDED.revision,snapshot=EXCLUDED.snapshot', [...this.scope, scene.id, scene.revision, snapshot]);
    await this.tx.query('INSERT INTO asset_locator.revisions(organization_id,site_id,scene_id,revision,snapshot) VALUES($1,$2,$3,$4,$5::jsonb)', [...this.scope, scene.id, scene.revision, JSON.stringify(revision)]);
    await this.tx.query('UPDATE asset_locator.placements SET current=false WHERE organization_id=$1 AND site_id=$2 AND scene_id=$3 AND current', [...this.scope, scene.id]);
    for (const component of scene.content.components.filter(c => c.assetId))
      await this.tx.query('INSERT INTO asset_locator.placements(organization_id,site_id,scene_id,revision,component_id,asset_id,current) VALUES($1,$2,$3,$4,$5,$6,true)', [...this.scope, scene.id, scene.revision, component.id, component.assetId]);
    await this.lookups.audit?.(this.tx,{subjectType:"locator-scene",id:scene.id,action:scene.revision===1?"created":"changed",revision:scene.revision,beforeRevision:prior?.revision??0,state:scene.content.calibration,beforeState:prior?.content.calibration??"",occurredAt:revision.at});
  }
  async history(id: string, before: number): Promise<Revision[]> { const result = await this.tx.query('SELECT snapshot FROM asset_locator.revisions WHERE organization_id=$1 AND site_id=$2 AND scene_id=$3 AND revision<$4 ORDER BY revision DESC LIMIT 31', [...this.scope, id, before]); return result.rows.map(r => r.snapshot as Revision); }
  asset(id: string) { return this.lookups.asset(this.tx, id); }
  assets(search: string) { return this.lookups.assets(this.tx, search); }
  problems(ids: string[]) { return this.lookups.problems(this.tx, ids); }
}

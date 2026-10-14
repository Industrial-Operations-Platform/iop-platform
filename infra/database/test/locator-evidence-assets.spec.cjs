const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Client, Pool } = require('pg');
const { randomUUID } = require('node:crypto');
const { resolve, join } = require('node:path');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { provision } = require('../dist/provision');
const { migrate } = require('../dist/migrate');
const { provisioningConfiguration } = require('../dist/configuration');
const { seedOrganization } = require('../dist/seed-organization');
const { seedSite } = require('../dist/seed-site');
const { seedUser } = require('../dist/seed-user');
const { seedMembership } = require('../dist/seed-membership');
// A private compile target allows focused review without racing the parent shared build.
const apiRoot = process.env.IOP_TEST_API_BUILD_ROOT || resolve(__dirname, '../../../apps/api/dist');
const api = module => require(join(apiRoot, module));
const { siteRoles } = api('modules/users-rbac/domain/profiles');
const { evaluateSiteAccess } = api('modules/users-rbac');
const { runSiteOperation } = api('persistence/site-operation');
const { Assets } = api('modules/assets/application/assets');
const { PgAssets } = api('modules/assets/adapters/postgres/store');
const { demonstration } = api('modules/asset-locator/domain/locator');
const { composePlatformLocator } = api('host/locator-composition');
const { locatorEvidenceAssets } = api('modules/assets/adapters/postgres/locator-evidence-assets');
const scope = { organizationId: 'evidence-org', siteId: 'evidence-site' };
const foreignScope = { organizationId: 'evidence-foreign-org', siteId: 'evidence-foreign-site' };
const locations = [{ id: 'area', label: 'Synthetic area', parentId: '', role: 'area', sectorKey: '' }];
let container, configs, pool, references, ids, foreignId;
async function bootstrap(work) {
  const client = new Client(configs.bootstrap);
  await client.connect();
  try { return await work(client); } finally { await client.end(); }
}
function assets(target) {
  return new Assets(new PgAssets(pool, target, {
    allowed: async (tx, actor, permission) => (await evaluateSiteAccess(tx, { ...target, userId: actor, permissions: [permission] })).allowed,
    names: async (_tx, values) => new Map(values.map(id => [id, id])), sources: [],
  }), locations, 'UTC', randomUUID, () => new Date().toISOString());
}
const save = (service, actor, code) => service.save(actor, { key: randomUUID(), id: '', expectedRevision: 0, note: '', content: {
  code, name: code, type: 'Sensor', locationId: 'area', status: 'unverified', validationNote: '', description: 'Disposable evidence capacity fixture', aliases: [],
} });
beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:17.6-bookworm').withDatabase('iop_local').withUsername('iop_bootstrap').withPassword('synthetic-bootstrap-password').start();
  const env = { IOP_DATABASE_MODE: 'local', IOP_DATABASE_HOST: container.getHost(), IOP_DATABASE_PORT: String(container.getPort()), IOP_DATABASE_NAME: 'iop_local', IOP_POSTGRES_PASSWORD: 'synthetic-bootstrap-password', IOP_MIGRATOR_PASSWORD: 'synthetic-migrator-password', IOP_RUNTIME_PASSWORD: 'synthetic-runtime-password' };
  configs = provisioningConfiguration(env); await provision(configs); await migrate(configs.migrator); await provision(configs);
  for (const [target, actor] of [[scope, 'evidence-admin'], [foreignScope, 'evidence-foreign-admin']]) {
    const seed = { ...env, IOP_SEED_ORGANIZATION_ID: target.organizationId, IOP_SEED_ORGANIZATION_NAME: 'Disposable organization', IOP_SEED_SITE_ID: target.siteId, IOP_SEED_SITE_NAME: 'Disposable site', IOP_SEED_SITE_TIME_ZONE: 'UTC', IOP_SEED_USER_ID: actor };
    await seedOrganization(seed); await seedSite(seed); await seedUser(seed); await seedMembership(seed);
    await bootstrap(async client => {
      await client.query('INSERT INTO users_rbac.profiles(organization_id,site_id,user_id,display_name,profile) VALUES($1,$2,$3,$3,$4)', [target.organizationId, target.siteId, actor, 'administrator']);
      for (const role of siteRoles('administrator')) await client.query('INSERT INTO users_rbac.site_role_assignments(organization_id,site_id,user_id,role_id,is_active) VALUES($1,$2,$3,$4,true) ON CONFLICT(organization_id,user_id,site_id,role_id) DO UPDATE SET is_active=true', [target.organizationId, target.siteId, actor, role]);
    });
  }
  pool = new Pool({ ...configs.runtime, max: 4 }); references = mkdtempSync(join(tmpdir(), 'iop-locator-evidence-'));
  const registry = assets(scope); ids = [];
  for (let index = 0; index < 501; index++) ids.push((await save(registry, 'evidence-admin', `evidence-sensor-${String(index).padStart(3, '0')}`)).id);
  foreignId = (await save(assets(foreignScope), 'evidence-foreign-admin', 'evidence-sensor-000')).id;
});
afterAll(async () => { if (pool) await pool.end(); if (container) await container.stop(); if (references) rmSync(references, { recursive: true, force: true }); });
test('actual composed scene detail preserves 501 exact canonical links and optional source coverage', async () => {
  const locator = composePlatformLocator(pool, scope, locations, references), content = demonstration(), template = content.components[0];
  content.components = ids.map((assetId, index) => ({ ...template, id: `component-${index}`, assetId, x: (index % 30) / 30, y: Math.floor(index / 30) / 30 }));
  const scene = await locator.save('evidence-admin', { id: '', expectedRevision: 0, note: 'Disposable 501-identity scene', content });
  const detail = await locator.detail('evidence-admin', scene.id);
  expect(detail.scene.content.components).toHaveLength(501);
  expect(new Set(detail.assets.map(asset => asset.id))).toEqual(new Set(ids));
  expect(detail.problems).toEqual({ items: [], coverage: [{ kind: 'handover', status: 'available' }, { kind: 'maintenance', status: 'available' }] });
});
test('source-owned evidence read supports the 1000 identity boundary, deduplicates and excludes foreign scope', async () => {
  await runSiteOperation(pool, { ...scope, userId: 'evidence-admin', permissions: ['assets.read'] }, async tx => {
    const result = await locatorEvidenceAssets(tx, [...ids, foreignId, ...Array.from({ length: 498 }, randomUUID)]);
    expect(result).toHaveLength(501);
    expect(new Set(result.map(asset => asset.id))).toEqual(new Set(ids));
    expect(result.some(asset => asset.id === foreignId)).toBe(false);
    expect(await locatorEvidenceAssets(tx, [...ids, ...ids.slice(0, 499)])).toHaveLength(501);
  });
});
test('above-bound identity evidence is denied before SQL and foreign actor cannot open the scoped read', async () => {
  await runSiteOperation(pool, { ...scope, userId: 'evidence-admin', permissions: ['assets.read'] }, async tx => {
    const query = jest.fn((sql, values) => tx.query(sql, values));
    await expect(locatorEvidenceAssets({ context: tx.context, query }, Array.from({ length: 1001 }, randomUUID))).rejects.toThrow('Asset evidence capacity exceeded.');
    expect(query).not.toHaveBeenCalled();
  });
  await expect(runSiteOperation(pool, { ...scope, userId: 'evidence-foreign-admin', permissions: ['assets.read'] }, tx => locatorEvidenceAssets(tx, ids))).rejects.toThrow();
});

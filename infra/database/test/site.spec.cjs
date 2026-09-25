const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Client } = require('pg');
const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');
const { provisioningConfiguration } = require('../dist/configuration.js');
const { provision } = require('../dist/provision.js');
const { migrate } = require('../dist/migrate.js');
const { seedSite, siteConfiguration } = require('../dist/seed-site.js');
const { seedOrganization } = require('../dist/seed-organization.js');

let container, env, configs;
const input = (id = 'org-a', name = 'Fictional A') => ({ ...env, IOP_SEED_ORGANIZATION_ID: id, IOP_SEED_ORGANIZATION_NAME: name });
async function withClient(role, action) {
  const client = new Client(configs[role]);
  try { await client.connect(); return await action(client); }
  finally { await client.end(); }
}
const query = (role, sql, args) => withClient(role, client => client.query(sql, args));
const all = () => query('bootstrap', 'SELECT * FROM platform_core.sites ORDER BY site_id');
const site = (id = 'site-a', overrides = {}) => ({ ...env, IOP_SEED_ORGANIZATION_ID: 'org-a', IOP_SEED_SITE_ID: id, IOP_SEED_SITE_NAME: 'Fictional Site', IOP_SEED_SITE_TIME_ZONE: 'Europe/Zurich', ...overrides });
beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:17.6-bookworm').withDatabase('iop_local')
    .withUsername('iop_bootstrap').withPassword('synthetic-bootstrap-password').start();
  env = { IOP_DATABASE_MODE: 'local', IOP_DATABASE_HOST: container.getHost(),
    IOP_DATABASE_PORT: String(container.getPort()), IOP_DATABASE_NAME: 'iop_local',
    IOP_POSTGRES_PASSWORD: 'synthetic-bootstrap-password', IOP_MIGRATOR_PASSWORD: 'synthetic-migrator-password',
    IOP_RUNTIME_PASSWORD: 'synthetic-runtime-password' };
  configs = provisioningConfiguration(env);
  await provision(configs);
  expect(await migrate(configs.migrator)).toBe(3);
  await seedOrganization(input());
  await seedOrganization(input('org-b', 'Fictional B'));
});
afterAll(async () => { if (container) await container.stop(); });

test('site seed is immutable across reruns, conflicts and provisioning', async () => {
  expect(await seedSite(site())).toBe('created');
  expect(await seedSite(site())).toBe('unchanged');
  const before = (await all()).rows;
  for (const overrides of [{ IOP_SEED_SITE_NAME: 'Changed' }, { IOP_SEED_SITE_TIME_ZONE: 'UTC' },
    { IOP_SEED_ORGANIZATION_ID: 'org-b' }]) {
    await expect(seedSite(site('site-a', overrides))).rejects.toThrow('conflicts');
  }
  await expect(seedSite(site('missing-owner', { IOP_SEED_ORGANIZATION_ID: 'missing' }))).rejects.toThrow('existing organization');
  expect((await all()).rows).toEqual(before);
  await provision(configs);
  expect(await migrate(configs.migrator)).toBe(0);
  expect(await seedSite(site())).toBe('unchanged');
  expect(await seedSite(site('utc', { IOP_SEED_SITE_TIME_ZONE: 'UTC' }))).toBe('created');
  expect(await seedSite(site('alias', { IOP_SEED_SITE_TIME_ZONE: 'US/Eastern' }))).toBe('created');
  const metadata = await query('bootstrap', `SELECT relrowsecurity, relforcerowsecurity,
    pg_get_userbyid(relowner) AS owner FROM pg_class WHERE oid = 'platform_core.sites'::regclass`);
  expect(metadata.rows[0]).toEqual({ relrowsecurity: true, relforcerowsecurity: true, owner: 'iop_migrator' });
  const trigger = await query('bootstrap', `SELECT prosecdef, provolatile FROM pg_proc
    WHERE oid = 'platform_core.validate_site_time_zone()'::regprocedure`);
  expect(trigger.rows[0]).toEqual({ prosecdef: false, provolatile: 'v' });
});

test('concurrent equal seeds converge; owner, name and zone conflicts never overwrite', async () => {
  expect((await Promise.all([seedSite(site('equal')), seedSite(site('equal'))])).sort()).toEqual(['created', 'unchanged']);
  for (const [index, overrides] of [{ IOP_SEED_SITE_NAME: 'Second' }, { IOP_SEED_SITE_TIME_ZONE: 'UTC' },
    { IOP_SEED_ORGANIZATION_ID: 'org-b' }].entries()) {
    const id = `race-${index}`;
    const results = await Promise.allSettled([seedSite(site(id)), seedSite(site(id, overrides))]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.find(r => r.status === 'rejected').reason.message).toMatch(/^Site seed conflicts/);
    expect((await all()).rows.filter(r => r.site_id === id)).toHaveLength(1);
  }
});

test('two-part RLS rejects missing, malformed, foreign and sibling selectors and clears transaction state', async () => {
  await seedSite(site('sibling'));
  await withClient('migrator', async client => {
    for (const [org, id] of [[null, null], ['org-a', null], [null, 'site-a'], ['', 'site-a'],
      ['org-a', ''], ['invalid scope', 'site-a'], ['org-a', 'invalid scope'], ['org-b', 'site-a'],
      ['org-a', 'sibling'], ['org-a', 'site-a']]) {
      await client.query('BEGIN');
      if (org !== null) await client.query("SELECT set_config('iop.seed_organization_id', $1, true)", [org]);
      if (id !== null) await client.query("SELECT set_config('iop.seed_site_id', $1, true)", [id]);
      const rows = await client.query('SELECT site_id FROM platform_core.sites');
      expect(rows.rows).toEqual(org === 'org-a' && ['site-a', 'sibling'].includes(id) ? [{ site_id: id }] : []);
      await expect(client.query("INSERT INTO platform_core.sites VALUES ('foreign', 'org-a', 'Foreign', 'UTC')"))
        .rejects.toMatchObject({ code: '42501' });
      await client.query('ROLLBACK');
      expect((await client.query('SELECT * FROM platform_core.sites')).rows).toEqual([]);
    }
    await client.query('BEGIN');
    await client.query("SELECT set_config('iop.seed_organization_id', 'org-a', true), set_config('iop.seed_site_id', 'site-a', true)");
    expect((await client.query("UPDATE platform_core.sites SET display_name = 'Changed', time_zone = 'UTC'")).rowCount).toBe(0);
    expect((await client.query('DELETE FROM platform_core.sites')).rowCount).toBe(0);
    await client.query('COMMIT');
    expect((await client.query('SELECT * FROM platform_core.sites')).rows).toEqual([]);
    for (const finish of ['ROLLBACK', 'COMMIT']) {
      await client.query('BEGIN');
      await client.query("SELECT set_config('iop.seed_organization_id', 'org-a', true), set_config('iop.seed_site_id', $1, true)", [finish]);
      await client.query('INSERT INTO platform_core.sites VALUES ($1, $2, $3, $4)', [finish, 'org-a', 'Transient', 'UTC']);
      await client.query(finish);
      expect((await client.query('SELECT * FROM platform_core.sites')).rows).toEqual([]);
    }
  });
  expect((await all()).rows.some(r => r.site_id === 'ROLLBACK')).toBe(false);
  expect((await all()).rows.some(r => r.site_id === 'COMMIT')).toBe(true);
});

test('table constraints, catalog validation and scoped foreign keys reject invalid direct writes', async () => {
  for (const [id, org, name, zone, code] of [
    [null, 'org-a', 'Name', 'UTC', '23502'], ['bad id', 'org-a', 'Name', 'UTC', '23514'],
    ['bad\n', 'org-a', 'Name', 'UTC', '23514'], ['x'.repeat(65), 'org-a', 'Name', 'UTC', '23514'],
    ['invalid', null, 'Name', 'UTC', '23502'], ['invalid', 'missing', 'Name', 'UTC', '23503'],
    ['invalid', 'org-a', null, 'UTC', '23502'], ['invalid', 'org-a', '', 'UTC', '23514'],
    ['invalid', 'org-a', ' ', 'UTC', '23514'], ['invalid', 'org-a', 'Trailing\u00a0', 'UTC', '23514'],
    ['invalid', 'org-a', 'a\u0085b', 'UTC', '23514'], ['invalid', 'org-a', 'x'.repeat(201), 'UTC', '23514'],
    ...[null, '', ' UTC', 'UTC\n', '+01:00', 'CET', 'Unknown/Zone', 'Europe//Zurich', 'europe/zurich', 'x'.repeat(101)]
      .map(zone => ['invalid', 'org-a', 'Name', zone, '23514']),
  ]) await expect(query('bootstrap', 'INSERT INTO platform_core.sites VALUES ($1, $2, $3, $4)', [id, org, name, zone]))
    .rejects.toMatchObject({ code });
  expect(await seedSite(site('unicode', { IOP_SEED_SITE_NAME: '🏭'.repeat(200) }))).toBe('created');
  expect(await seedSite(site('quoted', { IOP_SEED_SITE_NAME: "O'Brien; SELECT 1" }))).toBe('created');
  await withClient('bootstrap', async client => {
    await client.query('BEGIN');
    try {
      await client.query(`CREATE TABLE public.site_reference_fixture (organization_id text, site_id text,
        FOREIGN KEY (organization_id, site_id) REFERENCES platform_core.sites (organization_id, site_id))`);
      await client.query("INSERT INTO public.site_reference_fixture VALUES ('org-a', 'site-a')");
      await expect(client.query("INSERT INTO public.site_reference_fixture VALUES ('org-b', 'site-a')"))
        .rejects.toMatchObject({ code: '23503' });
    } finally { await client.query('ROLLBACK'); }
  });
});

test('Node/catalog disagreement fails without persistence and spelling is preserved', async () => {
  // Intl accepts case-insensitive IANA names; PostgreSQL requires exact catalog spelling.
  expect(siteConfiguration(site('disagreement', { IOP_SEED_SITE_TIME_ZONE: 'europe/zurich' })).timeZone).toBe('europe/zurich');
  await expect(seedSite(site('disagreement', { IOP_SEED_SITE_TIME_ZONE: 'europe/zurich' }))).rejects.toThrow('not supported');
  expect((await all()).rows.some(r => r.site_id === 'disagreement')).toBe(false);
  expect((await all()).rows.find(r => r.site_id === 'alias').time_zone).toBe('US/Eastern');
});

test('runtime remains denied even with seed selectors after provisioning reruns', async () => {
  await provision(configs);
  await withClient('runtime', async client => {
    await client.query("SELECT set_config('iop.seed_organization_id', 'org-a', false), set_config('iop.seed_site_id', 'site-a', false)");
    for (const sql of ['SELECT * FROM platform_core.sites',
      "INSERT INTO platform_core.sites VALUES ('forged', 'org-a', 'Forged', 'UTC')",
      "UPDATE platform_core.sites SET display_name = 'Forged'", 'DELETE FROM platform_core.sites',
      'TRUNCATE platform_core.sites', 'ALTER TABLE platform_core.sites DISABLE ROW LEVEL SECURITY',
      'CREATE TABLE platform_core.forged(id int)', 'SET ROLE iop_migrator', 'SET ROLE iop_bootstrap']) {
      await expect(client.query(sql)).rejects.toMatchObject({ code: '42501' });
    }
  });
});

test('role drift and CLI failures are safe without foreign details or secrets', async () => {
  await query('bootstrap', 'ALTER ROLE iop_migrator BYPASSRLS');
  try { await expect(seedSite(site('forbidden'))).rejects.toThrow('incompatible'); }
  finally { await query('bootstrap', 'ALTER ROLE iop_migrator NOBYPASSRLS'); }
  for (const overrides of [{ IOP_MIGRATOR_PASSWORD: 'do-not-print-password' },
    { IOP_SEED_SITE_NAME: 'do-not-print-conflict' }, { IOP_SEED_ORGANIZATION_ID: 'org-b' },
    { IOP_DATABASE_PORT: '1' }, { IOP_SEED_SITE_TIME_ZONE: 'europe/zurich' }]) {
    const result = spawnSync(process.execPath, [resolve(__dirname, '../dist/cli.js'), 'seed-site'], {
      env: { PATH: process.env.PATH, ...site(), ...overrides }, encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).not.toMatch(/do-not-print|synthetic|org-a|org-b|site-a|SELECT|INSERT|ECONNREFUSED| at /);
  }
});

test('second empty database reproduces organization and site through native CLI', async () => {
  const admin = new Client({ ...configs.bootstrap, database: 'postgres' });
  try {
    await admin.connect();
    await admin.query('DROP DATABASE iop_local');
    await admin.query('CREATE DATABASE iop_local OWNER iop_bootstrap');
  } finally { await admin.end(); }
  for (const [command, values, output] of [['provision', env, 'provisioned'], ['migrate', env, '3 applied'],
    ['seed-organization', input(), 'created'], ['seed-site', site(), 'created'],
    ['seed-site', site(), 'unchanged'], ['provision', env, 'provisioned'], ['migrate', env, '0 applied']]) {
    const result = spawnSync(process.execPath, [resolve(__dirname, '../dist/cli.js'), command], {
      env: { PATH: process.env.PATH, ...values }, encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain(output);
  }
  expect((await all()).rows).toEqual([{ site_id: 'site-a', organization_id: 'org-a', display_name: 'Fictional Site', time_zone: 'Europe/Zurich' }]);
});

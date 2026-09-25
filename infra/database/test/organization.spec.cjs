const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Client } = require('pg');
const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');
const { provisioningConfiguration } = require('../dist/configuration.js');
const { provision } = require('../dist/provision.js');
const { migrate } = require('../dist/migrate.js');
const { seedOrganization } = require('../dist/seed-organization.js');

let container, env, configs;
const input = (id = 'org-a', name = 'Fictional A') => ({ ...env, IOP_SEED_ORGANIZATION_ID: id, IOP_SEED_ORGANIZATION_NAME: name });
async function withClient(role, action) {
  const client = new Client(configs[role]);
  try { await client.connect(); return await action(client); }
  finally { await client.end(); }
}
const query = (role, sql, args) => withClient(role, client => client.query(sql, args));
const all = () => query('bootstrap', 'SELECT * FROM platform_core.organizations ORDER BY organization_id');
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
});
afterAll(async () => { if (container) await container.stop(); });

test('configured organization is stable across seed, migration and provisioning reruns', async () => {
  expect(await seedOrganization(input())).toBe('created');
  expect(await seedOrganization(input())).toBe('unchanged');
  await expect(seedOrganization(input('org-a', 'Different'))).rejects.toThrow('conflicts');
  expect((await all()).rows).toEqual([{ organization_id: 'org-a', display_name: 'Fictional A' }]);
  await provision(configs);
  expect(await migrate(configs.migrator)).toBe(0);
  expect(await seedOrganization(input())).toBe('unchanged');
  // Names are not keys; zero sites and a second organization with the same name are valid.
  expect(await seedOrganization(input('org-b'))).toBe('created');
  const metadata = await query('bootstrap', `SELECT relrowsecurity, relforcerowsecurity,
    pg_get_userbyid(relowner) AS owner FROM pg_class WHERE oid = 'platform_core.organizations'::regclass`);
  expect(metadata.rows[0]).toEqual({ relrowsecurity: true, relforcerowsecurity: true, owner: 'iop_migrator' });
});

test('concurrent identical and conflicting seeds converge without renaming', async () => {
  const equal = await Promise.all([seedOrganization(input('equal')), seedOrganization(input('equal'))]);
  expect(equal.sort()).toEqual(['created', 'unchanged']);
  const conflict = await Promise.allSettled([seedOrganization(input('race', 'First')), seedOrganization(input('race', 'Second'))]);
  expect(conflict.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  expect(conflict.find(r => r.status === 'rejected').reason.message).toContain('conflicts');
  expect((await all()).rows.filter(r => r.organization_id === 'race')).toHaveLength(1);
});

test('actual migrator login has scoped read/insert only; commit and rollback clear scope', async () => {
  await withClient('migrator', async client => {
    expect((await client.query('SELECT * FROM platform_core.organizations')).rows).toEqual([]);
    for (const scope of [null, '', 'invalid scope', 'org-a']) {
      await client.query('BEGIN');
      if (scope !== null) await client.query("SELECT set_config('iop.seed_organization_id', $1, true)", [scope]);
      const rows = (await client.query('SELECT * FROM platform_core.organizations')).rows;
      expect(rows.map(r => r.organization_id)).toEqual(scope === 'org-a' ? ['org-a'] : []);
      await expect(client.query("INSERT INTO platform_core.organizations VALUES ('foreign', 'Foreign')"))
        .rejects.toMatchObject({ code: '42501' });
      await client.query('ROLLBACK');
      expect((await client.query('SELECT * FROM platform_core.organizations')).rows).toEqual([]);
    }
    await client.query('BEGIN');
    await client.query("SELECT set_config('iop.seed_organization_id', 'org-a', true)");
    expect((await client.query("UPDATE platform_core.organizations SET display_name = 'Changed'")).rowCount).toBe(0);
    expect((await client.query('DELETE FROM platform_core.organizations')).rowCount).toBe(0);
    await client.query('COMMIT');
    expect((await client.query('SELECT * FROM platform_core.organizations')).rows).toEqual([]);
    await client.query('BEGIN');
    await client.query("SELECT set_config('iop.seed_organization_id', 'rollback', true)");
    await client.query("INSERT INTO platform_core.organizations VALUES ('rollback', 'Transient')");
    await client.query('ROLLBACK');
  });
  expect((await all()).rows.some(r => r.organization_id === 'rollback')).toBe(false);
});

test('constraints reject invalid direct writes and preserve Unicode names', async () => {
  for (const [id, name, code] of [
    [null, 'Name', '23502'], ['bad id', 'Name', '23514'], ['-bad', 'Name', '23514'],
    ['a'.repeat(65), 'Name', '23514'], ['org\n', 'Name', '23514'],
    ['constraint', null, '23502'], ['constraint', '', '23514'], ['constraint', ' ', '23514'],
    ['constraint', ' Leading', '23514'], ['constraint', 'Trailing\u00a0', '23514'],
    ['constraint', 'a\u0085b', '23514'], ['constraint', 'a\nb', '23514'], ['constraint', 'x'.repeat(201), '23514'],
  ]) await expect(query('bootstrap', 'INSERT INTO platform_core.organizations VALUES ($1, $2)', [id, name]))
    .rejects.toMatchObject({ code });
  expect(await seedOrganization(input('unicode', '🏭'.repeat(200)))).toBe('created');
  expect(await seedOrganization(input('quoted', "O'Brien; SELECT 1"))).toBe('created');
});

test('runtime cannot access business data even with a self-selected seed scope', async () => {
  await withClient('runtime', async client => {
    await client.query("SELECT set_config('iop.seed_organization_id', 'org-a', false)");
    for (const sql of ['SELECT * FROM platform_core.organizations',
      "INSERT INTO platform_core.organizations VALUES ('org-a', 'Forged')",
      "UPDATE platform_core.organizations SET display_name = 'Forged'", 'DELETE FROM platform_core.organizations',
      'TRUNCATE platform_core.organizations', 'ALTER TABLE platform_core.organizations DISABLE ROW LEVEL SECURITY',
      'SET ROLE iop_migrator', 'SET ROLE iop_bootstrap']) {
      await expect(client.query(sql)).rejects.toMatchObject({ code: '42501' });
    }
  });
});

test('seed rejects incompatible role and CLI errors conceal inputs and diagnostics', async () => {
  await query('bootstrap', 'ALTER ROLE iop_migrator BYPASSRLS');
  try { await expect(seedOrganization(input('forbidden'))).rejects.toThrow('incompatible'); }
  finally { await query('bootstrap', 'ALTER ROLE iop_migrator NOBYPASSRLS'); }
  for (const overrides of [
    { IOP_MIGRATOR_PASSWORD: 'do-not-print-password' },
    { IOP_SEED_ORGANIZATION_NAME: 'do-not-print-conflict' },
    { IOP_DATABASE_PORT: '1' }, { IOP_DATABASE_MODE: 'production' },
  ]) {
    const result = spawnSync(process.execPath, [resolve(__dirname, '../dist/cli.js'), 'seed-organization'], {
      env: { PATH: process.env.PATH, ...input(), ...overrides }, encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).not.toMatch(/do-not-print|synthetic|SELECT|INSERT|ECONNREFUSED| at /);
  }
});

test('second empty database reproduces organization identity and constraints', async () => {
  const admin = new Client({ ...configs.bootstrap, database: 'postgres' });
  try {
    await admin.connect();
    // Only this test-owned container is recreated, never an operator volume.
    await admin.query('DROP DATABASE iop_local');
    await admin.query('CREATE DATABASE iop_local OWNER iop_bootstrap');
  } finally { await admin.end(); }
  await provision(configs);
  expect(await migrate(configs.migrator)).toBe(3);
  expect(await seedOrganization(input())).toBe('created');
  expect((await all()).rows).toEqual([{ organization_id: 'org-a', display_name: 'Fictional A' }]);
  await provision(configs);
});

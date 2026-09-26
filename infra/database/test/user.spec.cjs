const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Client } = require('pg');
const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');
const { provisioningConfiguration } = require('../dist/configuration.js');
const { provision } = require('../dist/provision.js');
const { migrate } = require('../dist/migrate.js');
const { seedUser } = require('../dist/seed-user.js');

let container, env, configs;
const input = (id = 'local-user') => ({ ...env, IOP_SEED_USER_ID: id });
async function withClient(role, action) {
  const client = new Client(configs[role]);
  try { await client.connect(); return await action(client); }
  finally { await client.end(); }
}
const query = (role, sql, args) => withClient(role, client => client.query(sql, args));
const all = () => query('bootstrap', 'SELECT * FROM users_rbac.users ORDER BY user_id');
beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:17.6-bookworm').withDatabase('iop_local')
    .withUsername('iop_bootstrap').withPassword('synthetic-bootstrap-password').start();
  env = { IOP_DATABASE_MODE: 'local', IOP_DATABASE_HOST: container.getHost(),
    IOP_DATABASE_PORT: String(container.getPort()), IOP_DATABASE_NAME: 'iop_local',
    IOP_POSTGRES_PASSWORD: 'synthetic-bootstrap-password', IOP_MIGRATOR_PASSWORD: 'synthetic-migrator-password',
    IOP_RUNTIME_PASSWORD: 'synthetic-runtime-password' };
  configs = provisioningConfiguration(env);
  await provision(configs);
  expect(await migrate(configs.migrator)).toBe(5);
});
afterAll(async () => { if (container) await container.stop(); });

test('global principal seeds without organizations and remains unchanged across reruns', async () => {
  expect(await seedUser(input())).toBe('created');
  expect(await seedUser(input())).toBe('unchanged');
  expect((await all()).rows).toEqual([{ user_id: 'local-user', is_active: true }]);
  expect((await query('bootstrap', 'SELECT * FROM platform_core.organizations')).rows).toEqual([]);
  await provision(configs);
  expect(await migrate(configs.migrator)).toBe(0);
  expect(await seedUser(input())).toBe('unchanged');
  const metadata = await query('bootstrap', `SELECT relrowsecurity, relforcerowsecurity,
    pg_get_userbyid(relowner) AS owner FROM pg_class WHERE oid = 'users_rbac.users'::regclass`);
  expect(metadata.rows[0]).toEqual({ relrowsecurity: true, relforcerowsecurity: true, owner: 'iop_migrator' });
});

test('concurrent seeds converge; inactive identities never reactivate', async () => {
  expect((await Promise.all([seedUser(input('race')), seedUser(input('race'))])).sort())
    .toEqual(['created', 'unchanged']);
  // Test-only privileged fixture setup; no lifecycle mutation command is shipped.
  await query('bootstrap', "INSERT INTO users_rbac.users VALUES ('inactive', false)");
  const results = await Promise.allSettled([seedUser(input('inactive')), seedUser(input('inactive'))]);
  expect(results.every(r => r.status === 'rejected' && r.reason.message.includes('conflicts'))).toBe(true);
  expect((await all()).rows.find(r => r.user_id === 'inactive').is_active).toBe(false);
  expect((await all()).rows.filter(r => r.user_id === 'race')).toHaveLength(1);
});

test('actual migrator has exact-principal read/insert only and no lingering transaction scope', async () => {
  await withClient('migrator', async client => {
    expect((await client.query('SELECT * FROM users_rbac.users')).rows).toEqual([]);
    for (const scope of [null, '', 'invalid scope', 'local-user']) {
      await client.query('BEGIN');
      if (scope !== null) await client.query("SELECT set_config('iop.seed_user_id', $1, true)", [scope]);
      expect((await client.query('SELECT user_id FROM users_rbac.users')).rows)
        .toEqual(scope === 'local-user' ? [{ user_id: 'local-user' }] : []);
      await expect(client.query("INSERT INTO users_rbac.users VALUES ('foreign', true)"))
        .rejects.toMatchObject({ code: '42501' });
      await client.query('ROLLBACK');
      expect((await client.query('SELECT * FROM users_rbac.users')).rows).toEqual([]);
    }
    await client.query('BEGIN');
    await client.query("SELECT set_config('iop.seed_user_id', 'local-user', true)");
    expect((await client.query('UPDATE users_rbac.users SET is_active = false')).rowCount).toBe(0);
    expect((await client.query('DELETE FROM users_rbac.users')).rowCount).toBe(0);
    await client.query('COMMIT');
    expect((await client.query('SELECT * FROM users_rbac.users')).rows).toEqual([]);
    await client.query('BEGIN');
    await client.query("SELECT set_config('iop.seed_user_id', 'rollback', true)");
    await client.query("INSERT INTO users_rbac.users VALUES ('rollback', true)");
    await expect(client.query("INSERT INTO users_rbac.users VALUES ('rollback', null)"))
      .rejects.toMatchObject({ code: '23502' });
    await client.query('ROLLBACK');
    expect((await client.query('SELECT * FROM users_rbac.users')).rows).toEqual([]);
  });
  expect((await all()).rows.some(r => r.user_id === 'rollback')).toBe(false);
});

test('database constraints reject invalid identity and missing state; case is preserved', async () => {
  for (const [id, active, code] of [
    [null, true, '23502'], ['bad id', true, '23514'], ['-bad', true, '23514'],
    ['x'.repeat(65), true, '23514'], ['user\n', true, '23514'], ['', true, '23514'],
    ['constraint', null, '23502'],
  ]) await expect(query('bootstrap', 'INSERT INTO users_rbac.users VALUES ($1, $2)', [id, active]))
    .rejects.toMatchObject({ code });
  for (const id of ['Case', 'case', 'x'.repeat(64)]) expect(await seedUser(input(id))).toBe('created');
});

test('runtime has no identity access even with a forged seed selector', async () => {
  await withClient('runtime', async client => {
    await client.query("SELECT set_config('iop.seed_user_id', 'local-user', false)");
    for (const sql of ['SELECT * FROM users_rbac.users',
      "INSERT INTO users_rbac.users VALUES ('forged', true)",
      'UPDATE users_rbac.users SET is_active = false', 'DELETE FROM users_rbac.users',
      'TRUNCATE users_rbac.users', 'ALTER TABLE users_rbac.users DISABLE ROW LEVEL SECURITY',
      'SET ROLE iop_migrator', 'SET ROLE iop_bootstrap']) {
      await expect(client.query(sql)).rejects.toMatchObject({ code: '42501' });
    }
  });
});

test('role drift and invalid CLI configuration fail safely', async () => {
  await query('bootstrap', 'ALTER ROLE iop_migrator BYPASSRLS');
  try { await expect(seedUser(input('forbidden'))).rejects.toThrow('incompatible'); }
  finally { await query('bootstrap', 'ALTER ROLE iop_migrator NOBYPASSRLS'); }
  for (const overrides of [
    { IOP_MIGRATOR_PASSWORD: 'do-not-print-password' }, { IOP_SEED_USER_ID: 'inactive' },
    { IOP_DATABASE_PORT: '1' }, { IOP_DATABASE_MODE: 'production' },
    { IOP_DATABASE_MODE: undefined }, { IOP_SEED_USER_ID: 'do-not-print\n' },
  ]) {
    const result = spawnSync(process.execPath, [resolve(__dirname, '../dist/cli.js'), 'seed-user'], {
      env: { PATH: process.env.PATH, ...input(), ...overrides }, encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).not.toMatch(/do-not-print|inactive|synthetic|SELECT|INSERT|ECONNREFUSED| at /);
  }
});

test('native commands reproduce the seed on a second empty database', async () => {
  const admin = new Client({ ...configs.bootstrap, database: 'postgres' });
  try {
    await admin.connect();
    // Only this test-owned container is recreated, never an operator volume.
    await admin.query('DROP DATABASE iop_local');
    await admin.query('CREATE DATABASE iop_local OWNER iop_bootstrap');
  } finally { await admin.end(); }
  for (const [command, output] of [['provision', 'provisioned'], ['migrate', '5 applied'],
    ['seed-user', 'created'], ['seed-user', 'unchanged'], ['provision', 'provisioned'], ['migrate', '0 applied']]) {
    const result = spawnSync(process.execPath, [resolve(__dirname, '../dist/cli.js'), command], {
      env: { PATH: process.env.PATH, ...input() }, encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(output);
    expect(result.stderr).toBe('');
  }
  expect((await all()).rows).toEqual([{ user_id: 'local-user', is_active: true }]);
});

const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Client } = require('pg');
const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');
const { provisioningConfiguration } = require('../dist/configuration.js');
const { provision } = require('../dist/provision.js');
const { migrate } = require('../dist/migrate.js');
const { seedUser } = require('../dist/seed-user.js');
const { seedOrganization } = require('../dist/seed-organization.js');
const { seedSite } = require('../dist/seed-site.js');
const { seedMembership } = require('../dist/seed-membership.js');

let container, env, configs;
const tables = ['organization_memberships', 'site_role_assignments'];
const input = (user = 'user', org = 'org-a', site = 'site-a') => ({ ...env,
  IOP_SEED_USER_ID: user, IOP_SEED_ORGANIZATION_ID: org, IOP_SEED_SITE_ID: site });
async function withClient(role, action) {
  const client = new Client(configs[role]);
  try { await client.connect(); return await action(client); }
  finally { await client.end(); }
}
const query = (role, sql, args) => withClient(role, client => client.query(sql, args));
async function state() {
  return Promise.all(tables.map(table => query('bootstrap', `SELECT * FROM users_rbac.${table} ORDER BY 1, 2, 3`)
    .then(result => result.rows)));
}
async function selectors(client, org, user, site) {
  await client.query(`SELECT set_config('iop.seed_organization_id', $1, true),
    set_config('iop.seed_user_id', $2, true), set_config('iop.seed_site_id', $3, true)`, [org, user, site]);
}
const cli = (command, values) => spawnSync(process.execPath, [resolve(__dirname, '../dist/cli.js'), command], {
  env: { PATH: process.env.PATH, ...values }, encoding: 'utf8',
});
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
  for (const org of ['org-a', 'org-b']) {
    await seedOrganization({ ...env, IOP_SEED_ORGANIZATION_ID: org, IOP_SEED_ORGANIZATION_NAME: 'Fictional Organization' });
  }
  for (const [org, site] of [['org-a', 'site-a'], ['org-a', 'site-a2'], ['org-b', 'site-b']]) {
    await seedSite({ ...input('user', org, site), IOP_SEED_SITE_NAME: 'Fictional Site', IOP_SEED_SITE_TIME_ZONE: 'UTC' });
  }
  await seedUser(input());
});
afterAll(async () => { if (container) await container.stop(); });

test('atomic fixed-pair creation, unchanged rerun, ownership and forced RLS survive provisioning', async () => {
  expect(await seedMembership(input())).toBe('created');
  const before = await state();
  expect(before).toEqual([
    [{ organization_id: 'org-a', user_id: 'user', is_active: true }],
    expect.arrayContaining(['analytics-reader', 'site-operator'].map(role_id =>
      ({ organization_id: 'org-a', user_id: 'user', site_id: 'site-a', role_id }))),
  ]);
  expect(before[1]).toHaveLength(2);
  await provision(configs);
  expect(await migrate(configs.migrator)).toBe(0);
  expect(await seedMembership(input())).toBe('unchanged');
  expect(await state()).toEqual(before);
  for (const table of tables) {
    const metadata = await query('bootstrap', `SELECT relrowsecurity, relforcerowsecurity,
      pg_get_userbyid(relowner) AS owner FROM pg_class WHERE oid = $1::regclass`, [`users_rbac.${table}`]);
    expect(metadata.rows[0]).toEqual({ relrowsecurity: true, relforcerowsecurity: true, owner: 'iop_migrator' });
    const policies = await query('bootstrap', `SELECT cmd, roles FROM pg_policies
      WHERE schemaname = 'users_rbac' AND tablename = $1 ORDER BY cmd`, [table]);
    expect(policies.rows).toEqual([{ cmd: 'INSERT', roles: '{iop_migrator}' }, { cmd: 'SELECT', roles: '{iop_migrator}' }]);
  }
});

test('matching concurrent seeds converge and different sites cannot extend an existing membership', async () => {
  await seedUser(input('race'));
  expect((await Promise.all([seedMembership(input('race')), seedMembership(input('race'))])).sort())
    .toEqual(['created', 'unchanged']);
  await seedUser(input('site-race'));
  const results = await Promise.allSettled([
    seedMembership(input('site-race')), seedMembership(input('site-race', 'org-a', 'site-a2')),
  ]);
  expect(results.filter(r => r.status === 'fulfilled').map(r => r.value)).toEqual(['created']);
  expect(results.filter(r => r.status === 'rejected')).toHaveLength(1);
  expect(results.find(r => r.status === 'rejected').reason.message).toContain('conflicts');
  const grants = (await state())[1].filter(r => r.user_id === 'site-race');
  expect(grants).toHaveLength(2);
  expect(new Set(grants.map(r => r.site_id)).size).toBe(1);
  const before = await state();
  await expect(seedMembership(input('user', 'org-a', 'site-a2'))).rejects.toThrow('conflicts');
  expect(await state()).toEqual(before);
});

test('inactive memberships and either missing role are never repaired or reactivated', async () => {
  for (const [user, role] of [['missing-reader', 'analytics-reader'], ['missing-operator', 'site-operator'], ['inactive', null]]) {
    await seedUser(input(user));
    await seedMembership(input(user));
    if (role) await query('bootstrap', 'DELETE FROM users_rbac.site_role_assignments WHERE user_id = $1 AND role_id = $2', [user, role]);
    else await query('bootstrap', 'UPDATE users_rbac.organization_memberships SET is_active = false WHERE user_id = $1', [user]);
    const before = await state();
    await expect(seedMembership(input(user))).rejects.toThrow('conflicts');
    expect(await state()).toEqual(before);
  }
  await seedUser(input('empty-membership'));
  await query('bootstrap', "INSERT INTO users_rbac.organization_memberships VALUES ('org-a', 'empty-membership', true)");
  const before = await state();
  await expect(seedMembership(input('empty-membership'))).rejects.toThrow('conflicts');
  expect(await state()).toEqual(before);
});

test('absent or inactive principal, absent scope and mismatched ownership leave no state', async () => {
  await seedUser(input('disabled-user'));
  await query('bootstrap', "UPDATE users_rbac.users SET is_active = false WHERE user_id = 'disabled-user'");
  const before = await state();
  for (const values of [input('absent'), input('disabled-user'), input('user', 'absent'),
    input('user', 'org-a', 'absent'), input('user', 'org-a', 'site-b')]) {
    await expect(seedMembership(values)).rejects.toThrow('active user');
  }
  expect(await state()).toEqual(before);
  // A second explicitly selected organization is independent, never implicit inheritance.
  expect(await seedMembership(input('user', 'org-b', 'site-b'))).toBe('created');
  expect((await state())[0].filter(r => r.user_id === 'user')).toHaveLength(2);
});

test('failure during role insertion rolls back membership and every role, then releases its lock', async () => {
  await seedUser(input('rollback'));
  const before = await state();
  // Disposable test-only fault injection after membership and one role were written.
  await query('bootstrap', `CREATE FUNCTION users_rbac.reject_test_role() RETURNS trigger
    LANGUAGE plpgsql AS $$ BEGIN
      IF NEW.user_id = 'rollback' AND NEW.role_id = 'analytics-reader' THEN
        RAISE EXCEPTION 'Synthetic failure'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER reject_test_role BEFORE INSERT ON users_rbac.site_role_assignments
      FOR EACH ROW EXECUTE FUNCTION users_rbac.reject_test_role()`);
  try { await expect(seedMembership(input('rollback'))).rejects.toThrow('Synthetic failure'); }
  finally {
    await query('bootstrap', `DROP TRIGGER reject_test_role ON users_rbac.site_role_assignments;
      DROP FUNCTION users_rbac.reject_test_role()`);
  }
  expect(await state()).toEqual(before);
  expect(await seedMembership(input('rollback'))).toBe('created');
});

test('actual migrator policies constrain principal, organization and site and clear local context', async () => {
  await withClient('migrator', async client => {
    for (const table of tables) expect((await client.query(`SELECT * FROM users_rbac.${table}`)).rows).toEqual([]);
    for (const [org, user, site, members, grants] of [
      ['', '', '', 0, 0], ['org-a', '', 'site-a', 0, 0], ['', 'user', 'site-a', 0, 0],
      ['org-a', 'user', '', 1, 0], ['org-a', 'user', 'site-a2', 1, 0],
      ['org-b', 'user', 'site-a', 1, 0], ['org-a', 'absent', 'site-a', 0, 0],
      ['org-a', 'user', 'site-a', 1, 2],
    ]) {
      await client.query('BEGIN');
      await selectors(client, org, user, site);
      expect((await client.query('SELECT * FROM users_rbac.organization_memberships')).rowCount).toBe(members);
      expect((await client.query('SELECT * FROM users_rbac.site_role_assignments')).rowCount).toBe(grants);
      for (const table of tables) {
        const sql = table === tables[0] ? 'SET is_active = false' : "SET role_id = 'analytics-reader'";
        expect((await client.query(`UPDATE users_rbac.${table} ${sql}`)).rowCount).toBe(0);
        expect((await client.query(`DELETE FROM users_rbac.${table}`)).rowCount).toBe(0);
      }
      await client.query('COMMIT');
      for (const table of tables) expect((await client.query(`SELECT * FROM users_rbac.${table}`)).rows).toEqual([]);
    }
    for (const [org, user, site, sql] of [
      ['', '', '', "INSERT INTO users_rbac.organization_memberships VALUES ('org-a', 'user', true)"],
      ['org-a', 'user', 'site-a', "INSERT INTO users_rbac.organization_memberships VALUES ('org-b', 'user', true)"],
      ['org-a', 'user', 'site-a', "INSERT INTO users_rbac.organization_memberships VALUES ('org-a', 'race', true)"],
      ['org-a', 'user', '', "INSERT INTO users_rbac.site_role_assignments VALUES ('org-a', 'user', 'site-a', 'analytics-reader')"],
      ['org-a', 'user', 'site-a', "INSERT INTO users_rbac.site_role_assignments VALUES ('org-a', 'user', 'site-a2', 'analytics-reader')"],
      ['org-a', 'user', 'site-a', "INSERT INTO users_rbac.site_role_assignments VALUES ('org-b', 'user', 'site-b', 'analytics-reader')"],
      ['org-a', 'user', 'site-a', "INSERT INTO users_rbac.site_role_assignments VALUES ('org-a', 'race', 'site-a', 'analytics-reader')"],
    ]) {
      await client.query('BEGIN');
      await selectors(client, org, user, site);
      await expect(client.query(sql)).rejects.toMatchObject({ code: '42501' });
      await client.query('ROLLBACK');
      for (const table of tables) expect((await client.query(`SELECT * FROM users_rbac.${table}`)).rows).toEqual([]);
    }
  });
});

test('relational constraints independently reject missing, foreign, duplicate and unsupported references', async () => {
  for (const [sql, code] of [
    ["INSERT INTO users_rbac.organization_memberships VALUES ('absent', 'user', true)", '23503'],
    ["INSERT INTO users_rbac.organization_memberships VALUES ('org-a', 'absent', true)", '23503'],
    ["INSERT INTO users_rbac.organization_memberships VALUES ('org-a', 'user', true)", '23505'],
    ["INSERT INTO users_rbac.organization_memberships VALUES ('org-a', 'user', null)", '23502'],
    ["INSERT INTO users_rbac.site_role_assignments VALUES ('org-a', 'user', 'site-b', 'analytics-reader')", '23503'],
    ["INSERT INTO users_rbac.site_role_assignments VALUES ('org-a', 'absent', 'site-a', 'analytics-reader')", '23503'],
    ["INSERT INTO users_rbac.site_role_assignments VALUES ('org-a', 'user', 'site-a', 'analytics-reader')", '23505'],
    ["INSERT INTO users_rbac.site_role_assignments VALUES ('org-a', 'user', null, 'analytics-reader')", '23502'],
    ["INSERT INTO users_rbac.site_role_assignments VALUES ('org-a', 'user', 'site-a', null)", '23502'],
    ["DELETE FROM users_rbac.organization_memberships WHERE organization_id = 'org-a' AND user_id = 'user'", '23503'],
  ]) await expect(query('bootstrap', sql)).rejects.toMatchObject({ code });
  for (const role of ['organization-access-admin', '*', 'unknown', 'Analytics-reader']) {
    await expect(query('bootstrap', `INSERT INTO users_rbac.site_role_assignments VALUES ('org-a', 'user', 'site-a', $1)`, [role]))
      .rejects.toMatchObject({ code: '23514' });
  }
});

test('real runtime remains denied even with all forged selectors and after provisioning again', async () => {
  await provision(configs);
  await withClient('runtime', async client => {
    await client.query('BEGIN');
    await selectors(client, 'org-a', 'user', 'site-a');
    await client.query('COMMIT');
    await client.query("SELECT set_config('iop.seed_organization_id', 'org-a', false), set_config('iop.seed_user_id', 'user', false), set_config('iop.seed_site_id', 'site-a', false)");
    for (const table of tables) {
      const values = table === tables[0] ? "('org-a', 'user', true)" : "('org-a', 'user', 'site-a', 'analytics-reader')";
      for (const sql of [`SELECT * FROM users_rbac.${table}`, `INSERT INTO users_rbac.${table} VALUES ${values}`,
        `UPDATE users_rbac.${table} SET user_id = 'user'`, `DELETE FROM users_rbac.${table}`,
        `TRUNCATE users_rbac.${table}`, `ALTER TABLE users_rbac.${table} DISABLE ROW LEVEL SECURITY`]) {
        await expect(client.query(sql)).rejects.toMatchObject({ code: '42501' });
      }
    }
    for (const role of ['iop_migrator', 'iop_bootstrap']) {
      await expect(client.query(`SET ROLE ${role}`)).rejects.toMatchObject({ code: '42501' });
    }
  });
});

test('role drift and CLI failures reject safely without exposing input or driver errors', async () => {
  await query('bootstrap', 'ALTER ROLE iop_migrator BYPASSRLS');
  try { await expect(seedMembership(input())).rejects.toThrow('incompatible'); }
  finally { await query('bootstrap', 'ALTER ROLE iop_migrator NOBYPASSRLS'); }
  for (const overrides of [{ IOP_MIGRATOR_PASSWORD: 'do-not-print-password' },
    { IOP_SEED_USER_ID: 'disabled-user' }, { IOP_SEED_USER_ID: 'missing-reader' },
    { IOP_DATABASE_PORT: '1' }, { IOP_DATABASE_MODE: 'production' }, { IOP_DATABASE_MODE: undefined },
    { IOP_DATABASE_HOST: 'remote.invalid' }, { IOP_SEED_USER_ID: 'do-not-print\n' }]) {
    const result = cli('seed-membership', { ...input(), ...overrides });
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).not.toMatch(/do-not-print|disabled-user|missing-reader|synthetic|SELECT|INSERT|ECONNREFUSED| at /);
  }
});

test('native CLI reproduces the complete seed on a second empty disposable database', async () => {
  const admin = new Client({ ...configs.bootstrap, database: 'postgres' });
  try {
    await admin.connect();
    await admin.query('DROP DATABASE iop_local');
    await admin.query('CREATE DATABASE iop_local OWNER iop_bootstrap');
  } finally { await admin.end(); }
  const values = { ...input(), IOP_SEED_ORGANIZATION_NAME: 'Fictional Organization',
    IOP_SEED_SITE_NAME: 'Fictional Site', IOP_SEED_SITE_TIME_ZONE: 'UTC' };
  for (const [command, output] of [['provision', 'provisioned'], ['migrate', '5 applied'],
    ['seed-organization', 'created'], ['seed-site', 'created'], ['seed-user', 'created'],
    ['seed-membership', 'created'], ['seed-membership', 'unchanged'], ['provision', 'provisioned'], ['migrate', '0 applied']]) {
    const result = cli(command, values);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(output);
    expect(result.stderr).toBe('');
  }
  expect((await state())[0]).toHaveLength(1);
  expect((await state())[1]).toHaveLength(2);
});

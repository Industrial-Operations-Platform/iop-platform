const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Client } = require('pg');
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const { provisioningConfiguration } = require('../dist/configuration.js');
const { provision } = require('../dist/provision.js');
const { migrate } = require('../dist/migrate.js');

let container;
let configs;
let env;
const temporary = [];
async function query(role, sql, values) {
  const client = new Client(configs[role]);
  try { await client.connect(); return await client.query(sql, values); }
  finally { await client.end(); }
}
function fixture(files) {
  const directory = mkdtempSync(join(tmpdir(), 'iop-019-migrations-'));
  temporary.push(directory);
  for (const [name, sql] of Object.entries(files)) writeFileSync(join(directory, name), '-- Up Migration\n' + sql);
  return directory;
}
async function history() {
  return (await query('migrator', 'SELECT name FROM iop_migrations.history ORDER BY id')).rows;
}

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:17.6-bookworm')
    .withDatabase('iop_local').withUsername('iop_bootstrap')
    .withPassword('synthetic-bootstrap-password').start();
  env = {
    IOP_DATABASE_MODE: 'local', IOP_DATABASE_HOST: container.getHost(),
    IOP_DATABASE_PORT: String(container.getPort()), IOP_DATABASE_NAME: 'iop_local',
    IOP_POSTGRES_PASSWORD: 'synthetic-bootstrap-password',
    // Quote/backslash input proves password DDL cannot become injected SQL.
    IOP_MIGRATOR_PASSWORD: "synthetic-migrator-'\\-password",
    IOP_RUNTIME_PASSWORD: 'synthetic-runtime-password',
  };
  configs = provisioningConfiguration(env);
});
afterAll(async () => {
  for (const directory of temporary) rmSync(directory, { recursive: true, force: true });
  if (container) await container.stop();
});

test('fresh provisioning, simultaneous first migrations and unchanged rerun', async () => {
  await provision(configs);
  const first = await Promise.allSettled([migrate(configs.migrator), migrate(configs.migrator)]);
  expect(first.some((result) => result.status === 'fulfilled')).toBe(true);
  expect(first.filter((result) => result.status === 'fulfilled').reduce((sum, result) => sum + result.value, 0)).toBe(4);
  for (const result of first) {
    if (result.status === 'rejected') expect(result.reason.message).toContain('lock');
  }
  expect(await history()).toEqual([{ name: '20260923000000-privilege-baseline' }, { name: '20260924000000-organizations' }, { name: '20260925000000-sites' }, { name: '20260926000000-users' }]);
  await provision(configs);
  expect(await migrate(configs.migrator)).toBe(0);
  const tables = await query('bootstrap', "SELECT schemaname, tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')");
  expect(tables.rows).toEqual(expect.arrayContaining([{ schemaname: 'iop_migrations', tablename: 'history' }, { schemaname: 'platform_core', tablename: 'organizations' }, { schemaname: 'platform_core', tablename: 'sites' }, { schemaname: 'users_rbac', tablename: 'users' }]));
  expect(tables.rows).toHaveLength(4);
});

test('runtime connects but cannot migrate, change history, create objects or assume elevated roles', async () => {
  expect((await query('runtime', 'SELECT current_user AS name')).rows[0].name).toBe('iop_runtime');
  await expect(migrate(configs.runtime)).rejects.toThrow('migrator');
  for (const sql of [
    'CREATE SCHEMA forbidden', 'CREATE TABLE public.forbidden(id int)',
    'CREATE TEMP TABLE forbidden(id int)', 'SELECT * FROM iop_migrations.history',
    "INSERT INTO iop_migrations.history(name, run_on) VALUES ('forged', now())",
    'TRUNCATE iop_migrations.history', 'SET ROLE iop_migrator', 'SET ROLE iop_bootstrap',
  ]) await expect(query('runtime', sql)).rejects.toMatchObject({ code: '42501' });
  // A real object and SELECT grant ensure truncate denial is not just a missing object/schema.
  await query('migrator', 'CREATE SCHEMA privilege_fixture; CREATE TABLE privilege_fixture.probe(id int); INSERT INTO privilege_fixture.probe VALUES (1); GRANT USAGE ON SCHEMA privilege_fixture TO iop_runtime; GRANT SELECT ON privilege_fixture.probe TO iop_runtime');
  expect((await query('runtime', 'SELECT * FROM privilege_fixture.probe')).rows).toEqual([{ id: 1 }]);
  await expect(query('runtime', 'TRUNCATE privilege_fixture.probe')).rejects.toMatchObject({ code: '42501' });
  await expect(provision(configs)).rejects.toThrow('privileges');
  await query('migrator', 'DROP SCHEMA privilege_fixture CASCADE');
});

test('failed DDL leaves no partial history or objects; corrected fixture applies once', async () => {
  const directory = fixture({
    '20260923000000-privilege-baseline.sql': 'SELECT 1;',
    '20260924000000-organizations.sql': 'SELECT 1;',
    '20260925000000-sites.sql': 'SELECT 1;',
    '20260926000000-users.sql': 'SELECT 1;',
    '20260926000001-failure.sql': 'CREATE TABLE iop_migrations.rollback_probe(id int); SELECT 1 / 0;',
  });
  await expect(migrate(configs.migrator, directory)).rejects.toThrow();
  expect((await query('migrator', "SELECT to_regclass('iop_migrations.rollback_probe') AS object")).rows[0].object).toBeNull();
  expect(await history()).toHaveLength(4);
  writeFileSync(join(directory, '20260926000001-failure.sql'), '-- Up Migration\nCREATE TABLE iop_migrations.rollback_probe(id int);');
  expect(await migrate(configs.migrator, directory)).toBe(1);
  expect(await migrate(configs.migrator, directory)).toBe(0);
  // Remove disposable fixture metadata only; committed migrations are never edited.
  await query('migrator', "DROP TABLE iop_migrations.rollback_probe; DELETE FROM iop_migrations.history WHERE name = '20260926000001-failure'");
});

test('an advisory lock rejects a competing runner and permits an explicit retry', async () => {
  const { PG_MIGRATE_LOCK_ID } = await import('node-pg-migrate');
  const holder = new Client(configs.migrator);
  try {
    await holder.connect();
    await holder.query('SELECT pg_advisory_lock($1)', [PG_MIGRATE_LOCK_ID]);
    await expect(migrate(configs.migrator)).rejects.toThrow('lock');
  } finally { await holder.end(); }
  expect(await migrate(configs.migrator)).toBe(0);
});

test('provisioning rejects changed role attributes, memberships, ownership and passwords', async () => {
  await query('bootstrap', 'ALTER ROLE iop_runtime BYPASSRLS');
  await expect(provision(configs)).rejects.toThrow('incompatible');
  await query('bootstrap', 'ALTER ROLE iop_runtime NOBYPASSRLS; GRANT iop_migrator TO iop_runtime');
  await expect(provision(configs)).rejects.toThrow('incompatible');
  await query('bootstrap', 'REVOKE iop_migrator FROM iop_runtime; ALTER SCHEMA iop_migrations OWNER TO iop_bootstrap');
  await expect(provision(configs)).rejects.toThrow('ownership');
  await query('bootstrap', 'ALTER SCHEMA iop_migrations OWNER TO iop_migrator');
  const changed = { ...configs, runtime: { ...configs.runtime, password: 'different-synthetic-password' } };
  await expect(provision(changed)).rejects.toThrow();
  expect((await query('runtime', 'SELECT 1 AS ok')).rows[0].ok).toBe(1);
  await provision(configs);
});

test('CLI authentication errors do not disclose password, SQL or diagnostics', () => {
  const result = spawnSync(process.execPath, [resolve(__dirname, '../dist/cli.js'), 'migrate'], {
    env: { PATH: process.env.PATH, ...env, IOP_MIGRATOR_PASSWORD: 'do-not-print-this-password' }, encoding: 'utf8',
  });
  expect(result.status).toBe(1);
  expect(result.stderr.trim()).toBe('Local database command failed; check configuration, database availability and provisioning.');
});

test('a second empty database reproduces the same metadata using existing cluster roles', async () => {
  const admin = new Client({ ...configs.bootstrap, database: 'postgres' });
  try {
    await admin.connect();
    // This entire cluster is Testcontainers-owned; no operator volume is targeted.
    await admin.query('DROP DATABASE iop_local');
    await admin.query('CREATE DATABASE iop_local OWNER iop_bootstrap');
  } finally { await admin.end(); }
  await provision(configs);
  expect(await migrate(configs.migrator)).toBe(4);
  expect(await history()).toEqual([{ name: '20260923000000-privilege-baseline' }, { name: '20260924000000-organizations' }, { name: '20260925000000-sites' }, { name: '20260926000000-users' }]);
});

import { Client, type ClientConfig } from 'pg';
import { DatabaseError, databaseName, roles, type DatabaseRole } from './configuration';

const metadataSchema = 'iop_migrations';

export async function verifyRole(client: Client, role: 'migrator' | 'runtime'): Promise<boolean> {
  const result = await client.query(
    `SELECT oid, rolcanlogin, rolsuper, rolinherit, rolcreaterole, rolcreatedb,
       rolreplication, rolbypassrls, rolconnlimit, rolvaliduntil
     FROM pg_roles WHERE rolname = $1`, [roles[role]],
  );
  if (result.rowCount === 0) return false;
  const value = result.rows[0];
  const memberships = await client.query(
    'SELECT 1 FROM pg_auth_members WHERE member = $1 OR roleid = $1', [value.oid],
  );
  const settings = await client.query('SELECT 1 FROM pg_db_role_setting WHERE setrole = $1', [value.oid]);
  if (!value.rolcanlogin || value.rolsuper || value.rolinherit || value.rolcreaterole ||
      value.rolcreatedb || value.rolreplication || value.rolbypassrls || value.rolconnlimit !== -1 ||
      value.rolvaliduntil !== null || memberships.rowCount !== 0 || settings.rowCount !== 0) {
    throw new DatabaseError('Existing database role is incompatible; operator review is required.');
  }
  const ownership = await client.query(
    `SELECT 1 FROM pg_shdepend WHERE refclassid = 'pg_authid'::regclass
       AND refobjid = $1 AND deptype = 'o'
       AND ($2::boolean OR dbid <> (SELECT oid FROM pg_database WHERE datname = current_database()))`,
    [value.oid, role === 'runtime'],
  );
  if (ownership.rowCount !== 0) throw new DatabaseError('Existing database ownership is incompatible.');
  return true;
}

async function verifyRuntimeAccess(client: Client): Promise<void> {
  const history = await client.query("SELECT to_regclass('iop_migrations.history') AS object");
  const installed = history.rows[0].object !== null && (await client.query(
    "SELECT 1 FROM iop_migrations.history WHERE name = '20260926020000-authorization-lookup'",
  )).rowCount === 1;
  const allowedColumns = installed ? [
    'users_rbac.users.user_id', 'users_rbac.users.is_active',
    'users_rbac.organization_memberships.organization_id',
    'users_rbac.organization_memberships.user_id', 'users_rbac.organization_memberships.is_active',
    'users_rbac.site_role_assignments.organization_id', 'users_rbac.site_role_assignments.user_id',
    'users_rbac.site_role_assignments.site_id', 'users_rbac.site_role_assignments.role_id',
    'platform_core.sites.organization_id', 'platform_core.sites.site_id',
  ] : [];
  const schemas = installed ? ['platform_core', 'users_rbac'] : [];
  const result = await client.query(`SELECT
    has_database_privilege($1, current_database(), 'CREATE,TEMPORARY') OR
    EXISTS (SELECT 1 FROM pg_namespace n WHERE nspname NOT LIKE 'pg_%'
      AND nspname <> 'information_schema' AND (
        has_schema_privilege($1, n.oid, 'CREATE') OR
        has_schema_privilege($1, n.oid, 'USAGE') <> (nspname = ANY($2::text[])) OR
        (nspname = ANY($2::text[]) AND pg_get_userbyid(nspowner) <> 'iop_migrator') OR
        EXISTS (SELECT 1 FROM aclexplode(n.nspacl) a WHERE
          (a.grantee = 0 OR a.grantee = (SELECT oid FROM pg_roles WHERE rolname = $1))
          AND (a.grantee = 0 OR a.is_grantable)))) OR
    EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema'
      AND c.relkind IN ('r','p','v','m','f')
      AND has_table_privilege($1, c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) OR
    EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema'
      AND CASE WHEN c.relkind = 'S' THEN has_sequence_privilege($1, c.oid, 'USAGE,SELECT,UPDATE') ELSE false END) OR
    EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema'
      AND has_function_privilege($1, p.oid, 'EXECUTE')) OR
    EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema'
      AND c.relkind IN ('r','p','v','m','f') AND a.attnum > 0 AND NOT a.attisdropped AND (
        has_column_privilege($1, c.oid, a.attnum, 'INSERT,UPDATE,REFERENCES') OR
        has_column_privilege($1, c.oid, a.attnum, 'SELECT') <>
          ((n.nspname || '.' || c.relname || '.' || a.attname) = ANY($3::text[])) OR
        (has_column_privilege($1, c.oid, a.attnum, 'SELECT') AND
          (NOT c.relrowsecurity OR NOT c.relforcerowsecurity OR
           pg_get_userbyid(c.relowner) <> 'iop_migrator')) OR
        EXISTS (SELECT 1 FROM aclexplode(a.attacl) grant_entry WHERE
          (grant_entry.grantee = 0 OR grant_entry.grantee = (SELECT oid FROM pg_roles WHERE rolname = $1))
          AND (grant_entry.grantee = 0 OR grant_entry.is_grantable)))) AS unsafe`,
  [roles.runtime, schemas, allowedColumns]);
  if (result.rows[0].unsafe) throw new DatabaseError('Existing runtime privileges are incompatible.');
}

export async function provision(configs: Record<DatabaseRole, ClientConfig>): Promise<void> {
  const client = new Client(configs.bootstrap);
  try {
    await client.connect();
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(190019)');
    const owner = await client.query(
      `SELECT pg_get_userbyid(datdba) AS owner FROM pg_database WHERE datname = current_database()`,
    );
    if (owner.rows[0]?.owner !== roles.bootstrap) throw new DatabaseError('Local database ownership is incompatible.');
    const existing = {
      migrator: await verifyRole(client, 'migrator'),
      runtime: await verifyRole(client, 'runtime'),
    };
    // Authenticate existing roles before changing privileges; never rotate passwords on rerun.
    for (const role of ['migrator', 'runtime'] as const) {
      if (!existing[role]) continue;
      const probe = new Client(configs[role]);
      try { await probe.connect(); } finally { await probe.end(); }
    }
    const schema = await client.query(
      `SELECT pg_get_userbyid(nspowner) AS owner FROM pg_namespace WHERE nspname = $1`, [metadataSchema],
    );
    if (schema.rowCount && schema.rows[0].owner !== roles.migrator) {
      throw new DatabaseError('Migration schema ownership is incompatible.');
    }
    if (schema.rowCount) {
      const grants = await client.query(
        `SELECT 1 FROM pg_namespace n, LATERAL aclexplode(n.nspacl) a
         WHERE n.nspname = $1 AND a.grantee <> n.nspowner`, [metadataSchema],
      );
      if (grants.rowCount) throw new DatabaseError('Migration schema privileges are incompatible.');
    }
    for (const role of ['migrator', 'runtime'] as const) {
      if (existing[role]) continue;
      // SQL utility statements cannot parameterize PASSWORD. Obtain a server-quoted
      // literal from a bound parameter; only fixed identifiers enter the DDL.
      const literal = await client.query('SELECT quote_literal($1::text) AS password', [configs[role].password]);
      await client.query(`CREATE ROLE ${roles[role]} LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD ${literal.rows[0].password}`);
    }
    await client.query(`REVOKE ALL ON DATABASE ${databaseName} FROM PUBLIC`);
    await client.query('REVOKE ALL ON SCHEMA public FROM PUBLIC');
    await client.query(`GRANT CONNECT, CREATE ON DATABASE ${databaseName} TO ${roles.migrator}`);
    await client.query(`GRANT CONNECT ON DATABASE ${databaseName} TO ${roles.runtime}`);
    if (!schema.rowCount) await client.query(`CREATE SCHEMA ${metadataSchema} AUTHORIZATION ${roles.migrator}`);
    await verifyRuntimeAccess(client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

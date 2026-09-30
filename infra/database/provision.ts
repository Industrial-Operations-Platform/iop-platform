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
  const batchesInstalled = history.rows[0].object !== null && (await client.query(
    "SELECT 1 FROM iop_migrations.history WHERE name = '20260926030000-import-batches'",
  )).rowCount === 1;
  const batchColumns = ['organization_id', 'site_id', 'source_id', 'import_id', 'raw_id',
    'original_filename', 'reporting_date', 'original_bytes', 'byte_length', 'sha256',
    'received_at', 'submitted_by', 'adapter_revision', 'profile_revision', 'mapping_revision',
    'site_time_zone', 'reporting_window_status', 'outcome', 'completed_at', 'reason_code',
    'data_record_count', 'admitted_record_count', 'rejected_record_count', 'inspected_valid_count',
    'inspected_invalid_count', 'inspection_complete', 'unclassified_count', 'repeated_count',
    'diagnostics', 'diagnostics_truncated'];
  const batchInsert = batchColumns.slice(0, 10).concat(['submitted_by', 'adapter_revision',
    'profile_revision', 'mapping_revision', 'site_time_zone']);
  const batchUpdate = batchColumns.slice(17);
  const claimColumns = ['organization_id', 'site_id', 'source_id', 'reporting_date', 'import_id'];
  const columns = (table: string, names: string[]) => names.map(name => `integrations.${table}.${name}`);
  const inserts = batchesInstalled ? columns('import_batches', batchInsert)
    .concat(columns('import_date_claims', claimColumns)) : [];
  const updates = batchesInstalled ? columns('import_batches', batchUpdate)
    .concat(columns('import_quota', ['retained_attempts', 'retained_bytes'])) : [];
  if (batchesInstalled) allowedColumns.push(...columns('import_batches', batchColumns),
    ...columns('import_date_claims', claimColumns),
    ...columns('import_quota', ['singleton', 'retained_attempts', 'retained_bytes']));
  const schemas = installed ? ['platform_core', 'users_rbac'] : [];
  if (batchesInstalled) schemas.push('integrations');
  const oipInstalled = history.rows[0].object !== null && (await client.query(
    "SELECT 1 FROM iop_migrations.history WHERE name = '20260927000000-oip-aggregates'",
  )).rowCount === 1;
  if (oipInstalled) {
    schemas.push('oip');
    allowedColumns.push('platform_core.sites.time_zone');
    const oipColumns = {
      publications: ['organization_id','site_id','source_id','import_id','reporting_date','raw_id','record_count','context'],
      facts: ['organization_id','site_id','source_id','import_id','reporting_date','source_record_number',
        'reported_frequency','accumulated_alarm_seconds','sector_ref','area_ref','equipment_ref','message_ref','payload'],
    };
    for (const [table, names] of Object.entries(oipColumns)) {
      const qualified = names.map(name => `oip.${table}.${name}`);
      allowedColumns.push(...qualified); inserts.push(...qualified);
    }
  }
  const reportingInstalled = history.rows[0].object !== null && (await client.query(
    "SELECT 1 FROM iop_migrations.history WHERE name='20260928000000-reporting-profiles'",
  )).rowCount === 1;
  if (reportingInstalled) {
    const names=['organization_id','site_id','source_id','version','config'].map(n=>`oip.reporting_profiles.${n}`);
    allowedColumns.push(...names); inserts.push(...names);
    updates.push('oip.reporting_profiles.version','oip.reporting_profiles.config');
  }
  const hitlisteInstalled = history.rows[0].object !== null && (await client.query(
    "SELECT 1 FROM iop_migrations.history WHERE name='20260929000000-hitliste-analytics'",
  )).rowCount === 1;
  if (hitlisteInstalled) {
    schemas.push('analytics');
    const catalogs = ['sektor','bereich','meldetext','meldung_typ','meldegruppe'];
    for (const table of catalogs) {
      const names = ['organization_id','site_id','source_id','id','name', ...(table === 'sektor' ? ['is_unclassified'] : [])];
      const qualified = names.map(n => `analytics.${table}.${n}`);
      allowedColumns.push(...qualified); inserts.push(...qualified);
    }
    const equipment = ['organization_id','site_id','source_id','id','kennzeichen','bereich_id'].map(n => `analytics.betriebsmittel.${n}`);
    allowedColumns.push(...equipment); inserts.push(...equipment);
    const facts = ['organization_id', 'site_id', 'source_id', 'import_id', 'source_record_number', 'datum', 'haufigkeit', 'dauer_sekunden', 'dauer_original', 'sektor_id', 'bereich_id', 'betriebsmittel_id', 'meldetext_id', 'typ_id', 'meldegruppe_id', 'profile_version'].map(n => `analytics.fact_hitliste.${n}`);
    allowedColumns.push(...facts); inserts.push(...facts);
    updates.push(...['sektor_id', 'bereich_id', 'betriebsmittel_id', 'meldetext_id', 'typ_id', 'meldegruppe_id', 'profile_version'].map(n => `analytics.fact_hitliste.${n}`));
  }
  const accessInstalled = history.rows[0].object !== null && (await client.query(
    "SELECT 1 FROM iop_migrations.history WHERE name='20260930000000-transitional-access'",
  )).rowCount === 1;
  if (accessInstalled) {
    schemas.push('authentication');
    allowedColumns.push(...['organization_id', 'user_id', 'site_id', 'display_name', 'profile'].map(n => `users_rbac.profiles.${n}`));
    inserts.push(...['organization_id', 'user_id', 'site_id', 'display_name', 'profile'].map(n => `users_rbac.profiles.${n}`));
    updates.push(...['profile'].map(n => `users_rbac.profiles.${n}`));
    allowedColumns.push(...['organization_id', 'user_id', 'role_id', 'is_active'].map(n => `users_rbac.organization_role_assignments.${n}`));
    inserts.push(...['organization_id', 'user_id', 'role_id', 'is_active'].map(n => `users_rbac.organization_role_assignments.${n}`));
    updates.push(...['is_active'].map(n => `users_rbac.organization_role_assignments.${n}`));
    allowedColumns.push(...['organization_id', 'user_id', 'username', 'password_hash', 'must_change', 'version', 'failures', 'blocked_until'].map(n => `authentication.credentials.${n}`));
    inserts.push(...['organization_id', 'user_id', 'username', 'password_hash', 'must_change', 'version', 'failures', 'blocked_until'].map(n => `authentication.credentials.${n}`));
    updates.push(...['password_hash', 'must_change', 'version', 'failures', 'blocked_until'].map(n => `authentication.credentials.${n}`));
    allowedColumns.push(...['digest', 'organization_id', 'user_id', 'credential_version', 'expires_at', 'revoked'].map(n => `authentication.sessions.${n}`));
    inserts.push(...['digest', 'organization_id', 'user_id', 'credential_version', 'expires_at', 'revoked'].map(n => `authentication.sessions.${n}`));
    updates.push(...['revoked'].map(n => `authentication.sessions.${n}`));
    allowedColumns.push(...['organization_id', 'window_start', 'attempts'].map(n => `authentication.login_budget.${n}`));
    inserts.push(...['organization_id', 'window_start', 'attempts'].map(n => `authentication.login_budget.${n}`));
    updates.push(...['window_start', 'attempts'].map(n => `authentication.login_budget.${n}`));
    allowedColumns.push(...['id', 'organization_id', 'actor_id', 'subject_id', 'action', 'detail', 'recorded_at'].map(n => `users_rbac.access_audit.${n}`));
    inserts.push(...['id', 'organization_id', 'actor_id', 'subject_id', 'action', 'detail'].map(n => `users_rbac.access_audit.${n}`));
    allowedColumns.push('users_rbac.site_role_assignments.is_active');
    inserts.push('users_rbac.users.user_id','users_rbac.users.is_active',
      ...['organization_id','user_id','is_active'].map(n => `users_rbac.organization_memberships.${n}`),
      ...['organization_id','user_id','site_id','role_id'].map(n => `users_rbac.site_role_assignments.${n}`));
    updates.push('users_rbac.organization_memberships.is_active','users_rbac.site_role_assignments.is_active');
  }
  const handoverInstalled = installed && (await client.query(
    "SELECT 1 FROM iop_migrations.history WHERE name='20261001000000-shift-handover'",
  )).rowCount;
  if (handoverInstalled) {
    schemas.push('shift_handover');
    for (const [table, columns] of Object.entries({
      equipment_references: ['organization_id','site_id','id','namespace','code','department_id','area_id'],
      entries: ['organization_id','site_id','id','author_id','responsible_id','equipment_id','occurrence_date','created_at','revision','snapshot','request_key','fingerprint'],
      revisions: ['organization_id','site_id','entry_id','revision','actor_id','recorded_at','snapshot'],
    })) {
      allowedColumns.push(...columns.map(n=>`shift_handover.${table}.${n}`));
      inserts.push(...columns.map(n=>`shift_handover.${table}.${n}`));
    }
    updates.push(...['responsible_id','equipment_id','occurrence_date','revision','snapshot'].map(n=>`shift_handover.entries.${n}`));
  }
  const workforceInstalled = installed && (await client.query(
    "SELECT 1 FROM iop_migrations.history WHERE name='20261003000000-workforce'",
  )).rowCount;
  if (workforceInstalled) {
    schemas.push('workforce');
    for (const [table,columns] of Object.entries({
      records:['organization_id','site_id','kind','id','business_date','revision','snapshot'],
      revisions:['organization_id','site_id','kind','id','revision','snapshot'],
    })) {
      allowedColumns.push(...columns.map(n=>`workforce.${table}.${n}`));
      inserts.push(...columns.map(n=>`workforce.${table}.${n}`));
    }
    updates.push(...['business_date','revision','snapshot'].map(n=>`workforce.records.${n}`));
  }
  const deletionInstalled = installed && (await client.query(
    "SELECT 1 FROM iop_migrations.history WHERE name='20261004000000-logical-profile-deletion'",
  )).rowCount;
  if (deletionInstalled) {
    allowedColumns.push('users_rbac.profiles.deleted_at');
    updates.push('users_rbac.profiles.deleted_at');
  }
  const displayNameInstalled = installed && (await client.query(
    "SELECT 1 FROM iop_migrations.history WHERE name='20261005000000-profile-display-name'",
  )).rowCount;
  if (displayNameInstalled) updates.push('users_rbac.profiles.display_name');
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
        has_column_privilege($1, c.oid, a.attnum, 'REFERENCES') OR
        has_column_privilege($1, c.oid, a.attnum, 'INSERT') <>
          ((n.nspname || '.' || c.relname || '.' || a.attname) = ANY($4::text[])) OR
        has_column_privilege($1, c.oid, a.attnum, 'UPDATE') <>
          ((n.nspname || '.' || c.relname || '.' || a.attname) = ANY($5::text[])) OR
        has_column_privilege($1, c.oid, a.attnum, 'SELECT') <>
          ((n.nspname || '.' || c.relname || '.' || a.attname) = ANY($3::text[])) OR
        (has_column_privilege($1, c.oid, a.attnum, 'SELECT') AND
          (NOT c.relrowsecurity OR NOT c.relforcerowsecurity OR
           pg_get_userbyid(c.relowner) <> 'iop_migrator')) OR
        EXISTS (SELECT 1 FROM aclexplode(a.attacl) grant_entry WHERE
          (grant_entry.grantee = 0 OR grant_entry.grantee = (SELECT oid FROM pg_roles WHERE rolname = $1))
          AND (grant_entry.grantee = 0 OR grant_entry.is_grantable)))) AS unsafe`,
  [roles.runtime, schemas, allowedColumns, inserts, updates]);
  if (result.rows[0].unsafe) throw new DatabaseError('Existing runtime privileges are incompatible.');
  if (batchesInstalled) {
    // Bootstrap-only integrity check; runtime must not scan foreign receipts for quota.
    const quota = await client.query(`SELECT q.retained_attempts = b.attempts
        AND q.retained_bytes = b.bytes AS consistent
      FROM integrations.import_quota q CROSS JOIN
        (SELECT count(*) AS attempts, coalesce(sum(byte_length),0) AS bytes FROM integrations.import_batches) b
      WHERE q.singleton`);
    if (quota.rows.length !== 1 || !quota.rows[0].consistent) {
      throw new DatabaseError('Import quota is inconsistent; operator review is required.');
    }
  }
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

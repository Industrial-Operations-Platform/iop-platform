import { Client } from 'pg';
import { configuration, DatabaseError, roles } from './configuration';
import { verifyRole } from './provision';

export function siteConfiguration(env: NodeJS.ProcessEnv): {
  organizationId: string; id: string; name: string; timeZone: string;
} {
  const organizationId = env.IOP_SEED_ORGANIZATION_ID;
  const id = env.IOP_SEED_SITE_ID;
  const name = env.IOP_SEED_SITE_NAME;
  const timeZone = env.IOP_SEED_SITE_TIME_ZONE;
  const validId = (value: string | undefined): value is string =>
    !!value && /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}(?![\s\S])/.test(value);
  if (!validId(organizationId) || !validId(id)) {
    throw new DatabaseError('Valid explicit organization and site IDs are required.');
  }
  if (!name || Array.from(name).length > 200 || name.trim() !== name ||
      /[\u0000-\u001f\u007f-\u009f\ud800-\udfff]/u.test(name)) {
    throw new DatabaseError('A valid explicit site display name is required.');
  }
  if (!timeZone || timeZone.length > 100 ||
      !/^(UTC|[A-Za-z][A-Za-z0-9_+-]*(\/[A-Za-z0-9_+-]+)+)(?![\s\S])/.test(timeZone)) {
    throw new DatabaseError('A valid explicit site time zone is required.');
  }
  try { new Intl.DateTimeFormat('en', { timeZone }); }
  catch { throw new DatabaseError('A valid explicit site time zone is required.'); }
  return { organizationId, id, name, timeZone };
}

export async function seedSite(env: NodeJS.ProcessEnv): Promise<'created' | 'unchanged'> {
  const site = siteConfiguration(env);
  const client = new Client(configuration(env, 'migrator'));
  try {
    await client.connect();
    const identity = await client.query('SELECT current_user AS name');
    if (identity.rows[0].name !== roles.migrator || !(await verifyRole(client, 'migrator'))) {
      throw new DatabaseError('Site seed requires the dedicated migrator role.');
    }
    await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
    await client.query(`SELECT set_config('iop.seed_organization_id', $1, true),
      set_config('iop.seed_site_id', $2, true)`, [site.organizationId, site.id]);
    const owner = await client.query(
      'SELECT 1 FROM platform_core.organizations WHERE organization_id = $1', [site.organizationId],
    );
    if (owner.rowCount !== 1) throw new DatabaseError('Site seed requires an existing organization.');
    const zone = await client.query('SELECT 1 FROM pg_catalog.pg_timezone_names WHERE name COLLATE "C" = $1', [site.timeZone]);
    if (zone.rowCount !== 1) throw new DatabaseError('Site time zone is not supported by the database.');
    // Either identity index may detect a concurrent insert first. Both identify
    // the same site; handle either conflict, then verify the scoped committed row.
    const inserted = await client.query(
      `INSERT INTO platform_core.sites (site_id, organization_id, display_name, time_zone)
       VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [site.id, site.organizationId, site.name, site.timeZone],
    );
    // A separate READ COMMITTED statement sees the winning concurrent insert.
    const existing = await client.query(
      'SELECT organization_id, display_name, time_zone FROM platform_core.sites WHERE site_id = $1', [site.id],
    );
    const row = existing.rows[0];
    if (existing.rowCount !== 1 || row.organization_id !== site.organizationId ||
        row.display_name !== site.name || row.time_zone !== site.timeZone) {
      throw new DatabaseError('Site seed conflicts with existing configuration; no changes were made.');
    }
    await client.query('COMMIT');
    return inserted.rowCount === 1 ? 'created' : 'unchanged';
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

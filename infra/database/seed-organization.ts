import { Client } from 'pg';
import { configuration, DatabaseError, roles } from './configuration';
import { verifyRole } from './provision';

export function organizationConfiguration(env: NodeJS.ProcessEnv): { id: string; name: string } {
  const id = env.IOP_SEED_ORGANIZATION_ID;
  const name = env.IOP_SEED_ORGANIZATION_NAME;
  if (!id || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}(?![\s\S])/.test(id)) {
    throw new DatabaseError('A valid explicit organization ID is required.');
  }
  if (!name || Array.from(name).length > 200 || name.trim() !== name ||
      /[\u0000-\u001f\u007f-\u009f\ud800-\udfff]/u.test(name)) {
    throw new DatabaseError('A valid explicit organization display name is required.');
  }
  return { id, name };
}

export async function seedOrganization(env: NodeJS.ProcessEnv): Promise<'created' | 'unchanged'> {
  const organization = organizationConfiguration(env);
  const client = new Client(configuration(env, 'migrator'));
  try {
    await client.connect();
    const identity = await client.query('SELECT current_user AS name');
    if (identity.rows[0].name !== roles.migrator || !(await verifyRole(client, 'migrator'))) {
      throw new DatabaseError('Organization seed requires the dedicated migrator role.');
    }
    await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
    await client.query("SELECT set_config('iop.seed_organization_id', $1, true)", [organization.id]);
    const inserted = await client.query(
      `INSERT INTO platform_core.organizations (organization_id, display_name)
       VALUES ($1, $2) ON CONFLICT (organization_id) DO NOTHING`,
      [organization.id, organization.name],
    );
    // A separate READ COMMITTED statement sees the winning concurrent insert.
    const existing = await client.query(
      'SELECT display_name FROM platform_core.organizations WHERE organization_id = $1', [organization.id],
    );
    if (existing.rows.length !== 1 || existing.rows[0].display_name !== organization.name) {
      throw new DatabaseError('Organization seed conflicts with existing configuration; no changes were made.');
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

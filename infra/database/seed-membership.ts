import { Client } from 'pg';
import { configuration, DatabaseError, roles } from './configuration';
import { verifyRole } from './provision';

export function membershipConfiguration(env: NodeJS.ProcessEnv): {
  organizationId: string; userId: string; siteId: string;
} {
  const organizationId = env.IOP_SEED_ORGANIZATION_ID;
  const userId = env.IOP_SEED_USER_ID;
  const siteId = env.IOP_SEED_SITE_ID;
  const validId = (value: string | undefined): value is string =>
    !!value && /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}(?![\s\S])/.test(value);
  if (!validId(organizationId) || !validId(userId) || !validId(siteId)) {
    throw new DatabaseError('Valid explicit organization, user and site IDs are required.');
  }
  return { organizationId, userId, siteId };
}

export async function seedMembership(env: NodeJS.ProcessEnv): Promise<'created' | 'unchanged'> {
  const target = membershipConfiguration(env);
  const client = new Client(configuration(env, 'migrator'));
  try {
    await client.connect();
    const identity = await client.query('SELECT current_user AS name');
    if (identity.rows[0].name !== roles.migrator || !(await verifyRole(client, 'migrator'))) {
      throw new DatabaseError('Membership seed requires the dedicated migrator role.');
    }
    await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
    await client.query(`SELECT set_config('iop.seed_organization_id', $1, true),
      set_config('iop.seed_user_id', $2, true), set_config('iop.seed_site_id', $3, true)`,
    [target.organizationId, target.userId, target.siteId]);
    // Serialize this command for a membership across all sites. Hash collisions
    // only delay unrelated seeds; current state is read after acquiring the lock.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))',
      [target.organizationId, target.userId]);
    const user = await client.query(
      'SELECT is_active FROM users_rbac.users WHERE user_id = $1', [target.userId]);
    const site = await client.query(`SELECT 1 FROM platform_core.sites s
      JOIN platform_core.organizations o USING (organization_id)
      WHERE s.organization_id = $1 AND s.site_id = $2`, [target.organizationId, target.siteId]);
    if (user.rowCount !== 1 || user.rows[0].is_active !== true || site.rowCount !== 1) {
      throw new DatabaseError('Membership seed requires an active user and an existing owned site.');
    }
    const membership = await client.query(`SELECT is_active FROM users_rbac.organization_memberships
      WHERE organization_id = $1 AND user_id = $2`, [target.organizationId, target.userId]);
    let result: 'created' | 'unchanged';
    if (membership.rowCount === 0) {
      await client.query(`INSERT INTO users_rbac.organization_memberships
        (organization_id, user_id, is_active) VALUES ($1, $2, true)`,
      [target.organizationId, target.userId]);
      await client.query(`INSERT INTO users_rbac.site_role_assignments
        (organization_id, user_id, site_id, role_id)
        VALUES ($1, $2, $3, 'site-operator'), ($1, $2, $3, 'analytics-reader')`,
      [target.organizationId, target.userId, target.siteId]);
      result = 'created';
    } else {
      const assignments = await client.query(`SELECT role_id FROM users_rbac.site_role_assignments
        WHERE organization_id = $1 AND user_id = $2 AND site_id = $3 ORDER BY role_id`,
      [target.organizationId, target.userId, target.siteId]);
      if (membership.rows[0].is_active !== true || assignments.rowCount !== 2 ||
          assignments.rows[0].role_id !== 'analytics-reader' || assignments.rows[1].role_id !== 'site-operator') {
        throw new DatabaseError('Membership seed conflicts with existing access state; no changes were made.');
      }
      result = 'unchanged';
    }
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

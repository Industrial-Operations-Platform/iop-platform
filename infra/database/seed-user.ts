import { Client } from 'pg';
import { configuration, DatabaseError, roles } from './configuration';
import { verifyRole } from './provision';

export function userConfiguration(env: NodeJS.ProcessEnv): { id: string } {
  const id = env.IOP_SEED_USER_ID;
  if (!id || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}(?![\s\S])/.test(id)) {
    throw new DatabaseError('A valid explicit user ID is required.');
  }
  return { id };
}

export async function seedUser(env: NodeJS.ProcessEnv): Promise<'created' | 'unchanged'> {
  const user = userConfiguration(env);
  const client = new Client(configuration(env, 'migrator'));
  try {
    await client.connect();
    const identity = await client.query('SELECT current_user AS name');
    if (identity.rows[0].name !== roles.migrator || !(await verifyRole(client, 'migrator'))) {
      throw new DatabaseError('User seed requires the dedicated migrator role.');
    }
    await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
    await client.query("SELECT set_config('iop.seed_user_id', $1, true)", [user.id]);
    const inserted = await client.query(
      `INSERT INTO users_rbac.users (user_id, is_active)
       VALUES ($1, true) ON CONFLICT (user_id) DO NOTHING`, [user.id],
    );
    // A separate READ COMMITTED statement sees the winning concurrent insert.
    const existing = await client.query(
      'SELECT is_active FROM users_rbac.users WHERE user_id = $1', [user.id],
    );
    if (existing.rowCount !== 1 || existing.rows[0].is_active !== true) {
      throw new DatabaseError('User seed conflicts with existing identity; no changes were made.');
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

import { resolve } from 'node:path';
import { Client, type ClientConfig } from 'pg';
import { DatabaseError, roles } from './configuration';
import { verifyRole } from './provision';

export async function migrate(config: ClientConfig, directory = resolve(__dirname, '../migrations')): Promise<number> {
  const client = new Client(config);
  try {
    await client.connect();
    const identity = await client.query('SELECT current_user AS name');
    if (identity.rows[0].name !== roles.migrator || !(await verifyRole(client, 'migrator'))) {
      throw new DatabaseError('Migrations require the dedicated migrator role.');
    }
    const { runner } = await import('node-pg-migrate');
    const migrations = await runner({
      dbClient: client, dir: directory, direction: 'up',
      migrationsSchema: 'iop_migrations', migrationsTable: 'history',
      schema: 'iop_migrations', createSchema: false, createMigrationsSchema: false,
      checkOrder: true, singleTransaction: true, noLock: false,
      // Fail on contention so operators explicitly retry; no hidden background runner.
      advisoryLockMode: 'fail',
      logger: { debug() {}, info() {}, warn() {}, error() {} },
    });
    return migrations.length;
  } finally {
    await client.end();
  }
}

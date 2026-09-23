import type { ClientConfig } from 'pg';

export const databaseName = 'iop_local';
export const roles = { bootstrap: 'iop_bootstrap', migrator: 'iop_migrator', runtime: 'iop_runtime' } as const;
export type DatabaseRole = keyof typeof roles;
export class DatabaseError extends Error {}

const passwordFields = {
  bootstrap: 'IOP_POSTGRES_PASSWORD',
  migrator: 'IOP_MIGRATOR_PASSWORD',
  runtime: 'IOP_RUNTIME_PASSWORD',
} as const;

export function configuration(env: NodeJS.ProcessEnv, role: DatabaseRole): ClientConfig {
  if (env.IOP_DATABASE_MODE !== 'local') throw new DatabaseError('Explicit local database mode is required.');
  const host = env.IOP_DATABASE_HOST;
  if (!host || !['127.0.0.1', 'localhost', '::1', 'database'].includes(host)) {
    throw new DatabaseError('A supported local database host is required.');
  }
  const port = env.IOP_DATABASE_PORT;
  if (!port || !/^[1-9][0-9]{0,4}$/.test(port) || Number(port) > 65535) {
    throw new DatabaseError('A valid explicit database port is required.');
  }
  if (env.IOP_DATABASE_NAME !== databaseName) throw new DatabaseError('The dedicated local database is required.');
  const password = env[passwordFields[role]];
  if (!password || Buffer.byteLength(password) < 16 || Buffer.byteLength(password) > 256 || password.includes('\0')) {
    throw new DatabaseError('A database password of 16 to 256 bytes is required.');
  }
  return {
    host, port: Number(port), database: databaseName, user: roles[role], password,
    ssl: false, connectionTimeoutMillis: 5000, statement_timeout: 30000,
    application_name: 'iop-local-database',
    // Override libpq environment defaults, including PGOPTIONS/search_path.
    options: '-c search_path=pg_catalog -c lock_timeout=5000',
  };
}

export function provisioningConfiguration(env: NodeJS.ProcessEnv): Record<DatabaseRole, ClientConfig> {
  const configs = {
    bootstrap: configuration(env, 'bootstrap'),
    migrator: configuration(env, 'migrator'),
    runtime: configuration(env, 'runtime'),
  };
  if (new Set(Object.values(configs).map((value) => value.password)).size !== 3) {
    throw new DatabaseError('Database roles require separate passwords.');
  }
  return configs;
}

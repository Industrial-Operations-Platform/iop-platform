import type { Pool, PoolClient } from 'pg';
import { evaluateSiteAccess, validSiteAccessRequest, type SiteAccessRequest,
  type LookupQuery } from '../modules/users-rbac';
import { siteBelongsToOrganization } from '../modules/platform-core';

export class SiteAccessDeniedError extends Error {
  constructor() { super('Site operation is not permitted.'); }
}
export class AuthorizationUnavailableError extends Error {
  constructor() { super('Site authorization is unavailable.'); }
}
export interface SiteOperationContext {
  readonly userId: string;
  readonly organizationId: string;
  readonly siteId: string;
}
export interface SiteTransaction extends LookupQuery {
  readonly context: SiteOperationContext;
}

const selectors = ['iop.lookup_user_id', 'iop.lookup_organization_id', 'iop.lookup_site_id',
  'iop.user_id', 'iop.organization_id', 'iop.site_id'];

async function assertClean(client: PoolClient): Promise<void> {
  const result = await client.query(`SELECT
    current_user = 'iop_runtime' AND session_user = 'iop_runtime'
      AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcreaterole
      AND NOT rolcreatedb AND NOT rolreplication AND NOT rolinherit
      AND NOT EXISTS (SELECT 1 FROM pg_auth_members WHERE member = r.oid)
      AND NOT EXISTS (SELECT 1 FROM pg_shdepend
        WHERE refclassid = 'pg_authid'::regclass AND refobjid = r.oid AND deptype = 'o')
      AND NOT EXISTS (SELECT 1 FROM unnest($1::text[]) setting
        WHERE coalesce(current_setting(setting, true), '') <> '') AS clean
    FROM pg_roles r WHERE rolname = current_user`, [selectors]);
  if (result.rows[0]?.clean !== true) throw new AuthorizationUnavailableError();
}

/**
 * Use a dedicated runtime pool with clean defaults. Callbacks own domain validation,
 * use only this handle, and must await their queries. No callback may change context
 * or transaction state. A new operation/retry always acquires and authorizes afresh.
 */
export async function runSiteOperation<T>(
  pool: Pick<Pool, 'connect'>, request: SiteAccessRequest,
  operation: (transaction: SiteTransaction) => Promise<T>,
): Promise<T> {
  if (!validSiteAccessRequest(request)) throw new SiteAccessDeniedError();
  // Snapshot caller-owned objects before the first await.
  const input = Object.freeze({ ...request, permissions: Object.freeze([...request.permissions]) });
  const context = Object.freeze({ userId: input.userId,
    organizationId: input.organizationId, siteId: input.siteId });
  let client: PoolClient;
  try { client = await pool.connect(); }
  catch { throw new AuthorizationUnavailableError(); }
  let connectionFailed = false;
  const connectionError = () => { connectionFailed = true; };
  client.on('error', connectionError);
  let inTransaction = false;
  let reusable = false;
  let active = false;
  let callbackError: unknown;
  let callbackFailed = false;
  try {
    await assertClean(client);
    await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
    inTransaction = true;
    await client.query(`SELECT set_config('iop.lookup_user_id', $1, true),
      set_config('iop.lookup_organization_id', $2, true), set_config('iop.lookup_site_id', $3, true),
      set_config('iop.user_id', '', true), set_config('iop.organization_id', '', true),
      set_config('iop.site_id', '', true)`, [input.userId, input.organizationId, input.siteId]);
    if (!(await siteBelongsToOrganization(client, input.organizationId, input.siteId)) ||
        !(await evaluateSiteAccess(client, input)).allowed) throw new SiteAccessDeniedError();
    await client.query(`SELECT set_config('iop.user_id', $1, true),
      set_config('iop.organization_id', $2, true), set_config('iop.site_id', $3, true)`,
    [input.userId, input.organizationId, input.siteId]);
    active = true;
    const transaction: SiteTransaction = Object.freeze({ context,
      query: async (sql: string, values?: unknown[]) => {
        if (!active) throw new AuthorizationUnavailableError();
        try { return await client.query(sql, values); }
        catch { throw new AuthorizationUnavailableError(); }
      },
    });
    let value: T;
    try { value = await operation(transaction); }
    catch (error) { callbackFailed = true; callbackError = error; throw error; }
    finally { active = false; }
    if (connectionFailed) throw new AuthorizationUnavailableError();
    const commit = await client.query('COMMIT');
    inTransaction = false;
    // PostgreSQL can report ROLLBACK when COMMIT follows a swallowed SQL error.
    if (commit.command !== 'COMMIT') throw new AuthorizationUnavailableError();
    await assertClean(client);
    reusable = true;
    return value;
  } catch (error) {
    if (inTransaction) {
      try {
        await client.query('ROLLBACK');
        await assertClean(client);
        reusable = true;
      } catch { reusable = false; }
    }
    if (callbackFailed) throw callbackError;
    if (error instanceof SiteAccessDeniedError) throw error;
    throw new AuthorizationUnavailableError();
  } finally {
    active = false;
    client.removeListener('error', connectionError);
    client.release(!reusable || connectionFailed);
  }
}

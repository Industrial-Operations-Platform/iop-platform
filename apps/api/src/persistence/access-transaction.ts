import type { Pool, PoolClient } from "pg";
export interface AccessScope {
  organizationId: string;
  siteId: string;
}
const selectors = [
  "iop.access_organization_id",
  "iop.access_site_id",
  "iop.access_write",
  "iop.access_new_user_id",
  "iop.lookup_user_id",
  "iop.lookup_organization_id",
  "iop.lookup_site_id",
  "iop.user_id",
  "iop.organization_id",
  "iop.site_id",
];
async function assertClean(client: PoolClient): Promise<void> {
  const result = await client.query(
    `SELECT current_user='iop_runtime' AND session_user='iop_runtime'
    AND NOT rolsuper AND NOT rolbypassrls AND NOT rolinherit
    AND NOT EXISTS(SELECT 1 FROM unnest($1::text[]) setting WHERE coalesce(current_setting(setting,true),'')<>'') AS clean
    FROM pg_roles WHERE rolname=current_user`,
    [selectors],
  );
  if (result.rows[0]?.clean !== true)
    throw new Error("Access connection is not isolated.");
}
/** Every access mutation shares the organization lock; pooled selectors are transaction-local. */
export async function accessTransaction<T>(
  pool: Pool,
  scope: AccessScope,
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  let reusable = false;
  let inTransaction = false;
  try {
    await assertClean(client);
    await client.query("BEGIN");
    inTransaction = true;
    await client.query("SELECT pg_advisory_xact_lock_shared(190147)");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('iop-access'), hashtext($1))",
      [scope.organizationId],
    );
    await client.query(
      "SELECT set_config('iop.access_organization_id',$1,true),set_config('iop.access_site_id',$2,true)",
      [scope.organizationId, scope.siteId],
    );
    const result = await work(client);
    const commit = await client.query("COMMIT");
    inTransaction = false;
    if (commit.command !== "COMMIT")
      throw new Error("Access transaction did not commit.");
    await assertClean(client);
    reusable = true;
    return result;
  } catch (error) {
    if (inTransaction) {
      try {
        await client.query("ROLLBACK");
        await assertClean(client);
        reusable = true;
      } catch {
        /* Discard a failed or contaminated connection. */
      }
    }
    throw error;
  } finally {
    client.release(!reusable);
  }
}

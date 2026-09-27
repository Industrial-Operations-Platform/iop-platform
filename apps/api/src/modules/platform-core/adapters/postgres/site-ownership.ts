interface OwnershipQuery {
  query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

/** The scoped pair, not a site label or role name, establishes ownership. */
export async function siteBelongsToOrganization(
  database: OwnershipQuery, organizationId: string, siteId: string,
): Promise<boolean> {
  const result = await database.query(
    'SELECT site_id FROM platform_core.sites WHERE organization_id = $1 AND site_id = $2',
    [organizationId, siteId],
  );
  return result.rows.length === 1;
}

import type { LookupQuery } from "./authorization";
/** Module-owned projection for operational responsibility; no credentials or role fields. */
export async function sitePeople(
  query: LookupQuery,
  organizationId: string,
  siteId: string,
): Promise<{ id: string; name: string }[]> {
  const result = await query.query(
    `SELECT p.user_id AS id,p.display_name AS name FROM users_rbac.profiles p
    JOIN users_rbac.organization_memberships m USING(organization_id,user_id)
    JOIN users_rbac.users u USING(user_id)
    WHERE p.organization_id=$1 AND p.site_id=$2 AND m.is_active AND u.is_active
    ORDER BY p.display_name,p.user_id LIMIT 201`,
    [organizationId, siteId],
  );
  if (result.rows.length > 200)
    throw new Error("Site directory exceeds the configured limit.");
  return result.rows as { id: string; name: string }[];
}

/** Workforce directory includes the operational profile, never credentials. */
export async function workforcePeople(
  query: LookupQuery,
  organizationId: string,
  siteId: string,
) {
  const result = await query.query(
    `SELECT p.user_id AS id,p.display_name AS name,p.profile FROM users_rbac.profiles p
    JOIN users_rbac.organization_memberships m USING(organization_id,user_id) JOIN users_rbac.users u USING(user_id)
    WHERE p.organization_id=$1 AND p.site_id=$2 AND m.is_active AND u.is_active ORDER BY p.display_name LIMIT 201`,
    [organizationId, siteId],
  );
  if (result.rows.length > 200)
    throw new Error("Site directory exceeds the configured limit.");
  return result.rows as { id: string; name: string; profile: string }[];
}

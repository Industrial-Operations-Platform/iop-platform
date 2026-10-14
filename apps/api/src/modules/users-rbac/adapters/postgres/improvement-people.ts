import type { LookupQuery } from "./authorization";
/** Eligible responsibility directory requires an active explicit Tracking site grant. */
export async function improvementPeople(query: LookupQuery, organizationId: string, siteId: string) {
  const result = await query.query(`SELECT p.user_id AS id,p.display_name AS name FROM users_rbac.profiles p
    JOIN users_rbac.organization_memberships m USING(organization_id,user_id) JOIN users_rbac.users u USING(user_id)
    WHERE p.organization_id=$1 AND p.site_id=$2 AND m.is_active AND u.is_active
      AND p.profile IN ('administrator','team-leader','task-force')
      AND EXISTS(SELECT 1 FROM users_rbac.site_role_assignments a WHERE a.organization_id=p.organization_id
        AND a.site_id=p.site_id AND a.user_id=p.user_id AND a.is_active AND a.role_id='improvement-contributor')
    ORDER BY p.display_name,p.user_id LIMIT 201`, [organizationId, siteId]);
  if (result.rows.length > 200) throw new Error("Improvement responsibility directory exceeds the configured limit.");
  return result.rows as {
    id: string;
    name: string;
  }[];
}

import { authorizeSite } from "../../application/authorize-site";
import type {
  SiteAccessRequest,
  AuthorizationDecision,
} from "../../domain/authorization";
/** PostgreSQL query handle confined to this adapter. */
export interface LookupQuery {
  query(
    sql: string,
    values?: unknown[],
  ): Promise<{ rows: Record<string, unknown>[] }>;
}

/** Resolves current grants on the caller's pinned transaction. */
export async function evaluateSiteAccess(
  database: LookupQuery,
  request: SiteAccessRequest,
): Promise<AuthorizationDecision> {
  return authorizeSite(
    {
      load: async (request) => {
        // One statement snapshot for all mutable authorization state. No role/result cache.
        const result = await database.query(
          `
    SELECT u.is_active AS user_active, m.is_active AS membership_active, a.role_id
    FROM users_rbac.users u
    JOIN users_rbac.organization_memberships m ON m.user_id = u.user_id
    LEFT JOIN users_rbac.site_role_assignments a
      ON a.user_id = m.user_id AND a.organization_id = m.organization_id AND a.site_id = $3
    WHERE u.user_id = $1 AND m.organization_id = $2`,
          [request.userId, request.organizationId, request.siteId],
        );
        return result.rows.map((row) => ({
          userActive: row.user_active,
          membershipActive: row.membership_active,
          roleId: row.role_id,
        }));
      },
    },
    request,
  );
}

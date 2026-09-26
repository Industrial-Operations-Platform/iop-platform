/** Trusted execution identity and target, never a browser permission declaration. */
export interface SiteAccessRequest {
  readonly userId: string;
  readonly organizationId: string;
  readonly siteId: string;
  readonly permissions: readonly string[];
}

export type AuthorizationDecision =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: 'invalid-request' | 'access-denied' };

/** Internal persistence port; no provider, HTTP or driver entities cross the boundary. */
export interface LookupQuery {
  query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

const roles: Readonly<Record<string, readonly string[]>> = Object.freeze({
  'analytics-reader': Object.freeze(['analytics.read']),
  'site-operator': Object.freeze(['imports.submit', 'imports.review', 'site-configuration.manage']),
});
const permissions = new Set(Object.values(roles).flat());
const id = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value);

export function validSiteAccessRequest(request: SiteAccessRequest): boolean {
  return !!request && id(request.userId) && id(request.organizationId) && id(request.siteId) &&
    Array.isArray(request.permissions) && request.permissions.length > 0 &&
    request.permissions.every(value => typeof value === 'string' && permissions.has(value));
}

/** Called on every operation, after Platform Core validates exact site ownership. */
export async function evaluateSiteAccess(
  database: LookupQuery, request: SiteAccessRequest,
): Promise<AuthorizationDecision> {
  if (!validSiteAccessRequest(request)) return { allowed: false, reason: 'invalid-request' };
  // One statement snapshot for all mutable authorization state. No role/result cache.
  const result = await database.query(`
    SELECT u.is_active AS user_active, m.is_active AS membership_active, a.role_id
    FROM users_rbac.users u
    JOIN users_rbac.organization_memberships m ON m.user_id = u.user_id
    LEFT JOIN users_rbac.site_role_assignments a
      ON a.user_id = m.user_id AND a.organization_id = m.organization_id AND a.site_id = $3
    WHERE u.user_id = $1 AND m.organization_id = $2`,
  [request.userId, request.organizationId, request.siteId]);
  const granted = new Set<string>();
  for (const row of result.rows) {
    if (row.user_active !== true || row.membership_active !== true ||
        typeof row.role_id !== 'string' || !Object.hasOwn(roles, row.role_id)) {
      return { allowed: false, reason: 'access-denied' };
    }
    for (const permission of roles[row.role_id]) granted.add(permission);
  }
  return result.rows.length > 0 && request.permissions.every(permission => granted.has(permission))
    ? { allowed: true } : { allowed: false, reason: 'access-denied' };
}

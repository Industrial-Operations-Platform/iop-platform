/** Trusted execution identity and target, never a browser permission declaration. */
export interface SiteAccessRequest {
  readonly userId: string;
  readonly organizationId: string;
  readonly siteId: string;
  readonly permissions: readonly string[];
}

export type AuthorizationDecision =
  | { readonly allowed: true }
  | {
      readonly allowed: false;
      readonly reason: "invalid-request" | "access-denied";
    };

const roles: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "maintenance-contributor": Object.freeze([
    "maintenance.read",
    "maintenance.contribute",
  ]),
  "maintenance-coordinator": Object.freeze(["maintenance.coordinate"]),
  "maintenance-administrator": Object.freeze(["maintenance.administer"]),
  "assets-reader": Object.freeze(["assets.read"]),
  "assets-administrator": Object.freeze(["assets.manage"]),
  "workforce-reader": Object.freeze(["workforce.read"]),
  "workforce-planner": Object.freeze(["workforce.plan"]),
  "workforce-administrator": Object.freeze(["workforce.administer"]),
  "handover-contributor": Object.freeze([
    "handover.read",
    "handover.contribute",
  ]),
  "handover-coordinator": Object.freeze(["handover.coordinate"]),
  "analytics-reader": Object.freeze(["analytics.read"]),
  "site-operator": Object.freeze([
    "imports.submit",
    "imports.review",
    "site-configuration.manage",
  ]),
});
const permissions = new Set(Object.values(roles).flat());
const id = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value);

export function validSiteAccessRequest(request: SiteAccessRequest): boolean {
  return (
    !!request &&
    id(request.userId) &&
    id(request.organizationId) &&
    id(request.siteId) &&
    Array.isArray(request.permissions) &&
    request.permissions.length > 0 &&
    request.permissions.every(
      (value) => typeof value === "string" && permissions.has(value),
    )
  );
}

export interface SiteGrantState {
  readonly userActive: unknown;
  readonly membershipActive: unknown;
  readonly roleId: unknown;
}

export function decideSiteAccess(
  request: SiteAccessRequest,
  state: readonly SiteGrantState[],
): AuthorizationDecision {
  if (!validSiteAccessRequest(request))
    return { allowed: false, reason: "invalid-request" };
  const granted = new Set<string>();
  for (const row of state) {
    if (
      row.userActive !== true ||
      row.membershipActive !== true ||
      typeof row.roleId !== "string" ||
      !Object.hasOwn(roles, row.roleId)
    ) {
      return { allowed: false, reason: "access-denied" };
    }
    for (const permission of roles[row.roleId]) granted.add(permission);
  }
  return state.length > 0 &&
    request.permissions.every((permission) => granted.has(permission))
    ? { allowed: true }
    : { allowed: false, reason: "access-denied" };
}

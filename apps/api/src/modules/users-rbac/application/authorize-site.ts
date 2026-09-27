import {
  decideSiteAccess,
  validSiteAccessRequest,
  type SiteAccessRequest,
  type SiteGrantState,
  type AuthorizationDecision,
} from "../domain/authorization";

export interface SiteAccessLookup {
  load(request: SiteAccessRequest): Promise<readonly SiteGrantState[]>;
}

export async function authorizeSite(
  lookup: SiteAccessLookup,
  request: SiteAccessRequest,
): Promise<AuthorizationDecision> {
  if (!validSiteAccessRequest(request))
    return { allowed: false, reason: "invalid-request" };
  return decideSiteAccess(request, await lookup.load(request));
}

import { authorizeSite } from "../src/modules/users-rbac/application/authorize-site";
import type { SiteGrantState } from "../src/modules/users-rbac/domain/authorization";

const request = {
  userId: "user",
  organizationId: "org",
  siteId: "site",
  permissions: ["analytics.read"],
};
test("an in-memory lookup observes revocation on the next operation", async () => {
  let state: SiteGrantState[] = [
    { userActive: true, membershipActive: true, roleId: "analytics-reader" },
  ];
  const lookup = { load: jest.fn(async () => state) };
  expect(await authorizeSite(lookup, request)).toEqual({ allowed: true });
  state = [];
  expect(await authorizeSite(lookup, request)).toEqual({
    allowed: false,
    reason: "access-denied",
  });
  expect(lookup.load).toHaveBeenCalledTimes(2);
  expect(lookup.load).toHaveBeenLastCalledWith(request);
});
test("invalid scope never reaches the lookup port", async () => {
  const lookup = { load: jest.fn() };
  expect(await authorizeSite(lookup, { ...request, siteId: "" })).toEqual({
    allowed: false,
    reason: "invalid-request",
  });
  expect(lookup.load).not.toHaveBeenCalled();
});

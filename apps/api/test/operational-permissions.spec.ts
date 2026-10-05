import { decideSiteAccess } from "../src/modules/users-rbac/domain/authorization";
import { profiles, siteRoles } from "../src/modules/users-rbac/domain/profiles";

test.each(profiles)(
  "%s receives only its explicit Maintenance and Asset responsibilities",
  (profile) => {
    const state = siteRoles(profile).map((roleId) => ({
      roleId,
      userActive: true,
      membershipActive: true,
    }));
    const allowed = (permission: string) =>
      decideSiteAccess(
        {
          userId: "worker",
          organizationId: "organization",
          siteId: "site",
          permissions: [permission],
        },
        state,
      ).allowed;
    expect(allowed("maintenance.read")).toBe(true);
    expect(allowed("maintenance.contribute")).toBe(true);
    expect(allowed("assets.read")).toBe(
      ["team-leader", "task-force"].includes(profile),
    );
    expect(allowed("maintenance.coordinate")).toBe(profile === "team-leader");
    expect(allowed("maintenance.administer")).toBe(profile === "administrator");
    expect(allowed("assets.manage")).toBe(
      ["team-leader", "task-force"].includes(profile),
    );
    expect(allowed("analytics.read")).toBe(profile !== "technician");
  },
);

test("an asset read assignment grants neither source history nor mutation", () => {
  const state = [
    { roleId: "assets-reader", userActive: true, membershipActive: true },
  ];
  for (const permission of [
    "maintenance.read",
    "handover.read",
    "analytics.read",
    "assets.manage",
  ])
    expect(
      decideSiteAccess(
        {
          userId: "reader",
          organizationId: "organization",
          siteId: "site",
          permissions: [permission],
        },
        state,
      ).allowed,
    ).toBe(false);
});

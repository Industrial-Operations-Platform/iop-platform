export const profiles = [
  "administrator",
  "technician",
  "task-force",
  "team-leader",
] as const;
export type Profile = (typeof profiles)[number];
export class AccessError extends Error {
  constructor(
    readonly code:
      | "access_denied"
      | "invalid_user"
      | "user_conflict"
      | "last_administrator"
      | "user_limit",
  ) {
    super(code);
  }
}
export interface UserProfile {
  id: string;
  name: string;
  username: string;
  profile: Profile;
  active: boolean;
}
export interface NewUser {
  name: string;
  username: string;
  profile: Profile;
}
export function displayName(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > 100 ||
    /[\u0000-\u001f\u007f]/.test(value)
  )
    throw new AccessError("invalid_user");
  return value.trim();
}
export function validateUser(input: NewUser): NewUser {
  if (
    !input ||
    typeof input.name !== "string" ||
    !input.name.trim() ||
    input.name.length > 100 ||
    /[\u0000-\u001f]/.test(input.name) ||
    typeof input.username !== "string" ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$/.test(input.username) ||
    !profiles.includes(input.profile)
  )
    throw new AccessError("invalid_user");
  return {
    name: displayName(input.name),
    username: input.username.toLowerCase(),
    profile: input.profile,
  };
}
export function requireRemainingAdministrator(
  target: UserProfile,
  profile: Profile,
  active: boolean,
  count: number,
): void {
  if (
    target.active &&
    target.profile === "administrator" &&
    (!active || profile !== "administrator") &&
    count <= 1
  )
    throw new AccessError("last_administrator");
}
export function siteRoles(profile: Profile): readonly string[] {
  return profile === "administrator"
    ? [
        "workforce-reader",
        "workforce-planner",
        "workforce-administrator",
        "analytics-reader",
        "site-operator",
        "handover-contributor",
        "handover-coordinator",
      ]
    : profile === "team-leader"
      ? [
          "workforce-reader",
          "workforce-planner",
          "analytics-reader",
          "handover-contributor",
          "handover-coordinator",
        ]
      : profile === "technician"
        ? ["workforce-reader", "handover-contributor"]
        : ["workforce-reader", "analytics-reader", "handover-contributor"];
}

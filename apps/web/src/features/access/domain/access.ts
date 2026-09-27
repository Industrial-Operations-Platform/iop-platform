export const profileLabels = {
  administrator: "Administrator",
  technician: "Technician",
  "task-force": "Task Force",
  "team-leader": "Team Leader",
} as const;
export type Profile = keyof typeof profileLabels;
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
export interface SessionContext {
  enabled: boolean;
  authentication?: "password";
  mustChangePassword?: boolean;
  canAdminister?: boolean;
  canImport: boolean;
  user: { id: string; name: string; profile?: string } | null;
  users: { id: string; name: string }[];
  scope: {
    organizationId: string;
    siteId: string;
    sourceId: string;
    siteTimeZone: string;
  } | null;
}

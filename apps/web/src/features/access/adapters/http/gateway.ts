import type { AccessGateway } from "../../application/access";
import type {
  NewUser,
  Profile,
  SessionContext,
  UserProfile,
} from "../../domain/access";
import type { components } from "../../../../contracts/schema";
const messages: Record<string, string> = {
  invalid_credentials: "The username or password is incorrect.",
  session_required: "Sign in to continue.",
  password_change_required: "Change your initial password before continuing.",
  invalid_password: "Use a different password of 15 to 128 characters.",
  login_throttled: "Too many attempts. Wait before trying again.",
  last_administrator: "Keep at least one active administrator.",
  user_conflict: "This username is already in use.",
  access_denied: "You do not have permission for this operation.",
  invalid_user: "Check the name, username and profile.",
  user_limit: "The local user limit has been reached.",
};
async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch("/api/v1" + path, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers:
      body === undefined
        ? {}
        : { "Content-Type": "application/json", "X-IOP-Demo": "1" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      messages[data.code] ?? "The operation could not be completed. Try again.",
    );
  return data;
}
export class HttpAccessGateway implements AccessGateway {
  async context(): Promise<SessionContext> {
    return request<components["schemas"]["DemoContextDto"]>("/session/context");
  }
  async login(username: string, password: string) {
    await request("/auth/login", { username, password });
  }
  async password(currentPassword: string, password: string) {
    await request("/auth/password", { currentPassword, password });
  }
  async logout() {
    await request("/auth/logout", {});
  }
  async users(): Promise<UserProfile[]> {
    return request<components["schemas"]["UserProfileDto"][]>("/users");
  }
  async create(
    user: NewUser,
  ): Promise<{ user: UserProfile; initialPassword: string }> {
    return request<components["schemas"]["CreatedUserDto"]>("/users", user);
  }
  async change(id: string, profile: Profile, active: boolean) {
    await request("/users/access", { id, profile, active });
  }
}

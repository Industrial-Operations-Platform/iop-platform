import type {
  NewUser,
  Profile,
  SessionContext,
  UserProfile,
} from "../domain/access";
export interface AccessGateway {
  context(): Promise<SessionContext>;
  login(username: string, password: string): Promise<void>;
  password(currentPassword: string, password: string): Promise<void>;
  logout(): Promise<void>;
  users(): Promise<UserProfile[]>;
  create(
    user: NewUser,
  ): Promise<{ user: UserProfile; initialPassword: string }>;
  change(id: string, profile: Profile, active: boolean): Promise<void>;
}
export class AccessApplication {
  constructor(private readonly gateway: AccessGateway) {}
  context() {
    return this.gateway.context();
  }
  async login(username: string, password: string) {
    await this.gateway.login(username, password);
    return this.context();
  }
  async changePassword(
    current: string,
    password: string,
    confirmation: string,
  ) {
    if (password !== confirmation)
      throw new Error("The new passwords do not match.");
    if (password.length < 15 || password.length > 128)
      throw new Error("Use a password of 15 to 128 characters.");
    await this.gateway.password(current, password);
    return this.context();
  }
  async logout() {
    await this.gateway.logout();
    return this.context();
  }
  users() {
    return this.gateway.users();
  }
  create(user: NewUser) {
    return this.gateway.create(user);
  }
  change(id: string, profile: Profile, active: boolean) {
    return this.gateway.change(id, profile, active);
  }
}

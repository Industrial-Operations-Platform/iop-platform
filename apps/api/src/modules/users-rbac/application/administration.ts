import {
  AccessError,
  profiles,
  requireRemainingAdministrator,
  validateUser,
  type NewUser,
  type Profile,
  type UserProfile,
} from "../domain/profiles";
export interface IssuedCredential {
  secret: string;
  hash: string;
}
export interface AdministrationTransaction {
  list(): Promise<UserProfile[]>;
  create(user: NewUser, credentialHash: string): Promise<UserProfile>;
  change(id: string, profile: Profile, active: boolean): Promise<void>;
}
export interface AdministrationStore {
  self(actor: string): Promise<UserProfile>;
  asAdministrator<T>(
    actor: string,
    work: (tx: AdministrationTransaction) => Promise<T>,
  ): Promise<T>;
}
export class UserAdministration {
  constructor(
    private readonly store: AdministrationStore,
    private readonly issue: () => Promise<IssuedCredential>,
  ) {}
  self(actor: string): Promise<UserProfile> {
    return this.store.self(actor);
  }
  async canAdminister(actor: string): Promise<boolean> {
    try {
      return await this.store.asAdministrator(actor, async () => true);
    } catch (error) {
      if (error instanceof AccessError && error.code === "access_denied")
        return false;
      throw error;
    }
  }
  list(actor: string): Promise<UserProfile[]> {
    return this.store.asAdministrator(actor, (tx) => tx.list());
  }
  async create(
    actor: string,
    input: NewUser,
  ): Promise<{ user: UserProfile; initialPassword: string }> {
    const user = validateUser(input);
    return this.store.asAdministrator(actor, async (tx) => {
      if ((await tx.list()).length >= 200) throw new AccessError("user_limit");
      const credential = await this.issue();
      return {
        user: await tx.create(user, credential.hash),
        initialPassword: credential.secret,
      };
    });
  }
  async change(
    actor: string,
    id: string,
    profile: Profile,
    active: boolean,
  ): Promise<void> {
    if (
      typeof id !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(id) ||
      !profiles.includes(profile) ||
      typeof active !== "boolean"
    )
      throw new AccessError("invalid_user");
    await this.store.asAdministrator(actor, async (tx) => {
      const users = await tx.list();
      const target = users.find((user) => user.id === id);
      if (!target) throw new AccessError("access_denied");
      requireRemainingAdministrator(
        target,
        profile,
        active,
        users.filter((user) => user.active && user.profile === "administrator")
          .length,
      );
      await tx.change(id, profile, active);
    });
  }
}

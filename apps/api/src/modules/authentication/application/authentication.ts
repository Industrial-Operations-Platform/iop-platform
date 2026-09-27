import {
  AuthenticationError,
  password,
  username,
  type VerifiedPrincipal,
} from "../domain/identity";
export interface Credential {
  userId: string;
  hash: string;
  version: number;
  mustChangePassword: boolean;
  blockedUntil: number;
}
export interface Session extends VerifiedPrincipal {
  version: number;
  credentialHash: string;
}
export interface AuthenticationTransaction {
  allowAttempt(now: number): Promise<boolean>;
  credential(username: string): Promise<Credential | null>;
  recordAttempt(userId: string, success: boolean, now: number): Promise<void>;
  session(digest: string, now: number): Promise<Session | null>;
  issue(
    digest: string,
    userId: string,
    version: number,
    expires: number,
  ): Promise<void>;
  revoke(digest: string): Promise<void>;
  replacePassword(userId: string, hash: string): Promise<void>;
}
export interface AuthenticationStore {
  transaction<T>(
    work: (tx: AuthenticationTransaction) => Promise<T>,
  ): Promise<T>;
}
export interface PasswordHashing {
  hash(secret: string): Promise<string>;
  verify(secret: string, hash: string): Promise<boolean>;
  dummyHash: string;
}
export interface SessionSecrets {
  token(): string;
  digest(token: string): string;
  now(): number;
}
export class Authentication {
  constructor(
    private readonly store: AuthenticationStore,
    private readonly passwords: PasswordHashing,
    private readonly secrets: SessionSecrets,
  ) {}
  async login(
    input: { username: unknown; password: unknown },
    previous?: string,
  ): Promise<string> {
    const name = username(input.username);
    const secret =
      typeof input.password === "string" && input.password.length <= 128
        ? input.password
        : "";
    const now = this.secrets.now();
    const result = await this.store.transaction(async (tx) => {
      if (!(await tx.allowAttempt(now)))
        return { error: "login_throttled" as const };
      const account = await tx.credential(name);
      const matches = await this.passwords.verify(
        secret,
        account?.hash ?? this.passwords.dummyHash,
      );
      if (!account || account.blockedUntil > now || !matches) {
        if (account && account.blockedUntil <= now)
          await tx.recordAttempt(account.userId, false, now);
        return { error: "invalid_credentials" as const };
      }
      await tx.recordAttempt(account.userId, true, now);
      if (previous) await tx.revoke(this.secrets.digest(previous));
      const token = this.secrets.token();
      await tx.issue(
        this.secrets.digest(token),
        account.userId,
        account.version,
        now + 8 * 3600000,
      );
      return { token };
    });
    // Failed attempts must commit, not disappear with an exception rollback.
    if (result.error) throw new AuthenticationError(result.error);
    return result.token!;
  }
  async principal(
    token: string | undefined,
    allowPasswordChange = false,
  ): Promise<VerifiedPrincipal> {
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token))
      throw new AuthenticationError("session_required");
    const session = await this.store.transaction((tx) =>
      tx.session(this.secrets.digest(token), this.secrets.now()),
    );
    if (!session) throw new AuthenticationError("session_required");
    if (session.mustChangePassword && !allowPasswordChange)
      throw new AuthenticationError("password_change_required");
    return {
      userId: session.userId,
      mustChangePassword: session.mustChangePassword,
    };
  }
  async changePassword(
    token: string | undefined,
    current: unknown,
    value: unknown,
  ): Promise<void> {
    const next = password(value);
    if (!token) throw new AuthenticationError("session_required");
    await this.store.transaction(async (tx) => {
      const session = await tx.session(
        this.secrets.digest(token),
        this.secrets.now(),
      );
      if (!session) throw new AuthenticationError("session_required");
      if (
        typeof current !== "string" ||
        current.length > 128 ||
        !(await this.passwords.verify(current, session.credentialHash))
      )
        throw new AuthenticationError("invalid_credentials");
      if (next === current) throw new AuthenticationError("invalid_password");
      await tx.replacePassword(session.userId, await this.passwords.hash(next));
    });
  }
  async logout(token?: string): Promise<void> {
    if (token)
      await this.store.transaction((tx) =>
        tx.revoke(this.secrets.digest(token)),
      );
  }
}

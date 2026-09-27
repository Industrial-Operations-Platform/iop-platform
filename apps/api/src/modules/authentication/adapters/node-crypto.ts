import * as crypto from "node:crypto";
import type {
  PasswordHashing,
  SessionSecrets,
} from "../application/authentication";
// Node 24 is pinned by the application; older @types/node does not expose this API.
const argon2 = (
  crypto as unknown as {
    argon2(
      variant: string,
      options: {
        message: string;
        nonce: Buffer;
        memory: number;
        passes: number;
        parallelism: number;
        tagLength: number;
      },
      callback: (error: Error | null, value: Buffer) => void,
    ): void;
  }
).argon2;
const derive = (secret: string, salt: Buffer): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    argon2(
      "argon2id",
      {
        message: secret,
        nonce: salt,
        memory: 65536,
        passes: 3,
        parallelism: 1,
        tagLength: 32,
      },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
  });
export class NodePasswords implements PasswordHashing {
  // A valid fixed work-factor record used only to equalize unknown-account verification.
  readonly dummyHash = `argon2id:65536:3:1:${Buffer.alloc(16).toString("base64url")}:${Buffer.alloc(32).toString("base64url")}`;
  async hash(secret: string): Promise<string> {
    const salt = crypto.randomBytes(16);
    return `argon2id:65536:3:1:${salt.toString("base64url")}:${(await derive(secret, salt)).toString("base64url")}`;
  }
  async verify(secret: string, hash: string): Promise<boolean> {
    const match =
      /^argon2id:65536:3:1:([A-Za-z0-9_-]{22}):([A-Za-z0-9_-]{43})$/.exec(hash);
    if (!match) return false;
    return crypto.timingSafeEqual(
      await derive(secret, Buffer.from(match[1], "base64url")),
      Buffer.from(match[2], "base64url"),
    );
  }
}
export const nodeSessionSecrets: SessionSecrets = {
  token: () => crypto.randomBytes(32).toString("base64url"),
  digest: (token) => crypto.createHash("sha256").update(token).digest("hex"),
  now: Date.now,
};

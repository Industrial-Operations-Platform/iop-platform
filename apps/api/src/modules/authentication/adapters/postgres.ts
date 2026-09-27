import type { Pool, PoolClient } from "pg";
import {
  accessTransaction,
  type AccessScope,
} from "../../../persistence/access-transaction";
import type {
  AuthenticationStore,
  AuthenticationTransaction,
  Credential,
} from "../application/authentication";

export async function enrollLocal(
  client: PoolClient,
  organizationId: string,
  userId: string,
  username: string,
  hash: string,
): Promise<void> {
  await client.query(
    `INSERT INTO authentication.credentials (organization_id,user_id,username,password_hash) VALUES ($1,$2,$3,$4)`,
    [organizationId, userId, username, hash],
  );
}
export async function revokeUserSessions(
  client: PoolClient,
  organizationId: string,
  userId: string,
): Promise<void> {
  await client.query(
    "UPDATE authentication.sessions SET revoked=true WHERE organization_id=$1 AND user_id=$2",
    [organizationId, userId],
  );
}
export async function localUsernames(
  client: PoolClient,
  organizationId: string,
): Promise<Map<string, string>> {
  const result = await client.query(
    "SELECT user_id,username FROM authentication.credentials WHERE organization_id=$1",
    [organizationId],
  );
  return new Map(result.rows.map((row) => [row.user_id, row.username]));
}
export type PrincipalStatus = (
  client: PoolClient,
  organizationId: string,
  userId: string,
) => Promise<boolean>;
export class PgAuthentication implements AuthenticationStore {
  constructor(
    private readonly pool: Pool,
    private readonly scope: AccessScope,
    private readonly isActive: PrincipalStatus,
  ) {}
  transaction<T>(
    work: (tx: AuthenticationTransaction) => Promise<T>,
  ): Promise<T> {
    return accessTransaction(this.pool, this.scope, (client) =>
      work(
        new PgAuthenticationTransaction(
          client,
          this.scope.organizationId,
          this.isActive,
        ),
      ),
    );
  }
}
class PgAuthenticationTransaction implements AuthenticationTransaction {
  constructor(
    private readonly client: PoolClient,
    private readonly org: string,
    private readonly isActive: PrincipalStatus,
  ) {}
  async allowAttempt(now: number): Promise<boolean> {
    const result = await this.client.query(
      `INSERT INTO authentication.login_budget(organization_id,window_start,attempts)
      VALUES($1,$2,1) ON CONFLICT(organization_id) DO UPDATE SET
      attempts=CASE WHEN authentication.login_budget.window_start <= $2-60000 THEN 1 ELSE authentication.login_budget.attempts+1 END,
      window_start=CASE WHEN authentication.login_budget.window_start <= $2-60000 THEN $2 ELSE authentication.login_budget.window_start END
      RETURNING attempts`,
      [this.org, now],
    );
    return result.rows[0].attempts <= 20;
  }
  async credential(username: string): Promise<Credential | null> {
    const r = await this.client.query(
      `SELECT c.user_id,c.password_hash,c.version,c.must_change,c.blocked_until
      FROM authentication.credentials c
      WHERE c.organization_id=$1 AND c.username=$2`,
      [this.org, username],
    );
    const c = r.rows[0];
    return c && (await this.isActive(this.client, this.org, c.user_id))
      ? {
          userId: c.user_id,
          hash: c.password_hash,
          version: c.version,
          mustChangePassword: c.must_change,
          blockedUntil: Number(c.blocked_until),
        }
      : null;
  }
  async recordAttempt(
    userId: string,
    success: boolean,
    now: number,
  ): Promise<void> {
    await this.client.query(
      `UPDATE authentication.credentials SET
      failures=CASE WHEN $3 THEN 0 WHEN failures>=4 THEN 0 ELSE failures+1 END,
      blocked_until=CASE WHEN $3 THEN 0 WHEN failures>=4 THEN $4::bigint+900000 ELSE 0 END
      WHERE organization_id=$1 AND user_id=$2`,
      [this.org, userId, success, now],
    );
  }
  async session(digest: string, now: number) {
    const r = await this.client.query(
      `SELECT c.user_id,c.version,c.must_change,c.password_hash FROM authentication.sessions s
      JOIN authentication.credentials c ON c.organization_id=s.organization_id AND c.user_id=s.user_id AND c.version=s.credential_version
      WHERE s.organization_id=$1 AND s.digest=$2 AND NOT s.revoked AND s.expires_at>$3`,
      [this.org, digest, now],
    );
    const value = r.rows[0];
    return value && (await this.isActive(this.client, this.org, value.user_id))
      ? {
          userId: value.user_id,
          version: value.version,
          mustChangePassword: value.must_change,
          credentialHash: value.password_hash,
        }
      : null;
  }
  async issue(
    digest: string,
    userId: string,
    version: number,
    expires: number,
  ): Promise<void> {
    // Cap active sessions per identity; prior browser sessions are revoked on a new login.
    await revokeUserSessions(this.client, this.org, userId);
    await this.client.query(
      `INSERT INTO authentication.sessions(digest,organization_id,user_id,credential_version,expires_at) VALUES($1,$2,$3,$4,$5)`,
      [digest, this.org, userId, version, expires],
    );
  }
  async revoke(digest: string): Promise<void> {
    await this.client.query(
      "UPDATE authentication.sessions SET revoked=true WHERE organization_id=$1 AND digest=$2",
      [this.org, digest],
    );
  }
  async replacePassword(userId: string, hash: string): Promise<void> {
    await this.client.query(
      `UPDATE authentication.credentials SET password_hash=$3,version=version+1,must_change=false,failures=0,blocked_until=0 WHERE organization_id=$1 AND user_id=$2`,
      [this.org, userId, hash],
    );
    await revokeUserSessions(this.client, this.org, userId);
  }
}

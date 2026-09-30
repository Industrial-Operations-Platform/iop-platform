import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import {
  accessTransaction,
  type AccessScope,
} from "../../../../persistence/access-transaction";
import type {
  AdministrationStore,
  AdministrationTransaction,
  AccessActivity,
} from "../../application/administration";
import {
  AccessError,
  siteRoles,
  type NewUser,
  type Profile,
  type UserProfile,
} from "../../domain/profiles";
export interface CredentialPersistence {
  enroll(
    client: PoolClient,
    organizationId: string,
    userId: string,
    username: string,
    hash: string,
  ): Promise<void>;
  revoke(
    client: PoolClient,
    organizationId: string,
    userId: string,
  ): Promise<void>;
  names(
    client: PoolClient,
    organizationId: string,
  ): Promise<Map<string, string>>;
}
const userQuery = `SELECT p.user_id AS id,p.display_name AS name,p.profile,
 (m.is_active AND u.is_active) AS active FROM users_rbac.profiles p
 JOIN users_rbac.organization_memberships m ON m.organization_id=p.organization_id AND m.user_id=p.user_id
 JOIN users_rbac.users u ON u.user_id=p.user_id WHERE p.organization_id=$1 AND p.site_id=$2 AND p.deleted_at IS NULL`;
export class PgAdministration implements AdministrationStore {
  constructor(
    private readonly pool: Pool,
    private readonly scope: AccessScope,
    private readonly credentials: CredentialPersistence,
  ) {}
  self(actor: string): Promise<UserProfile> {
    return accessTransaction(this.pool, this.scope, async (client) => {
      const r = await client.query(userQuery + " AND p.user_id=$3", [
        this.scope.organizationId,
        this.scope.siteId,
        actor,
      ]);
      if (!r.rows[0]?.active) throw new AccessError("access_denied");
      return {
        ...r.rows[0],
        username:
          (await this.credentials.names(client, this.scope.organizationId)).get(
            actor,
          ) ?? "",
      };
    });
  }
  renameSelf(actor: string, name: string): Promise<void> {
    return accessTransaction(this.pool, this.scope, async (client) => {
      const result = await client.query(userQuery + " AND p.user_id=$3", [
        this.scope.organizationId,
        this.scope.siteId,
        actor,
      ]);
      if (!result.rows[0]?.active) throw new AccessError("access_denied");
      await client.query("SELECT set_config('iop.access_write','1',true)");
      await new PgAdministrationTransaction(
        client,
        this.scope,
        actor,
        this.credentials,
      ).rename(actor, name);
    });
  }
  asAdministrator<T>(
    actor: string,
    work: (tx: AdministrationTransaction) => Promise<T>,
  ): Promise<T> {
    return accessTransaction(this.pool, this.scope, async (client) => {
      const r = await client.query(
        `SELECT 1 FROM users_rbac.organization_role_assignments a
        JOIN users_rbac.organization_memberships m USING(organization_id,user_id)
        JOIN users_rbac.users u USING(user_id)
        JOIN platform_core.sites s ON s.organization_id=a.organization_id AND s.site_id=$3
        WHERE a.organization_id=$1 AND a.user_id=$2 AND a.role_id='organization-access-admin'
        AND a.is_active AND m.is_active AND u.is_active`,
        [this.scope.organizationId, actor, this.scope.siteId],
      );
      if (r.rowCount !== 1) throw new AccessError("access_denied");
      await client.query("SELECT set_config('iop.access_write','1',true)");
      return work(
        new PgAdministrationTransaction(
          client,
          this.scope,
          actor,
          this.credentials,
        ),
      );
    });
  }
}
class PgAdministrationTransaction implements AdministrationTransaction {
  constructor(
    private readonly client: PoolClient,
    private readonly scope: AccessScope,
    private readonly actor: string,
    private readonly credentials: CredentialPersistence,
  ) {}
  async activity(): Promise<AccessActivity[]> {
    const result = await this.client.query(
      `SELECT a.id, COALESCE(actor.display_name,a.actor_id) AS "actorName",
        subject.display_name AS "subjectName", a.action, a.recorded_at AS "recordedAt"
       FROM users_rbac.access_audit a
       JOIN users_rbac.profiles subject ON subject.organization_id=a.organization_id
         AND subject.user_id=a.subject_id AND subject.site_id=$2
       LEFT JOIN users_rbac.profiles actor ON actor.organization_id=a.organization_id
         AND actor.user_id=a.actor_id AND actor.site_id=$2
       WHERE a.organization_id=$1 ORDER BY a.recorded_at DESC,a.id DESC LIMIT 20`,
      [this.scope.organizationId, this.scope.siteId],
    );
    return result.rows.map((row) => ({
      ...row,
      recordedAt: row.recordedAt.toISOString(),
    }));
  }
  async list(): Promise<UserProfile[]> {
    const result = await this.client.query(
      userQuery + " ORDER BY p.display_name,p.user_id LIMIT 201",
      [this.scope.organizationId, this.scope.siteId],
    );
    if (result.rows.length > 200) throw new AccessError("user_limit");
    const names = await this.credentials.names(
      this.client,
      this.scope.organizationId,
    );
    return result.rows.map((row) => ({
      ...row,
      username: names.get(row.id) ?? "",
    }));
  }
  async create(user: NewUser, hash: string): Promise<UserProfile> {
    const id = randomUUID(),
      org = this.scope.organizationId;
    const existing = await this.credentials.names(this.client, org);
    if ([...existing.values()].includes(user.username))
      throw new AccessError("user_conflict");
    await this.client.query(
      "SELECT set_config('iop.access_new_user_id',$1,true)",
      [id],
    );
    await this.client.query(
      "INSERT INTO users_rbac.users(user_id,is_active) VALUES($1,true)",
      [id],
    );
    await this.client.query(
      "INSERT INTO users_rbac.organization_memberships(organization_id,user_id,is_active) VALUES($1,$2,true)",
      [org, id],
    );
    await this.client.query(
      "INSERT INTO users_rbac.profiles(organization_id,user_id,site_id,display_name,profile) VALUES($1,$2,$3,$4,$5)",
      [org, id, this.scope.siteId, user.name, user.profile],
    );
    await this.credentials.enroll(this.client, org, id, user.username, hash);
    await this.assign(id, user.profile, true);
    await this.audit(id, "user.created", {
      profile: user.profile,
      active: true,
    });
    return { id, ...user, active: true };
  }
  async change(id: string, profile: Profile, active: boolean): Promise<void> {
    const before = (await this.list()).find((user) => user.id === id);
    if (!before) throw new AccessError("access_denied");
    // A local identity owned by this organization cannot be reset/edited as a shared identity.
    const local = await this.credentials.names(
      this.client,
      this.scope.organizationId,
    );
    if (!local.has(id)) throw new AccessError("access_denied");
    await this.client.query(
      "UPDATE users_rbac.profiles SET profile=$3 WHERE organization_id=$1 AND user_id=$2",
      [this.scope.organizationId, id, profile],
    );
    await this.client.query(
      "UPDATE users_rbac.organization_memberships SET is_active=$3 WHERE organization_id=$1 AND user_id=$2",
      [this.scope.organizationId, id, active],
    );
    await this.assign(id, profile, active);
    await this.credentials.revoke(this.client, this.scope.organizationId, id);
    await this.audit(id, "user.access_changed", {
      before: { profile: before.profile, active: before.active },
      after: { profile, active },
    });
  }
  async rename(id: string, name: string): Promise<void> {
    const result = await this.client.query(userQuery + " AND p.user_id=$3", [
      this.scope.organizationId,
      this.scope.siteId,
      id,
    ]);
    const before = result.rows[0];
    if (!before) throw new AccessError("access_denied");
    if (before.name === name) return;
    await this.client.query(
      "UPDATE users_rbac.profiles SET display_name=$4 WHERE organization_id=$1 AND site_id=$2 AND user_id=$3 AND deleted_at IS NULL",
      [this.scope.organizationId, this.scope.siteId, id, name],
    );
    await this.audit(id, "user.name_changed", {
      before: before.name,
      after: name,
    });
  }
  async remove(id: string): Promise<void> {
    const target = (await this.list()).find((u) => u.id === id);
    if (!target) throw new AccessError("access_denied");
    await this.change(id, target.profile, false);
    await this.client.query(
      "UPDATE users_rbac.profiles SET deleted_at=CURRENT_TIMESTAMP WHERE organization_id=$1 AND site_id=$2 AND user_id=$3",
      [this.scope.organizationId, this.scope.siteId, id],
    );
    await this.audit(id, "user.deleted", {
      name: target.name,
      retainedHistory: true,
    });
  }
  private async assign(
    id: string,
    profile: Profile,
    active: boolean,
  ): Promise<void> {
    const org = this.scope.organizationId,
      site = this.scope.siteId;
    await this.client.query(
      `INSERT INTO users_rbac.organization_role_assignments(organization_id,user_id,role_id,is_active)
      VALUES($1,$2,'organization-access-admin',$3) ON CONFLICT(organization_id,user_id,role_id) DO UPDATE SET is_active=EXCLUDED.is_active`,
      [org, id, active && profile === "administrator"],
    );
    // Restoration receives an explicit profile; old grants never silently reactivate.
    for (const role of [
      "workforce-reader",
      "workforce-planner",
      "workforce-administrator",
      "analytics-reader",
      "site-operator",
      "handover-contributor",
      "handover-coordinator",
    ]) {
      await this.client.query(
        `INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id)
        VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [org, id, site, role],
      );
      await this.client.query(
        `UPDATE users_rbac.site_role_assignments SET is_active=$5
        WHERE organization_id=$1 AND user_id=$2 AND site_id=$3 AND role_id=$4`,
        [org, id, site, role, active && siteRoles(profile).includes(role)],
      );
    }
  }
  private async audit(
    id: string,
    action: string,
    detail: unknown,
  ): Promise<void> {
    await this.client.query(
      `INSERT INTO users_rbac.access_audit(id,organization_id,actor_id,subject_id,action,detail) VALUES($1,$2,$3,$4,$5,$6)`,
      [
        randomUUID(),
        this.scope.organizationId,
        this.actor,
        id,
        action,
        JSON.stringify(detail),
      ],
    );
  }
}

/** Published Users/RBAC lookup for authentication; uses the caller's scoped transaction. */
export async function activePrincipal(
  client: PoolClient,
  organizationId: string,
  userId: string,
): Promise<boolean> {
  const r = await client.query(
    `SELECT 1 FROM users_rbac.users u JOIN users_rbac.organization_memberships m USING(user_id)
    WHERE m.organization_id=$1 AND u.user_id=$2 AND u.is_active AND m.is_active`,
    [organizationId, userId],
  );
  return r.rowCount === 1;
}
export async function startupAdministrator(
  client: PoolClient,
  scope: AccessScope,
): Promise<string | undefined> {
  const r = await client.query(
    `SELECT p.user_id FROM users_rbac.profiles p
    JOIN users_rbac.organization_role_assignments a USING(organization_id,user_id)
    JOIN users_rbac.organization_memberships m USING(organization_id,user_id)
    JOIN users_rbac.users u USING(user_id)
    WHERE p.organization_id=$1 AND p.site_id=$2 AND a.is_active AND m.is_active AND u.is_active
    ORDER BY p.user_id LIMIT 1`,
    [scope.organizationId, scope.siteId],
  );
  return r.rows[0]?.user_id;
}

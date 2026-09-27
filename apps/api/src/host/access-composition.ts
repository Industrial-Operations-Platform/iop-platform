import type { Pool } from "pg";
import { Authentication } from "../modules/authentication/application/authentication";
import {
  NodePasswords,
  nodeSessionSecrets,
} from "../modules/authentication/adapters/node-crypto";
import {
  PgAuthentication,
  enrollLocal,
  revokeUserSessions,
  localUsernames,
} from "../modules/authentication/adapters/postgres";
import { UserAdministration } from "../modules/users-rbac/application/administration";
import {
  PgAdministration,
  activePrincipal,
} from "../modules/users-rbac/adapters/postgres/administration";
import type { AccessScope } from "../persistence/access-transaction";
export function composeAccess(pool: Pool, scope: AccessScope) {
  const passwords = new NodePasswords();
  return {
    authentication: new Authentication(
      new PgAuthentication(pool, scope, activePrincipal),
      passwords,
      nodeSessionSecrets,
    ),
    users: new UserAdministration(
      new PgAdministration(pool, scope, {
        enroll: enrollLocal,
        revoke: revokeUserSessions,
        names: localUsernames,
      }),
      async () => {
        const secret = nodeSessionSecrets.token();
        return { secret, hash: await passwords.hash(secret) };
      },
    ),
  };
}

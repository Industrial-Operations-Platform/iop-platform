import type { Pool } from "pg";
import { Connections } from "../modules/integrations/application/connections";
import { PgConnections, type ConnectionScope } from "../modules/integrations/adapters/postgres/connections";
import { sitePersonProfile } from "../modules/users-rbac/adapters/postgres/site-people";
import { evaluateSiteAccess } from "../modules/users-rbac";
export function composeConnections(pool: Pool, scope: ConnectionScope) {
    return new Connections(new PgConnections(pool, scope, {
        profile: (tx, actor) => sitePersonProfile(tx, scope.organizationId, scope.siteId, actor),
        allowed: async (tx, actor, permission) => (await evaluateSiteAccess(tx, { ...scope, userId: actor, permissions: [permission] })).allowed,
    }), () => new Date().toISOString());
}

import type { Pool } from "pg";
import { runSiteOperation, type SiteTransaction } from "../../../../persistence/site-operation";
import type { ConnectionStore, ConnectionTransaction } from "../../application/connections";
import { ConnectionError, type Connection, type IntegrationKind } from "../../domain/connections";
export interface ConnectionScope {
    organizationId: string;
    siteId: string;
}
export interface ConnectionAccess {
    profile(tx: SiteTransaction, actor: string): Promise<string>;
    allowed(tx: SiteTransaction, actor: string, permission: string): Promise<boolean>;
}
export class PgConnections implements ConnectionStore {
    constructor(private readonly pool: Pool, private readonly scope: ConnectionScope, private readonly access: ConnectionAccess) { }
    run<T>(actor: string, write: boolean, work: (tx: ConnectionTransaction) => Promise<T>): Promise<T> {
        const permission = write ? "integrations.manage" : "integrations.read";
        return runSiteOperation(this.pool, { ...this.scope, userId: actor, permissions: [permission] }, async (tx) => {
            await tx.query("SELECT pg_advisory_xact_lock_shared(hashtext('iop-access'),hashtext($1))", [this.scope.organizationId]);
            const profile = await this.access.profile(tx, actor);
            if (!['administrator', 'team-leader', 'task-force'].includes(profile) || (write && profile !== 'administrator') ||
                !await this.access.allowed(tx, actor, permission))
                throw new ConnectionError("integration_denied");
            if (write)
                await tx.query("SELECT pg_advisory_xact_lock(hashtext('iop-integrations'),hashtext($1))", [JSON.stringify([this.scope.organizationId, this.scope.siteId])]);
            const parameters = [this.scope.organizationId, this.scope.siteId];
            return work({
                get: async (kind) => {
                    const result = await tx.query("SELECT snapshot FROM integrations.connections WHERE organization_id=$1 AND site_id=$2 AND kind=$3", [...parameters, kind]);
                    return result.rows[0]?.snapshot as Connection | undefined ?? null;
                },
                save: async (connection) => {
                    const values = [...parameters, connection.configuration.kind, connection.revision, JSON.stringify(connection)];
                    await tx.query("INSERT INTO integrations.connections(organization_id,site_id,kind,revision,snapshot) VALUES($1,$2,$3,$4,$5::jsonb) ON CONFLICT(organization_id,site_id,kind) DO UPDATE SET revision=EXCLUDED.revision,snapshot=EXCLUDED.snapshot", values);
                    await tx.query("INSERT INTO integrations.connection_revisions(organization_id,site_id,kind,revision,snapshot) VALUES($1,$2,$3,$4,$5::jsonb)", values);
                },
                history: async (kind: IntegrationKind) => {
                    const result = await tx.query("SELECT snapshot FROM integrations.connection_revisions WHERE organization_id=$1 AND site_id=$2 AND kind=$3 ORDER BY revision DESC LIMIT 25", [...parameters, kind]);
                    return result.rows.map(row => row.snapshot as Connection);
                },
            });
        });
    }
}

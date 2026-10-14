import { siteMaterialAudit } from "../modules/audit/adapters/postgres/site-material";
import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { FormalHandover } from "../modules/shift-handover/application/formal-records";
import { PgFormalHandover, type FormalScope } from "../modules/shift-handover/adapters/postgres/formal-records";
import type { Location } from "../modules/shift-handover/domain/handover";
import { workforceShiftReferences } from "../modules/workforce/adapters/postgres/shift-reference";
import { evaluateSiteAccess } from "../modules/users-rbac";
import { sitePersonNames, sitePersonProfile } from "../modules/users-rbac/adapters/postgres/site-people";

export function composeFormalHandover(pool: Pool, scope: FormalScope, locations: Location[], timeZone: string) {
  return new FormalHandover(new PgFormalHandover(pool, scope, {
    audit: siteMaterialAudit,
    allowed: async (tx, actor, permission) => (await evaluateSiteAccess(tx, { ...scope, userId: actor, permissions: [permission] })).allowed,
    profile: (tx, actor) => sitePersonProfile(tx, scope.organizationId, scope.siteId, actor),
    name: async (tx, actor) => (await sitePersonNames(tx, scope.organizationId, scope.siteId, [actor])).get(actor) ?? actor,
    shifts: workforceShiftReferences,
  }), locations, timeZone, randomUUID, () => new Date().toISOString());
}

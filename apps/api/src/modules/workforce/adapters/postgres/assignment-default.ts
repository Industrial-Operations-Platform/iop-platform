import { SiteAccessDeniedError, type SiteTransaction } from "../../../../persistence/site-operation";
import { evaluateSiteAccess } from "../../../users-rbac";
import { assignedTarget } from "../../domain/assignment-default";
import type { Assignment, RecordEntry } from "../../domain/workforce";

/** Source-owned, bounded projection used by the host's Handover receiving port. */
export async function workforceAssignedTarget(tx: SiteTransaction, actor: string, day: string): Promise<string> {
  if (actor !== tx.context.userId || !(await evaluateSiteAccess(tx, {
    ...tx.context, permissions: ["workforce.read"],
  })).allowed) throw new SiteAccessDeniedError();
  const result = await tx.query(
    `SELECT snapshot FROM workforce.records WHERE organization_id=$1 AND site_id=$2
      AND kind='assignment' AND business_date=$3::date AND snapshot->'data'->>'userId'=$4
      AND coalesce(snapshot->>'deleted','false')<>'true' ORDER BY id LIMIT 101`,
    [tx.context.organizationId, tx.context.siteId, day, actor],
  );
  if (result.rows.length > 100) throw new Error("Assignment lookup exceeds the supported capacity.");
  return assignedTarget(actor, day, result.rows.map((row) => (row.snapshot as RecordEntry<"assignment">).data as Assignment));
}

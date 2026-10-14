import { createHash } from "node:crypto";
import { SiteAccessDeniedError, type SiteTransaction } from "../../../../persistence/site-operation";
import { evaluateSiteAccess } from "../../../users-rbac";
import { projectShifts } from "../../domain/shift-reference";
import { range, type RecordEntry } from "../../domain/workforce";

/** Workforce-owned bounded source projection on the caller's pinned transaction. */
export async function workforceShiftReferences(tx: SiteTransaction, actor: string, from: string, to: string) {
  range(from, to);
  if (actor !== tx.context.userId || !(await evaluateSiteAccess(tx, {
    ...tx.context, permissions: ["workforce.read"],
  })).allowed) throw new SiteAccessDeniedError();
  const result = await tx.query(
    `SELECT snapshot FROM workforce.records WHERE organization_id=$1 AND site_id=$2
      AND kind='assignment' AND business_date BETWEEN $3::date AND $4::date
      AND coalesce(snapshot->>'deleted','false')<>'true' ORDER BY business_date,id LIMIT 10001`,
    [tx.context.organizationId, tx.context.siteId, from, to],
  );
  if (result.rows.length > 10000) throw new Error("Shift projection exceeds its supported capacity.");
  return projectShifts(result.rows.map((row) => row.snapshot as RecordEntry<"assignment">)).map(({ key, ...shift }) => ({
    ...shift, id: createHash("sha256").update(key).digest("hex").slice(0, 48),
  }));
}

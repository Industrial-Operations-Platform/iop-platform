import { SiteAccessDeniedError, type SiteTransaction } from "../../../../persistence/site-operation";
import { evaluateSiteAccess } from "../../../users-rbac";
import { assert, type IssueReference } from "../../../improvement-tracking/domain/improvement";
import type { Entry } from "../../domain/handover";
interface Scope {
  organizationId: string;
  siteId: string;
}
async function authorize(tx: SiteTransaction, scope: Scope) {
  if (tx.context.organizationId !== scope.organizationId || tx.context.siteId !== scope.siteId) throw new SiteAccessDeniedError();
  await tx.query("SELECT pg_advisory_xact_lock_shared(hashtext('iop-access'),hashtext($1))", [scope.organizationId]);
  if (!(await evaluateSiteAccess(tx, {
    ...scope,
    userId: tx.context.userId,
    permissions: ["handover.read"]
  })).allowed) throw new SiteAccessDeniedError();
}
function reference(e: Entry): IssueReference {
  return {
    id: e.id,
    title: e.content.summary,
    state: e.issueState,
    revision: e.revision,
    equipmentCode: e.content.equipmentCode,
    area: e.areaLabel
  };
}
/** Issues remain Handover-owned; linkage never changes their state. */
export async function improvementIssue(tx: SiteTransaction, scope: Scope, id: string): Promise<IssueReference | null> {
  await authorize(tx, scope);
  const r = await tx.query("SELECT snapshot FROM shift_handover.entries WHERE organization_id=$1 AND site_id=$2 AND id=$3 AND coalesce(snapshot->>'deleted','false')<>'true' AND snapshot->>'issueState'<>'none' FOR SHARE", [scope.organizationId, scope.siteId, id]);
  return r.rows[0] ? reference(r.rows[0].snapshot as Entry) : null;
}
export async function improvementIssues(tx: SiteTransaction, scope: Scope, search: string, cursor: string) {
  await authorize(tx, scope);
  let at = "",
    id = "";
  if (cursor) {
    const c = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\|([A-Za-z0-9][A-Za-z0-9_-]{0,100})$/.exec(cursor);
    assert(c && Number.isFinite(Date.parse(c[1])) && new Date(c[1]).toISOString() === c[1]);
    [at, id] = c.slice(1);
  }
  const r = await tx.query(`SELECT snapshot FROM shift_handover.entries WHERE organization_id=$1 AND site_id=$2
    AND coalesce(snapshot->>'deleted','false')<>'true' AND snapshot->>'issueState'<>'none'
    AND ($3='' OR strpos(lower(concat_ws(' ',snapshot->'content'->>'summary',snapshot->'content'->>'equipmentCode')),lower($3))>0)
    AND ($4='' OR (snapshot->>'createdAt',id)<($4,$5)) ORDER BY snapshot->>'createdAt' DESC,id DESC LIMIT 31`, [scope.organizationId, scope.siteId, search, at, id]);
  const entries = r.rows.slice(0, 30).map(r => r.snapshot as Entry),
    last = entries.at(-1);
  return {
    issues: entries.map(reference),
    nextCursor: r.rows.length > 30 && last ? last.createdAt + "|" + last.id : ""
  };
}

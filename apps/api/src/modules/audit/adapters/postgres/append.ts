import { createHash } from "node:crypto";
import type { SiteTransaction } from "../../../../persistence/site-operation";
import { auditChange, type AuditChange } from "../../domain/events";
/** Explicit owner event, same pinned business transaction; no source bodies or personal names. */
export async function appendAudit(tx: SiteTransaction, input: AuditChange): Promise<void> {
  const event = auditChange(input), eventType = event.module + "." + event.action;
  const id = createHash("sha256").update(JSON.stringify([tx.context.organizationId,tx.context.siteId,event.operationId,eventType])).digest("hex");
  const fingerprint = createHash("sha256").update(JSON.stringify(event)).digest("hex");
  const prior = await tx.query("SELECT fingerprint FROM audit.site_events WHERE organization_id=$1 AND site_id=$2 AND event_id=$3",
    [tx.context.organizationId,tx.context.siteId,id]);
  if (prior.rows.length) {
    if (prior.rows[0].fingerprint !== fingerprint) throw new Error("Audit operation identity conflicts with retained evidence.");
    return;
  }
  await tx.query(`WITH observed AS MATERIALIZED (SELECT clock_timestamp()::timestamptz(3) AS instant)
    INSERT INTO audit.site_events(organization_id,site_id,event_id,operation_id,module,event_type,schema_version,actor_id,
    subject_type,subject_id,revision,before_revision,state,before_state,reason,occurred_at,recorded_at,retention_class,expires_at,policy_version,fingerprint)
    SELECT $1,$2,$3,$4,$5,$6,1,$7,$8,$9,$10,$11,$12,$13,$14,coalesce($16::timestamptz,instant),instant,'change',instant+interval '31536000 seconds','audit-v1-20261014',$15 FROM observed
    ON CONFLICT(organization_id,site_id,event_id) DO NOTHING`,
    [tx.context.organizationId,tx.context.siteId,id,event.operationId,event.module,eventType,tx.context.userId,event.subjectType,event.subjectId,
      event.revision,event.beforeRevision,event.state,event.beforeState,event.reason,fingerprint,event.occurredAt ?? null]);
  // Concurrent retries must retain the same safe envelope, not silently accept changed evidence.
  const saved = await tx.query("SELECT fingerprint FROM audit.site_events WHERE organization_id=$1 AND site_id=$2 AND event_id=$3",[tx.context.organizationId,tx.context.siteId,id]);
  if (saved.rows[0]?.fingerprint !== fingerprint) throw new Error("Audit operation identity conflicts with retained evidence.");
}

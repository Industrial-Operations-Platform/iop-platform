import { createHash } from "node:crypto";
import type { SiteTransaction } from "../../../../persistence/site-operation";
import { AuditError, type AuditChange } from "../../domain/events";
import { appendAudit } from "./append";

/** Each owner supplies revision references, never its domain snapshot or free text. */
const subjects = {
  "handover-entry": { module: "shift-handover", states: ["none","open","in-progress","resolved","removed"] },
  "handover-record": { module: "shift-handover", states: ["draft","open","closed"] },
  "maintenance-record": { module: "maintenance", states: ["open","in-progress","blocked","done"] },
  "maintenance-settings": { module: "maintenance", states: ["configured"] },
  "asset-model-catalog": { module: "assets", states: ["configured"] },
  "asset-enrichment": { module: "assets", states: ["pending","validated","rejected"] },
  "asset-source-mapping": { module: "assets", states: ["pending","approved","rejected"] },
  asset: { module: "assets", states: ["unverified","validated","retired"] },
  "workforce-settings": { module: "workforce", states: ["active","removed"] },
  "workforce-worker": { module: "workforce", states: ["active","removed"] },
  "workforce-schedule": { module: "workforce", states: ["active","removed"] },
  "workforce-assignment": { module: "workforce", states: ["active","removed"] },
  "improvement-action": { module: "improvement-tracking", states: ["planned","in-progress","blocked","implemented","evaluated","cancelled"] },
  "improvement-evidence": { module: "improvement-tracking", states: ["retained","corrected"] },
  "improvement-comparison": { module: "improvement-tracking", states: ["retained"] },
  "locator-scene": { module: "asset-locator", states: ["pending","surveyed"] },
  "integration-connection": { module: "integrations", states: ["enabled","disabled"] },
  "import-batch": { module: "integrations", states: ["received","succeeded","rejected","failed"] },
  "reporting-profile": { module: "configuration", states: ["configured"] },
  "oip-publication": { module: "oip", states: ["published"] },
} as const;
export interface SiteMaterialEvent {
  subjectType: keyof typeof subjects; id: string; action: AuditChange["action"];
  revision: number; beforeRevision: number; state: string; beforeState: string;
  reason?: AuditChange["reason"]; occurredAt?: string;
}
export type SiteMaterialAudit = (tx: SiteTransaction, event: SiteMaterialEvent) => Promise<void>;
/** Host-selected owner port; the caller must pass its existing authorized transaction. */
export const siteMaterialAudit: SiteMaterialAudit = async (tx,event) => {
  if(!event||Object.keys(event).some(key=>!["subjectType","id","action","revision","beforeRevision","state","beforeState","reason","occurredAt"].includes(key))||!Object.hasOwn(subjects,event.subjectType))throw new AuditError();
  const contract=subjects[event.subjectType];
  if(!(contract.states as readonly string[]).includes(event.state)||(event.beforeState!==""&&!(contract.states as readonly string[]).includes(event.beforeState)))throw new AuditError();
  const operationId=createHash("sha256").update(JSON.stringify([event.subjectType,event.id,event.revision,event.action])).digest("hex");
  await appendAudit(tx,{operationId,module:contract.module,action:event.action,subjectType:event.subjectType,subjectId:event.id,
    revision:event.revision,beforeRevision:event.beforeRevision,state:event.state,beforeState:event.beforeState,reason:event.reason??"none",
    ...(event.occurredAt===undefined?{}:{occurredAt:event.occurredAt})});
};

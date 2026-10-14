export type AuditModule = "jobs" | "assets" | "maintenance" | "workforce" | "shift-handover" | "improvement-tracking" | "asset-locator" | "integrations" | "configuration" | "audit";
export interface AuditChange {
  operationId: string;
  module: AuditModule;
  action: "created" | "changed" | "completed" | "retry" | "waiting" | "failed" | "inspected" | "purged";
  subjectType: string;
  subjectId: string;
  revision: number;
  beforeRevision: number;
  state: string;
  beforeState: string;
  reason: "none" | "transient" | "missing-handler" | "missing-configuration" | "exhausted" | "investigation" | "recovery" | "retention";
  /** Trusted source time, independent of the database recording instant. */
  occurredAt?: string;
}
export class AuditError extends Error { constructor() { super("Invalid audit event envelope."); } }
const id = (value: unknown) => typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_:.-]{0,127}$/.test(value);
export function auditChange(input: AuditChange): AuditChange {
  if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).filter(key => key !== "occurredAt").sort().join() !==
    ["operationId","module","action","subjectType","subjectId","revision","beforeRevision","state","beforeState","reason"].sort().join() ||
    !["jobs","assets","maintenance","workforce","shift-handover","improvement-tracking","asset-locator","integrations","configuration","audit"].includes(input.module) ||
    !["created","changed","completed","retry","waiting","failed","inspected","purged"].includes(input.action) ||
    !["none","transient","missing-handler","missing-configuration","exhausted","investigation","recovery","retention"].includes(input.reason) ||
    !id(input.operationId) || !id(input.subjectType) || !id(input.subjectId) ||
    !Number.isSafeInteger(input.revision) || input.revision < 0 || input.revision > 2147483647 ||
    !Number.isSafeInteger(input.beforeRevision) || input.beforeRevision < 0 || input.beforeRevision > 2147483647 ||
    ![input.state,input.beforeState].every(value => typeof value === "string" && /^$|^[a-z][a-z-]{0,31}$/.test(value)) ||
    (input.occurredAt !== undefined && (typeof input.occurredAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input.occurredAt) ||
      !Number.isFinite(Date.parse(input.occurredAt)) || new Date(input.occurredAt).toISOString() !== input.occurredAt))) throw new AuditError();
  return {operationId:input.operationId,module:input.module,action:input.action,subjectType:input.subjectType,subjectId:input.subjectId,
    revision:input.revision,beforeRevision:input.beforeRevision,state:input.state,beforeState:input.beforeState,reason:input.reason,
    ...(input.occurredAt===undefined?{}:{occurredAt:input.occurredAt})};
}

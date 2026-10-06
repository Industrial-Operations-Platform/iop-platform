import { changeIssue, type Entry, type Revision } from "../domain/handover";

/** Exact source identity; a location group does not assert physical asset identity. */
export interface EquipmentTarget {
  namespace: "site-equipment";
  code: string;
  departmentId: string;
  areaId: string;
}
export interface MaintenanceIssueScope {
  locationIds: string[];
  equipment: EquipmentTarget[];
}
export interface MaintenanceIssueSelection {
  scope: MaintenanceIssueScope;
  search?: string;
  cursor?: string;
  limit?: number;
  ids?: string[];
}
export interface MaintenanceIssuePage {
  entries: Entry[];
  total: number;
  nextCursor: string;
}
export interface IssueResolution {
  id: string;
  expectedRevision: number;
}
export interface MaintenanceResolution {
  maintenanceId: string;
  outcome: string;
  at: string;
}
export class MaintenanceIssuesError extends Error {
  constructor(readonly code: "invalid" | "conflict" | "capacity" | "denied") {
    super("maintenance_issues_" + code);
  }
}
export interface MaintenanceResolutionTransaction {
  actorId: string;
  actorName: string;
  get(id: string): Promise<Entry | null>;
  save(entry: Entry, revision: Revision): Promise<void>;
}
function requiredText(value: unknown, maximum: number): value is string {
  return (
    typeof value === "string" &&
    !!value.trim() &&
    value.length <= maximum &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}
export function validateMaintenanceScope(scope: MaintenanceIssueScope): void {
  if (
    !scope ||
    Object.keys(scope).sort().join() !== "equipment,locationIds" ||
    !Array.isArray(scope.locationIds) ||
    !scope.locationIds.length ||
    scope.locationIds.length > 500 ||
    scope.locationIds.some((id) => !requiredText(id, 64)) ||
    new Set(scope.locationIds).size !== scope.locationIds.length ||
    !Array.isArray(scope.equipment) ||
    scope.equipment.length > 200
  )
    throw new MaintenanceIssuesError("invalid");
  const targets = new Set<string>();
  for (const target of scope.equipment) {
    if (
      !target ||
      Object.keys(target).sort().join() !==
        "areaId,code,departmentId,namespace" ||
      target.namespace !== "site-equipment" ||
      !requiredText(target.code, 160) ||
      !requiredText(target.departmentId, 64) ||
      typeof target.areaId !== "string" ||
      target.areaId.length > 64 ||
      /[\u0000-\u001f\u007f]/.test(target.areaId)
    )
      throw new MaintenanceIssuesError("invalid");
    const identity = JSON.stringify([
      target.namespace,
      target.code,
      target.departmentId,
      target.areaId,
    ]);
    if (targets.has(identity)) throw new MaintenanceIssuesError("invalid");
    targets.add(identity);
  }
}

/** Delegation is limited to issues explicitly reviewed by the Maintenance owner. */
export async function resolveMaintenanceIssues(
  tx: MaintenanceResolutionTransaction,
  resolutions: IssueResolution[],
  context: MaintenanceResolution,
): Promise<Entry[]> {
  if (
    !Array.isArray(resolutions) ||
    resolutions.length > 200 ||
    !context ||
    Object.keys(context).sort().join() !== "at,maintenanceId,outcome" ||
    !requiredText(context.maintenanceId, 101) ||
    typeof context.outcome !== "string" ||
    !context.outcome.trim() ||
    context.outcome.length > 4000 ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(context.outcome) ||
    typeof context.at !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(context.at) ||
    !Number.isFinite(Date.parse(context.at)) ||
    new Date(context.at).toISOString() !== context.at
  )
    throw new MaintenanceIssuesError("invalid");
  const seen = new Set<string>();
  for (const resolution of resolutions) {
    if (
      !resolution ||
      Object.keys(resolution).sort().join() !== "expectedRevision,id" ||
      !requiredText(resolution.id, 64) ||
      !Number.isSafeInteger(resolution.expectedRevision) ||
      resolution.expectedRevision < 1 ||
      resolution.expectedRevision >= 2147483647 ||
      seen.has(resolution.id)
    )
      throw new MaintenanceIssuesError("invalid");
    seen.add(resolution.id);
  }
  const prefix = `Maintenance ${context.maintenanceId}: `;
  const outcome = context.outcome.trim();
  // The complete outcome remains in Maintenance; Handover retains a bounded linked summary.
  const note =
    prefix +
    (prefix.length + outcome.length > 4000
      ? outcome.slice(0, 3999 - prefix.length) + "…"
      : outcome);
  const updated: Entry[] = [];
  // Validate every locked entry before issuing any owner write.
  for (const resolution of [...resolutions].sort((a, b) =>
    a.id.localeCompare(b.id, "en"),
  )) {
    const entry = await tx.get(resolution.id);
    if (
      !entry ||
      entry.deleted ||
      entry.revision !== resolution.expectedRevision ||
      !["open", "in-progress"].includes(entry.issueState)
    )
      throw new MaintenanceIssuesError("conflict");
    const changed = structuredClone(entry);
    // The owner delegates state authority only for this reviewed maintenance scope.
    changeIssue(changed, tx.actorId, true, "resolved", note);
    changed.revision++;
    changed.updatedAt = context.at;
    changed.latestUpdate = {
      note,
      actorName: tx.actorName,
      at: context.at,
    };
    updated.push(changed);
  }
  for (const entry of updated)
    await tx.save(entry, {
      entry,
      actorId: tx.actorId,
      actorName: tx.actorName,
      action: "state",
      note,
      at: context.at,
    });
  return updated;
}

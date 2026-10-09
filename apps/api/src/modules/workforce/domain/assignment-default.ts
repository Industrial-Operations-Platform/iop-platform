import type { Assignment } from "./workforce";

/** A home team or a personal schedule alone is never a work-zone assignment. */
export function assignedTarget(actor: string, day: string, assignments: Assignment[]): string {
  const own = assignments.filter((assignment) => assignment.userId === actor && assignment.date === day);
  if (own.some((assignment) => ["floating", "maintenance"].includes(assignment.duty))) return "";
  const zones = own.filter((assignment) => assignment.duty === "zone");
  if (!zones.length || zones.some((assignment) => !assignment.targetId)) return "";
  const targets = new Set(zones.map((assignment) => assignment.targetId));
  return targets.size === 1 ? [...targets][0] : "";
}

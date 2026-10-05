import type { AssignmentCheckpoint } from "../../application/notifications";

/** Persist only scoped event IDs, never assignments or report contents. */
export class BrowserAssignmentCheckpoint implements AssignmentCheckpoint {
  private readonly key: string;
  private fallback: string[] = [];
  constructor(organizationId: string, siteId: string, userId: string) {
    this.key = `iop.maintenance.read:${JSON.stringify([organizationId, siteId, userId])}`;
  }
  load(): string[] {
    try {
      const ids: unknown = JSON.parse(localStorage.getItem(this.key) ?? "[]");
      if (
        Array.isArray(ids) &&
        ids.length <= 1000 &&
        ids.every((id) => typeof id === "string" && id.length <= 200)
      )
        return ids;
    } catch {
      /* Private browsers may disable storage. */
    }
    return this.fallback;
  }
  save(ids: string[]) {
    this.fallback = ids;
    try {
      localStorage.setItem(this.key, JSON.stringify(ids));
    } catch {
      /* Retain session read state. */
    }
  }
}

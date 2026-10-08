import type { NotificationCheckpoint } from "../../application/notifications";
import type { NotificationRead } from "../../domain/models";

/** Persist a timestamp only, never entry content or permissions. */
export class BrowserNotificationCheckpoint implements NotificationCheckpoint {
  private readonly key: string;
  private fallback: string | null = null;
  private readFallback: NotificationRead[] = [];
  constructor(organizationId: string, siteId: string, userId: string) {
    this.key = `iop.handover.read:${JSON.stringify([organizationId, siteId, userId])}`;
  }
  load(): string | null {
    try {
      const value = localStorage.getItem(this.key);
      if (
        value &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
        Number.isFinite(Date.parse(value)) &&
        new Date(value).toISOString() === value &&
        value >= "1970-01-01T00:00:00.000Z"
      )
        return value;
    } catch {
      /* A private browser may disable storage; keep the session usable. */
    }
    return this.fallback;
  }
  save(instant: string): void {
    this.fallback = instant;
    try {
      localStorage.setItem(this.key, instant);
    } catch {
      /* Session-only read state. */
    }
  }
  loadReads(): NotificationRead[] {
    try {
      const reads: unknown = JSON.parse(localStorage.getItem(this.key + ":entries") ?? "[]");
      if (Array.isArray(reads) && reads.length <= 1000 && reads.every((read) =>
        read && typeof read.id === "string" && read.id.length <= 64 &&
        typeof read.at === "string" && Number.isFinite(Date.parse(read.at)) &&
        new Date(read.at).toISOString() === read.at)) return reads;
    } catch { /* Retain session read state. */ }
    return this.readFallback;
  }
  saveReads(reads: NotificationRead[]): void {
    this.readFallback = reads;
    try { localStorage.setItem(this.key + ":entries", JSON.stringify(reads)); }
    catch { /* Retain session read state. */ }
  }
}

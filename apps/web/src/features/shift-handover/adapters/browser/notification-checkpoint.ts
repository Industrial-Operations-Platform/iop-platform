import type { NotificationCheckpoint } from "../../application/notifications";

/** Persist a timestamp only, never entry content or permissions. */
export class BrowserNotificationCheckpoint implements NotificationCheckpoint {
  private readonly key: string;
  private fallback: string | null = null;
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
}

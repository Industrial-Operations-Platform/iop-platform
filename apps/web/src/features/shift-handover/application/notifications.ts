import type { Gateway } from "./handover";
import { emptySelection, type NotificationRead, type Page } from "../domain/models";

export interface NotificationCheckpoint {
  load(): string | null;
  save(instant: string): void;
  loadReads?(): NotificationRead[];
  saveReads?(reads: NotificationRead[]): void;
}
export const notificationEpoch = "1970-01-01T00:00:00.000Z";
export const emptyNotifications: Page = {
  entries: [],
  total: 0,
  nextCursor: "",
};

/** Read state belongs to the current actor/site; publication data stays on the server. */
export class EntryNotifications {
  private since: string | null;
  private current: Page = emptyNotifications;
  private pending?: Promise<Page>;
  private reads: Map<string, string>;
  private listeners = new Set<(page: Page) => void>();
  constructor(
    private readonly gateway: Pick<Gateway, "list">,
    private readonly checkpoint: NotificationCheckpoint,
  ) {
    this.since = checkpoint.load();
    this.reads = new Map((checkpoint.loadReads?.() ?? []).map((read) => [read.id, read.at]));
  }
  subscribe(listener: (page: Page) => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }
  private publish(page: Page): Page {
    this.current = page;
    this.listeners.forEach((listener) => listener(page));
    return page;
  }
  refresh(): Promise<Page> {
    if (!this.pending)
      this.pending = this.read().finally(() => {
        this.pending = undefined;
      });
    return this.pending;
  }
  private async read(): Promise<Page> {
    const page = await this.gateway.list({
      ...emptySelection,
      notificationsAfter: this.since ?? notificationEpoch,
      notificationReads: [...this.reads].map(([id, at]) => ({ id, at })),
    });
    if (this.since === null) {
      this.since = (page.entries[0]?.notificationAt ?? page.entries[0]?.createdAt) ?? notificationEpoch;
      this.checkpoint.save(this.since);
      this.current = emptyNotifications;
    } else {
      // Detail reads may finish while the feed is in flight.
      const entries = page.entries.filter((entry) =>
        (this.reads.get(entry.id) ?? "") < (entry.notificationAt ?? entry.createdAt));
      return this.publish({ ...page, entries, total: Math.max(0, page.total - page.entries.length + entries.length) });
    }
    return this.publish(this.current);
  }
  markRead(id: string, viewedAt: string): Page {
    this.reads.set(id, [this.reads.get(id) ?? "", viewedAt].sort().at(-1)!);
    this.reads = new Map([...this.reads].slice(-1000));
    this.checkpoint.saveReads?.([...this.reads].map(([entryId, at]) => ({ id: entryId, at })));
    const entries = this.current.entries.filter((entry) =>
      entry.id !== id || (entry.notificationAt ?? entry.createdAt) > viewedAt);
    return this.publish({ ...this.current, entries,
      total: Math.max(0, this.current.total - this.current.entries.length + entries.length) });
  }
  markAllRead(): Page {
    const latest = (this.current.entries[0]?.notificationAt ?? this.current.entries[0]?.createdAt);
    if (latest) {
      this.since = latest;
      this.checkpoint.save(latest);
    }
    return this.publish(emptyNotifications);
  }
}

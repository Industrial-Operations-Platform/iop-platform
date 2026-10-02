import type { Gateway } from "./handover";
import { emptySelection, type Page } from "../domain/models";

export interface NotificationCheckpoint {
  load(): string | null;
  save(instant: string): void;
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
  constructor(
    private readonly gateway: Pick<Gateway, "list">,
    private readonly checkpoint: NotificationCheckpoint,
  ) {
    this.since = checkpoint.load();
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
    });
    if (this.since === null) {
      this.since = page.entries[0]?.createdAt ?? notificationEpoch;
      this.checkpoint.save(this.since);
      this.current = emptyNotifications;
    } else this.current = page;
    return this.current;
  }
  markAllRead(): Page {
    const latest = this.current.entries[0]?.createdAt;
    if (latest) {
      this.since = latest;
      this.checkpoint.save(latest);
    }
    this.current = emptyNotifications;
    return this.current;
  }
}

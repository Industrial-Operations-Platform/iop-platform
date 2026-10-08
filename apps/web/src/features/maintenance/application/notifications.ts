import type { AssignmentEvent } from "../domain/models";
import type { MaintenanceApplication } from "./maintenance";

export interface AssignmentCheckpoint {
  load(): string[];
  save(ids: string[]): void;
}
/** Event IDs retain exact assignment read state, including equal-time events. */
export class MaintenanceNotifications {
  private read: Set<string>;
  private current: AssignmentEvent[] = [];
  private pending?: Promise<AssignmentEvent[]>;
  private viewed = new Map<string, number>();
  private listeners = new Set<(events: AssignmentEvent[]) => void>();
  constructor(
    private readonly application: Pick<MaintenanceApplication, "assignments">,
    private readonly checkpoint: AssignmentCheckpoint,
  ) {
    this.read = new Set(checkpoint.load());
  }
  refresh() {
    this.pending ??= this.application
      .assignments()
      .then((value) => {
        value.events.filter((event) => event.revision <= (this.viewed.get(event.recordId) ?? 0))
          .forEach((event) => this.read.add(event.id));
        this.checkpoint.save([...this.read].slice(-1000));
        this.current = value.events.filter((event) => !this.read.has(event.id));
        return this.publish();
      })
      .finally(() => {
        this.pending = undefined;
      });
    return this.pending;
  }
  subscribe(listener: (events: AssignmentEvent[]) => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }
  private publish() {
    this.listeners.forEach((listener) => listener(this.current));
    return this.current;
  }
  markRead(recordId: string, viewedRevision: number): AssignmentEvent[] {
    this.viewed.set(recordId, Math.max(viewedRevision, this.viewed.get(recordId) ?? 0));
    this.current.filter((event) => event.recordId === recordId && event.revision <= viewedRevision)
      .forEach((event) => this.read.add(event.id));
    this.checkpoint.save([...this.read].slice(-1000));
    this.current = this.current.filter((event) => !this.read.has(event.id));
    return this.publish();
  }
  markAllRead(): AssignmentEvent[] {
    this.current.forEach((event) => this.read.add(event.id));
    this.read = new Set([...this.read].slice(-1000));
    this.checkpoint.save([...this.read]);
    this.current = [];
    return this.publish();
  }
}

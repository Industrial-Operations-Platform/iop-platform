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
        this.current = value.events.filter((event) => !this.read.has(event.id));
        return this.current;
      })
      .finally(() => {
        this.pending = undefined;
      });
    return this.pending;
  }
  markAllRead(): AssignmentEvent[] {
    this.current.forEach((event) => this.read.add(event.id));
    this.read = new Set([...this.read].slice(-1000));
    this.checkpoint.save([...this.read]);
    this.current = [];
    return this.current;
  }
}

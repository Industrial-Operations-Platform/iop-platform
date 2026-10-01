import {
  sameSchedule,
  validateWeek,
  type WeeklyScheduleInput,
} from "../domain/weekly-schedule";
import {
  assert,
  date,
  identifier,
  range,
  settings,
  statuses,
  overlaps,
  type Assignment,
  type ImportInput,
  type ImportRow,
  type Kind,
  type Payloads,
  type Person,
  type RecordEntry,
  type Revision,
  type Schedule,
  type Settings,
  type Worker,
} from "../domain/workforce";
export interface Transaction {
  canPlan: boolean;
  canAdminister: boolean;
  people(): Promise<Person[]>;
  names(userIds: string[]): Promise<Map<string, string>>;
  records(from: string, to: string): Promise<RecordEntry[]>;
  get(kind: Kind, id: string): Promise<RecordEntry | null>;
  save(entry: RecordEntry, revision: Revision): Promise<void>;
  history(kind: Kind, id: string): Promise<Revision[]>;
}
export interface Store {
  run<T>(
    actor: string,
    permission: "workforce.read" | "workforce.plan" | "workforce.administer",
    work: (tx: Transaction) => Promise<T>,
  ): Promise<T>;
}
export interface ScheduleDecoder {
  decode(input: ImportInput): ImportRow[];
}
export interface SiteClock {
  interval(
    date: string,
    start: string,
    end: string,
    zone: string,
  ): { startsAt: string; endsAt: string };
}
export interface SaveInput {
  kind: Kind;
  id: string;
  expectedRevision: number;
  deleted: boolean;
  data: Payloads[Kind];
}
export class Workforce {
  constructor(
    private readonly store: Store,
    private readonly decoder: ScheduleDecoder,
    private readonly clock: SiteClock,
    private readonly defaults: Settings,
    private readonly timeZone: string,
    private readonly now: () => string,
  ) {}
  board(actor: string, from: string, to: string) {
    range(from, to);
    return this.store.run(actor, "workforce.read", async (tx) => {
      const records = (await tx.records(from, to)).filter((r) => !r.deleted);
      const names = await tx.names(
        records.flatMap((r) => ("userId" in r.data ? [r.data.userId] : [])),
      );
      return {
        actorId: actor,
        timeZone: this.timeZone,
        canPlan: tx.canPlan,
        canAdminister: tx.canAdminister,
        people: await tx.people(),
        settings: await this.configuration(tx),
        records: records.map((record) => ({
          ...record,
          personName:
            "userId" in record.data
              ? (names.get(record.data.userId) ?? record.personName)
              : record.personName,
        })),
      };
    });
  }
  private async configuration(tx: Transaction): Promise<Settings> {
    return (
      ((await tx.get("settings", "site"))?.data as Settings) ?? this.defaults
    );
  }
  private async write(
    tx: Transaction,
    actor: string,
    kind: Kind,
    id: string,
    data: Payloads[Kind],
    expectedRevision: number,
    deleted = false,
    action = "saved",
  ) {
    const before = await tx.get(kind, id);
    assert(
      Number.isSafeInteger(expectedRevision) &&
        expectedRevision >= 0 &&
        (before?.revision ?? 0) === expectedRevision,
      "workforce_conflict",
    );
    assert(!deleted || before, "workforce_missing");
    const people = await tx.people();
    const person =
      "userId" in data ? people.find((p) => p.id === data.userId) : undefined;
    const entry: RecordEntry = {
      kind,
      id,
      revision: expectedRevision + 1,
      deleted,
      data: structuredClone(data),
      personName: person?.name ?? before?.personName ?? "",
    };
    await tx.save(entry, {
      record: entry,
      actorId: actor,
      actorName: people.find((p) => p.id === actor)?.name ?? actor,
      at: this.now(),
      action,
    });
    return entry;
  }
  async save(actor: string, input: SaveInput) {
    assert(
      input &&
        ["settings", "worker", "schedule", "assignment"].includes(input.kind),
    );
    identifier(input.id);
    assert(
      typeof input.deleted === "boolean" &&
        input.data &&
        typeof input.data === "object" &&
        !Array.isArray(input.data),
    );
    const permission =
      input.kind === "assignment" && !input.deleted
        ? "workforce.plan"
        : "workforce.administer";
    return this.store.run(actor, permission, async (tx) => {
      if (input.deleted) {
        const prior = await tx.get(input.kind, input.id);
        assert(prior, "workforce_missing");
        assert(input.kind !== "settings");
        if (input.kind === "schedule") {
          const schedule = prior.data as Schedule;
          const assigned = (
            await tx.records(schedule.date, schedule.date)
          ).some(
            (r) =>
              !r.deleted &&
              r.kind === "assignment" &&
              (r.data as Assignment).userId === schedule.userId,
          );
          assert(!assigned, "workforce_conflict");
        }
        return this.write(
          tx,
          actor,
          input.kind,
          input.id,
          prior.data,
          input.expectedRevision,
          true,
          "deleted",
        );
      }
      const config = await this.configuration(tx);
      const people = await tx.people();
      if (input.kind === "settings") {
        assert(input.id === "site");
        settings(input.data as Settings);
        for (const team of (input.data as Settings).teams)
          assert(
            !team.leaderId ||
              people.some(
                (p) =>
                  p.id === team.leaderId &&
                  ["team-leader", "administrator"].includes(p.profile),
              ),
          );
      } else if (input.kind === "worker") {
        const worker = input.data as Worker;
        identifier(worker.userId);
        assert(
          typeof worker.teamId === "string" &&
            typeof worker.homeTargetId === "string",
        );
        assert(
          input.id === worker.userId &&
            people.some((p) => p.id === worker.userId),
        );
        assert(
          !worker.teamId || config.teams.some((t) => t.id === worker.teamId),
        );
        assert(
          !worker.homeTargetId ||
            config.targets.some((t) => t.id === worker.homeTargetId),
        );
      } else if (input.kind === "schedule") {
        const s = this.schedule(input.data as Schedule, "manual");
        assert(
          input.id === `${s.userId}_${s.date}` &&
            people.some((p) => p.id === s.userId),
        );
        await this.checkScheduleChange(tx, s);
        input = { ...input, data: s };
      } else {
        input = {
          ...input,
          data: await this.assignment(
            tx,
            input.data as Assignment,
            config,
            input.id,
          ),
        };
      }
      return this.write(
        tx,
        actor,
        input.kind,
        input.id,
        input.data,
        input.expectedRevision,
      );
    });
  }
  private schedule(row: ImportRow, source: string): Schedule {
    assert(row && typeof row === "object");
    identifier(row.userId);
    date(row.date);
    assert(statuses.includes(row.status));
    const working = ["work", "training", "maintenance"].includes(row.status);
    assert(working || (row.start === "" && row.end === ""));
    return {
      userId: row.userId,
      date: row.date,
      status: row.status,
      start: row.start,
      end: row.end,
      ...(working
        ? this.clock.interval(row.date, row.start, row.end, this.timeZone)
        : { startsAt: "", endsAt: "" }),
      source,
    };
  }
  private async checkScheduleChange(
    tx: Transaction,
    schedule: Schedule,
    replacingDates: ReadonlySet<string> = new Set(),
  ) {
    const entries = await tx.records(
      this.previousDate(schedule.date),
      this.nextDate(schedule.date),
    );
    for (const r of entries.filter((r) => !r.deleted)) {
      if (r.kind === "assignment") {
        const a = r.data as Assignment;
        if (a.userId === schedule.userId && a.date === schedule.date)
          assert(
            ["work", "maintenance"].includes(schedule.status) &&
              a.startsAt >= schedule.startsAt &&
              a.endsAt <= schedule.endsAt,
            "workforce_conflict",
          );
      }
      if (r.kind === "schedule") {
        const other = r.data as Schedule;
        if (
          other.userId === schedule.userId &&
          other.date !== schedule.date &&
          !replacingDates.has(other.date) &&
          schedule.startsAt &&
          other.startsAt
        )
          assert(!overlaps(other, schedule), "workforce_overlap");
      }
    }
  }
  private previousDate(d: string) {
    return new Date(Date.parse(d) - 86400000).toISOString().slice(0, 10);
  }
  private nextDate(d: string) {
    return new Date(Date.parse(d) + 86400000).toISOString().slice(0, 10);
  }
  private async assignment(
    tx: Transaction,
    input: Assignment,
    config: Settings,
    id: string,
  ): Promise<Assignment> {
    assert(input && typeof input === "object");
    identifier(input.userId);
    date(input.date);
    const person = (await tx.people()).find((p) => p.id === input.userId);
    assert(person);
    assert(["zone", "floating", "leader", "maintenance"].includes(input.duty));
    assert(
      input.duty !== "leader" ||
        ["team-leader", "administrator"].includes(person.profile),
    );
    assert(input.duty === "leader" || person.profile !== "team-leader");
    assert(input.duty !== "zone" || !!input.targetId);
    assert(
      input.targetId === "" ||
        config.targets.some((t) => t.id === input.targetId),
    );
    const shift = config.shifts.find((s) => s.id === input.shiftId);
    assert(shift && shift.days.includes(new Date(input.date).getUTCDay()));
    const a: Assignment = {
      targetLabel:
        config.targets.find((t) => t.id === input.targetId)?.label ?? "",
      shiftLabel: shift.label,
      phoneLabel:
        input.phone === "maintenance"
          ? "Maintenance"
          : (config.targets.find((t) => t.id === input.phone)?.phone ?? ""),
      userId: input.userId,
      date: input.date,
      shiftId: shift.id,
      targetId: input.targetId,
      duty: input.duty,
      phone: input.phone,
      start: input.start || shift.start,
      end: input.end || shift.end,
      ...this.clock.interval(
        input.date,
        input.start || shift.start,
        input.end || shift.end,
        this.timeZone,
      ),
    };
    assert(
      typeof a.phone === "string" &&
        (a.phone === "" ||
          (a.phone === "maintenance" && a.duty === "maintenance") ||
          config.targets.some(
            (t) => t.id === a.targetId && t.id === a.phone && !!t.phone,
          )),
    );
    const schedule = await tx.get("schedule", `${a.userId}_${a.date}`);
    const s = schedule?.data as Schedule | undefined;
    assert(
      schedule &&
        !schedule.deleted &&
        s &&
        ["work", "maintenance"].includes(s.status) &&
        a.startsAt >= s.startsAt &&
        a.endsAt <= s.endsAt,
      "workforce_schedule_required",
    );
    for (const r of (
      await tx.records(this.previousDate(a.date), this.nextDate(a.date))
    ).filter((r) => r.kind === "assignment" && r.id !== id && !r.deleted)) {
      const other = r.data as Assignment;
      assert(
        !overlaps(a, other) ||
          (other.userId !== a.userId && (!a.phone || other.phone !== a.phone)),
        "workforce_overlap",
      );
    }
    return a;
  }
  saveWeek(actor: string, input: WeeklyScheduleInput) {
    validateWeek(input);
    return this.store.run(actor, "workforce.plan", async (tx) => {
      assert((await tx.people()).some((person) => person.id === input.userId));
      const replacingDates = new Set(input.days.map((day) => day.date));
      const prepared = [];
      for (const day of input.days) {
        const schedule = this.schedule(
          { ...day, userId: input.userId },
          "manual",
        );
        const id = `${input.userId}_${day.date}`;
        const prior = await tx.get("schedule", id);
        // Revision zero means no active day, including a retained tombstone.
        assert(
          (prior && !prior.deleted ? prior.revision : 0) ===
            day.expectedRevision,
          "workforce_conflict",
        );
        await this.checkScheduleChange(tx, schedule, replacingDates);
        prepared.push({
          id,
          schedule,
          revision: prior?.revision ?? 0,
          unchanged:
            !!prior &&
            !prior.deleted &&
            sameSchedule(prior.data as Schedule, schedule),
        });
      }
      const working = prepared
        .filter((day) => day.schedule.startsAt)
        .sort((a, b) => a.schedule.startsAt.localeCompare(b.schedule.startsAt));
      for (let i = 1; i < working.length; i++)
        assert(
          !overlaps(working[i - 1].schedule, working[i].schedule),
          "workforce_overlap",
        );
      let changed = 0;
      for (const day of prepared) {
        if (day.unchanged) continue;
        await this.write(
          tx,
          actor,
          "schedule",
          day.id,
          day.schedule,
          day.revision,
        );
        changed++;
      }
      return { changed, unchanged: prepared.length - changed };
    });
  }
  preview(actor: string, input: ImportInput) {
    return this.store.run(actor, "workforce.administer", (tx) =>
      this.prepare(tx, input),
    );
  }
  private async prepare(tx: Transaction, input: ImportInput) {
    const rows = this.decoder.decode(input);
    assert(rows.length > 0 && rows.length <= 2000, "workforce_import_invalid");
    const people = await tx.people(),
      seen = new Set<string>();
    const prepared = [];
    for (const row of rows) {
      const data = this.schedule(row, input.format),
        id = `${data.userId}_${data.date}`;
      assert(
        people.some((p) => p.id === data.userId) && !seen.has(id),
        "workforce_import_invalid",
      );
      seen.add(id);
      await this.checkScheduleChange(tx, data);
      const prior = await tx.get("schedule", id);
      const previous = prior?.data as Schedule | undefined;
      const unchanged =
        !!prior && !prior.deleted && !!previous && sameSchedule(previous, data);
      prepared.push({
        id,
        data,
        expectedRevision: prior?.revision ?? 0,
        outcome: unchanged ? "unchanged" : prior ? "replace" : "create",
      });
    }
    // Detect overlaps within a batch too; no partial writes occur in preview or commit.
    const sorted = prepared
      .filter((p) => p.data.startsAt)
      .sort(
        (a, b) =>
          a.data.userId.localeCompare(b.data.userId) ||
          a.data.startsAt.localeCompare(b.data.startsAt),
      );
    for (let i = 1; i < sorted.length; i++)
      assert(
        sorted[i].data.userId !== sorted[i - 1].data.userId ||
          !overlaps(sorted[i].data, sorted[i - 1].data),
        "workforce_overlap",
      );
    return prepared;
  }
  import(
    actor: string,
    input: ImportInput,
    revisions: { id: string; expectedRevision: number }[],
  ) {
    assert(Array.isArray(revisions) && revisions.length <= 2000);
    return this.store.run(actor, "workforce.administer", async (tx) => {
      const rows = await this.prepare(tx, input);
      assert(
        rows.length === revisions.length &&
          new Set(revisions.map((r) => r.id)).size === rows.length,
        "workforce_conflict",
      );
      for (const row of rows)
        assert(
          revisions.some(
            (r) =>
              r.id === row.id && r.expectedRevision === row.expectedRevision,
          ) || row.outcome === "unchanged",
          "workforce_conflict",
        );
      let changed = 0;
      for (const row of rows)
        if (row.outcome !== "unchanged") {
          await this.write(
            tx,
            actor,
            "schedule",
            row.id,
            row.data,
            row.expectedRevision,
            false,
            "imported",
          );
          changed++;
        }
      return { changed, unchanged: rows.length - changed };
    });
  }
  history(actor: string, kind: Kind, id: string) {
    assert(["worker", "settings", "schedule", "assignment"].includes(kind));
    identifier(id);
    return this.store.run(actor, "workforce.read", (tx) =>
      tx.history(kind, id),
    );
  }
}

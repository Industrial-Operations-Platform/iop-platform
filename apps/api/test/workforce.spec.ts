import {
  Workforce,
  type Store,
  type Transaction,
} from "../src/modules/workforce/application/workforce";
import {
  WorkforceError,
  type RecordEntry,
  type Revision,
  type Settings,
} from "../src/modules/workforce/domain/workforce";
import { ManualScheduleDecoder } from "../src/modules/integrations/adapters/schedule/decoder";
import { IntlSiteClock } from "../src/modules/workforce/adapters/time/site-clock";
import { decideSiteAccess } from "../src/modules/users-rbac/domain/authorization";
import { siteRoles } from "../src/modules/users-rbac/domain/profiles";
const config: Settings = {
  shifts: [
    {
      id: "early",
      label: "Early",
      start: "05:00",
      end: "14:15",
      days: [0, 1, 2, 3, 4, 5, 6],
    },
  ],
  targets: [{ id: "zone", label: "Zone", phone: "phone" }],
  teams: [],
};
function setup() {
  const records = new Map<string, RecordEntry>(),
    revisions: Revision[] = [];
  const names = new Map([
    ["admin", "Admin"],
    ["lead", "Leader"],
    ["tech", "Technician"],
    ["other", "Other"],
  ]);
  const store: Store = {
    run: async (actor, permission, work) => {
      const allowed = decideSiteAccess(
        {
          userId: actor,
          organizationId: "org",
          siteId: "site",
          permissions: [permission],
        },
        siteRoles(
          actor === "admin"
            ? "administrator"
            : actor === "lead"
              ? "team-leader"
              : "technician",
        ).map((roleId) => ({
          userActive: true,
          membershipActive: true,
          roleId,
        })),
      );
      if (!allowed.allowed) throw new WorkforceError("workforce_denied");
      const staged = new Map(
          [...records].map(([k, v]) => [k, structuredClone(v)]),
        ),
        audit: Revision[] = [];
      const tx: Transaction = {
        canPlan: actor !== "tech",
        canAdminister: actor === "admin",
        people: async () => [
          { id: "admin", name: "Admin", profile: "administrator" },
          { id: "lead", name: "Leader", profile: "team-leader" },
          { id: "tech", name: "Technician", profile: "technician" },
          { id: "other", name: "Other", profile: "technician" },
        ],
        names: async () => new Map(names),
        records: async (from, to) =>
          [...staged.values()].filter(
            (r) =>
              !("date" in r.data) || (r.data.date >= from && r.data.date <= to),
          ),
        get: async (kind, id) => staged.get(kind + id) ?? null,
        save: async (r, h) => {
          staged.set(r.kind + r.id, structuredClone(r));
          audit.push(structuredClone(h));
        },
        history: async (kind, id) =>
          revisions.filter((r) => r.record.kind === kind && r.record.id === id),
      };
      const result = await work(tx);
      records.clear();
      staged.forEach((v, k) => records.set(k, v));
      revisions.push(...audit);
      return result;
    },
  };
  return {
    app: new Workforce(
      store,
      new ManualScheduleDecoder(),
      new IntlSiteClock(),
      config,
      "Europe/Zurich",
      () => new Date().toISOString(),
    ),
    records,
    revisions,
    names,
  };
}
const source = {
  format: "csv" as const,
  userId: "",
  text: "userId,date,status,start,end\ntech,2026-09-30,work,05:00,14:15\nother,2026-09-30,work,05:00,14:15",
};
const assignment = {
  kind: "assignment" as const,
  id: "assignment",
  expectedRevision: 0,
  deleted: false,
  data: {
    userId: "tech",
    date: "2026-09-30",
    shiftId: "early",
    targetId: "zone",
    duty: "zone" as const,
    phone: "zone",
    start: "05:00",
    end: "14:15",
    startsAt: "",
    endsAt: "",
  },
};
test("preview has no writes, commit is atomic and identical replay is idempotent", async () => {
  const { app, records, revisions } = setup();
  const preview = await app.preview("admin", source);
  expect(records.size).toBe(0);
  expect(await app.import("admin", source, preview)).toEqual({
    changed: 2,
    unchanged: 0,
  });
  expect(await app.import("admin", source, preview)).toEqual({
    changed: 0,
    unchanged: 2,
  });
  expect(revisions).toHaveLength(2);
  await expect(app.preview("tech", source)).rejects.toMatchObject({
    code: "workforce_denied",
  });
  await expect(app.preview("lead", source)).rejects.toMatchObject({
    code: "workforce_denied",
  });
});
test("planning requires schedule, role, exclusive person and phone, and expected revision", async () => {
  const { app } = setup();
  await expect(app.save("lead", assignment)).rejects.toMatchObject({
    code: "workforce_schedule_required",
  });
  await app.import("admin", source, await app.preview("admin", source));
  await app.save("lead", assignment);
  await expect(
    app.save("tech", { ...assignment, id: "forbidden" }),
  ).rejects.toMatchObject({ code: "workforce_denied" });
  await expect(
    app.save("lead", { ...assignment, id: "overlap" }),
  ).rejects.toMatchObject({ code: "workforce_overlap" });
  await expect(
    app.save("lead", {
      ...assignment,
      id: "phone",
      data: { ...assignment.data, userId: "other" },
    }),
  ).rejects.toMatchObject({ code: "workforce_overlap" });
  await expect(app.save("lead", assignment)).rejects.toMatchObject({
    code: "workforce_conflict",
  });
});
test("logical deletion preserves named revisions and requires administrator", async () => {
  const { app } = setup();
  await app.import("admin", source, await app.preview("admin", source));
  await app.save("lead", assignment);
  await expect(
    app.save("lead", { ...assignment, expectedRevision: 1, deleted: true }),
  ).rejects.toMatchObject({ code: "workforce_denied" });
  await app.save("admin", {
    ...assignment,
    expectedRevision: 1,
    deleted: true,
  });
  expect(
    (await app.board("tech", "2026-09-30", "2026-09-30")).records.filter(
      (r) => r.kind === "assignment",
    ),
  ).toHaveLength(0);
  expect(
    (await app.history("tech", "assignment", "assignment")).map(
      (r) => r.record.personName,
    ),
  ).toEqual(["Technician", "Technician"]);
});
test("absence replacement cannot invalidate an assignment; stale import writes nothing", async () => {
  const { app, records } = setup();
  const preview = await app.preview("admin", source);
  await app.import("admin", source, preview);
  await app.save("lead", assignment);
  const vacation = {
    ...source,
    text: "userId,date,status,start,end\ntech,2026-09-30,vacation,,",
  };
  await expect(app.preview("admin", vacation)).rejects.toMatchObject({
    code: "workforce_conflict",
  });
  const changed = { ...source, text: source.text.replaceAll("05:00", "04:00") };
  await expect(app.import("admin", changed, preview)).rejects.toMatchObject({
    code: "workforce_conflict",
  });
  expect(records.size).toBe(3);
});
test("source adapter parses quoted-printable HTML, off and vacation without invented Sunday", () => {
  const decoded = new ManualScheduleDecoder().decode({
    format: "email",
    userId: "tech",
    text: "Content-Type: text/html\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n<table><tr><td>Montag, 28.09.2026</td><td>13:45 =E2=80=93 23:00</td></tr><tr><td>Dienstag, 29.09.2026</td><td>Ferien</td></tr><tr><td>Samstag, 03.10.2026</td><td>X</td></tr></table>",
  });
  expect(decoded).toHaveLength(3);
  expect(decoded[0]).toMatchObject({
    date: "2026-09-28",
    start: "13:45",
    end: "23:00",
  });
  expect(decoded[1].status).toBe("vacation");
  expect(decoded[2].status).toBe("off");
  expect(() =>
    new ManualScheduleDecoder().decode({
      format: "email",
      userId: "tech",
      text: "Montag, 28.09.2026\nUnknown",
    }),
  ).toThrow();
});
test("local intervals support overnight and reject missing/repeated DST times", () => {
  const clock = new IntlSiteClock();
  expect(
    clock.interval("2026-09-30", "22:00", "06:00", "Europe/Zurich"),
  ).toEqual({
    startsAt: "2026-09-30T20:00:00.000Z",
    endsAt: "2026-10-01T04:00:00.000Z",
  });
  expect(() =>
    clock.interval("2026-10-25", "02:30", "06:00", "Europe/Zurich"),
  ).toThrow("workforce_time_ambiguous");
  expect(() =>
    clock.interval("2026-03-29", "02:30", "06:00", "Europe/Zurich"),
  ).toThrow("workforce_time_ambiguous");
});

test("phone renaming keeps exclusivity and the maintenance phone ID stays reserved", async () => {
  const { app } = setup();
  await app.import("admin", source, await app.preview("admin", source));
  await app.save("lead", assignment);
  const changed = {
    ...config,
    targets: [{ id: "zone", label: "Renamed zone", phone: "New phone label" }],
  };
  await app.save("admin", {
    kind: "settings",
    id: "site",
    expectedRevision: 0,
    deleted: false,
    data: changed,
  });
  await expect(
    app.save("lead", {
      ...assignment,
      id: "other-phone",
      data: { ...assignment.data, userId: "other" },
    }),
  ).rejects.toMatchObject({ code: "workforce_overlap" });
  await expect(
    app.save("admin", {
      kind: "settings",
      id: "site",
      expectedRevision: 1,
      deleted: false,
      data: {
        ...config,
        targets: [{ id: "maintenance", label: "Zone", phone: "Phone" }],
      },
    }),
  ).rejects.toMatchObject({ code: "workforce_invalid" });
});

const manualWeek = {
  userId: "tech",
  weekStart: "2026-09-28",
  days: [
    "2026-09-28",
    "2026-09-29",
    "2026-09-30",
    "2026-10-01",
    "2026-10-02",
  ].map((date) => ({
    date,
    status: "work" as const,
    start: "05:00",
    end: "14:15",
    expectedRevision: 0,
  })),
};
test("leader enters a week and updates one day; technician remains read-only and unchanged days retain history", async () => {
  const { app } = setup();
  await expect(app.saveWeek("tech", manualWeek)).rejects.toMatchObject({
    code: "workforce_denied",
  });
  expect(await app.saveWeek("lead", manualWeek)).toEqual({
    changed: 5,
    unchanged: 0,
  });
  const update = {
    ...manualWeek,
    days: [
      {
        ...manualWeek.days[2],
        start: "13:45",
        end: "23:00",
        expectedRevision: 1,
      },
    ],
  };
  expect(await app.saveWeek("lead", update)).toEqual({
    changed: 1,
    unchanged: 0,
  });
  const history = await app.history("tech", "schedule", "tech_2026-09-30");
  expect(history).toHaveLength(2);
  expect(history[1]).toMatchObject({
    actorId: "lead",
    record: { data: { start: "13:45", source: "manual" } },
  });
  expect(
    await app.saveWeek("admin", {
      ...update,
      days: [{ ...update.days[0], expectedRevision: 2 }],
    }),
  ).toEqual({ changed: 0, unchanged: 1 });
  expect(await app.history("tech", "schedule", "tech_2026-09-28")).toHaveLength(
    1,
  );
});
test("weekly stale, malformed and out-of-week input cannot partially overwrite the schedule", async () => {
  const { app } = setup();
  await app.saveWeek("lead", manualWeek);
  const changed = {
    ...manualWeek,
    days: manualWeek.days.map((day) => ({
      ...day,
      start: "13:45",
      end: "23:00",
      expectedRevision: 1,
    })),
  };
  changed.days[4].expectedRevision = 0;
  await expect(app.saveWeek("lead", changed)).rejects.toMatchObject({
    code: "workforce_conflict",
  });
  expect(await app.history("tech", "schedule", "tech_2026-09-28")).toHaveLength(
    1,
  );
  for (const invalid of [
    { ...manualWeek, weekStart: "2026-09-29" },
    { ...manualWeek, days: [{ ...manualWeek.days[0], date: "2026-10-05" }] },
    { ...manualWeek, days: [manualWeek.days[0], manualWeek.days[0]] },
    { ...manualWeek, days: [] },
  ])
    expect(() => app.saveWeek("lead", invalid)).toThrow("workforce_invalid");
});
test("weekly edits preserve zone assignments and roll back every day on a dependent interval conflict", async () => {
  const { app, records } = setup();
  await app.import("admin", source, await app.preview("admin", source));
  await app.save("lead", assignment);
  await expect(
    app.saveWeek("lead", {
      ...manualWeek,
      days: [
        manualWeek.days[0],
        {
          ...manualWeek.days[2],
          start: "13:45",
          end: "23:00",
          expectedRevision: 1,
        },
      ],
    }),
  ).rejects.toMatchObject({ code: "workforce_conflict" });
  expect(records.has("scheduletech_2026-09-28")).toBe(false);
  expect(records.get("assignmentassignment")?.revision).toBe(1);
});
test("weekly overlap validation uses the whole proposed week plus unchanged neighboring dates", async () => {
  const { app } = setup();
  await app.saveWeek("lead", { ...manualWeek, days: [manualWeek.days[1]] });
  const replacement = {
    ...manualWeek,
    days: [
      { ...manualWeek.days[0], start: "22:00", end: "06:00" },
      {
        ...manualWeek.days[1],
        start: "08:00",
        end: "17:00",
        expectedRevision: 1,
      },
    ],
  };
  expect(await app.saveWeek("lead", replacement)).toEqual({
    changed: 2,
    unchanged: 0,
  });
  await expect(
    app.saveWeek("lead", {
      ...manualWeek,
      days: [{ ...manualWeek.days[1], expectedRevision: 2 }],
    }),
  ).rejects.toMatchObject({ code: "workforce_overlap" });
  const overnight = {
    ...manualWeek,
    userId: "other",
    days: [
      { ...manualWeek.days[0], start: "22:00", end: "06:00" },
      manualWeek.days[1],
    ],
  };
  await expect(app.saveWeek("lead", overnight)).rejects.toMatchObject({
    code: "workforce_overlap",
  });
  const priorSunday = {
    ...manualWeek,
    weekStart: "2026-09-21",
    days: [
      {
        ...manualWeek.days[0],
        date: "2026-09-27",
        start: "22:00",
        end: "06:00",
      },
    ],
  };
  await app.saveWeek("lead", priorSunday);
  await expect(
    app.saveWeek("lead", {
      ...manualWeek,
      days: [{ ...manualWeek.days[0], expectedRevision: 1 }],
    }),
  ).rejects.toMatchObject({ code: "workforce_overlap" });
});

test("board resolves names by account ID without rewriting records or revision evidence", async () => {
  const { app, records, revisions, names } = setup();
  await app.import("admin", source, await app.preview("admin", source));
  await app.save("lead", assignment);
  const before = structuredClone([...records.values()]);
  const evidence = structuredClone(revisions);
  names.set("tech", "Renamed colleague");
  names.set("other", "Renamed colleague");
  const board = await app.board("tech", "2026-09-30", "2026-09-30");
  expect(board.records).toHaveLength(3);
  expect(
    board.records.every((record) => record.personName === "Renamed colleague"),
  ).toBe(true);
  names.delete("other");
  expect(
    (await app.board("tech", "2026-09-30", "2026-09-30")).records.find(
      (record) => "userId" in record.data && record.data.userId === "other",
    )?.personName,
  ).toBe("Other");
  expect([...records.values()]).toEqual(before);
  expect(revisions).toEqual(evidence);
});

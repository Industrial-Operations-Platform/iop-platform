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

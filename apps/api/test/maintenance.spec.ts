import {
  Maintenance,
  type Store,
  type Transaction,
  type SaveInput,
} from "../src/modules/maintenance/application/maintenance";
import {
  MaintenanceError,
  type MaintenanceRecord,
  type Revision,
  type Settings,
  type Priority,
} from "../src/modules/maintenance/domain/maintenance";
const defaultPriorities: Priority[] = [
  { id: "normal", label: "Normal", rank: 1 },
  { id: "urgent", label: "Urgent", rank: 2 },
];
const input: SaveInput = {
  id: "work-1",
  expectedRevision: 0,
  reason: "",
  data: {
    title: "Inspect drive",
    details: "Scheduled inspection",
    locationId: "area",
    assetId: "asset",
    priorityId: "normal",
    assigneeId: "assigned",
    teamId: "team",
    status: "open",
    dueDate: "2026-10-07",
    outcome: "",
    blockedReason: "",
    externalReference: "00123",
  },
};
function setup() {
  const records = new Map<string, MaintenanceRecord>(),
    revisions: Revision[] = [];
  let settings: Settings | null = null;
  let failSave = false;
  const names = new Map([
    ["author", "Author"],
    ["assigned", "Assigned"],
    ["other", "Other"],
    ["admin", "Administrator"],
  ]);
  const assets = new Map([
    [
      "asset",
      {
        id: "asset",
        name: "Drive",
        locationId: "area",
        status: "validated" as const,
      },
    ],
  ]);
  const used = new Set<string>();
  let selectionLocations: string[] = [];
  const store: Store = {
    run: async (actor, permission, work) => {
      if (
        !names.has(actor) ||
        (permission === "maintenance.administer" && actor !== "admin")
      )
        throw new MaintenanceError("maintenance_denied");
      const staged = new Map(
        [...records].map(([id, r]) => [id, structuredClone(r)]),
      );
      const history: Revision[] = [];
      let nextSettings = settings;
      const tx: Transaction = {
        canContribute: true,
        canCoordinate: actor === "admin",
        canAdminister: actor === "admin",
        people: async () => [...names].map(([id, name]) => ({ id, name })),
        names: async () => names,
        teams: async () => [{ id: "team", label: "Mechanical" }],
        assets: async () => [...assets.values()],
        asset: async (id) => assets.get(id) ?? null,
        settings: async () => nextSettings,
        saveSettings: async (next) => {
          nextSettings = structuredClone(next);
        },
        priorityUsed: async (ids) => ids.some((id) => used.has(id)),
        get: async (id) => structuredClone(staged.get(id) ?? null),
        creation: async (id) =>
          structuredClone(
            revisions.find(
              (r) => r.record.id === id && r.record.revision === 1,
            ) ?? null,
          ),
        save: async (record, revision) => {
          staged.set(record.id, structuredClone(record));
          if (failSave) throw new Error("Synthetic failed revision append");
          history.push(structuredClone(revision));
        },
        query: async (_selection, locationIds) => {
          selectionLocations = locationIds;
          return {
            records: [...staged.values()],
            total: staged.size,
            nextCursor: "",
            statusCounts: {
              open: staged.size,
              "in-progress": 0,
              blocked: 0,
              done: 0,
            },
          };
        },
        history: async (id, before, limit) => ({
          revisions: revisions
            .filter(
              (r) =>
                r.record.id === id && (!before || r.record.revision < before),
            )
            .sort((a, b) => b.record.revision - a.record.revision)
            .slice(0, limit),
          nextBefore: 0,
        }),
      };
      const result = await work(tx);
      records.clear();
      staged.forEach((value, id) => records.set(id, value));
      revisions.push(...history);
      settings = nextSettings;
      return result;
    },
  };
  const app = new Maintenance(
    store,
    [
      { id: "department", label: "Department", parentId: "" },
      { id: "area", label: "Area", parentId: "department" },
    ],
    defaultPriorities,
    () => "2026-10-05T12:00:00.000Z",
  );
  return {
    app,
    records,
    revisions,
    names,
    assets,
    used,
    locations: () => selectionLocations,
    fail: () => {
      failSave = true;
    },
  };
}
test("creation attributes server identity and supports exact retries independent of object key order", async () => {
  const { app, revisions } = setup();
  const first = await app.save("author", input);
  expect(first).toMatchObject({
    authorId: "author",
    authorName: "Author",
    assetName: "Drive",
    assigneeName: "Assigned",
    revision: 1,
    canEdit: true,
    canReassign: false,
  });
  const reordered = Object.fromEntries(
    Object.entries(input.data).reverse(),
  ) as unknown as SaveInput["data"];
  expect(await app.save("author", { ...input, data: reordered })).toEqual(
    first,
  );
  await app.save("assigned", {
    ...input,
    expectedRevision: 1,
    reason: "Inspection started",
    data: { ...input.data, status: "in-progress" },
  });
  expect((await app.save("author", input)).revision).toBe(2);
  expect(revisions).toHaveLength(2);
  await expect(app.save("other", input)).rejects.toMatchObject({
    code: "maintenance_conflict",
  });
  await expect(
    app.save("author", {
      ...input,
      data: { ...input.data, title: "Different request" },
    }),
  ).rejects.toMatchObject({ code: "maintenance_conflict" });
  await expect(
    app.save("author", { ...input, reason: "Changed creation evidence" }),
  ).rejects.toMatchObject({ code: "maintenance_conflict" });
});
test("assigned workers progress work, coordinators reassign and unrelated contributors cannot edit", async () => {
  const { app } = setup();
  await app.save("author", input);
  const update = {
    ...input,
    expectedRevision: 1,
    reason: "Started inspection",
    data: { ...input.data, status: "in-progress" as const },
  };
  await expect(app.save("other", update)).rejects.toMatchObject({
    code: "maintenance_denied",
  });
  await expect(
    app.save("assigned", {
      ...update,
      data: { ...update.data, assigneeId: "other" },
    }),
  ).rejects.toMatchObject({ code: "maintenance_denied" });
  await app.save("assigned", update);
  await expect(app.save("author", update)).rejects.toMatchObject({
    code: "maintenance_conflict",
  });
  expect(
    (
      await app.save("admin", {
        ...update,
        expectedRevision: 2,
        data: { ...update.data, assigneeId: "other" },
      })
    ).data.assigneeId,
  ).toBe("other");
  expect((await app.query("assigned", {})).records[0].canEdit).toBe(false);
});
test("blocked and completed work require evidence, reopening and corrections retain explanations", async () => {
  const { app, revisions } = setup();
  await app.save("author", input);
  for (const status of ["done", "blocked"] as const)
    expect(() =>
      app.save("author", {
        ...input,
        expectedRevision: 1,
        reason: "State change",
        data: { ...input.data, status },
      }),
    ).toThrow("invalid_maintenance");
  const done = await app.save("assigned", {
    ...input,
    expectedRevision: 1,
    reason: "Inspection finished",
    data: {
      ...input.data,
      status: "done",
      outcome: "Drive inspected and tested",
    },
  });
  expect(done.data.status).toBe("done");
  await expect(
    app.save("author", { ...input, expectedRevision: 2, reason: "" }),
  ).rejects.toMatchObject({ code: "invalid_maintenance" });
  await app.save("author", {
    ...input,
    expectedRevision: 2,
    reason: "New vibration requires follow-up",
  });
  expect(revisions[1].record.data.outcome).toBe("Drive inspected and tested");
  expect(revisions[2].reason).toBe("New vibration requires follow-up");
});
test("reference validation rejects foreign identities and retired new links while preserving retained evidence", async () => {
  const { app, assets, names } = setup();
  await expect(
    app.save("author", {
      ...input,
      data: { ...input.data, assigneeId: "foreign" },
    }),
  ).rejects.toMatchObject({ code: "maintenance_denied" });
  await expect(
    app.save("author", {
      ...input,
      data: { ...input.data, assetId: "foreign" },
    }),
  ).rejects.toMatchObject({ code: "invalid_maintenance" });
  await app.save("author", input);
  assets.delete("asset");
  names.delete("assigned");
  const saved = await app.save("author", {
    ...input,
    expectedRevision: 1,
    reason: "Recorded inspection progress",
  });
  expect(saved.assetName).toBe("Drive");
  expect(saved.assigneeName).toBe("Assigned");
  await expect(
    app.save("author", {
      ...input,
      id: "retired-work",
      data: { ...input.data, assetId: "asset" },
    }),
  ).rejects.toThrow();
});
test("priority configuration checks revisions, administrator permission and existing references", async () => {
  const { app, used } = setup();
  await expect(
    app.configure("author", {
      expectedRevision: 0,
      priorities: defaultPriorities,
    }),
  ).rejects.toMatchObject({ code: "maintenance_denied" });
  const next = await app.configure("admin", {
    expectedRevision: 0,
    priorities: defaultPriorities,
  });
  expect(next.revision).toBe(1);
  await expect(
    app.configure("admin", {
      expectedRevision: 0,
      priorities: defaultPriorities,
    }),
  ).rejects.toMatchObject({ code: "maintenance_conflict" });
  used.add("normal");
  await expect(
    app.configure("admin", {
      expectedRevision: 1,
      priorities: [defaultPriorities[1]],
    }),
  ).rejects.toMatchObject({ code: "maintenance_conflict" });
  expect(() =>
    app.configure("admin", {
      expectedRevision: 1,
      priorities: [defaultPriorities[0], { ...defaultPriorities[1], rank: 1 }],
    }),
  ).toThrow("invalid_maintenance");
});
test("current names resolve by scoped ID while old revision snapshots remain unchanged", async () => {
  const { app, names, revisions } = setup();
  await app.save("author", input);
  names.set("author", "Renamed author");
  names.set("assigned", "Renamed colleague");
  const history = await app.history("other", input.id);
  expect(history.record.authorName).toBe("Renamed author");
  expect(history.record.assigneeName).toBe("Renamed colleague");
  expect(revisions[0].record.authorName).toBe("Author");
  expect(history.revisions[0].record.assigneeName).toBe("Assigned");
});
test("query location scope includes configured descendants and validates budgets and real dates", async () => {
  const { app, locations } = setup();
  await app.query("author", { locationId: "department" });
  expect(locations()).toEqual(["department", "area"]);
  for (const selection of [
    { limit: 101 },
    { dueFrom: "2026-02-30" },
    { dueFrom: "2026-10-08", dueTo: "2026-10-05" },
    { search: "x".repeat(201) },
    { unknown: "scope" },
  ])
    expect(() => app.query("author", selection)).toThrow("invalid_maintenance");
  await expect(app.history("author", "missing")).rejects.toMatchObject({
    code: "maintenance_missing",
  });
});
test("failed append leaves both current projection and revision history untouched", async () => {
  const { app, records, revisions, fail } = setup();
  await app.save("author", input);
  fail();
  await expect(
    app.save("author", {
      ...input,
      expectedRevision: 1,
      reason: "Append must be atomic",
      data: { ...input.data, title: "Must roll back" },
    }),
  ).rejects.toThrow("Synthetic failed revision append");
  expect(records.get(input.id)?.data.title).toBe(input.data.title);
  expect(revisions).toHaveLength(1);
});

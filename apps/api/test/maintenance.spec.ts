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
  type RelatedEntry,
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
    revisions: Revision[] = [],
    issues = new Map<string, RelatedEntry>();
  let settings: Settings | null = null;
  let failSave = false;
  const names = new Map([
    ["author", "Author"],
    ["leader", "Leader"],
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
  let receivedSelection: Parameters<Transaction["query"]>[0] = {};
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
      const stagedIssues = new Map(
        [...issues].map(([id, entry]) => [id, structuredClone(entry)]),
      );
      const matching = (scope: Parameters<Transaction["pending"]>[0]) =>
        [...stagedIssues.values()].filter(
          (entry) =>
            scope.locationIds.includes(
              entry.content.areaId || entry.content.departmentId,
            ) &&
            (!scope.equipment.length ||
              scope.equipment.some(
                (target) =>
                  target.namespace === entry.content.equipmentNamespace &&
                  target.code === entry.content.equipmentCode &&
                  target.departmentId === entry.content.departmentId &&
                  target.areaId === entry.content.areaId,
              )),
        );
      let nextSettings = settings;
      const tx: Transaction = {
        canContribute: true,
        canCoordinate: actor === "leader",
        canAdminister: actor === "admin",
        related: async (scope, selection) => {
          const entries = matching(scope).filter(
            (entry) => !selection.ids || selection.ids.includes(entry.id),
          );
          return { entries, total: entries.length, nextCursor: "" };
        },
        pending: async (scope) =>
          matching(scope).filter((entry) =>
            ["open", "in-progress"].includes(entry.issueState),
          ),
        resolve: async (resolutions) => {
          for (const resolution of resolutions) {
            const entry = stagedIssues.get(resolution.id)!;
            if (entry.revision !== resolution.expectedRevision)
              throw new MaintenanceError("maintenance_conflict");
            entry.issueState = "resolved";
            entry.revision++;
          }
        },
        assignments: async (target, after) => {
          const current = [...staged.values()].filter(
            (record) =>
              record.data.assigneeId === target &&
              record.data.status !== "done",
          );
          return {
            records: current,
            events: current.flatMap((record) => {
              const event = revisions
                .filter(
                  (revision) =>
                    revision.record.id === record.id &&
                    revision.record.data.assigneeId === target &&
                    (revision.record.revision === 1 ||
                      revisions.find(
                        (previous) =>
                          previous.record.id === record.id &&
                          previous.record.revision ===
                            revision.record.revision - 1,
                      )?.record.data.assigneeId !== target),
                )
                .at(-1);
              return event && event.at >= after
                ? [
                    {
                      id: `assignment_${record.id}_${event.record.revision}`,
                      recordId: record.id,
                      title: event.record.data.title,
                      at: event.at,
                      revision: event.record.revision,
                    },
                  ]
                : [];
            }),
          };
        },
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
          receivedSelection = _selection;
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
      issues.clear();
      stagedIssues.forEach((entry, id) => issues.set(id, entry));
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
    issues,
    selection: () => receivedSelection,
    locations: () => selectionLocations,
    fail: () => {
      failSave = true;
    },
  };
}
test("creation attributes server identity and supports exact retries independent of object key order", async () => {
  const { app, revisions } = setup();
  const first = await app.save("leader", input);
  expect(first).toMatchObject({
    authorId: "leader",
    authorName: "Leader",
    assetName: "Drive",
    assigneeName: "Assigned",
    revision: 1,
    canEdit: true,
    canReassign: true,
  });
  const reordered = Object.fromEntries(
    Object.entries(input.data).reverse(),
  ) as unknown as SaveInput["data"];
  expect(await app.save("leader", { ...input, data: reordered })).toEqual(
    first,
  );
  await app.save("assigned", {
    ...input,
    expectedRevision: 1,
    reason: "Inspection started",
    data: { ...input.data, status: "in-progress" },
  });
  expect((await app.save("leader", input)).revision).toBe(2);
  expect(revisions).toHaveLength(2);
  await expect(app.save("other", input)).rejects.toMatchObject({
    code: "maintenance_conflict",
  });
  await expect(
    app.save("leader", {
      ...input,
      data: { ...input.data, title: "Different request" },
    }),
  ).rejects.toMatchObject({ code: "maintenance_conflict" });
  await expect(
    app.save("leader", { ...input, reason: "Changed creation evidence" }),
  ).rejects.toMatchObject({ code: "maintenance_conflict" });
});
test("assigned workers progress work, coordinators reassign and unrelated contributors cannot edit", async () => {
  const { app } = setup();
  await app.save("leader", input);
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
  await expect(app.save("leader", update)).rejects.toMatchObject({
    code: "maintenance_conflict",
  });
  expect(
    (
      await app.save("leader", {
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
  await app.save("leader", input);
  for (const status of ["done", "blocked"] as const)
    expect(() =>
      app.save("leader", {
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
    app.save("leader", { ...input, expectedRevision: 2, reason: "" }),
  ).rejects.toMatchObject({ code: "invalid_maintenance" });
  await app.save("leader", {
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
    app.save("leader", {
      ...input,
      data: { ...input.data, assigneeId: "foreign" },
    }),
  ).rejects.toMatchObject({ code: "maintenance_denied" });
  await expect(
    app.save("leader", {
      ...input,
      data: { ...input.data, assetId: "foreign" },
    }),
  ).rejects.toMatchObject({ code: "invalid_maintenance" });
  await app.save("leader", input);
  assets.delete("asset");
  names.delete("assigned");
  const saved = await app.save("leader", {
    ...input,
    expectedRevision: 1,
    reason: "Recorded inspection progress",
  });
  expect(saved.assetName).toBe("Drive");
  expect(saved.assigneeName).toBe("Assigned");
  await expect(
    app.save("leader", {
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
  await app.save("leader", input);
  names.set("leader", "Renamed author");
  names.set("assigned", "Renamed colleague");
  const history = await app.history("other", input.id);
  expect(history.record.authorName).toBe("Renamed author");
  expect(history.record.assigneeName).toBe("Renamed colleague");
  expect(revisions[0].record.authorName).toBe("Leader");
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
  await app.save("leader", input);
  fail();
  await expect(
    app.save("leader", {
      ...input,
      expectedRevision: 1,
      reason: "Append must be atomic",
      data: { ...input.data, title: "Must roll back" },
    }),
  ).rejects.toThrow("Synthetic failed revision append");
  expect(records.get(input.id)?.data.title).toBe(input.data.title);
  expect(revisions).toHaveLength(1);
});

const equipmentTarget = {
  namespace: "site-equipment" as const,
  code: "=11+11.11.02-B102.1",
  departmentId: "department",
  areaId: "area",
};
function issue(id: string, code = equipmentTarget.code): RelatedEntry {
  return {
    id,
    revision: 1,
    authorId: "other",
    authorName: "Other",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    content: {
      date: "2026-10-01",
      categoryId: "problems",
      summary: "Drive stopped",
      details: "Sensor indicates a cassette obstruction",
      departmentId: "department",
      areaId: "area",
      equipmentCode: code,
      equipmentNamespace: "site-equipment",
      condition: "blocked",
      externalReference: "00123",
      challenge: "",
      cause: "",
      measure: "",
      dueDate: "",
      feedbackDueDate: "",
      discuss: false,
    },
    departmentLabel: "Department",
    areaLabel: "Area",
    categoryLabel: "Problems",
    equipmentReferenceId: "equipment-1",
    responsibleId: "other",
    responsibleName: "Other",
    issueState: "open",
    highlighted: false,
    highlightedAt: "",
  };
}
test("only Team Leaders assign initial responsibility; contributors can propose unassigned work", async () => {
  const { app } = setup();
  for (const actor of ["author", "assigned", "admin"])
    await expect(app.save(actor, input)).rejects.toMatchObject({
      code: "maintenance_denied",
    });
  const unassigned = {
    ...input,
    data: { ...input.data, assigneeId: "", teamId: "" },
  };
  const created = await app.save("author", unassigned);
  expect(created.canReassign).toBe(false);
  expect(created.data.category).toBe("corrective");
  expect(created.data.equipment).toEqual([]);
  await expect(
    app.save("admin", {
      ...unassigned,
      expectedRevision: 1,
      reason: "Administrative assignment",
      data: { ...unassigned.data, assigneeId: "assigned" },
    }),
  ).rejects.toMatchObject({ code: "maintenance_denied" });
});
test("manual multiple equipment scope preserves exact identifiers and validates configured location", async () => {
  const { app } = setup();
  const created = await app.save("leader", {
    ...input,
    data: {
      ...input.data,
      category: "preventive",
      repairTarget: "Cassette directional mechanism, without its own sensor",
      equipment: [
        equipmentTarget,
        { ...equipmentTarget, code: "=11+11.11.02-B102.2" },
      ],
    },
  });
  expect(created.data.category).toBe("preventive");
  expect(created.data.equipment?.[0].code).toBe(equipmentTarget.code);
  for (const targets of [
    [equipmentTarget, equipmentTarget],
    [{ ...equipmentTarget, departmentId: "foreign" }],
    [{ ...equipmentTarget, areaId: "foreign" }],
  ])
    await expect(
      Promise.resolve().then(() =>
        app.save("leader", {
          ...input,
          id: "invalid-scope",
          data: { ...input.data, equipment: targets },
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid_maintenance" });
  expect(() =>
    app.save("leader", {
      ...input,
      data: { ...input.data, category: "unknown" as never },
    }),
  ).toThrow("invalid_maintenance");
});
test("completion reviews every pending scoped issue and closes included issues while preserving exclusions", async () => {
  const { app, issues } = setup();
  issues.set("included", issue("included"));
  issues.set("excluded", issue("excluded"));
  issues.set("unrelated", issue("unrelated", "different-code"));
  const data = { ...input.data, equipment: [equipmentTarget] };
  await app.save("leader", { ...input, data });
  const finish = {
    ...input,
    expectedRevision: 1,
    reason: "Replaced cassette bearing",
    data: {
      ...data,
      status: "done" as const,
      outcome: "Mechanism repaired and tested",
    },
  };
  await expect(app.save("assigned", finish)).rejects.toMatchObject({
    code: "maintenance_conflict",
  });
  const decisions = [
    {
      id: "included",
      expectedRevision: 1,
      disposition: "include" as const,
      reason: "",
    },
    {
      id: "excluded",
      expectedRevision: 1,
      disposition: "exclude" as const,
      reason: "Motor belongs to another repair",
    },
  ];
  await expect(
    app.save("assigned", {
      ...finish,
      data: {
        ...finish.data,
        linkedEntries: [{ ...decisions[0], expectedRevision: 2 }, decisions[1]],
      },
    }),
  ).rejects.toMatchObject({ code: "maintenance_conflict" });
  await expect(
    app.save("assigned", {
      ...finish,
      data: {
        ...finish.data,
        linkedEntries: [
          ...decisions,
          {
            id: "unrelated",
            expectedRevision: 1,
            disposition: "include",
            reason: "",
          },
        ],
      },
    }),
  ).rejects.toMatchObject({ code: "maintenance_conflict" });
  const completed = await app.save("assigned", {
    ...finish,
    data: { ...finish.data, linkedEntries: decisions },
  });
  expect(completed.data.status).toBe("done");
  expect(issues.get("included")?.issueState).toBe("resolved");
  expect(issues.get("excluded")?.issueState).toBe("open");
  expect(issues.get("unrelated")?.issueState).toBe("open");
  issues.set("new-scope-issue", issue("new-scope-issue"));
  await expect(
    app.save("assigned", {
      id: completed.id,
      expectedRevision: 2,
      reason: "Amend completed repair",
      data: completed.data,
    }),
  ).rejects.toMatchObject({ code: "maintenance_conflict" });
  expect(() =>
    app.save("assigned", {
      ...finish,
      data: {
        ...finish.data,
        linkedEntries: [{ ...decisions[1], reason: "" }],
      },
    }),
  ).toThrow("invalid_maintenance");
});
test("issue resolution and maintenance revision roll back together when own revision append fails", async () => {
  const { app, issues, fail, records } = setup();
  issues.set("included", issue("included"));
  const data = {
    ...input.data,
    equipment: [equipmentTarget],
    linkedEntries: [
      {
        id: "included",
        expectedRevision: 1,
        disposition: "include" as const,
        reason: "",
      },
    ],
  };
  await app.save("leader", { ...input, data });
  fail();
  await expect(
    app.save("assigned", {
      ...input,
      expectedRevision: 1,
      reason: "Repair finished",
      data: { ...data, status: "done", outcome: "Cassette replaced" },
    }),
  ).rejects.toThrow("Synthetic failed revision append");
  expect(records.get(input.id)?.data.status).toBe("open");
  expect(issues.get("included")?.issueState).toBe("open");
});
test("default closed-work bounds use calendar weeks and explicit historical searches remove them", async () => {
  const { app, selection } = setup();
  await app.query("author", {});
  expect(selection()).toMatchObject({
    doneFrom: "2026-09-28",
    doneTo: "2026-10-11",
  });
  await app.query("author", { history: true });
  expect(selection().doneFrom).toBeUndefined();
  await app.query("author", { doneFrom: "2026-08-01", doneTo: "2026-08-31" });
  expect(selection().doneTo).toBe("2026-08-31");
  expect(() => app.query("author", { doneFrom: "2026-02-30" })).toThrow(
    "invalid_maintenance",
  );
});
test("assignment feed belongs to the actor and notices follow true assignment revisions", async () => {
  const { app } = setup();
  const created = await app.save("leader", input);
  const first = await app.assignments("assigned", {});
  expect(first.events.map((event) => event.id)).toEqual([
    "assignment_work-1_1",
  ]);
  await app.save("assigned", {
    ...input,
    expectedRevision: 1,
    reason: "Work started",
    data: { ...input.data, status: "in-progress" },
  });
  expect((await app.assignments("assigned", {})).events).toEqual(first.events);
  expect((await app.assignments("other", {})).records).toEqual([]);
  expect(created.assignedAt).toBe(first.events[0].at);
  expect(() => app.assignments("assigned", { after: "invalid" })).toThrow(
    "invalid_maintenance",
  );
  expect(() =>
    app.assignments("assigned", { actorId: "other" } as never),
  ).toThrow("invalid_maintenance");
});

test("an unassigned author cannot manufacture delegated authority over another worker's issues", async () => {
  const { app, issues } = setup();
  issues.set("other-issue", issue("other-issue"));
  const data = {
    ...input.data,
    assigneeId: "",
    teamId: "",
    equipment: [equipmentTarget],
    linkedEntries: [
      {
        id: "other-issue",
        expectedRevision: 1,
        disposition: "include" as const,
        reason: "",
      },
    ],
  };
  await app.save("author", { ...input, data });
  await expect(
    app.save("author", {
      ...input,
      expectedRevision: 1,
      reason: "Manufactured order",
      data: {
        ...data,
        status: "done",
        outcome: "Attempt to resolve another author's issue",
      },
    }),
  ).rejects.toMatchObject({ code: "maintenance_denied" });
  expect(issues.get("other-issue")?.issueState).toBe("open");
});
test("assigned workers cannot expand a Team Leader's repair scope", async () => {
  const { app } = setup();
  const data = { ...input.data, equipment: [equipmentTarget] };
  await app.save("leader", { ...input, data });
  for (const change of [
    { equipment: [] },
    { locationId: "department" },
    { assetId: "" },
  ])
    await expect(
      app.save("assigned", {
        ...input,
        expectedRevision: 1,
        reason: "Expand repair scope",
        data: { ...data, ...change },
      }),
    ).rejects.toMatchObject({ code: "maintenance_denied" });
  const correction = await app.save("assigned", {
    ...input,
    expectedRevision: 1,
    reason: "Describe repair",
    data: { ...data, repairTarget: "Cassette roller bearing" },
  });
  expect(correction.data.repairTarget).toBe("Cassette roller bearing");
});

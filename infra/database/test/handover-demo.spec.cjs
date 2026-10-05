const {
  buildScenarios,
  applyScenario,
} = require("../../../scripts/local/handover-demo-scenarios.cjs");
const {
  Handover,
} = require("../../../apps/api/dist/modules/shift-handover/application/handover");
const {
  siteDate,
} = require("../../../apps/api/dist/modules/shift-handover/domain/handover");

const people = ["technician", "task-force", "team-leader", "administrator"].map(
  (id) => ({ id, name: id }),
);
const departments = ["a", "b", "c", "d", "e"].map((id) => ({
  id,
  label: `Department ${id}`,
  areaId: `${id}-area`,
  equipment: [{ areaId: `${id}-area`, code: `000-${id}` }],
}));
const today = "2026-09-29";
const scenarios = () =>
  buildScenarios({ today, people, coordinator: "administrator", departments });

function harness() {
  const entries = new Map(),
    requests = new Map(),
    revisions = new Map();
  let clock,
    counter = 0;
  const copy = (value) => structuredClone(value);
  const store = {
    run: async (actor, permission, work) =>
      work({
        coordinator: ["administrator", "team-leader"].includes(actor),
        people: async () => people,
        names: async (userIds) =>
          new Map(
            people
              .filter((person) => userIds.includes(person.id))
              .map((person) => [person.id, person.name]),
          ),
        latestUpdateActors: async (entryIds) => {
          const actors = new Map();
          for (const entryId of entryIds) {
            const latestAt = entries.get(entryId)?.latestUpdate?.at;
            const revision = (revisions.get(entryId) ?? []).findLast(
              (revision) =>
                revision.at === latestAt &&
                ["follow-up", "state"].includes(revision.action),
            );
            if (revision) actors.set(entryId, revision.actorId);
          }
          return actors;
        },
        equipment: async (actor, departmentId) => ({
          codes: [`000-${departmentId}`],
          nextCursor: "",
        }),
        reference: async (content) =>
          content.equipmentCode ? `reference-${content.equipmentCode}` : "",
        prior: async (key) => {
          const request = requests.get(`${actor}/${key}`);
          return request
            ? {
                fingerprint: request.fingerprint,
                entry: copy(entries.get(request.id)),
              }
            : null;
        },
        get: async (id) => copy(entries.get(id)),
        history: async (entry) => ({
          entry,
          revisions: copy(revisions.get(entry.id)).reverse(),
          nextBefore: 0,
        }),
        save: async (entry, revision, request) => {
          entries.set(entry.id, copy(entry));
          revisions.set(entry.id, [
            ...(revisions.get(entry.id) ?? []),
            copy(revision),
          ]);
          if (request)
            requests.set(`${actor}/${request.key}`, {
              fingerprint: request.fingerprint,
              id: entry.id,
            });
        },
      }),
  };
  const catalog = {
    timeZone: "Europe/Zurich",
    externalSystemLabel: "Ultimo",
    categories: [
      "safety",
      "information",
      "successes",
      "people",
      "performance",
      "problems",
    ].map((id) => ({ id, label: id })),
    locations: departments.flatMap((department) => [
      {
        id: department.id,
        label: department.label,
        parentId: "",
        role: "department",
        sectorKey: "",
      },
      {
        id: department.areaId,
        label: "Area",
        parentId: department.id,
        role: "area",
        sectorKey: "",
      },
    ]),
  };
  return {
    entries,
    revisions,
    app: new Handover(
      store,
      catalog,
      () => `entry-${counter++}`,
      () => clock,
    ),
    setDate: (date, step) => {
      clock = new Date(
        Date.parse(date + "T12:00:00Z") + step * 1000,
      ).toISOString();
    },
  };
}

test("demo covers each department, all users/categories and three months of history through real application rules", async () => {
  const h = harness();
  for (const scenario of scenarios())
    await applyScenario(h.app, scenario, h.setDate);
  const entries = [...h.entries.values()];
  expect(entries).toHaveLength(60);
  expect(new Set(entries.map((entry) => entry.authorId))).toEqual(
    new Set(people.map((person) => person.id)),
  );
  expect(new Set(entries.map((entry) => entry.issueState))).toEqual(
    new Set(["none", "open", "in-progress", "resolved"]),
  );
  for (const department of departments) {
    const selected = entries.filter(
      (entry) => entry.content.departmentId === department.id,
    );
    expect(selected).toHaveLength(12);
    expect(
      new Set(
        selected
          .filter((entry) => entry.content.date === today)
          .map((entry) => entry.content.categoryId),
      ).size,
    ).toBe(6);
  }
  expect(entries.some((entry) => entry.content.date === "2026-07-01")).toBe(
    true,
  );
  expect(entries.filter((entry) => entry.highlighted)).toHaveLength(10);
  for (const entry of entries) {
    const history = h.revisions.get(entry.id);
    expect(history[0].entry.content.summary.startsWith("[DEMO] ")).toBe(true);
    expect(siteDate(history[0].at, "Europe/Zurich")).toBe(entry.content.date);
    expect(history.map((revision) => revision.at)).toEqual(
      history.map((revision) => revision.at).sort(),
    );
    expect(history.at(-1).entry).toEqual(entry);
    if (entry.issueState === "resolved")
      expect(entry.latestUpdate.note).toContain("functional test passed");
  }
  const reopened = entries.find((entry) =>
    entry.content.summary.includes("Repeated stop"),
  );
  expect(
    h.revisions.get(reopened.id).map((revision) => revision.entry.issueState),
  ).toEqual(["open", "in-progress", "resolved", "open"]);
});

test("repeat execution adds nothing and preserves user follow-up", async () => {
  const h = harness();
  const scenario = scenarios().find((entry) => entry.changes.length === 3);
  const result = await applyScenario(h.app, scenario, h.setDate);
  const first = structuredClone([...h.revisions]);
  await applyScenario(h.app, scenario, h.setDate);
  expect([...h.revisions]).toEqual(first);
  h.setDate(today, 10);
  await h.app.change(scenario.actor, {
    id: result.id,
    expectedRevision: 4,
    action: "follow-up",
    note: "Operator's own walkthrough note",
  });
  const changed = structuredClone([...h.revisions]);
  expect((await applyScenario(h.app, scenario, h.setDate)).result).toBe(
    "preserved",
  );
  expect([...h.revisions]).toEqual(changed);
});

test("interrupted scenario resumes an unchanged fixture prefix without duplicate revisions", async () => {
  const h = harness(),
    scenario = scenarios().find((entry) => entry.changes.length === 3);
  const change = h.app.change.bind(h.app);
  let calls = 0;
  h.app.change = async (...args) => {
    if (++calls === 2) throw new Error("Simulated interruption");
    return change(...args);
  };
  await expect(applyScenario(h.app, scenario, h.setDate)).rejects.toThrow(
    "Simulated interruption",
  );
  h.app.change = change;
  await applyScenario(h.app, scenario, h.setDate);
  expect(h.entries.size).toBe(1);
  expect([...h.revisions.values()][0]).toHaveLength(4);
});

test("departments without imported equipment retain location-only examples", () => {
  const entries = buildScenarios({
    today,
    people,
    coordinator: "administrator",
    departments: [{ ...departments[0], equipment: [] }],
  });
  expect(entries.every((entry) => entry.content.equipmentCode === "")).toBe(
    true,
  );
  expect(
    entries
      .filter((entry) => entry.issue)
      .every((entry) => entry.content.areaId === "a-area"),
  ).toBe(true);
});

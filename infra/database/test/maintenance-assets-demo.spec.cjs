const {
  build,
  resume,
} = require("../../../scripts/local/maintenance-assets-demo-scenarios.cjs");
const {
  validContent,
} = require("../../../apps/api/dist/modules/assets/domain/assets");
const {
  data: validateData,
} = require("../../../apps/api/dist/modules/maintenance/domain/maintenance");
const locations = Array.from({ length: 5 }, (_, index) => ({
  id: `department-${index}`,
  label: `Department ${index}`,
  parentId: "",
  role: "department",
  sectorKey: "",
}));
const manifest = () =>
  build({
    today: "2026-10-05",
    actor: "operator",
    people: [
      { id: "operator", name: "Operator" },
      { id: "technician", name: "Technician" },
    ],
    teams: [{ id: "team", label: "Team" }],
    priorities: [
      { id: "high", label: "High", rank: 3 },
      { id: "normal", label: "Normal", rank: 2 },
    ],
    departments: locations,
  });

test("creates bounded fictional records accepted by the actual module validators", () => {
  const sample = manifest();
  expect(sample.assets).toHaveLength(10);
  expect(sample.records).toHaveLength(30);
  const assetStates = new Set();
  const workStates = new Set();
  for (const asset of sample.assets) {
    let content = validContent(asset.content, locations);
    for (const { note, ...change } of asset.changes)
      content = validContent({ ...content, ...change }, locations);
    assetStates.add(content.status);
    expect(content.aliases).toEqual([]);
  }
  for (const record of sample.records) {
    let content = record.data;
    validateData(content);
    for (const { reason, ...change } of record.changes) {
      content = { ...content, ...change };
      validateData(content);
      expect(reason).toContain("[DEMO]");
    }
    workStates.add(content.status);
  }
  expect([...assetStates].sort()).toEqual([
    "retired",
    "unverified",
    "validated",
  ]);
  expect([...workStates].sort()).toEqual([
    "blocked",
    "done",
    "in-progress",
    "open",
  ]);
  expect(
    sample.records.some(
      (record) => !record.assetKey && !record.data.assigneeId,
    ),
  ).toBe(true);
  expect(sample.records.some((record) => record.data.teamId)).toBe(true);
  expect(
    sample.records.some(
      (record) =>
        record.changes.map((change) => change.status).join() ===
        "in-progress,done,open",
    ),
  ).toBe(true);
});
test("works without configured teams and adapts to active priorities", () => {
  const result = build({
    today: "2026-10-05",
    actor: "operator",
    people: [{ id: "operator" }],
    teams: [],
    priorities: [{ id: "custom" }],
    departments: locations.slice(0, 1),
  });
  expect(
    result.records.every(
      (record) =>
        record.data.teamId === "" && record.data.priorityId === "custom",
    ),
  ).toBe(true);
  expect(new Set(result.records.map((record) => record.data.dueDate))).toEqual(
    new Set([
      "2026-10-02",
      "2026-10-05",
      "2026-10-04",
      "2026-10-03",
      "2026-10-07",
      "2026-10-12",
    ]),
  );
});
test("rejects incomplete configuration before fixture creation", () => {
  expect(() => build({ departments: [], people: [], priorities: [] })).toThrow(
    "configured",
  );
});
const expected = [
  { content: { status: "open" }, note: "created" },
  { content: { status: "done" }, note: "finished" },
];
const snapshot = (current, note) => ({
  revision: current.revision,
  content: current.content,
  note,
});
test("resumes an interrupted prefix exactly once", async () => {
  const save = jest.fn(async (current, next) => ({
    revision: current.revision + 1,
    content: next.content,
  }));
  const current = await resume(
    { revision: 1, content: expected[0].content },
    expected,
    jest.fn(),
    snapshot,
    save,
  );
  expect(current.revision).toBe(2);
  expect(save).toHaveBeenCalledTimes(1);
  await resume(
    current,
    expected,
    async () =>
      expected.map((entry, index) => ({ ...entry, revision: index + 1 })),
    snapshot,
    save,
  );
  expect(save).toHaveBeenCalledTimes(1);
});
test("preserves subsequent owner edits without writing", async () => {
  const current = { revision: 3, content: { status: "blocked" } };
  const save = jest.fn();
  const result = await resume(
    current,
    expected,
    async () => [
      ...expected.map((entry, index) => ({ ...entry, revision: index + 1 })),
      { revision: 3, content: current.content, note: "Owner edit" },
    ],
    snapshot,
    save,
  );
  expect(result).toBe(current);
  expect(save).not.toHaveBeenCalled();
});
test("refuses to overwrite an owner edit inside an unfinished prefix", async () => {
  const save = jest.fn();
  await expect(
    resume(
      { revision: 2, content: { status: "blocked" } },
      [...expected, { content: { status: "open" }, note: "reopened" }],
      async () => [
        { ...expected[0], revision: 1 },
        { revision: 2, content: { status: "blocked" }, note: "Owner edit" },
      ],
      snapshot,
      save,
    ),
  ).rejects.toThrow("preserve owner changes");
  expect(save).not.toHaveBeenCalled();
});

const {
  build,
  validate,
  resume,
  finalData,
  createReason,
} = require("../../../scripts/local/linked-maintenance-demo-runner.cjs");
const {
  data,
} = require("../../../apps/api/dist/modules/maintenance/domain/maintenance");
const {
  validContent,
} = require("../../../apps/api/dist/modules/assets/domain/assets");
const {
  validContent: handoverContent,
} = require("../../../apps/api/dist/modules/shift-handover/domain/handover");
const locations = [
  {
    id: "department",
    parentId: "",
    role: "department",
    label: "Department",
    sectorKey: "",
  },
  {
    id: "area",
    parentId: "department",
    role: "area",
    label: "Repair area",
    sectorKey: "",
  },
];
const scope = { organizationId: "organization", siteId: "site" };
function manifest() {
  let counter = 0;
  return build({
    scope,
    actor: "leader",
    worker: "technician",
    today: "2026-10-05",
    departmentId: "department",
    areaId: "area",
    priorityId: "normal",
    categoryId: "problems",
    exclusions: [
      {
        id: "00000000-0000-4000-8000-000000000999",
        expectedRevision: 2,
        disposition: "exclude",
        reason: "Existing report is outside this exercise",
      },
    ],
    ids: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`,
  });
}
test("fictional linked fixtures pass owner validators and never include pre-existing reports", () => {
  const sample = manifest();
  validate(sample, scope);
  for (const asset of sample.assets) {
    validContent(asset.content, locations);
    expect(asset.content.status).toBe("unverified");
  }
  for (const issue of sample.issues)
    handoverContent(issue.content, {
      locations,
      timeZone: "UTC",
      categories: [{ id: "problems", label: "Problems" }],
      externalSystemLabel: "External reference",
    });
  for (const record of sample.records) {
    data(record.data);
    data(finalData(record));
    expect(record.data.assigneeId).toBe("technician");
    expect(
      record.data.linkedEntries.find(
        (link) => link.id === sample.exclusions[0].id,
      ).disposition,
    ).toBe("exclude");
  }
  expect(new Set(sample.records.map((record) => record.finalStatus))).toEqual(
    new Set(["open", "in-progress", "blocked", "done"]),
  );
  expect(new Set(sample.records.map((record) => record.data.category))).toEqual(
    new Set(["corrective", "preventive", "inspection"]),
  );
});
test("refuses a fixture manifest that could resolve existing reports or use real equipment codes", () => {
  const sample = manifest();
  sample.records[3].data.linkedEntries.at(-1).disposition = "include";
  expect(() => validate(sample, scope)).toThrow("pre-existing report");
  const real = manifest();
  real.records[0].data.equipment[0].code = "=11+11.11.02-B102.1";
  expect(() => validate(real, scope)).toThrow("work scope");
});
test("resumes an interrupted record once and preserves later owner edits", async () => {
  const sample = manifest(),
    scenario = sample.records[1];
  const initial = { id: scenario.id, revision: 1, data: scenario.data };
  const next = { id: scenario.id, revision: 2, data: finalData(scenario) };
  const save = jest.fn(async () => next);
  const application = {
    history: async () => ({
      revisions: [{ record: initial, reason: createReason }],
    }),
    save,
  };
  expect((await resume(application, sample, scenario, initial)).revision).toBe(
    2,
  );
  expect(save).toHaveBeenCalledTimes(1);
  const owner = {
    ...next,
    revision: 3,
    data: { ...next.data, details: "Owner correction" },
  };
  application.history = async () => ({
    revisions: [
      { record: initial, reason: createReason },
      {
        record: next,
        reason: "[DEMO LINKED] Record the simulated repair progress.",
      },
      { record: owner, reason: "Owner correction" },
    ],
  });
  expect(await resume(application, sample, scenario, owner)).toBe(owner);
  expect(save).toHaveBeenCalledTimes(1);
});
test("an owner change within an unfinished prefix is never overwritten", async () => {
  const sample = manifest(),
    scenario = sample.records[1];
  const current = {
    id: scenario.id,
    revision: 1,
    data: { ...scenario.data, details: "Owner correction" },
  };
  const application = {
    history: async () => ({
      revisions: [{ record: current, reason: "Owner correction" }],
    }),
    save: jest.fn(),
  };
  await expect(resume(application, sample, scenario, current)).rejects.toThrow(
    "preserve owner changes",
  );
  expect(application.save).not.toHaveBeenCalled();
});

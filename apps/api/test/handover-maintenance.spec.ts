import {
  resolveMaintenanceIssues,
  validateMaintenanceScope,
  type MaintenanceResolutionTransaction,
} from "../src/modules/shift-handover/application/maintenance-issues";
import type {
  Entry,
  Revision,
} from "../src/modules/shift-handover/domain/handover";

const at = "2026-10-05T12:00:00.000Z";
const scope = {
  locationIds: ["department", "area"],
  equipment: [
    {
      namespace: "site-equipment" as const,
      code: "=11+11.11.02-B102.1",
      departmentId: "department",
      areaId: "area",
    },
  ],
};
function entry(id: string, state: Entry["issueState"] = "open"): Entry {
  return {
    id,
    authorId: "author",
    authorName: "Original Author",
    createdAt: "2026-10-01T12:00:00.000Z",
    updatedAt: "2026-10-02T12:00:00.000Z",
    revision: 2,
    content: {
      date: "2026-10-01",
      categoryId: "problems",
      summary: "Container cannot change direction",
      details: "Sensor indicates a cassette-zone fault",
      departmentId: "department",
      areaId: "area",
      equipmentCode: "=11+11.11.02-B102.1",
      equipmentNamespace: "site-equipment",
      condition: "blocked",
      externalReference: "00123",
      challenge: "",
      cause: "",
      measure: "",
      dueDate: "",
      feedbackDueDate: "",
      discuss: true,
    },
    departmentLabel: "Department",
    areaLabel: "Cassette zone",
    categoryLabel: "Problems",
    equipmentReferenceId: "source-reference",
    responsibleId: "original-responsible",
    responsibleName: "Original Responsible",
    issueState: state,
    highlighted: true,
    highlightedAt: "2026-10-02T12:00:00.000Z",
  };
}
function fixture(entries: Entry[]) {
  const records = new Map(entries.map((record) => [record.id, record]));
  const revisions: Revision[] = [];
  const tx: MaintenanceResolutionTransaction = {
    actorId: "maintenance-assignee",
    actorName: "Maintenance Assignee",
    get: jest.fn(async (id) => records.get(id) ?? null),
    save: jest.fn(async (record, revision) => {
      records.set(record.id, structuredClone(record));
      revisions.push(structuredClone(revision));
    }),
  };
  return { tx, records, revisions };
}
const context = {
  maintenanceId: "work-194",
  outcome: "Replaced the cassette drive; checked both selected sensor signals.",
  at,
};

test("resolves only reviewed issues with attributed owner evidence and original source identity", async () => {
  const original = entry("included", "in-progress");
  const excluded = entry("excluded");
  const { tx, records, revisions } = fixture([original, excluded]);
  const result = await resolveMaintenanceIssues(
    tx,
    [{ id: "included", expectedRevision: 2 }],
    context,
  );
  expect(result[0]).toMatchObject({
    revision: 3,
    issueState: "resolved",
    authorId: "author",
    responsibleId: "original-responsible",
    content: original.content,
    highlighted: true,
    updatedAt: at,
    latestUpdate: {
      actorName: "Maintenance Assignee",
      note: "Maintenance work-194: " + context.outcome,
      at,
    },
  });
  expect(original.issueState).toBe("in-progress");
  expect(records.get("excluded")).toEqual(excluded);
  expect(revisions).toHaveLength(1);
  expect(revisions[0]).toMatchObject({
    actorId: "maintenance-assignee",
    actorName: "Maintenance Assignee",
    action: "state",
    note: "Maintenance work-194: " + context.outcome,
    at,
  });
});

test.each(["stale", "deleted", "resolved", "none", "missing"])(
  "rejects a %s included issue before any owner write",
  async (invalid) => {
    const bad = entry("z-invalid");
    if (invalid === "deleted") bad.deleted = true;
    if (invalid === "resolved" || invalid === "none") bad.issueState = invalid;
    const { tx } = fixture([
      entry("a-valid"),
      ...(invalid === "missing" ? [] : [bad]),
    ]);
    await expect(
      resolveMaintenanceIssues(
        tx,
        [
          { id: "a-valid", expectedRevision: 2 },
          { id: "z-invalid", expectedRevision: invalid === "stale" ? 1 : 2 },
        ],
        context,
      ),
    ).rejects.toMatchObject({ code: "conflict" });
    expect(tx.save).not.toHaveBeenCalled();
  },
);

test("locks issues in stable order and rejects duplicate dispositions", async () => {
  const { tx } = fixture([entry("a-issue"), entry("b-issue")]);
  await resolveMaintenanceIssues(
    tx,
    [
      { id: "b-issue", expectedRevision: 2 },
      { id: "a-issue", expectedRevision: 2 },
    ],
    context,
  );
  expect((tx.get as jest.Mock).mock.calls).toEqual([["a-issue"], ["b-issue"]]);
  await expect(
    resolveMaintenanceIssues(
      tx,
      [
        { id: "a-issue", expectedRevision: 2 },
        { id: "a-issue", expectedRevision: 2 },
      ],
      context,
    ),
  ).rejects.toMatchObject({ code: "invalid" });
});

test("keeps long completion summaries inside Handover's note budget", async () => {
  const { tx, revisions } = fixture([entry("issue")]);
  const outcome = "x".repeat(4000);
  await resolveMaintenanceIssues(tx, [{ id: "issue", expectedRevision: 2 }], {
    ...context,
    outcome,
  });
  expect(revisions[0].note).toHaveLength(4000);
  expect(revisions[0].note.startsWith("Maintenance work-194: ")).toBe(true);
  expect(revisions[0].note.endsWith("…")).toBe(true);
  expect(outcome).toHaveLength(4000);
});

test("preserves exact equipment data and rejects duplicate or malformed scope", () => {
  expect(() => validateMaintenanceScope(scope)).not.toThrow();
  expect(scope.equipment[0].code).toBe("=11+11.11.02-B102.1");
  expect(() =>
    validateMaintenanceScope({
      ...scope,
      equipment: [...scope.equipment, ...scope.equipment],
    }),
  ).toThrow("maintenance_issues_invalid");
  expect(() => validateMaintenanceScope({ ...scope, locationIds: [] })).toThrow(
    "maintenance_issues_invalid",
  );
  expect(() =>
    validateMaintenanceScope({
      ...scope,
      equipment: [{ ...scope.equipment[0], namespace: "analytics" as never }],
    }),
  ).toThrow("maintenance_issues_invalid");
});

import {
  Handover,
  type Transaction,
  type CreateEntry,
} from "../src/modules/shift-handover/application/handover";
import {
  validContent,
  siteDate,
  validSelection,
  emptySelection,
  type Entry,
  type Revision,
} from "../src/modules/shift-handover/domain/handover";
import { handoverCatalog } from "../src/host/adapters/handover-catalog";
import { siteRoles } from "../src/modules/users-rbac/domain/profiles";
import { decideSiteAccess } from "../src/modules/users-rbac/domain/authorization";
const catalog = handoverCatalog(
  {
    organizationId: "org",
    siteId: "site",
    externalSystemLabel: "Work order",
    categories: [{ id: "safety", label: "Safety" }],
    locations: [
      {
        id: "dept",
        label: "Department",
        parentId: "",
        role: "department",
        sectorKey: "",
      },
      {
        id: "area",
        label: "Area",
        parentId: "dept",
        role: "area",
        sectorKey: "",
      },
    ],
  },
  { organizationId: "org", siteId: "site" },
  "UTC",
);
const input: CreateEntry = {
  key: "request",
  issue: true,
  responsibleId: "colleague",
  content: {
    date: "2026-09-29",
    categoryId: "safety",
    summary: "Guard inspected",
    details: "",
    departmentId: "dept",
    areaId: "area",
    equipmentCode: "0001",
    equipmentNamespace: "site-equipment",
    condition: "inspection-needed",
    externalReference: "00123",
    challenge: "",
    cause: "",
    measure: "",
    dueDate: "2026-10-02",
    feedbackDueDate: "2026-09-30",
    discuss: true,
  },
};
function fixture() {
  let entry: Entry | null = null,
    prior: { entry: Entry; fingerprint: string } | null = null;
  const revisions: Revision[] = [];
  const names = new Map([
    ["author", "Author"],
    ["colleague", "Colleague"],
    ["other", "Other"],
  ]);
  const tx: Transaction = {
    coordinator: false,
    equipment: jest.fn(async () => ({ codes: ["0001"], nextCursor: "" })),
    people: async () => [
      { id: "author", name: "Author" },
      { id: "colleague", name: "Colleague" },
      { id: "other", name: "Other" },
    ],
    names: async () => new Map(names),
    latestUpdateActors: async () =>
      new Map(
        revisions
          .filter((revision) =>
            ["state", "follow-up"].includes(revision.action),
          )
          .map((revision) => [revision.entry.id, revision.actorId]),
      ),
    get: async () => structuredClone(entry),
    prior: async () => prior,
    reference: async (c) => (c.equipmentCode ? "reference" : ""),
    save: jest.fn(async (e, r, key) => {
      entry = structuredClone(e);
      revisions.push(structuredClone(r));
      if (key)
        prior = { entry: structuredClone(e), fingerprint: key.fingerprint };
    }),
    list: jest.fn(async () => ({
      entries: entry ? [structuredClone(entry)] : [],
      total: entry ? 1 : 0,
      nextCursor: "",
    })),
    history: jest.fn(async (current) => ({
      entry: current,
      revisions: structuredClone(revisions),
      nextBefore: 0,
    })),
  };
  const app = new Handover(
    { run: async (_actor, _permission, work) => work(tx) },
    catalog,
    () => "entry-id",
    () => "2026-09-29T12:00:00.000Z",
  );
  return { app, tx, names, revisions, entry: () => entry! };
}
test("publishes attributed history and recovers an identical request without duplicating it", async () => {
  const { app, tx, revisions } = fixture();
  const first = await app.create("author", input);
  expect(first).toMatchObject({
    authorId: "author",
    authorName: "Author",
    responsibleName: "Colleague",
    revision: 1,
    issueState: "open",
    equipmentReferenceId: "reference",
    content: { externalReference: "00123" },
  });
  expect(await app.create("author", input)).toEqual(first);
  expect(tx.save).toHaveBeenCalledTimes(1);
  expect(revisions).toHaveLength(1);
  await expect(
    app.create("author", {
      ...input,
      content: { ...input.content, summary: "Changed request" },
    }),
  ).rejects.toMatchObject({ code: "handover_conflict" });
});
test("corrections retain old content, reject foreign authors and stale revisions", async () => {
  const { app, revisions } = fixture();
  await app.create("author", input);
  const command = {
    id: "entry-id",
    action: "correct" as const,
    expectedRevision: 1,
    note: "Correct the observation",
    content: { ...input.content, summary: "Guard replaced" },
  };
  await expect(app.change("other", command)).rejects.toMatchObject({
    code: "handover_denied",
  });
  expect((await app.change("author", command)).revision).toBe(2);
  expect(revisions[0].entry.content.summary).toBe("Guard inspected");
  expect(revisions[1].entry.content.summary).toBe("Guard replaced");
  await expect(app.change("author", command)).rejects.toMatchObject({
    code: "handover_conflict",
  });
  await expect(
    app.change("author", {
      ...command,
      expectedRevision: 2,
      highlighted: true,
    }),
  ).rejects.toMatchObject({ code: "invalid_handover" });
});
test("assigned workers resolve and reopen with outcomes; unrelated workers only add attributed follow-up", async () => {
  const { app, entry } = fixture();
  await app.create("author", input);
  await expect(
    app.change("other", {
      id: "entry-id",
      action: "state",
      expectedRevision: 1,
      note: "Fixed",
      state: "resolved",
    }),
  ).rejects.toMatchObject({ code: "handover_denied" });
  await expect(
    app.change("colleague", {
      id: "entry-id",
      action: "state",
      expectedRevision: 1,
      note: "",
      state: "resolved",
    }),
  ).rejects.toMatchObject({ code: "invalid_handover" });
  await app.change("colleague", {
    id: "entry-id",
    action: "state",
    expectedRevision: 1,
    note: "Verified repair",
    state: "resolved",
  });
  expect(entry().content.condition).toBe("inspection-needed");
  await app.change("author", {
    id: "entry-id",
    action: "state",
    expectedRevision: 2,
    note: "Condition recurred",
    state: "open",
  });
  await app.change("other", {
    id: "entry-id",
    action: "follow-up",
    expectedRevision: 3,
    note: "Additional observation",
  });
  expect(entry().revision).toBe(4);
});
test("only a coordinator changes prominence or responsibility", async () => {
  const { app, tx } = fixture();
  await app.create("author", input);
  const highlight = {
    id: "entry-id",
    action: "highlight" as const,
    expectedRevision: 1,
    note: "Important for the site",
    highlighted: true,
  };
  await expect(app.change("author", highlight)).rejects.toMatchObject({
    code: "handover_denied",
  });
  tx.coordinator = true;
  expect((await app.change("other", highlight)).highlighted).toBe(true);
  expect(
    (
      await app.change("other", {
        id: "entry-id",
        action: "assign",
        expectedRevision: 2,
        note: "Take over",
        responsibleId: "other",
      })
    ).responsibleId,
  ).toBe("other");
  await expect(
    app.change("other", {
      id: "entry-id",
      action: "assign",
      expectedRevision: 3,
      note: "Foreign",
      responsibleId: "foreign",
    }),
  ).rejects.toMatchObject({ code: "handover_denied" });
});
test.each([
  { date: "2026-02-30" },
  { date: "2026-99-01" },
  { departmentId: "foreign" },
  { areaId: "foreign" },
  { summary: "" },
  { summary: "x".repeat(241) },
  { categoryId: "foreign" },
  { discuss: "yes" },
  { departmentId: "", areaId: "" },
])("rejects invalid content %p", (patch) => {
  expect(() =>
    validContent(
      { ...input.content, ...patch } as typeof input.content,
      catalog,
    ),
  ).toThrow("invalid_handover");
});
test("accepts incomplete safety reports and independent feedback deadlines, but rejects forged fields", () => {
  expect(
    validContent(
      {
        ...input.content,
        cause: "",
        dueDate: "",
        feedbackDueDate: "2026-09-30",
      },
      catalog,
    ).cause,
  ).toBe("");
  expect(() =>
    validContent(
      { ...input.content, authorId: "forged" } as typeof input.content,
      catalog,
    ),
  ).toThrow();
  expect(() =>
    validSelection({ ...emptySelection, from: "2026-09-30", to: "2026-09-29" }),
  ).toThrow();
  expect(() =>
    validSelection({ ...emptySelection, cursor: "invalid" }),
  ).toThrow();
});
test.each([
  "administrator",
  "technician",
  "team-leader",
  "task-force",
] as const)(
  "%s receives explicit operational grants independently from analytics",
  (profile) => {
    const grants = siteRoles(profile).map((roleId) => ({
      userActive: true,
      membershipActive: true,
      roleId,
    }));
    const req = {
      userId: "user",
      organizationId: "org",
      siteId: "site",
      permissions: ["handover.contribute"],
    };
    expect(decideSiteAccess(req, grants).allowed).toBe(true);
    expect(
      decideSiteAccess({ ...req, permissions: ["handover.coordinate"] }, grants)
        .allowed,
    ).toBe(["administrator", "team-leader"].includes(profile));
    expect(
      decideSiteAccess(req, [
        {
          userActive: true,
          membershipActive: true,
          roleId: "analytics-reader",
        },
      ]).allowed,
    ).toBe(false);
  },
);

test("configured location trees support intermediate levels and reject cycles or unknown parents", () => {
  const nested = {
    ...catalog,
    locations: [
      ...catalog.locations.map((l) =>
        l.id === "area" ? { ...l, parentId: "group" } : l,
      ),
      {
        id: "group",
        label: "Intermediate location",
        parentId: "dept",
        role: "location" as const,
        sectorKey: "",
      },
    ],
  };
  expect(validContent(input.content, nested).areaId).toBe("area");
  const value = { ...nested, organizationId: "org", siteId: "site" };
  const { timeZone, ...configuration } = value;
  expect(
    handoverCatalog(
      configuration,
      { organizationId: "org", siteId: "site" },
      timeZone,
    ).locations,
  ).toHaveLength(3);
  expect(() =>
    handoverCatalog(
      {
        ...configuration,
        locations: [
          {
            id: "loop",
            label: "Loop",
            parentId: "loop",
            role: "location",
            sectorKey: "",
          },
        ],
      },
      { organizationId: "org", siteId: "site" },
      timeZone,
    ),
  ).toThrow();
});

test("contributors create only today, coordinators can backdate, and corrections cannot move a contributor's date", async () => {
  const { app, tx } = fixture();
  const backdated = {
    ...input,
    content: { ...input.content, date: "2026-09-28" },
  };
  await expect(app.create("author", backdated)).rejects.toMatchObject({
    code: "handover_today_only",
  });
  tx.coordinator = true;
  const entry = await app.create("author", backdated);
  tx.coordinator = false;
  await expect(
    app.change("author", {
      id: entry.id,
      expectedRevision: 1,
      action: "correct",
      note: "Change date",
      content: input.content,
    }),
  ).rejects.toMatchObject({ code: "handover_today_only" });
  expect(await app.create("author", backdated)).toEqual(entry);
});
test("equipment admission validates exact source codes while unchanged historical references survive catalog changes", async () => {
  const { app, tx } = fixture();
  await expect(
    app.create("author", {
      ...input,
      content: { ...input.content, equipmentCode: "invented" },
    }),
  ).rejects.toMatchObject({ code: "handover_equipment_unavailable" });
  const entry = await app.create("author", input);
  tx.equipment = async () => ({ codes: [], nextCursor: "" });
  await expect(
    app.change("author", {
      id: entry.id,
      expectedRevision: 1,
      action: "correct",
      note: "Clarify",
      content: { ...input.content, summary: "Clarified" },
    }),
  ).resolves.toMatchObject({ revision: 2 });
  await expect(
    app.equipmentChoices("author", {
      departmentId: "dept",
      areaId: "foreign",
      search: "",
      after: "",
    }),
  ).rejects.toMatchObject({ code: "invalid_handover" });
});
test("follow-up and resolution commit one attributed revision and preserve original content", async () => {
  const { app, revisions, tx } = fixture();
  const original = await app.create("author", input);
  await expect(
    app.change("other", {
      id: original.id,
      expectedRevision: 1,
      action: "follow-up",
      note: "Unauthorized closure",
      state: "resolved",
    }),
  ).rejects.toMatchObject({ code: "handover_denied" });
  const updated = await app.change("colleague", {
    id: original.id,
    expectedRevision: 1,
    action: "follow-up",
    note: "Repaired and checked",
    state: "resolved",
  });
  expect(updated).toMatchObject({
    revision: 2,
    issueState: "resolved",
    latestUpdate: { note: "Repaired and checked", actorName: "Colleague" },
  });
  expect(updated.content).toEqual(original.content);
  expect(revisions[0].entry.issueState).toBe("open");
  expect(tx.save).toHaveBeenCalledTimes(2);
});

test("current-day rules use the site calendar across UTC midnight and DST", () => {
  expect(siteDate("2026-09-29T22:30:00.000Z", "Europe/Zurich")).toBe(
    "2026-09-30",
  );
  expect(siteDate("2026-10-25T23:30:00.000Z", "Europe/Zurich")).toBe(
    "2026-10-26",
  );
});

test("matrix filters validate bounded references, responsibility, conditions and due date ranges", () => {
  expect(
    validSelection({
      ...emptySelection,
      from: "2026-09-01",
      to: "2026-09-30",
      dueFrom: "2026-10-01",
      dueTo: "2026-10-31",
      responsibleId: "",
      externalReference: "  00123  ",
      condition: "blocked",
    }),
  ).toMatchObject({
    responsibleId: "",
    externalReference: "00123",
    condition: "blocked",
  });
  for (const values of [
    { dueFrom: "2026-10-02", dueTo: "2026-10-01" },
    { dueFrom: "2026-02-30" },
    { dueTo: "not-a-date" },
    { dueFrom: "2000-01-01", dueTo: "2050-01-01" },
    { responsibleId: "a".repeat(65) },
    { externalReference: "x".repeat(161) },
    { condition: "unknown" },
    { condition: null },
    { responsibleId: null },
    { unknownColumn: "value" },
  ])
    expect(() =>
      validSelection({ ...emptySelection, ...values } as never),
    ).toThrow();
});

test("carry-forward is configured by category ID, preserves labels and accepts explicit overrides", () => {
  expect(
    handoverCatalog(undefined, { organizationId: "org", siteId: "site" }, "UTC")
      .categories.filter((category) => category.carryForward)
      .map((category) => category.id),
  ).toEqual(["performance", "problems"]);
  const config = {
    organizationId: "org",
    siteId: "site",
    externalSystemLabel: "Work order",
    locations: [],
    categories: [
      { id: "problems", label: "Renamed problems", carryForward: false },
      { id: "custom", label: "Local topics", carryForward: true },
      { id: "information", label: "Information" },
    ],
  };
  expect(handoverCatalog(config, config, "UTC").categories).toEqual([
    { id: "problems", label: "Renamed problems", carryForward: false, coordinatorOnly: false },
    { id: "custom", label: "Local topics", carryForward: true, coordinatorOnly: false },
    { id: "information", label: "Information", carryForward: false, coordinatorOnly: true },
  ]);
  expect(() =>
    handoverCatalog(
      {
        ...config,
        categories: [{ id: "custom", label: "Topics", carryForward: "yes" }],
      },
      config,
      "UTC",
    ),
  ).toThrow();
});

test("current entries resolve author, responsible and latest update actor by ID while revisions retain their original names", async () => {
  const { app, tx, names, revisions, entry } = fixture();
  await app.create("author", input);
  await app.change("colleague", {
    id: "entry-id",
    action: "follow-up",
    expectedRevision: 1,
    note: "Checked on site",
  });
  tx.coordinator = true;
  await app.change("other", {
    id: "entry-id",
    action: "highlight",
    expectedRevision: 2,
    highlighted: true,
    note: "Discuss next shift",
  });
  const saved = structuredClone(entry());
  const evidence = structuredClone(revisions);
  names.set("author", "Current author");
  names.set("colleague", "Current colleague");
  const current = (await app.list("author", emptySelection)).entries[0];
  expect(current).toMatchObject({
    authorName: "Current author",
    responsibleName: "Current colleague",
    latestUpdate: { actorName: "Current colleague" },
  });
  const history = await app.history("author", "entry-id");
  expect(history.entry).toEqual(current);
  expect(history.revisions).toEqual(evidence);
  expect(entry()).toEqual(saved);
  expect((await app.create("author", input)).authorName).toBe("Current author");
  names.delete("colleague");
  expect((await app.history("author", "entry-id")).entry).toMatchObject({
    responsibleName: "Colleague",
    latestUpdate: { actorName: "Colleague" },
  });
});

test("notification reads validate exact UTC instants without accepting malformed dates or unknown fields", () => {
  expect(
    validSelection({
      ...emptySelection,
      notificationsAfter: "2026-10-02T08:30:00.000Z",
    }).notificationsAfter,
  ).toBe("2026-10-02T08:30:00.000Z");
  for (const value of [
    "",
    "2026-02-30T08:30:00.000Z",
    "2026-10-02",
    "0000-01-01T00:00:00.000Z",
    "2026-10-02T08:30:00+02:00",
    null,
    3,
  ]) {
    expect(() =>
      validSelection({ ...emptySelection, notificationsAfter: value } as never),
    ).toThrow();
  }
});

test("matrix scope comes from trusted category configuration and the site-local clock", async () => {
  const { tx } = fixture();
  const app = new Handover(
    { run: async (_actor, _permission, work) => work(tx) },
    {
      ...catalog,
      timeZone: "Europe/Zurich",
      categories: [
        { id: "ongoing-custom", label: "Work", carryForward: true },
        { id: "daily-custom", label: "News" },
      ],
    },
    () => "id",
    () => "2026-09-28T22:30:00.000Z",
  );
  await app.list("author", { ...emptySelection, departmentMatrix: true });
  expect(tx.list).toHaveBeenLastCalledWith(
    expect.objectContaining({ departmentMatrix: true }),
    {
      date: "2026-09-29",
      timeZone: "Europe/Zurich",
      ongoingCategoryIds: ["ongoing-custom"],
      dailyCategoryIds: ["daily-custom"],
    },
  );
  await app.list("author", { ...emptySelection, categoryId: "daily-custom" });
  expect(tx.list).toHaveBeenLastCalledWith(
    expect.objectContaining({ categoryId: "daily-custom" }),
    undefined,
  );
});
test.each(["true", 1, null, [], {}])(
  "matrix mode rejects non-boolean input %p",
  (value) => {
    expect(() =>
      validSelection({ ...emptySelection, departmentMatrix: value } as never),
    ).toThrow("invalid_handover");
  },
);

test("Information publication/correction requires coordinator authority and mentions resolve exact site people", async () => {
  const { tx, entry } = fixture();
  const restricted = new Handover(
    { run: async (_actor, _permission, work) => work(tx) },
    { ...catalog, categories: [...catalog.categories, { id: "information", label: "Information", coordinatorOnly: true }] },
    () => "information-entry", () => "2026-09-29T12:00:00.000Z",
  );
  const publication = { ...input, issue: false, responsibleId: "", content: { ...input.content, categoryId: "information", mentionIds: ["colleague"] } };
  await expect(restricted.create("author", publication)).rejects.toMatchObject({ code: "handover_denied" });
  expect(tx.save).not.toHaveBeenCalled();
  tx.coordinator = true;
  const saved = await restricted.create("author", publication);
  expect(saved.mentionedPeople).toEqual([{ id: "colleague", name: "Colleague" }]);
  tx.coordinator = false;
  await expect(restricted.change("author", { id: saved.id, expectedRevision: 1, action: "correct", note: "Correction", content: { ...saved.content, categoryId: "safety" } })).rejects.toMatchObject({ code: "handover_denied" });
  expect(entry().revision).toBe(1);
  tx.coordinator = true;
  await expect(restricted.change("author", { id: saved.id, expectedRevision: 1, action: "correct", note: "Correction", content: { ...saved.content, mentionIds: ["foreign-person"] } })).rejects.toMatchObject({ code: "handover_denied" });
  expect(entry().revision).toBe(1);
});

test("raster attachments and mentions are bounded snapshot content with no executable image format", () => {
  const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlVQAAAAASUVORK5CYII=";
  expect(validContent({ ...input.content, images: [{ name: "Inspection.png", dataUrl: png }], mentionIds: ["author"] }, catalog).images).toHaveLength(1);
  for (const images of [
    [{ name: "unsafe.svg", dataUrl: "data:image/svg+xml;base64,PHN2Zy8+" }],
    [{ name: "fake.png", dataUrl: "data:image/png;base64,YWJjZA==" }],
    Array.from({ length: 3 }, () => ({ name: "image.png", dataUrl: png })),
    [{ name: "huge.png", dataUrl: png + "A".repeat(65536) }],
  ]) expect(() => validContent({ ...input.content, images }, catalog)).toThrow("invalid_handover");
  expect(() => validContent({ ...input.content, mentionIds: ["author", "author"] }, catalog)).toThrow("invalid_handover");
  for (const selected of [{ resolvedFrom: "2026-09-01" }, { resolvedFrom: "2026-09-30", resolvedTo: "2026-09-01" }, { excludeAttention: "yes" }])
    expect(() => validSelection({ ...emptySelection, ...selected } as never)).toThrow("invalid_handover");
});

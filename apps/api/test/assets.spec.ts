import {
  Assets,
  type Transaction,
  type SaveAsset,
} from "../src/modules/assets/application/assets";
import {
  validContent,
  validTimeline,
  timelineCursor,
  compareTimeline,
  encodeCursor,
  aliasKey,
  type Asset,
  type AssetRevision,
  type SourceQuery,
  type TimelineRecord,
  type TimelineKind,
} from "../src/modules/assets/domain/assets";
const locations = [
  {
    id: "department",
    parentId: "",
    label: "Workshop",
    role: "department",
    sectorKey: "Workshop",
  },
  {
    id: "area",
    parentId: "department",
    label: "Area",
    role: "area",
    sectorKey: "",
  },
  {
    id: "other",
    parentId: "",
    label: "Other",
    role: "department",
    sectorKey: "",
  },
];
const content: SaveAsset["content"] = {
  code: "0001",
  name: "Conveyor",
  type: "Equipment",
  locationId: "area",
  status: "unverified",
  validationNote: "",
  description: "First line\nSecond line",
  aliases: [],
};
const create: SaveAsset = {
  key: "request",
  id: "",
  expectedRevision: 0,
  note: "",
  content,
};
const handoverAlias = {
  namespace: "site-equipment",
  sourceId: "",
  code: "0001",
  departmentId: "department",
  areaId: "area",
  sector: "",
  area: "",
};
const analyticAlias = {
  namespace: "analytics",
  sourceId: "source",
  code: "0001",
  departmentId: "",
  areaId: "",
  sector: "Workshop",
  area: "Area",
};
function fixture() {
  let saved: Asset | null = null,
    prior: { fingerprint: string; asset: Asset } | null = null;
  const revisions: AssetRevision[] = [];
  const tx: Transaction = {
    canManage: true,
    equipment: async () => [
      {
        namespace: "analytics",
        sourceId: "source",
        code: "0001",
        sector: "Workshop",
        area: "Area",
        departmentId: "department",
        areaId: "area",
      },
    ],
    name: async (actor) => (actor === "admin" ? "Administrator" : actor),
    get: async () => structuredClone(saved),
    prior: async () => structuredClone(prior),
    save: jest.fn(async (asset, revision, request) => {
      saved = structuredClone(asset);
      revisions.push(structuredClone(revision));
      if (request)
        prior = {
          fingerprint: request.fingerprint,
          asset: structuredClone(asset),
        };
    }),
    list: async () => ({
      assets: saved ? [saved] : [],
      total: saved ? 1 : 0,
      nextCursor: "",
    }),
    history: async (asset) => ({
      asset,
      revisions: structuredClone(revisions),
      nextBefore: 0,
    }),
    sources: jest.fn(
      async (): ReturnType<Transaction["sources"]> => [
        {
          kind: "maintenance",
          status: "available",
          result: { records: [], total: 0 },
        },
        { kind: "handover", status: "unmapped" },
        { kind: "analytics", status: "not-authorized" },
      ],
    ),
  };
  const app = new Assets(
    { run: async (_actor, _permission, work) => work(tx) },
    locations,
    "Europe/Zurich",
    () => "asset-id",
    () => "2026-10-05T12:00:00.000Z",
  );
  return { app, tx, revisions };
}
test("registration preserves leading zeros and explicit unverified identity without inferred aliases", async () => {
  const { app, tx, revisions } = fixture();
  const first = await app.save("admin", create);
  expect(first).toMatchObject({
    id: "asset-id",
    revision: 1,
    authorId: "admin",
    content: { code: "0001", status: "unverified", aliases: [] },
  });
  expect(await app.save("admin", create)).toEqual(first);
  expect(tx.save).toHaveBeenCalledTimes(1);
  expect(revisions[0].asset.content.description).toContain("\n");
  await expect(
    app.save("admin", {
      ...create,
      content: { ...content, type: "Different" },
    }),
  ).rejects.toMatchObject({ code: "asset_conflict" });
  await expect(
    app.save("admin", { ...create, note: "Changed registration rationale" }),
  ).rejects.toMatchObject({ code: "asset_conflict" });
  expect(revisions).toHaveLength(1);
});
test("validation requires evidence; canonical identity and immutable revisions survive retire and edits", async () => {
  const { app, revisions } = fixture();
  await app.save("admin", create);
  const edit = {
    key: "",
    id: "asset-id",
    expectedRevision: 1,
    note: "Survey inspected",
    content: {
      ...content,
      status: "validated" as const,
      validationNote: "Equipment label and location inspected.",
    },
  };
  const validated = await app.save("admin", edit);
  expect(validated.id).toBe("asset-id");
  expect(validated.createdAt).toBe(revisions[0].asset.createdAt);
  expect(revisions[0].asset.content.status).toBe("unverified");
  await expect(app.save("admin", edit)).rejects.toMatchObject({
    code: "asset_conflict",
  });
  await expect(
    app.save("admin", { ...edit, expectedRevision: 2, note: "" }),
  ).rejects.toMatchObject({ code: "invalid_asset" });
  const retired = await app.save("admin", {
    ...edit,
    expectedRevision: 2,
    content: { ...edit.content, status: "retired" },
  });
  expect(retired.content.status).toBe("retired");
  expect((await app.history("admin", "asset-id", 0)).revisions).toHaveLength(3);
});
test("ordinary readers cannot manage asset identity, aliases or validation", async () => {
  const { app, tx } = fixture();
  tx.canManage = false;
  expect((await app.context("tech")).canManage).toBe(false);
  await expect(app.save("tech", create)).rejects.toMatchObject({
    code: "asset_denied",
  });
  expect(tx.save).not.toHaveBeenCalled();
});
test("aliases preserve exact code case and scoped location; irrelevant fields cannot bypass semantic uniqueness", () => {
  const result = validContent(
    { ...content, aliases: [handoverAlias, analyticAlias] },
    locations,
  );
  expect(result.aliases).toEqual([handoverAlias, analyticAlias]);
  expect(aliasKey(handoverAlias)).not.toBe(
    aliasKey({ ...handoverAlias, code: "0001 " }),
  );
  expect(() =>
    validContent(
      { ...content, aliases: [analyticAlias, { ...analyticAlias }] },
      locations,
    ),
  ).toThrow("asset_alias_conflict");
  expect(() =>
    validContent(
      {
        ...content,
        aliases: [{ ...analyticAlias, departmentId: "department" }],
      },
      locations,
    ),
  ).toThrow("invalid_asset");
  expect(() =>
    validContent(
      { ...content, aliases: [{ ...handoverAlias, departmentId: "other" }] },
      locations,
    ),
  ).toThrow("invalid_asset");
  expect(() =>
    validContent(
      { ...content, aliases: [{ ...handoverAlias, sourceId: "source" }] },
      locations,
    ),
  ).toThrow("invalid_asset");
  expect(() =>
    validContent({ ...content, status: "validated" }, locations),
  ).toThrow("invalid_asset");
});
function record(
  kind: TimelineKind,
  id: string,
  recordedAt = "2026-10-05T12:00:00.000Z",
): TimelineRecord {
  return {
    id,
    kind,
    date: "2026-10-05",
    recordedAt,
    title: id,
    summary: "",
    sourceRecordId: id,
    periodKind: kind === "analytics" ? "daily-aggregate" : "calendar-date",
  };
}
test("digital record merges every source below the shared cursor and preserves equal-day rows across pages", async () => {
  const { app, tx } = fixture();
  await app.save("admin", create);
  const records = Array.from({ length: 45 }, (_, index) =>
    record(
      index % 2 ? "maintenance" : "handover",
      String(index).padStart(3, "0"),
    ),
  );
  records.push(record("analytics", "source-line", ""));
  tx.sources = jest.fn(async (_asset, query: SourceQuery) =>
    ["maintenance", "handover", "analytics"].map((kind) => ({
      kind: kind as TimelineKind,
      status: "available" as const,
      result: {
        total: records.filter((r) => r.kind === kind).length,
        records: records
          .filter(
            (r) =>
              r.kind === kind &&
              (!query.cursor || compareTimeline(r, query.cursor) > 0),
          )
          .sort(compareTimeline)
          .slice(0, query.limit),
      },
    })),
  );
  const selection = {
    id: "asset-id",
    from: "2026-10-01",
    to: "2026-10-05",
    cursor: "",
  };
  const first = await app.timeline("admin", selection);
  const second = await app.timeline("admin", {
    ...selection,
    cursor: first.nextCursor,
  });
  expect(first.total).toBe(46);
  expect(second.total).toBe(46);
  expect(first.records).toHaveLength(25);
  expect(second.records).toHaveLength(21);
  expect(second.nextCursor).toBe("");
  const all = [...first.records, ...second.records];
  expect(new Set(all.map((r) => r.id)).size).toBe(46);
  expect(all).toEqual([...records].sort(compareTimeline));
  expect(all.at(-1)).toMatchObject({
    kind: "analytics",
    recordedAt: "",
    periodKind: "daily-aggregate",
  });
});
test("source coverage distinguishes denied analytics, unmapped handover and available empty maintenance", async () => {
  const { app } = fixture();
  await app.save("admin", create);
  const page = await app.timeline("tech", {
    id: "asset-id",
    from: "2026-10-05",
    to: "2026-10-05",
    cursor: "",
  });
  expect(page.records).toEqual([]);
  expect(page.total).toBe(0);
  expect(page.sources.map((s) => s.status)).toEqual([
    "available",
    "unmapped",
    "not-authorized",
  ]);
});
test("timeline cursors bind asset revision, exact range and full ordering instead of authorizing another selection", () => {
  const asset: Asset = {
    id: "asset-id",
    revision: 2,
    authorId: "admin",
    authorName: "Admin",
    createdAt: "",
    updatedAt: "",
    content,
  };
  const selection = {
    id: "asset-id",
    from: "2026-10-01",
    to: "2026-10-05",
    cursor: "",
  };
  const token = encodeCursor({
    v: 1,
    assetId: "asset-id",
    revision: 2,
    from: selection.from,
    to: selection.to,
    sourceKind: "",
    date: "2026-10-05",
    recordedAt: "",
    kind: "analytics",
    id: "row",
  });
  expect(timelineCursor(token, asset, selection)).toMatchObject({
    recordedAt: "",
    kind: "analytics",
  });
  expect(() =>
    timelineCursor(token, { ...asset, revision: 3 }, selection),
  ).toThrow("asset_conflict");
  expect(() =>
    timelineCursor(token, asset, { ...selection, to: "2026-10-04" }),
  ).toThrow("invalid_asset");
  expect(() => timelineCursor("bad%", asset, selection)).toThrow(
    "invalid_asset",
  );
});
test("dates and bounded inputs reject manufactured timestamps and impossible days", () => {
  expect(() =>
    validTimeline({
      id: "asset",
      from: "0000-01-01",
      to: "0000-01-01",
      cursor: "",
    }),
  ).toThrow("invalid_asset");
  expect(() =>
    validTimeline({
      id: "asset",
      from: "2026-01-01",
      to: "2027-01-02",
      cursor: "",
    }),
  ).toThrow("invalid_asset");
  expect(() =>
    validTimeline({
      id: "asset",
      from: "2026-02-30",
      to: "2026-03-01",
      cursor: "",
    }),
  ).toThrow("invalid_asset");
  expect(() =>
    validTimeline({
      id: "asset",
      from: "2026-10-05T00:00:00Z",
      to: "2026-10-05",
      cursor: "",
    }),
  ).toThrow("invalid_asset");
  expect(() =>
    validContent({ ...content, extraPermission: true }, locations),
  ).toThrow("invalid_asset");
});

test("current asset names equal exact codes while manual location details remain descriptive metadata", async () => {
  const { app, revisions } = fixture();
  const registered = await app.save("admin", {
    ...create,
    content: {
      ...content,
      name: "Unrelated display name",
      locationDetails: "Puffer 1 / lower drive",
    },
  });
  expect(registered.content.name).toBe(content.code);
  expect(registered.content.locationDetails).toBe("Puffer 1 / lower drive");
  expect(revisions[0].asset.content.name).toBe(content.code);
});
test("legacy reads and create recovery retain old attributed names without rewriting revisions", async () => {
  const { app, tx } = fixture();
  const legacy: Asset = {
    id: "asset-id",
    revision: 1,
    authorId: "admin",
    authorName: "Administrator",
    createdAt: "2026-10-01T12:00:00.000Z",
    updatedAt: "2026-10-01T12:00:00.000Z",
    content,
  };
  tx.prior = async () => ({
    asset: legacy,
    fingerprint: JSON.stringify({ content, note: "" }),
  });
  tx.get = async () => legacy;
  expect((await app.save("admin", create)).content.name).toBe("Conveyor");
  expect((await app.detail("admin", legacy.id)).content.locationDetails).toBe(
    "",
  );
  const updated = await app.save("admin", {
    ...create,
    key: "",
    id: legacy.id,
    expectedRevision: 1,
    note: "Use the exact source identifier",
  });
  expect(updated.content.name).toBe("0001");
  expect(legacy.content.name).toBe("Conveyor");
});
test("conditioned equipment catalog facets cover full matches and stable pages bind their filters", async () => {
  const { app, tx } = fixture();
  tx.equipment = async () =>
    Array.from({ length: 73 }, (_, index) => ({
      namespace: "analytics",
      sourceId: index < 60 ? "source" : "second-source",
      code: `CODE-${String(index).padStart(3, "0")}`,
      sector: "Workshop",
      area: index < 60 ? "Area" : "Second area",
      departmentId: "department",
      areaId: "area",
    }));
  const first = await app.equipmentCatalog("admin", {
    locationId: "department",
  });
  expect(first.total).toBe(73);
  expect(first.candidates).toHaveLength(50);
  expect(first.sources).toEqual(["second-source", "source"]);
  expect(first.areas).toEqual(["Area", "Second area"]);
  const second = await app.equipmentCatalog("admin", {
    locationId: "department",
    cursor: first.nextCursor,
  });
  expect(second.candidates).toHaveLength(23);
  expect(second.nextCursor).toBe("");
  expect(
    new Set(
      [...first.candidates, ...second.candidates].map(
        (candidate) => candidate.code,
      ),
    ).size,
  ).toBe(73);
  await expect(
    app.equipmentCatalog("admin", {
      locationId: "department",
      sourceId: "source",
      cursor: first.nextCursor,
    }),
  ).rejects.toMatchObject({ code: "invalid_asset" });
  expect(
    (
      await app.equipmentCatalog("admin", {
        locationId: "department",
        code: "CODE-072",
        sourceId: "second-source",
      })
    ).candidates[0].area,
  ).toBe("Second area");
  expect(
    (await app.equipmentCatalog("admin", { locationId: "other" })).total,
  ).toBe(0);
});
test("new source aliases require the exact asset code and a known analytical source tuple", async () => {
  const { app } = fixture();
  for (const alias of [
    { ...analyticAlias, sourceId: "guessed-source" },
    { ...analyticAlias, code: "different-code" },
    { ...analyticAlias, area: "Guessed area" },
    { ...handoverAlias, code: "other-equipment" },
  ])
    await expect(
      app.save("admin", {
        ...create,
        content: { ...content, aliases: [alias] },
      }),
    ).rejects.toMatchObject({ code: "invalid_asset" });
  expect(
    (
      await app.save("admin", {
        ...create,
        content: { ...content, aliases: [analyticAlias, handoverAlias] },
      })
    ).content.aliases,
  ).toHaveLength(2);
});
test("unchanged unverified legacy aliases remain readable and editable while corrections revalidate identity", async () => {
  const { app, tx } = fixture();
  const oldAlias = {
    ...analyticAlias,
    code: "different-code",
    sourceId: "old-source",
  };
  const legacy: Asset = {
    id: "asset-id",
    revision: 1,
    authorId: "admin",
    authorName: "Administrator",
    createdAt: "2026-10-01T12:00:00.000Z",
    updatedAt: "2026-10-01T12:00:00.000Z",
    content: { ...content, aliases: [oldAlias] },
  };
  tx.get = async () => legacy;
  const updated = await app.save("admin", {
    ...create,
    key: "",
    id: legacy.id,
    expectedRevision: 1,
    note: "Document physical inspection plan",
    content: {
      ...legacy.content,
      description: "Unverified manual registration",
    },
  });
  expect(updated.content.aliases).toEqual([oldAlias]);
  await expect(
    app.save("admin", {
      ...create,
      key: "",
      id: legacy.id,
      expectedRevision: 1,
      note: "Change the source tuple",
      content: { ...legacy.content, aliases: [{ ...oldAlias, area: "Other" }] },
    }),
  ).rejects.toMatchObject({ code: "invalid_asset" });
});
test("asset query resolves location descendants without changing the transport selection", async () => {
  const { app, tx } = fixture();
  const list = jest.fn(async () => ({ assets: [], total: 0, nextCursor: "" }));
  tx.list = list;
  await app.query("admin", {
    locationId: "department",
    status: "current",
    search: "",
    cursor: "",
  });
  expect(list).toHaveBeenCalledWith(
    { locationId: "department", status: "current", search: "", cursor: "" },
    ["department", "area"],
  );
});

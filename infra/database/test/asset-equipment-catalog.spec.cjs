const {
  prepareCatalog,
  applyCatalog,
  digest,
} = require("../../../scripts/local/asset-equipment-catalog-runner.cjs");
const {
  Assets,
} = require("../../../apps/api/dist/modules/assets/application/assets");
const {
  validContent,
} = require("../../../apps/api/dist/modules/assets/domain/assets");
const scope = { organizationId: "org", siteId: "site" };
const locations = [
  {
    id: "department",
    label: "Configured hall",
    role: "department",
    sectorKey: "Halle A",
    parentId: "",
  },
  {
    id: "area",
    label: "Buffer",
    role: "area",
    sectorKey: "",
    parentId: "department",
  },
  {
    id: "second-area",
    label: "Second buffer",
    role: "area",
    sectorKey: "",
    parentId: "department",
  },
];
const codeA = "=11+11.11.02-B102.1",
  codeB = "=11+11.11.02-B102.6";
const source = (code, sector = "Halle A", area = "Buffer") => ({
  namespace: "analytics",
  sourceId: "hitliste",
  code,
  sector,
  area,
});
const reference = (code) => ({
  namespace: "site-equipment",
  sourceId: "",
  code,
  sector: "",
  area: "",
  departmentId: "department",
  areaId: "area",
});
const asset = (id, code, changes = {}) => ({
  id,
  revision: 1,
  authorId: "owner",
  authorName: "Owner",
  createdAt: "2026-10-05T12:00:00.000Z",
  updatedAt: "2026-10-05T12:00:00.000Z",
  content: {
    code,
    name: code,
    type: "",
    locationId: "area",
    status: "unverified",
    validationNote: "",
    description: "Owner notes",
    aliases: [],
    locationDetails: "Buffer two",
    ...changes,
  },
});

function fixture() {
  const contexts = [source(codeA), source(codeB)];
  const assets = [
    asset("prueba", codeB, {
      name: "Prueba",
      type: "Owner-recorded motor",
      aliases: [reference(codeA), reference(codeB)],
    }),
    asset("training", "DEMO-194-01-1", {
      name: "[DEMO] Conveyor",
      status: "validated",
      validationNote: "Simulated check",
    }),
    asset("retired-training", "DEMO-194-01-2", { status: "retired" }),
    asset("manual", "MANUAL-CASSETTE", {
      type: "Cassette",
      locationDetails: "Buffer one",
    }),
  ];
  const manifest = prepareCatalog({
    scope,
    actor: "leader",
    contexts,
    reported: [reference("Unregistered manual report")],
    assets,
    locations,
    baseline: {},
  });
  const rows = assets.map((snapshot) => ({
    snapshot: structuredClone(snapshot),
    author_id: snapshot.authorId,
    request_key: "original-" + snapshot.id,
    fingerprint: JSON.stringify({ content: snapshot.content, note: "" }),
  }));
  const revisions = assets.map((value) => ({
    asset: structuredClone(value),
    actorId: "owner",
    actorName: "Owner",
    action: "created",
    note: "Original metadata",
    at: value.createdAt,
  }));
  let sequence = 0;
  const app = new Assets(
    {
      run: async (_actor, _permission, work) =>
        work({
          canManage: true,
          equipment: async (selection) =>
            contexts
              .filter(
                (candidate) =>
                  !selection?.code || candidate.code === selection.code,
              )
              .map((candidate) => ({
                ...candidate,
                departmentId: "department",
                areaId: "area",
              })),
          name: async () => "Leader",
          get: async (id) =>
            structuredClone(
              rows.find((row) => row.snapshot.id === id)?.snapshot ?? null,
            ),
          prior: async (key) => {
            const row = rows.find(
              (row) => row.author_id === "leader" && row.request_key === key,
            );
            return row
              ? {
                  fingerprint: row.fingerprint,
                  asset: structuredClone(row.snapshot),
                }
              : null;
          },
          save: async (saved, revision, request) => {
            const index = rows.findIndex((row) => row.snapshot.id === saved.id);
            if (request)
              rows.push({
                snapshot: structuredClone(saved),
                author_id: "leader",
                request_key: request.key,
                fingerprint: request.fingerprint,
              });
            else rows[index].snapshot = structuredClone(saved);
            revisions.push(structuredClone(revision));
          },
        }),
    },
    locations,
    "UTC",
    () => "generated-" + ++sequence,
    () => "2026-10-06T12:00:00.000Z",
  );
  return { manifest, rows, revisions, app, contexts, assets };
}

test("prepares one exact code identity, preserves owner metadata and archives only active training records", () => {
  const f = fixture();
  expect(f.manifest.summary).toMatchObject({
    importedCodes: 2,
    manualOnlyCodes: 1,
    create: 1,
    update: 1,
    archive: 1,
    retainedTrainingIdentities: 2,
    expectedRegistryRecords: 5,
    expectedCurrentCodes: 3,
  });
  const kept = f.manifest.actions.find((action) => action.id === "prueba");
  expect(kept.content).toMatchObject({
    code: codeB,
    name: codeB,
    type: "Owner-recorded motor",
    description: "Owner notes",
    locationDetails: "Buffer two",
    locationId: "area",
    status: "unverified",
  });
  expect(kept.content.aliases.every((alias) => alias.code === codeB)).toBe(
    true,
  );
  const created = f.manifest.actions.find((action) => action.kind === "create");
  expect(created.code).toBe(codeA);
  expect(created.content).toMatchObject({
    name: codeA,
    type: "",
    status: "unverified",
    locationId: "area",
  });
  expect(created.content.aliases).toEqual(
    expect.arrayContaining([reference(codeA)]),
  );
  expect(
    f.manifest.actions
      .filter((action) => action.kind !== "create")
      .every(
        (action) =>
          f.manifest.actions.indexOf(action) <
          f.manifest.actions.indexOf(created),
      ),
  ).toBe(true);
  expect(f.assets[0].content.name).toBe("Prueba");
  for (const action of f.manifest.actions)
    expect(() => validContent(action.content, locations)).not.toThrow();
});

test("ambiguous and unmapped source contexts remain explicit without guessed locations or physical types", () => {
  const manifest = prepareCatalog({
    scope,
    actor: "leader",
    assets: [],
    locations,
    baseline: {},
    contexts: [
      source("AMBIGUOUS"),
      source("AMBIGUOUS", "Halle A", "Second buffer"),
      source("UNMAPPED", "Unclassified", "Configured hall"),
    ],
  });
  expect(
    manifest.actions.find((action) => action.code === "AMBIGUOUS").content,
  ).toMatchObject({ locationId: "", type: "", status: "unverified" });
  const unmapped = manifest.actions.find(
    (action) => action.code === "UNMAPPED",
  ).content;
  expect(unmapped.locationId).toBe("");
  expect(unmapped.aliases).toHaveLength(1);
  expect(unmapped.aliases[0].namespace).toBe("analytics");
});

test("actual Assets validators normalize fingerprint field order and repeated application adds no revisions", async () => {
  const f = fixture();
  const originalHistory = digest(f.revisions);
  const first = await applyCatalog(f.manifest, f, (request) =>
    f.app.save("leader", request),
  );
  expect(first).toMatchObject({
    completed: 3,
    written: 3,
    preservedOwnerEdits: 0,
  });
  expect(f.rows).toHaveLength(5);
  expect(digest(f.revisions.slice(0, 4))).toBe(originalHistory);
  const finalHistory = digest(f.revisions);
  const repeated = await applyCatalog(f.manifest, f, (request) =>
    f.app.save("leader", request),
  );
  expect(repeated).toMatchObject({ completed: 3, written: 0 });
  expect(digest(f.revisions)).toBe(finalHistory);
  expect(
    f.rows.find((row) => row.snapshot.id === "prueba").snapshot.authorId,
  ).toBe("owner");
  const created = f.rows.find(
    (row) => row.snapshot.content.code === codeA,
  ).snapshot;
  await f.app.save("leader", {
    key: "",
    id: created.id,
    expectedRevision: created.revision,
    note: "Owner location refinement",
    content: {
      ...created.content,
      locationDetails: "Manually surveyed buffer group",
    },
  });
  const correctedHistory = digest(f.revisions);
  const preserved = await applyCatalog(f.manifest, f, (request) =>
    f.app.save("leader", request),
  );
  expect(preserved).toMatchObject({ written: 0, preservedOwnerEdits: 1 });
  expect(digest(f.revisions)).toBe(correctedHistory);
});

test("interrupted prefixes resume while later owner edits are preserved", async () => {
  const f = fixture();
  let calls = 0;
  await expect(
    applyCatalog(f.manifest, f, (request) => {
      if (++calls === 3) throw new Error("Synthetic interruption");
      return f.app.save("leader", request);
    }),
  ).rejects.toThrow("Synthetic interruption");
  const current = f.rows.find((row) => row.snapshot.id === "prueba").snapshot;
  await f.app.save("leader", {
    key: "",
    id: current.id,
    expectedRevision: current.revision,
    note: "Owner correction after prefix",
    content: {
      ...current.content,
      locationDetails: "Owner corrected physical group",
    },
  });
  const result = await applyCatalog(f.manifest, f, (request) =>
    f.app.save("leader", request),
  );
  expect(result).toMatchObject({ written: 1, preservedOwnerEdits: 1 });
  expect(
    f.rows.find((row) => row.snapshot.id === "prueba").snapshot.content
      .locationDetails,
  ).toBe("Owner corrected physical group");
  expect(f.rows).toHaveLength(5);
});

test("all pending preconditions are checked before writes when an owner edits or registers after preview", async () => {
  for (const conflict of ["changed", "registered"]) {
    const f = fixture();
    if (conflict === "changed") {
      f.rows[0].snapshot.revision++;
      f.rows[0].snapshot.content.description = "Owner change after preview";
    } else
      f.rows.push({
        snapshot: asset("owner-new", codeA),
        author_id: "owner",
        request_key: "owner-request",
        fingerprint: "{}",
      });
    const save = jest.fn((request) => f.app.save("leader", request));
    await expect(applyCatalog(f.manifest, f, save)).rejects.toThrow(
      /after preview/,
    );
    expect(save).not.toHaveBeenCalled();
  }
});

test("capacity and ambiguous training/source identity stop preparation before any mutation", () => {
  expect(() =>
    prepareCatalog({
      scope,
      actor: "leader",
      contexts: Array(10001).fill(source(codeA)),
      assets: [],
      locations,
      baseline: {},
    }),
  ).toThrow("supported limit");
  expect(() =>
    prepareCatalog({
      scope,
      actor: "leader",
      contexts: [source("DEMO-194-01-1")],
      assets: [asset("training", "DEMO-194-01-1")],
      locations,
      baseline: {},
    }),
  ).toThrow("training marker overlaps");
});

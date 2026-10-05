const { PostgreSqlContainer } = require("@testcontainers/postgresql");
const { Client, Pool } = require("pg");
const { randomUUID } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { provision } = require("../dist/provision");
const { migrate } = require("../dist/migrate");
const { provisioningConfiguration } = require("../dist/configuration");
const { seedOrganization } = require("../dist/seed-organization");
const { seedSite } = require("../dist/seed-site");
const { seedUser } = require("../dist/seed-user");
const { seedMembership } = require("../dist/seed-membership");
const {
  Assets,
} = require("../../../apps/api/dist/modules/assets/application/assets");
const {
  PgAssets,
  assetReference,
  assetReferences,
} = require("../../../apps/api/dist/modules/assets/adapters/postgres/store");
const {
  Handover,
} = require("../../../apps/api/dist/modules/shift-handover/application/handover");
const {
  PgHandover,
} = require("../../../apps/api/dist/modules/shift-handover/adapters/postgres/store");
const {
  handoverAssetTimeline,
} = require("../../../apps/api/dist/modules/shift-handover/adapters/postgres/asset-history");
const {
  Maintenance,
} = require("../../../apps/api/dist/modules/maintenance/application/maintenance");
const {
  PgMaintenance,
} = require("../../../apps/api/dist/modules/maintenance/adapters/postgres/store");
const {
  maintenanceTimeline,
} = require("../../../apps/api/dist/modules/maintenance/adapters/postgres/asset-history");
const {
  analyticAssetTimeline,
} = require("../../../apps/api/dist/modules/oip/adapters/postgres/asset-history");
const {
  PgReportingProfiles,
} = require("../../../apps/api/dist/modules/oip/adapters/postgres/reporting-profiles");
const {
  hitlisteReportingProfile,
} = require("../../../apps/api/dist/host/adapters/hitliste-reporting-profile");
const {
  sitePeople,
  sitePersonNames,
} = require("../../../apps/api/dist/modules/users-rbac/adapters/postgres/site-people");
const {
  siteRoles,
} = require("../../../apps/api/dist/modules/users-rbac/domain/profiles");
const {
  evaluateSiteAccess,
} = require("../../../apps/api/dist/modules/users-rbac");
const {
  runSiteOperation,
  SiteAccessDeniedError,
  AuthorizationUnavailableError,
} = require("../../../apps/api/dist/persistence/site-operation");
const {
  SourceMappings,
} = require("../../../apps/api/dist/modules/integrations");
const { PlatformRuntime } = require("../../../apps/api/dist/host/runtime");
const scope = { organizationId: "org-a", siteId: "site-a" };
const locations = [
  {
    id: "department",
    label: "Preparation",
    parentId: "",
    role: "department",
    sectorKey: "Preparation",
  },
  {
    id: "area",
    label: "Area A",
    parentId: "department",
    role: "area",
    sectorKey: "",
  },
];
const content = {
  code: "0001",
  name: "Drive",
  type: "Motor",
  locationId: "area",
  status: "unverified",
  validationNote: "",
  description: "",
  aliases: [],
};
const aliases = [
  {
    namespace: "site-equipment",
    sourceId: "",
    code: "=EQ-001",
    departmentId: "department",
    areaId: "area",
    sector: "",
    area: "",
  },
  {
    namespace: "analytics",
    sourceId: "source-a",
    code: "=EQ-001",
    departmentId: "",
    areaId: "",
    sector: "Preparation",
    area: "Area A",
  },
];
let container, configs, pool, app, runtime, initialProfileVersion;
let tick = 0;
const now = () =>
  new Date(Date.parse("2026-07-01T12:00:00.000Z") + tick++).toISOString();
async function db(role, work) {
  const client = new Client(configs[role]);
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}
function allowed(tx, target, actor, permission) {
  return evaluateSiteAccess(tx, {
    ...target,
    userId: actor,
    permissions: [permission],
  }).then((result) => result.allowed);
}
function directory(target = scope) {
  return {
    allowed: (tx, actor, permission) => allowed(tx, target, actor, permission),
    names: (tx, ids) =>
      sitePersonNames(tx, target.organizationId, target.siteId, ids),
  };
}
function service(target = scope, connection = pool, sourceReaders) {
  const readers = sourceReaders ?? [
    {
      kind: "maintenance",
      permission: "maintenance.read",
      read: (tx, asset, query) =>
        maintenanceTimeline(tx, target, asset.id, query),
    },
    {
      kind: "handover",
      permission: "handover.read",
      read: (tx, asset, query) =>
        handoverAssetTimeline(tx, target, asset, query),
    },
    {
      kind: "analytics",
      permission: "analytics.read",
      read: (tx, asset, query) =>
        analyticAssetTimeline(
          tx,
          runtime.source,
          asset,
          query,
          initialProfileVersion,
        ),
    },
  ];
  return new Assets(
    new PgAssets(connection, target, {
      ...directory(target),
      sources: readers,
    }),
    locations,
    "UTC",
    randomUUID,
    now,
  );
}
function create(code = randomUUID(), mapped = false) {
  return {
    key: randomUUID(),
    id: "",
    expectedRevision: 0,
    note: "",
    content: { ...content, code, aliases: mapped ? aliases : [] },
  };
}
beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:17.6-bookworm")
    .withDatabase("iop_local")
    .withUsername("iop_bootstrap")
    .withPassword("synthetic-bootstrap-password")
    .start();
  const env = {
    IOP_DATABASE_MODE: "local",
    IOP_DATABASE_HOST: container.getHost(),
    IOP_DATABASE_PORT: String(container.getPort()),
    IOP_DATABASE_NAME: "iop_local",
    IOP_POSTGRES_PASSWORD: "synthetic-bootstrap-password",
    IOP_MIGRATOR_PASSWORD: "synthetic-migrator-password",
    IOP_RUNTIME_PASSWORD: "synthetic-runtime-password",
  };
  configs = provisioningConfiguration(env);
  await provision(configs);
  await migrate(configs.migrator);
  await provision(configs);
  for (const [organizationId, siteId, users] of [
    [
      "org-a",
      "site-a",
      [
        ["admin-a", "administrator"],
        ["tech-a", "technician"],
        ["lead-a", "team-leader"],
        ["task-a", "task-force"],
      ],
    ],
    ["org-a", "site-a2", [["admin-a2", "team-leader"]]],
    ["org-b", "site-b", [["admin-b", "team-leader"]]],
  ]) {
    const seed = {
      ...env,
      IOP_SEED_ORGANIZATION_ID: organizationId,
      IOP_SEED_ORGANIZATION_NAME: organizationId,
      IOP_SEED_SITE_ID: siteId,
      IOP_SEED_SITE_NAME: siteId,
      IOP_SEED_SITE_TIME_ZONE: "UTC",
    };
    await seedOrganization(seed);
    await seedSite(seed);
    for (const [id, profile] of users) {
      await seedUser({ ...seed, IOP_SEED_USER_ID: id });
      await seedMembership({ ...seed, IOP_SEED_USER_ID: id });
      await db("bootstrap", async (client) => {
        await client.query(
          "INSERT INTO users_rbac.profiles(organization_id,user_id,site_id,display_name,profile) VALUES($1,$2,$3,$2,$4)",
          [organizationId, id, siteId, profile],
        );
        await client.query(
          "DELETE FROM users_rbac.site_role_assignments WHERE organization_id=$1 AND site_id=$2 AND user_id=$3",
          [organizationId, siteId, id],
        );
        for (const role of siteRoles(profile))
          await client.query(
            "INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active) VALUES($1,$2,$3,$4,true)",
            [organizationId, id, siteId, role],
          );
      });
    }
  }
  pool = new Pool({ ...configs.runtime, max: 5 });
  const mappings = new SourceMappings({
    ...scope,
    sourceId: "source-a",
    mappingRevision: "asset-fixture-v1",
    sectors: [
      { sectorKey: "alpha", label: "Preparation" },
      { sectorKey: "beta", label: "Dispatch" },
    ],
    areas: [
      { sourceArea: "Area A", sectorKey: "alpha" },
      { sourceArea: "Area B", sectorKey: "beta" },
    ],
  });
  runtime = new PlatformRuntime(pool, {
    local: {
      organization: { id: scope.organizationId },
      site: {
        id: scope.siteId,
        organizationId: scope.organizationId,
        timeZone: "UTC",
      },
      source: {
        id: "source-a",
        siteId: scope.siteId,
        organizationId: scope.organizationId,
      },
    },
    users: [{ id: "admin-a", name: "Administrator" }],
    origins: [],
    mappings,
  });
  initialProfileVersion = new PgReportingProfiles(
    pool,
    runtime.source,
    hitlisteReportingProfile(mappings.configuration),
  ).initialVersion;
  app = service();
}, 90000);
afterAll(async () => {
  if (pool) await pool.end();
  if (container) await container.stop();
});

test("durable revision-safe assets recover idempotent creates, serialize stale edits and retain history after restart", async () => {
  const input = create("0001"),
    first = await app.save("lead-a", input);
  expect(await app.save("lead-a", input)).toEqual(first);
  await expect(
    app.save("lead-a", {
      ...input,
      content: { ...input.content, name: "Different" },
    }),
  ).rejects.toMatchObject({ code: "asset_conflict" });
  const edit = {
    key: "",
    id: first.id,
    expectedRevision: 1,
    note: "Verified label",
    content: {
      ...first.content,
      status: "validated",
      validationNote: "Synthetic survey",
    },
  };
  const concurrent = await Promise.allSettled([
    app.save("lead-a", edit),
    app.save("lead-a", edit),
  ]);
  expect(
    concurrent.filter((result) => result.status === "fulfilled"),
  ).toHaveLength(1);
  expect(
    concurrent.find((result) => result.status === "rejected").reason.code,
  ).toBe("asset_conflict");
  const restarted = new Pool({ ...configs.runtime, max: 1 });
  try {
    const saved = await service(scope, restarted).detail("lead-a", first.id);
    expect(saved.revision).toBe(2);
    expect(saved.content.code).toBe("0001");
    const history = await service(scope, restarted).history(
      "lead-a",
      first.id,
      0,
    );
    expect(
      history.revisions.map((revision) => revision.asset.revision),
    ).toEqual([2, 1]);
    expect(history.revisions[1].asset.content.status).toBe("unverified");
  } finally {
    await restarted.end();
  }
});
test("only Team Leaders and Task Force manage assets; exact aliases conflict atomically and cannot map two assets to one source tuple", async () => {
  await expect(app.save("tech-a", create())).rejects.toBeInstanceOf(
    SiteAccessDeniedError,
  );
  await expect(app.save("admin-a", create())).rejects.toBeInstanceOf(
    SiteAccessDeniedError,
  );
  expect((await app.save("task-a", create("task-managed"))).content.code).toBe(
    "task-managed",
  );
  const aliasInput = {
    ...create("alias-asset"),
    content: {
      ...content,
      code: "alias-asset",
      aliases: aliases.map((alias) => ({ ...alias, code: "alias-test-code" })),
    },
  };
  const mapped = await app.save("lead-a", aliasInput);
  await expect(
    app.save("lead-a", {
      ...create("duplicate-mapped"),
      content: { ...aliasInput.content, code: "duplicate-mapped" },
    }),
  ).rejects.toMatchObject({ code: "asset_alias_conflict" });
  expect(
    (
      await app.query("lead-a", {
        search: "duplicate-mapped",
        status: "",
        locationId: "",
        cursor: "",
      })
    ).total,
  ).toBe(0);
  expect((await app.history("lead-a", mapped.id, 0)).revisions).toHaveLength(1);
  const separate = await app.save("lead-a", {
    ...create("different-area"),
    content: {
      ...content,
      code: "different-area",
      aliases: [{ ...aliases[1], area: "Area B" }],
    },
  });
  expect(separate.id).not.toBe(mapped.id);
});
test("RLS, scoped foreign keys and current grants protect records and immutable revisions with no ordinary deletes", async () => {
  const first = await app.save("lead-a", create("protected"));
  await expect(
    service({ organizationId: "org-b", siteId: "site-b" }).detail(
      "admin-b",
      first.id,
    ),
  ).rejects.toMatchObject({ code: "asset_missing" });
  await expect(
    service({ organizationId: "org-a", siteId: "site-a2" }).detail(
      "admin-a2",
      first.id,
    ),
  ).rejects.toMatchObject({ code: "asset_missing" });
  await expect(
    service({ organizationId: "org-b", siteId: "site-b" }).query("admin-a", {
      search: "",
      status: "",
      locationId: "",
      cursor: "",
    }),
  ).rejects.toBeInstanceOf(SiteAccessDeniedError);
  const naked = await db("runtime", (client) =>
    client.query("SELECT id FROM assets.records"),
  );
  expect(naked.rows).toEqual([]);
  await expect(
    db("runtime", (client) => client.query("DELETE FROM assets.records")),
  ).rejects.toMatchObject({ code: "42501" });
  await expect(
    db("runtime", (client) =>
      client.query("UPDATE assets.revisions SET snapshot='{}'"),
    ),
  ).rejects.toMatchObject({ code: "42501" });
  await expect(
    db("bootstrap", (client) =>
      client.query("INSERT INTO assets.aliases VALUES($1,$2,$3,$4,true)", [
        "org-b",
        "site-b",
        first.id,
        "synthetic-alias",
      ]),
    ),
  ).rejects.toMatchObject({ code: "23503" });
  await db("bootstrap", (client) =>
    client.query(
      "UPDATE users_rbac.site_role_assignments SET is_active=false WHERE user_id='lead-a' AND role_id='assets-reader'",
    ),
  );
  await expect(app.detail("lead-a", first.id)).rejects.toBeInstanceOf(
    SiteAccessDeniedError,
  );
  await db("bootstrap", (client) =>
    client.query(
      "UPDATE users_rbac.site_role_assignments SET is_active=true WHERE user_id='lead-a' AND role_id='assets-reader'",
    ),
  );
});
test("digital record reads owner evidence with exact mapping and denies Technician access", async () => {
  const imported = await runtime.imports.submit(
    "admin-a",
    "Hitliste-20260701.csv",
    readFileSync(
      join(
        __dirname,
        "../../../fixtures/analytical-poc/valid/Hitliste-20260701.csv",
      ),
    ),
  );
  expect(imported.outcome).toBe("succeeded");
  const mapped = await app.save("lead-a", create("history-asset", true));
  const lookup = {
    ...directory(),
    people: (tx) => sitePeople(tx, scope.organizationId, scope.siteId),
  };
  const handover = new Handover(
    new PgHandover(pool, scope, {
      ...lookup,
      equipment: async () => ({ codes: ["=EQ-001"], nextCursor: "" }),
    }),
    {
      timeZone: "UTC",
      locations,
      categories: [{ id: "problems", label: "Problems" }],
      externalSystemLabel: "External reference",
    },
    randomUUID,
    now,
  );
  const entry = await handover.create("admin-a", {
    key: randomUUID(),
    issue: true,
    responsibleId: "",
    content: {
      date: "2026-07-01",
      categoryId: "problems",
      summary: "Guard issue",
      details: "Observed",
      departmentId: "department",
      areaId: "area",
      equipmentCode: "=EQ-001",
      equipmentNamespace: "site-equipment",
      condition: "inspection-needed",
      externalReference: "",
      challenge: "",
      cause: "",
      measure: "",
      dueDate: "",
      feedbackDueDate: "",
      discuss: false,
    },
  });
  const maintenance = new Maintenance(
    new PgMaintenance(pool, scope, {
      ...lookup,
      teams: async () => [],
      assets: (tx) => assetReferences(tx, scope),
      asset: (tx, id) => assetReference(tx, scope, id),
    }),
    locations,
    [{ id: "normal", label: "Normal", rank: 1 }],
    now,
  );
  const work = await maintenance.save("admin-a", {
    id: randomUUID(),
    expectedRevision: 0,
    reason: "",
    data: {
      title: "Inspect guard",
      details: "",
      locationId: "area",
      assetId: mapped.id,
      priorityId: "normal",
      assigneeId: "",
      teamId: "",
      status: "open",
      dueDate: "",
      outcome: "",
      blockedReason: "",
      externalReference: "",
    },
  });
  const input = {
    id: mapped.id,
    from: "2026-07-01",
    to: "2026-07-01",
    cursor: "",
  };
  const all = await app.timeline("lead-a", input);
  expect(all.sources.map((source) => source.status)).toEqual([
    "available",
    "available",
    "available",
  ]);
  expect(
    all.records.find((record) => record.kind === "handover").sourceRecordId,
  ).toBe(entry.id);
  expect(
    all.records.find((record) => record.kind === "maintenance").sourceRecordId,
  ).toBe(work.id);
  const analytics = all.records.filter((record) => record.kind === "analytics");
  expect(analytics).toHaveLength(2);
  expect(analytics.reduce((sum, record) => sum + record.frequency, 0)).toBe(4);
  expect(analytics.reduce((sum, record) => sum + record.seconds, 0)).toBe(180);
  expect(
    analytics.every(
      (record) =>
        record.recordedAt === "" && record.periodKind === "daily-aggregate",
    ),
  ).toBe(true);
  expect(
    analytics.every((record) =>
      record.sourceRecordId.startsWith(imported.importId + ":"),
    ),
  ).toBe(true);
  await expect(app.timeline("tech-a", input)).rejects.toBeInstanceOf(
    SiteAccessDeniedError,
  );
  await expect(app.timeline("admin-a", input)).rejects.toBeInstanceOf(
    SiteAccessDeniedError,
  );
  const onlyAnalytical = await app.timeline("lead-a", {
    ...input,
    kind: "analytics",
  });
  expect(onlyAnalytical.total).toBe(2);
  expect(onlyAnalytical.records).toHaveLength(2);
});
test("history pages never imply complete evidence when aliases are absent or a source read is unavailable", async () => {
  const unmapped = await app.save("lead-a", create("no-mappings"));
  const input = {
    id: unmapped.id,
    from: "2026-07-01",
    to: "2026-07-01",
    cursor: "",
  };
  const empty = await app.timeline("lead-a", input);
  expect(empty.sources.map((source) => source.status)).toEqual([
    "available",
    "unmapped",
    "unmapped",
  ]);
  const fail = service(scope, pool, [
    {
      kind: "handover",
      permission: "handover.read",
      read: async () => {
        throw new Error("Source not prepared");
      },
    },
  ]);
  expect((await fail.timeline("lead-a", input)).sources).toEqual([
    { kind: "handover", status: "unavailable", total: 0 },
  ]);
  const denied = jest.fn(async () => {
    throw new Error("Should never query");
  });
  await db("bootstrap", (client) =>
    client.query(
      "UPDATE users_rbac.site_role_assignments SET is_active=false WHERE user_id='task-a' AND role_id='analytics-reader'",
    ),
  );
  try {
    await service(scope, pool, [
      { kind: "analytics", permission: "analytics.read", read: denied },
    ]).timeline("task-a", input);
  } finally {
    await db("bootstrap", (client) =>
      client.query(
        "UPDATE users_rbac.site_role_assignments SET is_active=true WHERE user_id='task-a' AND role_id='analytics-reader'",
      ),
    );
  }
  expect(denied).not.toHaveBeenCalled();
});
test("owner read ports enforce their own current source grants and exact pinned scope", async () => {
  const target = { id: "source-subject", aliases };
  const query = {
    from: "2026-07-01",
    to: "2026-07-01",
    cursor: null,
    limit: 26,
    timeZone: "UTC",
  };
  await expect(
    runSiteOperation(
      pool,
      { ...scope, userId: "admin-a", permissions: ["maintenance.read"] },
      (tx) =>
        assetReference(
          tx,
          { organizationId: "org-b", siteId: "site-b" },
          "foreign-asset",
        ),
    ),
  ).rejects.toBeInstanceOf(SiteAccessDeniedError);
  await expect(
    runSiteOperation(
      pool,
      { ...scope, userId: "admin-a", permissions: ["maintenance.read"] },
      (tx) => assetReferences(tx, { ...scope, siteId: "site-a2" }),
    ),
  ).rejects.toBeInstanceOf(SiteAccessDeniedError);
  await expect(
    runSiteOperation(
      pool,
      { ...scope, userId: "tech-a", permissions: ["maintenance.read"] },
      (tx) =>
        analyticAssetTimeline(
          tx,
          runtime.source,
          target,
          query,
          initialProfileVersion,
        ),
    ),
  ).rejects.toBeInstanceOf(SiteAccessDeniedError);
  await expect(
    runSiteOperation(
      pool,
      { ...scope, userId: "lead-a", permissions: ["assets.read"] },
      (tx) =>
        handoverAssetTimeline(
          tx,
          { organizationId: "org-b", siteId: "site-b" },
          target,
          query,
        ),
    ),
  ).rejects.toBeInstanceOf(SiteAccessDeniedError);
  await expect(
    runSiteOperation(
      pool,
      { ...scope, userId: "lead-a", permissions: ["assets.read"] },
      (tx) =>
        analyticAssetTimeline(
          tx,
          { ...runtime.source, siteId: "site-a2" },
          target,
          query,
          initialProfileVersion,
        ),
    ),
  ).rejects.toBeInstanceOf(SiteAccessDeniedError);
  await db("bootstrap", (client) =>
    client.query(
      "UPDATE users_rbac.site_role_assignments SET is_active=false WHERE user_id='tech-a' AND role_id='handover-contributor'",
    ),
  );
  try {
    await expect(
      runSiteOperation(
        pool,
        { ...scope, userId: "tech-a", permissions: ["maintenance.read"] },
        (tx) => handoverAssetTimeline(tx, scope, target, query),
      ),
    ).rejects.toBeInstanceOf(SiteAccessDeniedError);
  } finally {
    await db("bootstrap", (client) =>
      client.query(
        "UPDATE users_rbac.site_role_assignments SET is_active=true WHERE user_id='tech-a' AND role_id='handover-contributor'",
      ),
    );
  }
});
test("SQL source faults abort safely and the same pooled connection recovers in a fresh authorized operation", async () => {
  const subject = await app.save("lead-a", create("sql-recovery"));
  const selection = {
    id: subject.id,
    from: "2026-07-01",
    to: "2026-07-01",
    cursor: "",
  };
  const connection = new Pool({ ...configs.runtime, max: 1 });
  const later = jest.fn(async () => ({ records: [], total: 0 }));
  try {
    const failing = service(scope, connection, [
      {
        kind: "handover",
        permission: "handover.read",
        read: async (tx) => {
          await tx.query("SELECT id FROM assets.iop_missing_source_record");
          return { records: [], total: 0 };
        },
      },
      { kind: "maintenance", permission: "maintenance.read", read: later },
    ]);
    await expect(failing.timeline("lead-a", selection)).rejects.toBeInstanceOf(
      AuthorizationUnavailableError,
    );
    expect(later).not.toHaveBeenCalled();
    const recovered = service(scope, connection, [
      {
        kind: "maintenance",
        permission: "maintenance.read",
        read: async (tx) => {
          const rows = await tx.query(
            "SELECT id FROM assets.records WHERE organization_id=$1 AND site_id=$2 AND id=$3",
            [scope.organizationId, scope.siteId, subject.id],
          );
          expect(rows.rows).toEqual([{ id: subject.id }]);
          return { records: [], total: 0 };
        },
      },
    ]);
    expect((await recovered.timeline("lead-a", selection)).sources).toEqual([
      { kind: "maintenance", status: "available", total: 0 },
    ]);
    expect((await recovered.detail("lead-a", subject.id)).id).toBe(subject.id);
  } finally {
    await connection.end();
  }
});
test("directory and real mixed-source timeline keyset pages retain full counts without dropping equal-day revisions", async () => {
  for (let index = 0; index < 28; index++)
    await app.save("lead-a", create("paged-" + String(index).padStart(3, "0")));
  const selection = {
    search: "paged-",
    status: "",
    locationId: "",
    cursor: "",
  };
  const firstDirectory = await app.query("lead-a", selection);
  const secondDirectory = await app.query("lead-a", {
    ...selection,
    cursor: firstDirectory.nextCursor,
  });
  expect(firstDirectory.total).toBe(28);
  expect(firstDirectory.assets).toHaveLength(25);
  expect(secondDirectory.total).toBe(28);
  expect(secondDirectory.assets).toHaveLength(3);
  expect(
    new Set(
      [...firstDirectory.assets, ...secondDirectory.assets].map(
        (asset) => asset.id,
      ),
    ).size,
  ).toBe(28);
  await expect(
    app.query("lead-a", {
      ...selection,
      status: "validated",
      cursor: firstDirectory.nextCursor,
    }),
  ).rejects.toMatchObject({ code: "invalid_asset" });
  const mapped = await app.save("lead-a", {
    ...create("timeline-pages"),
    content: {
      ...content,
      code: "timeline-pages",
      aliases: [{ ...aliases[0], code: "timeline-code" }],
    },
  });
  const handover = new Handover(
    new PgHandover(pool, scope, {
      ...directory(),
      people: (tx) => sitePeople(tx, scope.organizationId, scope.siteId),
      equipment: async () => ({ codes: ["timeline-code"], nextCursor: "" }),
    }),
    {
      timeZone: "UTC",
      locations,
      categories: [{ id: "problems", label: "Problems" }],
      externalSystemLabel: "External reference",
    },
    randomUUID,
    now,
  );
  let entry = await handover.create("admin-a", {
    key: randomUUID(),
    issue: true,
    responsibleId: "",
    content: {
      date: "2026-07-01",
      categoryId: "problems",
      summary: "Tracked asset",
      details: "",
      departmentId: "department",
      areaId: "area",
      equipmentCode: "timeline-code",
      equipmentNamespace: "site-equipment",
      condition: "",
      externalReference: "",
      challenge: "",
      cause: "",
      measure: "",
      dueDate: "",
      feedbackDueDate: "",
      discuss: false,
    },
  });
  for (let index = 0; index < 30; index++)
    entry = await handover.change("admin-a", {
      id: entry.id,
      expectedRevision: entry.revision,
      action: "follow-up",
      note: "Recorded update " + index,
    });
  const window = {
    id: mapped.id,
    from: "2026-07-01",
    to: "2026-07-01",
    cursor: "",
    kind: "handover",
  };
  const first = await app.timeline("lead-a", window);
  const second = await app.timeline("lead-a", {
    ...window,
    cursor: first.nextCursor,
  });
  expect(first.total).toBe(31);
  expect(first.records).toHaveLength(25);
  expect(second.total).toBe(31);
  expect(second.records).toHaveLength(6);
  expect(second.nextCursor).toBe("");
  const records = [...first.records, ...second.records];
  expect(new Set(records.map((record) => record.id)).size).toBe(31);
  expect(records.map((record) => record.recordedAt)).toEqual(
    records
      .map((record) => record.recordedAt)
      .sort()
      .reverse(),
  );
  await expect(
    app.timeline("lead-a", {
      ...window,
      kind: "maintenance",
      cursor: first.nextCursor,
    }),
  ).rejects.toMatchObject({ code: "invalid_asset" });
  await app.save("lead-a", {
    id: mapped.id,
    key: "",
    expectedRevision: mapped.revision,
    note: "Registry correction",
    content: { ...mapped.content, name: "Corrected name" },
  });
  await expect(
    app.timeline("lead-a", { ...window, cursor: first.nextCursor }),
  ).rejects.toMatchObject({ code: "asset_conflict" });
});

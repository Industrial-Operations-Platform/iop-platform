const { PostgreSqlContainer } = require("@testcontainers/postgresql");
const { Client, Pool } = require("pg");
const request = require("supertest");
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
  SourceMappings,
} = require("../../../apps/api/dist/modules/integrations");
const { PlatformRuntime } = require("../../../apps/api/dist/host/runtime");
const { createApplication } = require("../../../apps/api/dist/host/application");
const { Maintenance } = require("../../../apps/api/dist/modules/maintenance/application/maintenance");
const { PgMaintenance } = require("../../../apps/api/dist/modules/maintenance/adapters/postgres/store");
const { assetReference, assetReferences } = require("../../../apps/api/dist/modules/assets/adapters/postgres/store");
const { evaluateSiteAccess } = require("../../../apps/api/dist/modules/users-rbac");
const { siteRoles } = require("../../../apps/api/dist/modules/users-rbac/domain/profiles");
const { sitePeople, sitePersonNames } = require("../../../apps/api/dist/modules/users-rbac/adapters/postgres/site-people");
const scope = require("../../../fixtures/analytical-poc/scope.json");
let container,
  configs,
  runtime,
  app,
  cookie,
  firstId,
  maintenanceEnv,
  dataset,
  runtimeConfig;
const { demoMaintenance } = require("../dist/demo-maintenance");
const origin = "http://127.0.0.1:4173";
const fixture = (path) =>
  readFileSync(join(__dirname, "../../../fixtures/analytical-poc", path));
const api = (method, path) => {
  let call = request(app.getHttpServer())
    [method]("/api/v1" + path)
    .set("Host", "127.0.0.1:3000")
    .set("Origin", origin)
    .set("X-IOP-Demo", "1");
  if (cookie) call = call.set("Cookie", cookie);
  return call;
};
async function admin(sql, values) {
  const c = new Client(configs.bootstrap);
  try {
    await c.connect();
    return await c.query(sql, values);
  } finally {
    await c.end();
  }
}
async function operationalSnapshot() {
  const result = {};
  for (const table of [
    "assets.records",
    "assets.aliases",
    "assets.revisions",
    "maintenance.records",
    "maintenance.revisions",
    "maintenance.settings",
    "maintenance.settings_revisions",
    "workforce.records",
    "workforce.revisions",
    "shift_handover.entries",
    "shift_handover.equipment_references",
    "shift_handover.revisions",
    "users_rbac.profiles",
  ]) {
    const rows = await admin(
      `SELECT to_jsonb(record) AS data FROM ${table} record WHERE organization_id=$1 AND site_id=$2 ORDER BY to_jsonb(record)::text`,
      [scope.organizationId, scope.siteId],
    );
    result[table] = rows.rows;
  }
  return result;
}
async function retainOperationalResetEvidence() {
  await admin(
    "INSERT INTO users_rbac.profiles(organization_id,user_id,site_id,display_name,profile) VALUES($1,'demo-a',$2,'Demo operator','administrator')",
    [scope.organizationId, scope.siteId],
  );
  for (const role of siteRoles("administrator")) {
    await admin(
      "INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active) VALUES($1,'demo-a',$2,$3,true) ON CONFLICT(organization_id,user_id,site_id,role_id) DO UPDATE SET is_active=true",
      [scope.organizationId, scope.siteId, role],
    );
  }
  // Operational Assets and work assignment use an eligible Team Leader;
  // the administrator retains priority and workforce administration.
  await admin(
    "INSERT INTO users_rbac.profiles(organization_id,user_id,site_id,display_name,profile) VALUES($1,'demo-b',$2,'Demo colleague','team-leader')",
    [scope.organizationId, scope.siteId],
  );
  for (const role of siteRoles("team-leader")) {
    await admin(
      "INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active) VALUES($1,'demo-b',$2,$3,true) ON CONFLICT(organization_id,user_id,site_id,role_id) DO UPDATE SET is_active=true",
      [scope.organizationId, scope.siteId, role],
    );
  }
  const knownEquipment = (await runtime.assets.equipmentCatalog("demo-b", {
    locationId: "",
  })).candidates.find(candidate => candidate.namespace === "analytics");
  expect(knownEquipment).toBeDefined();
  const asset = await runtime.assets.save("demo-b", {
    key: "reset-evidence-asset",
    id: "",
    expectedRevision: 0,
    note: "",
    content: {
      code: knownEquipment.code,
      name: knownEquipment.code,
      type: "",
      locationId: "",
      status: "unverified",
      validationNote: "",
      description: "",
      aliases: [
        {
          namespace: "analytics",
          sourceId: scope.sourceId,
          code: knownEquipment.code,
          departmentId: "",
          areaId: "",
          sector: knownEquipment.sector,
          area: knownEquipment.area,
        },
      ],
    },
  });
  const priorities = [{ id: "normal", label: "Normal", rank: 1 }];
  const maintenance = new Maintenance(
    new PgMaintenance(runtime.pool, scope, {
      allowed: async (tx, actor, permission) =>
        (
          await evaluateSiteAccess(tx, {
            ...scope,
            userId: actor,
            permissions: [permission],
          })
        ).allowed,
      people: (tx) => sitePeople(tx, scope.organizationId, scope.siteId),
      names: (tx, ids) =>
        sitePersonNames(tx, scope.organizationId, scope.siteId, ids),
      teams: async () => [],
      assets: (tx) => assetReferences(tx, scope),
      asset: (tx, id) => assetReference(tx, scope, id),
    }),
    [
      {
        id: "reset-fixture-location",
        parentId: "",
        label: "Reset fixture location",
      },
    ],
    priorities,
    () => "2026-10-05T12:00:00.000Z",
  );
  await maintenance.save("demo-b", {
    id: "reset-evidence-work",
    expectedRevision: 0,
    reason: "",
    data: {
      title: "Retained work after analytical reset",
      details: "",
      locationId: "reset-fixture-location",
      assetId: asset.id,
      priorityId: "normal",
      assigneeId: "demo-b",
      teamId: "",
      status: "open",
      dueDate: "2026-10-07",
      outcome: "",
      blockedReason: "",
      externalReference: "",
    },
  });
  await maintenance.configure("demo-a", { expectedRevision: 0, priorities });
  await runtime.workforce.saveWeek("demo-a", {
    userId: "demo-a",
    weekStart: "2026-10-05",
    days: [
      {
        date: "2026-10-05",
        status: "off",
        start: "",
        end: "",
        expectedRevision: 0,
      },
    ],
  });
  const retained = await operationalSnapshot();
  expect(retained["assets.aliases"]).toHaveLength(1);
  expect(retained["maintenance.records"]).toHaveLength(1);
  expect(retained["maintenance.revisions"]).toHaveLength(1);
  expect(retained["workforce.records"]).toHaveLength(1);
  return retained;
}
async function selectUser(id = "demo-a") {
  const r = await api("post", "/demo/user").send({ userId: id }).expect(201);
  cookie = r.headers["set-cookie"][0].split(";")[0];
  return r;
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
  const seed = {
    ...env,
    IOP_SEED_ORGANIZATION_ID: scope.organizationId,
    IOP_SEED_ORGANIZATION_NAME: scope.organizationName,
    IOP_SEED_SITE_ID: scope.siteId,
    IOP_SEED_SITE_NAME: scope.siteName,
    IOP_SEED_SITE_TIME_ZONE: scope.siteTimeZone,
  };
  await seedOrganization(seed);
  await seedSite(seed);
  for (const user of ["demo-a", "demo-b"]) {
    await seedUser({ ...seed, IOP_SEED_USER_ID: user });
    await seedMembership({ ...seed, IOP_SEED_USER_ID: user });
  }
  runtime = new PlatformRuntime(new Pool({ ...configs.runtime, max: 5 }), {
    local: {
      organization: { id: scope.organizationId },
      site: {
        id: scope.siteId,
        organizationId: scope.organizationId,
        timeZone: scope.siteTimeZone,
      },
      source: {
        id: scope.sourceId,
        siteId: scope.siteId,
        organizationId: scope.organizationId,
      },
    },
    users: [
      { id: "demo-a", name: "Demo operator" },
      { id: "demo-b", name: "Demo colleague" },
    ],
    origins: [origin],
    mappings: new SourceMappings({
      organizationId: scope.organizationId,
      siteId: scope.siteId,
      sourceId: scope.sourceId,
      mappingRevision: scope.mappingRevision,
      sectors: Object.entries(scope.sectorLabels).map(([sectorKey, label]) => ({
        sectorKey,
        label,
      })),
      areas: Object.entries(scope.sectorBySourceArea).map(
        ([sourceArea, sectorKey]) => ({ sourceArea, sectorKey }),
      ),
    }),
  });
  runtimeConfig = runtime.config;
  maintenanceEnv = {
    ...env,
    IOP_EXECUTION_MODE: "local-demo",
    IOP_RESET_ORGANIZATION_ID: scope.organizationId,
    IOP_RESET_SITE_ID: scope.siteId,
    IOP_RESET_SOURCE_ID: scope.sourceId,
  };
  dataset = await demoMaintenance(maintenanceEnv, "register");
  await runtime.start();
  app = await createApplication(runtime);
  await app.init();
});
afterAll(async () => {
  if (app) await app.close();
  if (runtime) await runtime.close();
  if (container) await container.stop();
});

test("configured local sessions and origin/host checks precede business access", async () => {
  await api("get", "/analytics/availability").expect(401);
  await api("post", "/demo/user").send({ userId: "foreign-user" }).expect(403);
  await api("post", "/demo/user")
    .set("Origin", "http://evil.example")
    .send({ userId: "demo-a" })
    .expect(403);
  await api("post", "/demo/user")
    .unset("X-IOP-Demo")
    .send({ userId: "demo-a" })
    .expect(403);
  await api("get", "/demo/context").set("Host", "evil.example").expect(403);
  await selectUser();
  const r = await api("get", "/analytics/availability").expect(200);
  expect(r.body.dates).toEqual([]);
});

test("real CSV receipt, normalization, publication, provenance and persistent history", async () => {
  for (const date of ["20260701", "20260703"]) {
    const started = performance.now(),
      bytes = fixture(`valid/Hitliste-${date}.csv`);
    const r = await api("post", "/imports")
      .set("Content-Type", "application/octet-stream")
      .set("X-CSV-Filename", `Hitliste-${date}.csv`)
      .send(bytes)
      .expect(201);
    console.info(
      JSON.stringify({
        event: "poc.measurement",
        operation: "import",
        bytes: bytes.length,
        milliseconds: Math.round(performance.now() - started),
      }),
    );
    expect(r.body.outcome).toBe("succeeded");
    if (date === "20260701") firstId = r.body.importId;
  }
  const history = await api("get", "/imports").expect(200);
  expect(history.body).toHaveLength(2);
  expect(history.body[0].submittedBy).toBe("demo-a");
  const raw = await api("get", `/imports/${firstId}/original`).expect(200);
  expect(raw.body).toEqual(fixture("valid/Hitliste-20260701.csv"));
  const available = (await api("get", "/analytics/availability").expect(200))
    .body;
  const selection = {
    revision: available.revision,
    from: "2026-07-01",
    toExclusive: "2026-07-04",
    pageSize: 2,
  };
  let cursor,
    facts = [];
  do {
    const r = await api("post", "/analytics/query")
      .send({ ...selection, ...(cursor ? { cursor } : {}) })
      .expect(201);
    expect(r.body).toMatchObject({
      recordCount: 9,
      reportedFrequency: 19,
      accumulatedAlarmSeconds: 97775,
      missingDates: ["2026-07-02"],
      reportingWindowStatus: "unknown",
    });
    facts.push(...r.body.records);
    cursor = r.body.nextCursor;
  } while (cursor);
  expect(facts).toHaveLength(9);
  expect(
    new Set(facts.map((r) => r.importId + ":" + r.sourceRecordNumber)).size,
  ).toBe(9);
  expect(facts.reduce((n, r) => n + r.reportedFrequency, 0)).toBe(19);
  expect(facts.reduce((n, r) => n + r.accumulatedAlarmSeconds, 0)).toBe(97775);
  const oracle = require("../../../fixtures/analytical-poc/expected.json");
  for (const f of oracle.validFiles) {
    expect(
      facts
        .filter((r) => r.reportingDate === f.reportingDate)
        .map((r) => [
          r.sourceRecordNumber,
          r.reportedFrequency,
          r.accumulatedAlarmSeconds,
          r.sourceArea,
          r.sourceEquipmentReference,
          r.sourceMessageText,
          r.sourceMessageType,
          r.sourceMessageGroup,
          r.sectorKey,
        ]),
    ).toEqual(f.rows);
  }
  const grouped = (
    await api("post", "/analytics/query").send(selection).expect(201)
  ).body;
  const tuples = (kind) =>
    grouped.groups[kind]
      .map((g) => [
        g.label,
        g.recordCount,
        g.reportedFrequency,
        g.accumulatedAlarmSeconds,
      ])
      .sort((a, b) => a[0].localeCompare(b[0]));
  expect(tuples("area")).toEqual(
    [
      ["area a", 1, 1, 61],
      ["Area A", 4, 9, 300],
      ["Area B", 2, 5, 97384],
      ["Area X", 2, 4, 30],
    ].sort((a, b) => a[0].localeCompare(b[0])),
  );
  expect(tuples("equipment")).toEqual(
    [
      ["Area A / =EQ-001", 3, 9, 300],
      ["Area A / =EQ-003", 1, 0, 0],
      ["Area B / =EQ-002", 2, 5, 97384],
      ["Area X / =EQ-004", 2, 4, 30],
      ["area a / =EQ-005", 1, 1, 61],
    ].sort((a, b) => a[0].localeCompare(b[0])),
  );
  for (const kind of ["sector", "area", "equipment", "message"]) {
    expect(
      grouped.groups[kind].reduce((n, g) => n + g.reportedFrequency, 0),
    ).toBe(19);
    expect(
      grouped.groups[kind].reduce((n, g) => n + g.accumulatedAlarmSeconds, 0),
    ).toBe(97775);
  }
  const sameFile = await api("post", "/analytics/query")
    .send({ ...selection, toExclusive: "2026-07-02" })
    .expect(201);
  expect(sameFile.body).toMatchObject({
    recordCount: 6,
    reportedFrequency: 12,
    accumulatedAlarmSeconds: 94055,
  });
});

test("invalid and changed duplicate input retain review evidence and add no facts or revision", async () => {
  const before = (await api("get", "/analytics/availability")).body;
  const invalid = await api("post", "/imports")
    .set("Content-Type", "application/octet-stream")
    .set("X-CSV-Filename", "Hitliste-20260702.csv")
    .send(fixture("invalid/negative-frequency/Hitliste-20260702.csv"))
    .expect(201);
  expect(invalid.body).toMatchObject({
    outcome: "rejected",
    admittedRecordCount: 0,
  });
  expect(invalid.body.diagnostics.length).toBeGreaterThan(0);
  const duplicate = await api("post", "/imports")
    .set("Content-Type", "application/octet-stream")
    .set("X-CSV-Filename", "Hitliste-20260701.csv")
    .send(fixture("duplicate-changed/Hitliste-20260701.csv"))
    .expect(201);
  expect(duplicate.body).toMatchObject({
    outcome: "rejected",
    reasonCode: "duplicate-date",
    admittedRecordCount: 0,
  });
  expect((await api("get", "/analytics/availability")).body).toEqual(before);
});

test("filters, options, exclusions and cursor/revision validation use actual persisted facts", async () => {
  const a = (await api("get", "/analytics/availability")).body,
    selection = {
      revision: a.revision,
      from: "2026-07-01",
      toExclusive: "2026-07-04",
      pageSize: 2,
    };
  const opts = await api("post", "/analytics/options")
    .send({ revision: a.revision, kind: "sector", pageSize: 1 })
    .expect(201);
  expect(opts.body.options).toHaveLength(1);
  expect(opts.body.nextCursor).toBeTruthy();
  const all = await api("post", "/analytics/query").send(selection).expect(201);
  const group = all.body.groups.sector.find((x) => x.label === "Unclassified");
  const filtered = await api("post", "/analytics/query")
    .send({ ...selection, sectors: [group.reference] })
    .expect(201);
  expect(filtered.body).toMatchObject({
    reportedFrequency: 5,
    accumulatedAlarmSeconds: 91,
  });
  await api("post", "/analytics/query")
    .send({
      ...selection,
      sectors: [group.reference],
      cursor: all.body.nextCursor,
    })
    .expect(400);
  await api("post", "/analytics/query")
    .send({ ...selection, areas: ["d1." + "A".repeat(43)] })
    .expect(400);
  await api("post", "/analytics/query")
    .send({ ...selection, pageSize: 101 })
    .expect(400);
  await api("post", "/analytics/query")
    .send({ ...selection, organizationId: "foreign" })
    .expect(400);
  await api("post", "/imports")
    .set("Content-Type", "application/octet-stream")
    .set("X-CSV-Filename", "Hitliste-20260704.csv")
    .send(fixture("renamed-content/Hitliste-20260704.csv"))
    .expect(201);
  const changed = await api("post", "/analytics/query")
    .send(selection)
    .expect(409);
  expect(changed.body.code).toBe("analytics_revision_changed");
});

test("switching invalidates the old cookie and current revocation denies a live session", async () => {
  const old = cookie;
  await selectUser("demo-b");
  await api("get", "/analytics/availability").set("Cookie", old).expect(401);
  expect((await api("get", "/imports")).body.length).toBe(5);
  await admin(
    "UPDATE users_rbac.organization_memberships SET is_active=false WHERE user_id='demo-b'",
  );
  await api("get", "/analytics/availability").expect(403);
  await api("post", "/demo/user").send({ userId: "demo-b" }).expect(403);
  await admin(
    "UPDATE users_rbac.organization_memberships SET is_active=true WHERE user_id='demo-b'",
  );
  await selectUser();
  const direct = new Client(configs.runtime);
  try {
    await direct.connect();
    expect(
      (await direct.query("SELECT import_id FROM oip.publications")).rowCount,
    ).toBe(0);
    await expect(direct.query("DELETE FROM oip.facts")).rejects.toThrow();
  } finally {
    await direct.end();
  }
});

test("coverage, zero measures, exclusions, exact limits and bounded HTTP input remain distinct", async () => {
  const a = (await api("get", "/analytics/availability")).body,
    base = {
      revision: a.revision,
      from: "2026-07-01",
      toExclusive: "2026-07-04",
    };
  const all = (await api("post", "/analytics/query").send(base).expect(201))
    .body;
  const missing = await api("post", "/analytics/query")
    .send({ ...base, from: "2026-07-02", toExclusive: "2026-07-03" })
    .expect(201);
  expect(missing.body).toMatchObject({ state: "no-imports", recordCount: 0 });
  const area = all.groups.area.find((g) => g.label === "Area A"),
    sector = all.groups.sector.find((g) => g.label === "Unclassified");
  const none = await api("post", "/analytics/query")
    .send({ ...base, areas: [area.reference], sectors: [sector.reference] })
    .expect(201);
  expect(none.body).toMatchObject({
    state: "no-matches",
    recordCount: 0,
    admittedDates: ["2026-07-01", "2026-07-03"],
  });
  const idle = all.groups.message.find((g) => g.label.startsWith("Idle "));
  const zero = await api("post", "/analytics/query")
    .send({ ...base, messages: [idle.reference] })
    .expect(201);
  expect(zero.body).toMatchObject({
    state: "ready",
    recordCount: 1,
    reportedFrequency: 0,
    accumulatedAlarmSeconds: 0,
  });
  const exclude = await api("post", "/analytics/query")
    .send({ ...base, excludedMessages: [idle.reference] })
    .expect(201);
  expect(exclude.body).toMatchObject({
    recordCount: 8,
    reportedFrequency: 19,
    accumulatedAlarmSeconds: 97775,
  });
  await api("post", "/imports")
    .set("Content-Type", "application/octet-stream")
    .set("X-CSV-Filename", "Hitliste-20260801.csv")
    .send(Buffer.alloc(5242881))
    .expect(413);
  await api("get", "/imports?organizationId=foreign").expect(400);
  const header =
    "Häufigkeit;Dauer;Bereich;Betriebsmittelkennzeichen;Meldetext;Typ;Meldegruppe";
  for (const [date, frequency] of [
    ["20260801", Number.MAX_SAFE_INTEGER],
    ["20260803", 1],
  ]) {
    const bytes = Buffer.from(
      "\uFEFF" +
        header +
        "\r\n" +
        frequency +
        ";0 0:00:00;Area A;Equipment;Exact boundary;01;001\r\n",
      "utf16le",
    );
    const r = await api("post", "/imports")
      .set("Content-Type", "application/octet-stream")
      .set("X-CSV-Filename", `Hitliste-${date}.csv`)
      .send(bytes)
      .expect(201);
    expect(r.body.outcome).toBe("succeeded");
  }
  const b = (await api("get", "/analytics/availability")).body;
  const boundary = await api("post", "/analytics/query")
    .send({
      revision: b.revision,
      from: "2026-08-01",
      toExclusive: "2026-08-02",
    })
    .expect(201);
  expect(boundary.body.reportedFrequency).toBe(Number.MAX_SAFE_INTEGER);
  const overflow = await api("post", "/analytics/query")
    .send({
      revision: b.revision,
      from: "2026-08-01",
      toExclusive: "2026-08-04",
    })
    .expect(422);
  expect(overflow.body.code).toBe("analytics_total_out_of_range");
});

test("offline reset refuses active hosts, mismatched targets and drift; rollback preserves facts, foreign data and operational evidence", async () => {
  const env = { ...maintenanceEnv, IOP_DEMO_DATASET_ID: dataset.datasetId };
  await expect(demoMaintenance(env, "reset")).rejects.toThrow(
    "Stop the demo host",
  );
  const operationalBefore = await retainOperationalResetEvidence();
  // A different configured source shares the local installation but is not the reset target.
  const foreignSource = { ...runtimeConfig.local.source, id: "other-source" };
  const foreignConfig = {
    ...runtimeConfig,
    local: { ...runtimeConfig.local, source: foreignSource },
    mappings: new SourceMappings({
      ...runtimeConfig.mappings.configuration,
      sourceId: "other-source",
    }),
  };
  const foreign = new PlatformRuntime(runtime.pool, foreignConfig);
  const foreignBatch = await foreign.submit(
    "demo-a",
    "Hitliste-20260701.csv",
    fixture("valid/Hitliste-20260701.csv"),
  );
  const foreignBefore = (
    await admin(
      "SELECT row_to_json(b) AS data FROM integrations.import_batches b WHERE source_id='other-source'",
    )
  ).rows;
  await app.close();
  app = null;
  await runtime.close();
  runtime = null;
  for (const wrong of [
    { IOP_EXECUTION_MODE: "shared" },
    { IOP_RESET_SITE_ID: "another-site" },
    { IOP_RESET_ORGANIZATION_ID: "another-org" },
    { NODE_ENV: "production" },
  ])
    await expect(
      demoMaintenance({ ...env, ...wrong }, "reset"),
    ).rejects.toThrow();
  const holder = new Client(configs.migrator);
  try {
    await holder.connect();
    await holder.query("BEGIN");
    await holder.query("SELECT pg_advisory_xact_lock(190147)");
    await expect(demoMaintenance(env, "reset")).rejects.toThrow(
      "Stop the demo host",
    );
    const reconnect = new PlatformRuntime(
      new Pool({ ...configs.runtime, max: 5 }),
      runtimeConfig,
    );
    try {
      await expect(reconnect.start()).rejects.toThrow("maintenance");
    } finally {
      await reconnect.close();
    }
  } finally {
    await holder.end();
  }
  // Disconnecting the holder releases maintenance; no persistent bypass flag exists.
  await expect(
    demoMaintenance({ ...env, IOP_DEMO_DATASET_ID: "wrong" }, "reset"),
  ).rejects.toThrow("dataset identity");
  await expect(
    demoMaintenance({ ...env, IOP_RESET_SOURCE_ID: "other-source" }, "reset"),
  ).rejects.toThrow("marker");
  await admin(
    "UPDATE integrations.import_quota SET retained_attempts=retained_attempts+1",
  );
  await expect(demoMaintenance(env, "reset")).rejects.toThrow("Quota drift");
  await admin(
    "UPDATE integrations.import_quota SET retained_attempts=retained_attempts-1",
  );
  const before = (await admin("SELECT count(*)::integer AS n FROM oip.facts"))
    .rows[0].n;
  await admin(
    `CREATE FUNCTION public.test_reset_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic reset failure'; END $$`,
  );
  for (const table of [
    "analytics.fact_hitliste", "analytics.betriebsmittel", "analytics.bereich", "analytics.sektor",
    "analytics.meldetext", "analytics.meldung_typ", "analytics.meldegruppe",
    "oip.facts",
    "oip.publications",
    "integrations.import_date_claims",
    "integrations.import_batches",
    "integrations.import_quota",
  ]) {
    await admin(
      `CREATE TRIGGER test_reset_failure BEFORE ${table.endsWith("quota") ? "UPDATE" : "DELETE"} ON ${table} FOR EACH ROW EXECUTE FUNCTION public.test_reset_failure()`,
    );
    try {
      await expect(demoMaintenance(env, "reset")).rejects.toThrow(
        "confirmed result",
      );
      expect(
        (await admin("SELECT count(*)::integer AS n FROM oip.facts")).rows[0].n,
      ).toBe(before);
      expect((await admin("SELECT count(*)::integer AS n FROM analytics.fact_hitliste")).rows[0].n).toBe(before);
      expect(
        (await admin("SELECT retained_attempts FROM integrations.import_quota"))
          .rows[0].retained_attempts,
      ).toBe(8);
    } finally {
      await admin(`DROP TRIGGER test_reset_failure ON ${table}`);
    }
  }
  await admin("DROP FUNCTION public.test_reset_failure()");
  const result = await demoMaintenance(env, "reset");
  expect(await operationalSnapshot()).toEqual(operationalBefore);
  expect(result.attempts).toBe(7);
  expect(
    (
      await admin(
        "SELECT count(*)::integer AS n FROM oip.facts WHERE source_id=$1",
        [scope.sourceId],
      )
    ).rows[0].n,
  ).toBe(0);
  expect(
    (
      await admin(
        "SELECT row_to_json(b) AS data FROM integrations.import_batches b WHERE source_id='other-source'",
      )
    ).rows,
  ).toEqual(foreignBefore);
  expect(
    (
      await admin(
        "SELECT retained_attempts,retained_bytes::integer FROM integrations.import_quota",
      )
    ).rows[0],
  ).toEqual({ retained_attempts: 1, retained_bytes: foreignBatch.byteLength });
  for (const table of ['fact_hitliste','betriebsmittel','bereich','sektor','meldetext','meldung_typ','meldegruppe']) {
    expect((await admin(`SELECT count(*)::integer AS n FROM analytics.${table} WHERE source_id=$1`,[scope.sourceId])).rows[0].n).toBe(0);
  }
  expect((await admin("SELECT count(*)::integer AS n FROM analytics.fact_hitliste WHERE source_id='other-source'")).rows[0].n).toBeGreaterThan(0);
  expect((await demoMaintenance(env, "reset")).attempts).toBe(0);
  // The server committed, but the acknowledgement was lost. No automatic reset or reload follows.
  const query = Client.prototype.query;
  let commits = 0;
  Client.prototype.query = async function (sql, ...args) {
    const result = await query.call(this, sql, ...args);
    if (this.user === "iop_migrator" && sql === "COMMIT") {
      commits++;
      throw new Error("synthetic lost commit acknowledgement");
    }
    return result;
  };
  try {
    await expect(demoMaintenance(env, "reset")).rejects.toThrow(
      "confirmed result",
    );
  } finally {
    Client.prototype.query = query;
  }
  expect(commits).toBe(1);
  expect(
    (await admin("SELECT retained_attempts FROM integrations.import_quota"))
      .rows[0].retained_attempts,
  ).toBe(1);
  await provision(configs);
});

test("real browser imports, analyzes file and history, reviews failures, switches user and preserves results after reload", async () => {
  const { chromium } = require("@playwright/test");
  const { createServer, request: proxyRequest } = require("node:http");
  const { mkdirSync } = require("node:fs");
  runtime = new PlatformRuntime(
    new Pool({ ...configs.runtime, max: 5 }),
    runtimeConfig,
  );
  await runtime.start();
  app = await createApplication(runtime);
  await app.listen(0, "127.0.0.1");
  const apiPort = app.getHttpServer().address().port;
  const dist = join(__dirname, "../../../apps/web/dist");
  const server = createServer((req, res) => {
    if (req.url.startsWith("/api/")) {
      const proxied = proxyRequest(
        {
          hostname: "127.0.0.1",
          port: apiPort,
          path: req.url,
          method: req.method,
          headers: req.headers,
        },
        (response) => {
          res.writeHead(response.statusCode, response.headers);
          response.pipe(res);
        },
      );
      proxied.on("error", () => {
        res.writeHead(502);
        res.end();
      });
      req.pipe(proxied);
      return;
    }
    try {
      const path = new URL(req.url, "http://local").pathname;
      const name = path === "/" ? "index.html" : path.slice(1);
      if (name.includes("..")) throw new Error();
      const bytes = readFileSync(join(dist, name));
      res.setHeader(
        "Content-Type",
        name.endsWith(".js")
          ? "text/javascript"
          : name.endsWith(".css")
            ? "text/css"
            : "text/html",
      );
      res.end(bytes);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const browserOrigin = `http://127.0.0.1:${server.address().port}`;
  runtimeConfig.origins.push(browserOrigin);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1366, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const { expect: pw } = require("@playwright/test");
  try {
    const button = name => page.getByRole('button', { name, exact: true });
    const kpi = page.locator('.analysis-kpis strong').first();
    const input = page.getByLabel('CSV file', { exact: true });
    await page.goto(browserOrigin);
    await page.getByLabel('Demo user', { exact: true }).selectOption('demo-a');
    await pw(page.getByRole('region', { name: 'Start page' })).toBeVisible();
    await pw(button('Import & prepare')).toHaveCount(0);
    await button('Data analysis').click();
    await button('Administration').click();
    await button('Data administration').click();
    await button('Import files').click();
    for (const [date, count] of [['20260701', '6'], ['20260703', '3']]) {
      await input.setInputFiles(join(__dirname, `../../../fixtures/analytical-poc/valid/Hitliste-${date}.csv`));
      await pw(button('Import CSV')).toBeDisabled();
      await page.getByRole('checkbox', { name: /^Confirm reporting date:/ }).check();
      await button('Import CSV').click();
      await pw(page.getByRole('heading', { name: 'Import complete' })).toBeVisible();
      await pw(page.locator('.analysis-import-counts strong').nth(1)).toHaveText(count);
      await pw(page.locator('.analysis-kpis')).toHaveCount(0);
    }
    // Current administration prevents a known duplicate before another upload.
    await input.setInputFiles(join(__dirname, '../../../fixtures/analytical-poc/valid/Hitliste-20260701.csv'));
    await pw(page.getByRole('alert')).toContainText('already has an accepted file');
    await pw(button('Import CSV')).toBeDisabled();
    await button('Review existing import').click();
    await pw(page.getByRole('heading', { name: 'Import complete' })).toBeVisible();
    await input.setInputFiles(join(__dirname, '../../../fixtures/analytical-poc/invalid/negative-frequency/Hitliste-20260702.csv'));
    await page.getByRole('checkbox', { name: /^Confirm reporting date:/ }).check();
    await button('Import CSV').click();
    await pw(page.getByRole('heading', { name: 'Import rejected' })).toBeVisible();
    await button('KPI settings & goals').click();
    await page.getByLabel('Label 1', { exact: true }).fill('Jam frequency');
    await page.getByLabel('Meldetext 1', { exact: true }).selectOption('Jam');
    await button('Save KPI settings').click();
    await pw(page.getByText('KPI settings saved.', { exact: true })).toBeVisible();
    await button('Data analysis').click();
    await pw(kpi).toHaveText('4.5');
    await pw(page.locator('.analysis-kpis section').first()).toHaveAttribute('data-state', 'equal');
    // Profile saves persist across the administration/taskforce boundary.
    for (const [goal, state] of [['3', 'worse'], ['', 'equal']]) {
      await button('Administration').click();
      await button('Data administration').click();
      await button('KPI settings & goals').click();
      await page.getByLabel('Goal 1', { exact: true }).fill(goal);
      await button('Save KPI settings').click();
      await pw(page.getByText('KPI settings saved.', { exact: true })).toBeVisible();
      await button('Data analysis').click();
      await pw(page.locator('.analysis-kpis section').first()).toHaveAttribute('data-state', state);
      if (goal) await pw(page.locator('.analysis-kpis section').first()).toContainText('+50%');
    }
    for (const title of ['Bereich analysis', 'Equipment analysis', 'Error analysis', 'Daily / monthly', 'Halle analysis']) {
      await button(title).click();
      await pw(page.locator('.analysis-plot svg').first()).toBeVisible();
      await pw(page.locator('.analysis-kpis')).toHaveCount(0);
    }
    await button('Executive Overview').click();
    await pw(kpi).toHaveText('4.5');
    await page.locator('.analysis-filters summary').click();
    await pw(page.getByLabel('Month', { exact: true })).toHaveValue('2026-07');
    await pw(button('Import & prepare')).toHaveCount(0);
    await button('Administration').click();
    await button('Data administration').click();
    await button('Files & source rows').click();
    await page.getByLabel('Imported file', { exact: true }).selectOption({ label: 'Hitliste-20260701.csv · 2026-07-01' });
    await pw(page.getByRole('table')).toBeVisible();
    for (const state of ['ascending', 'descending', 'none']) {
      await button('Sector').click();
      await pw(page.getByRole('columnheader', { name: 'Sector', exact: true })).toHaveAttribute('aria-sort', state);
    }
    await button('Import & prepare').click();
    await button('Data preparation').click();
    await button('Save historical preparation').click();
    await pw(page.getByText('Preparation saved.', { exact: false })).toBeVisible();
    await button('Data analysis').click();
    await pw(kpi).toHaveText('4.5');
    const artifactDir = join(__dirname, '../../../test-results/analytical-workspace');
    mkdirSync(artifactDir, { recursive: true });
    await page.screenshot({ path: join(artifactDir, 'desktop.png'), fullPage: true });
    for (const [width, height] of [[1024, 768], [768, 1024], [390, 844]]) {
      await page.setViewportSize({ width, height });
      await pw(kpi).toBeVisible();
      await pw.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    }
    await page.screenshot({ path: join(artifactDir, 'mobile.png'), fullPage: true });
    await button('Daily / monthly').click();
    await pw(page.locator('.analysis-plot svg').first()).toBeVisible();
    await button('Executive Overview').click();
    await page.getByLabel('Demo user', { exact: true }).selectOption('demo-b');
    await pw(page.getByRole('region', { name: 'Start page' })).toBeVisible();
    await button('Data analysis').click();
    await pw(kpi).toHaveText('4.5');
    await page.reload();
    await button('Data analysis').click();
    await pw(kpi).toHaveText('4.5');
    await page.route('**/api/v1/analytics/report', route => route.fulfill({ status: 503, contentType: 'application/problem+json', body: JSON.stringify({ code: 'persistence_unavailable' }) }));
    await button('Refresh history').click();
    await pw(page.getByRole('alert')).toBeVisible();
    await page.unroute('**/api/v1/analytics/report');
    await button('Refresh history').click();
    await pw(kpi).toHaveText('4.5');
    await page.getByLabel('Demo user', { exact: true }).focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement.tagName)).not.toBe('BODY');
    expect(errors).toEqual([]);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("historical mappings and scoped tuples preserve distinct equipment, message types and unclassified identity", async () => {
  const sourceId = "analytical-edge-source";
  const mapping = {
    organizationId: scope.organizationId,
    siteId: scope.siteId,
    sourceId,
    mappingRevision: "edge-v1",
    sectors: [
      { sectorKey: "alpha", label: "Unclassified" },
      { sectorKey: "beta", label: "Second sector" },
    ],
    areas: [
      { sourceArea: "Area A", sectorKey: "alpha" },
      { sourceArea: "Area B", sectorKey: "beta" },
    ],
  };
  const config = {
    ...runtimeConfig,
    local: {
      ...runtimeConfig.local,
      source: { ...runtimeConfig.local.source, id: sourceId },
    },
    mappings: new SourceMappings(mapping),
  };
  const first = new PlatformRuntime(runtime.pool, config);
  const header =
    "Häufigkeit;Dauer;Bereich;Betriebsmittelkennzeichen;Meldetext;Typ;Meldegruppe";
  const bytes = (rows) =>
    Buffer.from(
      "\uFEFF" + header + "\r\n" + rows.join("\r\n") + "\r\n",
      "utf16le",
    );
  const rows = [
    "1;0 0:00:01;Area A;=007;Same;01;001",
    "2;0 0:00:02;Area B;=007;Same;01;001",
    "3;0 0:00:03;Area A;=007;Same;1;001",
    "4;0 0:00:04;area a;=007;Same;01;001",
  ];
  expect(
    (await first.submit("demo-a", "Hitliste-20260901.csv", bytes(rows)))
      .outcome,
  ).toBe("succeeded");
  const second = new PlatformRuntime(runtime.pool, {
    ...config,
    mappings: new SourceMappings({
      ...mapping,
      mappingRevision: "edge-v2",
      areas: [
        { sourceArea: "Area A", sectorKey: "beta" },
        { sourceArea: "Area B", sectorKey: "beta" },
      ],
    }),
  });
  expect(
    (
      await second.submit(
        "demo-a",
        "Hitliste-20260902.csv",
        bytes(["5;0 0:00:05;Area A;=007;Same;01;001"]),
      )
    ).outcome,
  ).toBe("succeeded");
  const a = await second.queries.availability("demo-a"),
    selection = {
      revision: a.revision,
      from: "2026-09-01",
      toExclusive: "2026-09-04",
    };
  const r = await second.queries.query("demo-a", selection);
  expect(r).toMatchObject({
    recordCount: 5,
    reportedFrequency: 15,
    accumulatedAlarmSeconds: 15,
    unclassifiedCount: 1,
  });
  expect(r.groups.equipment).toHaveLength(3);
  expect(r.groups.message).toHaveLength(2);
  expect(r.groups.area.find((g) => g.label === "Area A")).toMatchObject({
    reportedFrequency: 9,
    recordCount: 3,
  });
  const unclassified = r.groups.sector.filter((g) =>
    g.label.startsWith("Unclassified"),
  );
  expect(unclassified).toHaveLength(2);
  expect(unclassified.map(g=>g.label).sort()).toEqual(["Unclassified","Unclassified (sector alpha)"]);
  expect(new Set(unclassified.map((g) => g.reference)).size).toBe(2);
  expect(
    r.records
      .filter(
        (f) => f.reportingDate === "2026-09-01" && f.sourceArea === "Area A",
      )
      .every((f) => f.sectorKey === "alpha" && f.mappingRevision === "edge-v1"),
  ).toBe(true);
  expect(r.records.find((f) => f.reportingDate === "2026-09-02")).toMatchObject(
    { sectorKey: "beta", mappingRevision: "edge-v2" },
  );
  await expect(
    runtime.queries.query("demo-a", {
      revision: (await runtime.queries.availability("demo-a")).revision,
      from: "2026-07-01",
      toExclusive: "2026-07-04",
      areas: [r.groups.area[0].reference],
    }),
  ).rejects.toThrow();
  const empty = await second.submit(
    "demo-a",
    "Hitliste-20260903.csv",
    bytes([]),
  );
  expect(empty).toMatchObject({ outcome: "rejected", admittedRecordCount: 0 });
  expect(await second.queries.availability("demo-a")).toEqual(a);
});

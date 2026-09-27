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
const { DemoRuntime } = require("../../../apps/api/dist/demo/runtime");
const { createApplication } = require("../../../apps/api/dist/application");
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
  runtime = new DemoRuntime(new Pool({ ...configs.runtime, max: 5 }), {
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

const selection = {
  from: "2026-07-01",
  toExclusive: "2026-08-01",
  dimension: "sector",
  period: "day",
  metric: "frequency",
};
test("full historical report preserves all source rows and exact duration", async () => {
  await selectUser();
  for (const date of ["20260701", "20260703"]) {
    const r = await runtime.submit(
      "demo-a",
      `Hitliste-${date}.csv`,
      fixture(`valid/Hitliste-${date}.csv`),
    );
    expect(r.outcome).toBe("succeeded");
  }
  const report = (
    await api("post", "/analytics/report").send(selection).expect(201)
  ).body;
  expect(report.totals).toMatchObject({
    records: 9,
    frequency: 19,
    seconds: 97775,
    minutes: 97775 / 60,
  });
  expect(report.timeline.map((x) => x.period)).toEqual([
    "2026-07-01",
    "2026-07-03",
  ]);
  expect(report.groups.reduce((n, x) => n + x.frequency, 0)).toBe(19);
  expect(report.records).toHaveLength(9);
  expect(report.executive).toEqual([
    {
      dimension: "area",
      metric: "duration",
      key: "Area B",
      frequency: 5,
      seconds: 97384,
      minutes: 97384 / 60,
      records: 2,
    },
    {
      dimension: "equipment",
      metric: "frequency",
      key: "=EQ-001",
      frequency: 9,
      seconds: 300,
      minutes: 5,
      records: 3,
    },
    {
      dimension: "message",
      metric: "frequency",
      key: "Jam",
      frequency: 9,
      seconds: 300,
      minutes: 5,
      records: 3,
    },
    expect.objectContaining({
      dimension: "sector",
      metric: "frequency",
      frequency: 9,
      seconds: 300,
      records: 4,
    }),
  ]);
  const tied = await runtime.reports.query("demo-a", {
    ...selection,
    toExclusive: "2026-07-02",
    filters: { equipment: ["=EQ-001", "=EQ-004"] },
  });
  expect(tied.executive.find((x) => x.dimension === "equipment").key).toBe(
    "=EQ-001",
  );
  expect(tied.executive.find((x) => x.dimension === "sector").key).toBe(
    "Nicht klassifiziert",
  );
  const paged = await runtime.reports.query("demo-a", {
    ...selection,
    page: 20,
    metric: "duration",
  });
  expect(paged.records).toEqual([]);
  expect(paged.executive).toEqual(report.executive);
  for (const dimension of [
    "area",
    "equipment",
    "message",
    "type",
    "messageGroup",
    "frequency",
    "duration",
  ]) {
    const r = await runtime.reports.query("demo-a", {
      ...selection,
      dimension,
    });
    expect(r.totals).toEqual(report.totals);
    expect(r.executive).toEqual(report.executive);
    expect(r.groups.reduce((n, x) => n + x.seconds, 0)).toBe(97775);
  }
});

test("profile edits persist, reclassify historical analysis and reject stale writers/pages", async () => {
  const before = await runtime.reports.query("demo-a", selection);
  const current = await runtime.profiles.get("demo-a");
  const profile = {
    ...current.profile,
    areaSectors: current.profile.areaSectors.map((x) => ({
      ...x,
      sector: "Updated hall",
    })),
  };
  const saved = await runtime.profiles.save("demo-a", {
    version: current.version,
    profile,
  });
  expect(await runtime.profiles.get("demo-b")).toEqual(saved);
  await expect(
    runtime.profiles.save("demo-a", { version: current.version, profile }),
  ).rejects.toMatchObject({ code: "analytics_revision_changed" });
  await expect(
    runtime.reports.query("demo-a", {
      ...selection,
      revision: before.revision,
    }),
  ).rejects.toMatchObject({ code: "analytics_revision_changed" });
  const after = await runtime.reports.query("demo-a", selection);
  expect(after.revision).not.toBe(before.revision);
  expect(after.totals).toEqual(before.totals);
  expect(after.groups.some((x) => x.key === "Updated hall")).toBe(true);
  const raw = await runtime.queries.availability("demo-a");
  expect(raw.dates).toEqual(["2026-07-01", "2026-07-03"]);
});

test("literal source filters retain commas and never interpret SQL syntax", async () => {
  const all = await runtime.reports.query("demo-a", {
    ...selection,
    dimension: "area",
  });
  const key = all.groups[0].key;
  const filtered = await runtime.reports.query("demo-a", {
    ...selection,
    dimension: "area",
    filters: { area: [key] },
  });
  expect(filtered.groups.map((x) => x.key)).toEqual([key]);
  expect(filtered.executive.find((x) => x.dimension === "area")).toMatchObject({
    key,
    frequency: filtered.totals.frequency,
    seconds: filtered.totals.seconds,
  });
  const zero = await runtime.reports.query("demo-a", {
    ...selection,
    filters: { equipment: ["=EQ-003"] },
  });
  expect(zero.totals.records).toBe(1);
  expect(zero.executive).toEqual([]);
  const empty = await runtime.reports.query("demo-a", {
    ...selection,
    filters: { equipment: ["' OR true --"] },
  });
  expect(empty.totals.records).toBe(0);
  expect(empty.groups).toEqual([]);
  expect(empty.executive).toEqual([]);
});

test("reader-only grants permit historical reports and deny preparation/import operations", async () => {
  await admin(
    "DELETE FROM users_rbac.site_role_assignments WHERE organization_id=$1 AND site_id=$2 AND user_id='demo-b' AND role_id='site-operator'",
    [scope.organizationId, scope.siteId],
  );
  const context = await selectUser("demo-b");
  expect(context.body.canImport).toBe(false);
  await api("post", "/analytics/report").send(selection).expect(201);
  await api("get", "/analytics/profile").expect(200);
  const profile = await runtime.profiles.get("demo-b");
  await api("post", "/analytics/profile").send(profile).expect(403);
  await api("get", "/imports").expect(403);
  await api("post", "/imports")
    .set("Content-Type", "application/octet-stream")
    .set("X-CSV-Filename", "Hitliste-20260705.csv")
    .send(fixture("valid/Hitliste-20260701.csv"))
    .expect(403);
});

test("the same equipment identifier can be followed across months and calendar weeks", async () => {
  expect(
    (
      await runtime.submit(
        "demo-a",
        "Hitliste-20260801.csv",
        fixture("valid/Hitliste-20260703.csv"),
      )
    ).outcome,
  ).toBe("succeeded");
  const query = {
    ...selection,
    toExclusive: "2026-09-01",
    dimension: "equipment",
    filters: { equipment: ["=EQ-001"] },
  };
  const monthly = await runtime.reports.query("demo-a", {
    ...query,
    period: "month",
  });
  expect(
    monthly.timeline.map((x) => [x.period, x.frequency, x.seconds]),
  ).toEqual([
    ["2026-07-01", 9, 300],
    ["2026-08-01", 5, 120],
  ]);
  const weekly = await runtime.reports.query("demo-a", {
    ...query,
    period: "week",
  });
  expect(weekly.timeline.map((x) => [x.period, x.frequency])).toEqual([
    ["2026-06-29", 9],
    ["2026-07-27", 5],
  ]);
  expect(weekly.totals).toEqual(monthly.totals);
});

test("owner reference files reconcile exact totals and all five sectors after runtime recreation", async () => {
  const preset = require("../../../config/reporting/hitliste-halls.json");
  const labels = [...new Set(preset.areaSectors.map((x) => x.sector))];
  const sourceId = "reference-csv";
  const config = {
    ...runtimeConfig,
    local: {
      ...runtimeConfig.local,
      source: { ...runtimeConfig.local.source, id: sourceId },
    },
    mappings: new SourceMappings({
      organizationId: scope.organizationId,
      siteId: scope.siteId,
      sourceId,
      mappingRevision: "owner-v1",
      sectors: labels.map((label, i) => ({ sectorKey: "hall-" + i, label })),
      areas: preset.areaSectors.map((x) => ({
        sourceArea: x.area,
        sectorKey: "hall-" + labels.indexOf(x.sector),
      })),
    }),
  };
  let ref = new DemoRuntime(new Pool({ ...configs.runtime, max: 2 }), config);
  try {
    for (const date of ["20260701", "20260705", "20260707"]) {
      const name = `Hitliste-${date}.csv`,
        bytes = readFileSync(
          join(
            __dirname,
            "../../../docs/product/reference-data/hitliste",
            name,
          ),
        );
      expect((await ref.submit("demo-a", name, bytes)).outcome).toBe(
        "succeeded",
      );
    }
    const profile = await ref.profiles.get("demo-a");
    await ref.profiles.save("demo-a", profile);
    await ref.close();
    ref = new DemoRuntime(new Pool({ ...configs.runtime, max: 2 }), config);
    const r = await ref.reports.query("demo-a", selection);
    expect(r.totals).toMatchObject({
      records: 1446,
      frequency: 8496,
      seconds: 1629521,
      minutes: 1629521 / 60,
    });
    expect(
      Object.fromEntries(r.groups.map((x) => [x.key, x.frequency])),
    ).toEqual({
      "Halle A T3": 663,
      "Halle B Sky": 3009,
      "Halle B Sh": 1624,
      "Halle A T2": 1616,
      "Halle A T1": 1583,
      "Nicht klassifiziert": 1,
    });
    expect(r.unclassifiedCount).toBe(1);
    const p = await ref.profiles.get("demo-a");
    expect(p.version.startsWith("default.")).toBe(false);
    const byArea = await ref.reports.query("demo-a", {
      ...selection,
      dimension: "area",
    });
    expect(byArea.groups.some((x) => x.key === "Kartonzuführung L,M,S")).toBe(
      true,
    );
    expect(byArea.groups.some((x) => x.key === "Kon.Kreuz MidiTransfer")).toBe(
      true,
    );
    const header = fixture("valid/Hitliste-20260701.csv")
      .toString("utf16le")
      .replace(/^\ufeff/, "")
      .split(/\r?\n/)[0];
    const csv =
      header +
      '\r\n"1";"0 0:00:30";"Kon.Kreuz\u00a0\u00a0MidiTransfer";"=0001+Station";"Station";"Störung";"007"\r\n';
    expect(
      (
        await ref.submit(
          "demo-a",
          "Hitliste-20260708.csv",
          Buffer.from("\ufeff" + csv, "utf16le"),
        )
      ).outcome,
    ).toBe("succeeded");
    const normalized = await ref.reports.query("demo-a", {
      ...selection,
      from: "2026-07-08",
      toExclusive: "2026-07-09",
    });
    expect(normalized.groups[0].key).toBe("Halle A T1");
    expect(normalized.records[0].equipment).toBe("=0001+Station");
    expect(normalized.records[0].message).toBe("Station");
  } finally {
    await ref.close();
  }
});

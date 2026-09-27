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

test("relational catalogs preserve exact facts and enforce sector/equipment foreign keys and runtime immutability", async () => {
  const totals = (
    await admin(
      "SELECT count(*)::integer AS rows,sum(haufigkeit)::text AS frequency,sum(dauer_sekunden)::text AS seconds FROM analytics.fact_hitliste",
    )
  ).rows[0];
  expect(totals).toEqual({ rows: 9, frequency: "19", seconds: "97775" });
  const sectors = (
    await admin(
      "SELECT name,is_unclassified FROM analytics.sektor ORDER BY name",
    )
  ).rows;
  expect(sectors).toEqual([
    { name: "Dispatch", is_unclassified: false },
    { name: "Nicht klassifiziert", is_unclassified: true },
    { name: "Preparation", is_unclassified: false },
  ]);
  expect(
    (await admin("SELECT count(*)::integer AS n FROM analytics.betriebsmittel"))
      .rows[0].n,
  ).toBe(5);
  const joined = (
    await admin(`SELECT b.name,e.kennzeichen,s.name AS sektor FROM analytics.fact_hitliste f
    JOIN analytics.bereich b USING(organization_id,site_id,source_id)
    JOIN analytics.betriebsmittel e ON e.id=f.betriebsmittel_id AND e.organization_id=f.organization_id AND e.site_id=f.site_id AND e.source_id=f.source_id
    JOIN analytics.sektor s ON s.id=f.sektor_id AND s.organization_id=f.organization_id AND s.site_id=f.site_id AND s.source_id=f.source_id
    WHERE b.id=f.bereich_id AND e.kennzeichen='=EQ-001'`)
  ).rows;
  expect(joined).toHaveLength(3);
  expect(
    joined.every((x) => x.name === "Area A" && x.sektor === "Preparation"),
  ).toBe(true);
  const client = new Client(configs.runtime);
  await client.connect();
  const scoped = async (sql, values = []) => {
    await client.query("BEGIN");
    try {
      await client.query(
        "SELECT set_config('iop.organization_id',$1,true),set_config('iop.site_id',$2,true),set_config('iop.user_id','demo-a',true)",
        [scope.organizationId, scope.siteId],
      );
      return await client.query(sql, values);
    } finally {
      await client.query("ROLLBACK");
    }
  };
  try {
    for (const table of [
      "sektor",
      "bereich",
      "betriebsmittel",
      "meldetext",
      "meldung_typ",
      "meldegruppe",
      "fact_hitliste",
    ]) {
      expect(
        (await client.query(`SELECT * FROM analytics.${table}`)).rows,
      ).toEqual([]);
      await expect(
        scoped(`DELETE FROM analytics.${table}`),
      ).rejects.toMatchObject({ code: "42501" });
    }
    await expect(
      scoped("UPDATE analytics.fact_hitliste SET haufigkeit=0"),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      scoped("UPDATE analytics.fact_hitliste SET sektor_id=NULL"),
    ).rejects.toMatchObject({ code: "23502" });
    await expect(
      scoped("UPDATE analytics.fact_hitliste SET sektor_id=repeat('0',64)"),
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      scoped(
        `UPDATE analytics.fact_hitliste SET bereich_id=(SELECT id FROM analytics.bereich WHERE name='Area B') WHERE betriebsmittel_id=(SELECT id FROM analytics.betriebsmittel WHERE kennzeichen='=EQ-001')`,
      ),
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      scoped(
        `INSERT INTO analytics.sektor(organization_id,site_id,source_id,id,name,is_unclassified) VALUES('foreign',$1,$2,repeat('0',64),'Foreign',false)`,
        [scope.siteId, scope.sourceId],
      ),
    ).rejects.toMatchObject({ code: "42501" });
  } finally {
    await client.end();
  }
});

test("incomplete and stale projections fail closed and administrator startup backfills existing history", async () => {
  const original = (
    await admin(
      "SELECT jsonb_agg(to_jsonb(f) ORDER BY import_id,source_record_number) AS data FROM oip.facts f",
    )
  ).rows[0].data;
  await admin(
    "DELETE FROM analytics.fact_hitliste WHERE (import_id,source_record_number) IN (SELECT import_id,source_record_number FROM analytics.fact_hitliste LIMIT 1)",
  );
  await api("post", "/analytics/report")
    .send(selection)
    .expect(503)
    .expect((r) =>
      expect(r.body.code).toBe("analytics_projection_unavailable"),
    );
  await app.close();
  await runtime.close();
  runtime = new PlatformRuntime(
    new Pool({ ...configs.runtime, max: 5 }),
    runtimeConfig,
  );
  await runtime.start();
  app = await createApplication(runtime);
  await app.init();
  await selectUser();
  const report = await runtime.reports.query("demo-a", selection);
  expect(report.totals.records).toBe(9);
  await admin("UPDATE analytics.fact_hitliste SET profile_version='stale'");
  await expect(
    runtime.reports.query("demo-a", selection),
  ).rejects.toMatchObject({ code: "analytics_projection_unavailable" });
  const profile = await runtime.profiles.get("demo-a");
  await runtime.profiles.save("demo-a", profile);
  expect((await runtime.reports.query("demo-a", selection)).totals).toEqual(
    report.totals,
  );
  expect(
    (
      await admin(
        "SELECT jsonb_agg(to_jsonb(f) ORDER BY import_id,source_record_number) AS data FROM oip.facts f",
      )
    ).rows[0].data,
  ).toEqual(original);
});

test("projection failures roll back import publication and profile reclassification together", async () => {
  const before = await runtime.reports.query("demo-a", selection);
  const profile = await runtime.profiles.get("demo-a");
  await admin(
    "CREATE FUNCTION public.test_projection_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic projection failure'; END $$",
  );
  await admin(
    "CREATE TRIGGER test_projection_failure AFTER INSERT OR UPDATE ON analytics.fact_hitliste FOR EACH ROW EXECUTE FUNCTION public.test_projection_failure()",
  );
  try {
    await expect(
      runtime.profiles.save("demo-a", {
        version: profile.version,
        profile: {
          ...profile.profile,
          areaSectors: profile.profile.areaSectors.map((x) => ({
            ...x,
            sector: "Must roll back",
          })),
        },
      }),
    ).rejects.toThrow();
    expect(await runtime.profiles.get("demo-a")).toEqual(profile);
    const result = await runtime.submit(
      "demo-a",
      "Hitliste-20260702.csv",
      fixture("valid/Hitliste-20260703.csv"),
    );
    expect(result.outcome).not.toBe("succeeded");
    expect(
      (
        await admin(
          "SELECT count(*)::integer AS n FROM oip.publications WHERE reporting_date='2026-07-02'",
        )
      ).rows[0].n,
    ).toBe(0);
    expect(
      (
        await admin(
          "SELECT count(*)::integer AS n FROM integrations.import_date_claims WHERE reporting_date='2026-07-02'",
        )
      ).rows[0].n,
    ).toBe(0);
    expect(
      (
        await admin(
          "SELECT count(*)::integer AS n FROM analytics.sektor WHERE name='Must roll back'",
        )
      ).rows[0].n,
    ).toBe(0);
    expect((await runtime.reports.query("demo-a", selection)).totals).toEqual(
      before.totals,
    );
  } finally {
    await admin(
      "DROP TRIGGER test_projection_failure ON analytics.fact_hitliste",
    );
    await admin("DROP FUNCTION public.test_projection_failure()");
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
  let ref = new PlatformRuntime(new Pool({ ...configs.runtime, max: 2 }), config);
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
    ref = new PlatformRuntime(new Pool({ ...configs.runtime, max: 2 }), config);
    const r = await ref.reports.query("demo-a", selection);
    expect(r.totals).toMatchObject({
      records: 1420,
      frequency: 8272,
      seconds: 1422439,
      minutes: 1422439 / 60,
    });
    expect(
      Object.fromEntries(r.groups.map((x) => [x.key, x.frequency])),
    ).toEqual({
      "Halle A T3": 663,
      "Halle B Sky": 3009,
      "Halle B Sh": 1607,
      "Halle A T2": 1441,
      "Halle A T1": 1551,
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

test("concurrent preparation and import keep every relational fact on the committed profile and preserve code/area pairs", async () => {
  const sourceId = "concurrent-relational";
  const ref = new PlatformRuntime(new Pool({ ...configs.runtime, max: 4 }), {
    ...runtimeConfig,
    local: {
      ...runtimeConfig.local,
      source: { ...runtimeConfig.local.source, id: sourceId },
    },
    mappings: new SourceMappings({
      ...runtimeConfig.mappings.configuration,
      sourceId,
    }),
  });
  try {
    const current = await ref.profiles.get("demo-a");
    const header = fixture("valid/Hitliste-20260701.csv")
      .toString("utf16le")
      .replace(/^\ufeff/, "")
      .split(/\r?\n/)[0];
    const bytes = Buffer.from(
      "\ufeff" +
        header +
        '\r\n"3";"0 0:01:00";"Area A";"=SHARED";"Jam";"X";"001"\r\n"2";"0 0:00:30";"Area B";"=SHARED";"Jam";"X";"001"\r\n',
      "utf16le",
    );
    const revised = {
      ...current.profile,
      areaSectors: current.profile.areaSectors.map((x) => ({
        ...x,
        sector: "Concurrent hall",
      })),
    };
    const [imported, saved] = await Promise.all([
      ref.submit("demo-a", "Hitliste-20260901.csv", bytes),
      ref.profiles.save("demo-a", {
        version: current.version,
        profile: revised,
      }),
    ]);
    expect(imported.outcome).toBe("succeeded");
    const q = { ...selection, from: "2026-09-01", toExclusive: "2026-09-02" };
    const report = await ref.reports.query("demo-a", q);
    expect(report.profileVersion).toBe(saved.version);
    expect(report.groups).toEqual([
      {
        key: "Concurrent hall",
        frequency: 5,
        seconds: 90,
        minutes: 1.5,
        records: 2,
      },
    ]);
    expect(
      (
        await admin(
          "SELECT count(*)::integer AS n FROM analytics.betriebsmittel WHERE source_id=$1",
          [sourceId],
        )
      ).rows[0].n,
    ).toBe(2);
    expect(
      (await ref.reports.query("demo-a", { ...q, dimension: "equipment" }))
        .groups,
    ).toHaveLength(1);
    const writers = await Promise.allSettled([
      ref.profiles.save("demo-a", saved),
      ref.profiles.save("demo-a", saved),
    ]);
    expect(writers.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    expect(writers.find((x) => x.status === "rejected").reason).toMatchObject({
      code: "analytics_revision_changed",
    });
    expect((await ref.reports.query("demo-a", q)).totals).toEqual(
      report.totals,
    );
    const latest = await ref.profiles.get("demo-a");
    await ref.profiles.save("demo-a", {
      version: latest.version,
      profile: {
        ...latest.profile,
        areaSectors: latest.profile.areaSectors.map((x) => ({
          ...x,
          area: x.area === "Area A" ? "Area A, corrected" : x.area,
        })),
        aliases: [
          { field: "area", from: "Area A", to: "Area A, corrected" },
          { field: "equipment", from: "=SHARED", to: "=CORRECTED" },
        ],
      },
    });
    const corrected = await ref.reports.query("demo-a", {
      ...q,
      dimension: "equipment",
    });
    expect(corrected.groups[0].key).toBe("=CORRECTED");
    expect(corrected.totals).toEqual(report.totals);
    expect(corrected.records.map((x) => x.area).sort()).toEqual([
      "Area A, corrected",
      "Area B",
    ]);
    expect(
      (
        await admin(
          "SELECT count(*)::integer AS n FROM oip.facts WHERE source_id=$1 AND payload->>'sourceEquipmentReference'='=SHARED'",
          [sourceId],
        )
      ).rows[0].n,
    ).toBe(2);
  } finally {
    await ref.close();
  }
});

test("monthly Meldetext KPIs persist in configured order, use scoped history and honor explicit goals", async () => {
  const current = await runtime.profiles.get("demo-a");
  const definitions = [
    { id: "z-jam", label: "Jam frequency", message: "Jam", metric: "frequency", goal: null },
    { id: "a-duration", label: "Jam duration", message: "Jam", metric: "duration", goal: 2 },
    { id: "b-zero", label: "Zero goal", message: "Jam", metric: "frequency", goal: 0 },
    { id: "c-absent", label: "No matching error", message: "Absent, error", metric: "frequency", goal: null },
  ];
  const saved = await runtime.profiles.save("demo-a", {
    version: current.version, profile: { ...current.profile, executiveKpis: definitions },
  });
  expect((await runtime.profiles.get("demo-b")).profile.executiveKpis).toEqual(definitions);
  const query = { ...selection, executive: true, dimension: "area" };
  const july = await runtime.reports.query("demo-a", query);
  expect(july.monthlyExecutive).toMatchObject({ month: "2026-07", importedDays: 2, calendarDays: 31, historicalDays: 3 });
  const kpis = july.monthlyExecutive.kpis;
  expect(kpis.map(x => x.id)).toEqual(definitions.map(x => x.id));
  expect(kpis[0]).toMatchObject({ total: 9, average: 4.5, historicalAverage: 14 / 3, referenceKind: "historical", status: "better" });
  expect(kpis[1]).toMatchObject({ total: 5, average: 2.5, historicalAverage: 7 / 3, reference: 2, status: "worse", changePercent: 25 });
  expect(kpis[2]).toMatchObject({ reference: 0, status: "worse", changePercent: null });
  expect(kpis[3]).toMatchObject({ average: 0, historicalAverage: 0, status: "equal", changePercent: null });
  expect(july.groups.map(x => x.frequency)).toEqual(july.groups.map(x => x.frequency).sort((a,b) => b-a));
  expect(new Set(july.series.map(x => x.key))).toEqual(new Set(july.groups.map(x => x.key)));
  const august = await runtime.reports.query("demo-a", { ...query, from: "2026-08-01", toExclusive: "2026-09-01" });
  expect(august.monthlyExecutive.kpis[0]).toMatchObject({ total: 5, average: 5, historicalAverage: 14 / 3, status: "worse" });
  const absent = await runtime.reports.query("demo-a", { ...query, from: "2026-06-01", toExclusive: "2026-07-01" });
  expect(absent.monthlyExecutive).toMatchObject({ importedDays: 0, calendarDays: 30, historicalDays: 3 });
  expect(absent.monthlyExecutive.kpis.every(x => x.average === null && x.status === "unavailable")).toBe(true);
  await expect(runtime.profiles.save("demo-a", current)).rejects.toMatchObject({ code: "analytics_revision_changed" });
  await expect(runtime.reports.query("demo-b", { ...query, filters: { area: ["Area A"] } })).rejects.toMatchObject({ code: "invalid_selection" });
  // A legacy saved profile inherits source-scoped defaults without losing its normalization rules.
  await admin("UPDATE oip.reporting_profiles SET config=config-'executiveKpis' WHERE organization_id=$1 AND site_id=$2 AND source_id=$3", [scope.organizationId,scope.siteId,scope.sourceId]);
  const legacy = await runtime.profiles.get("demo-a");
  expect(legacy.profile.areaSectors).toEqual(saved.profile.areaSectors);
  expect(legacy.profile.executiveKpis).toHaveLength(4);
  expect((await runtime.reports.query("demo-a", query)).monthlyExecutive.kpis.map(x => x.message)).toEqual(legacy.profile.executiveKpis.map(x => x.message));
});

test("administrator file rows sort across pages and catalog choices include every current scoped message", async () => {
  const sourceId="explorer-pagination";
  const ref=new PlatformRuntime(new Pool({...configs.runtime,max:3}),{
    ...runtimeConfig,local:{...runtimeConfig.local,source:{...runtimeConfig.local.source,id:sourceId}},
    mappings:new SourceMappings({...runtimeConfig.mappings.configuration,sourceId}),
  });
  try {
    const header=fixture("valid/Hitliste-20260701.csv").toString("utf16le").replace(/^\ufeff/,"").split(/\r?\n/)[0];
    const lines=Array.from({length:235},(_,i)=>`"1";"0 0:00:30";"Area ${i%2?'B':'A'}";"=EQ-${String(i).padStart(3,'0')}";"Müll, ${String(i).padStart(3,'0')}";"Störung";"007"`);
    const submitted=await ref.submit("demo-a","Hitliste-20260901.csv",Buffer.from("\ufeff"+header+"\r\n"+lines.join("\r\n")+"\r\n","utf16le"));
    expect(submitted.outcome).toBe("succeeded");
    const q={importId:submitted.importId,page:1,sort:[]};
    const natural=await ref.explorer.sourceRows("demo-a",q);
    expect(natural.recordCount).toBe(235);expect(natural.pageCount).toBe(5);
    expect(natural.totalRecordCount).toBe(235);
    expect(natural.options.message).toHaveLength(200);
    expect(natural.options.minutes).toEqual(["0.50"]);
    const specific = await ref.explorer.sourceRows("demo-a", {...q, filters: {
      sector: natural.records[0].sector, area: "Area A", equipment: "=EQ-234", message: "Müll, 234",
      type: "Störung", messageGroup: "007", frequency: "1", minutes: "0.5", line: "236",
    }});
    expect(specific).toMatchObject({recordCount: 1, totalRecordCount: 235, pageCount: 1});
    expect(specific.records[0]).toMatchObject({line: 236, equipment: "=EQ-234"});
    expect(specific.options.sector).toEqual(natural.options.sector);
    expect(specific.options.area).toEqual(["Area A"]);
    expect(specific.options.equipment).toHaveLength(118);
    expect(specific.options.equipment).not.toContain("=EQ-233");
    expect(specific.options.message).toEqual(["Müll, 234"]);
    expect(specific.options.line).toEqual(["236"]);
    expect(specific.options.minutes).toEqual(["0.50"]);
    const sectorChoices = await ref.explorer.sourceRows("demo-a", {...q, filters: {sector:"Preparation"}});
    expect(sectorChoices.options.area).toEqual(["Area A"]);
    expect(sectorChoices.options.equipment).toHaveLength(118);
    expect(sectorChoices.options.message).toHaveLength(118);
    const otherSector = await ref.explorer.sourceRows("demo-a", {...q, filters: {sector:"Dispatch"}});
    expect(otherSector.options.area).toEqual(["Area B"]);
    expect(otherSector.options.equipment).not.toContain("=EQ-234");
    const invalidPair = await ref.explorer.sourceRows("demo-a", {...q, filters: {sector:"Preparation",area:"Area B"}});
    expect(invalidPair.recordCount).toBe(0);
    expect(invalidPair.options.area).toEqual(["Area A"]);
    expect(invalidPair.options.equipment ?? []).toEqual([]);

    const areaPage = await ref.explorer.sourceRows("demo-a", {...q, page: 3, filters: {area: "Area A"}});
    expect(areaPage).toMatchObject({recordCount: 118, totalRecordCount: 235, pageCount: 3});
    expect(areaPage.records).toHaveLength(18);
    expect(areaPage.records.every(x => x.area === "Area A")).toBe(true);
    for (const filters of [{area:"Area A", equipment:"=EQ-233"}, {message:"%' OR 1=1 --"}, {minutes:"0.51"}]) {
      const empty = await ref.explorer.sourceRows("demo-a", {...q, filters});
      expect(empty).toMatchObject({recordCount:0,totalRecordCount:235,pageCount:0,records:[]});
    }

    expect(natural.records.map(x=>x.line)).toEqual(Array.from({length:50},(_,i)=>i+2));
    const sort=[{field:"area",direction:"asc"},{field:"equipment",direction:"desc"}];
    const all=[];
    for(let page=1;page<=5;page++)all.push(...(await ref.explorer.sourceRows("demo-a",{...q,page,sort,revision:natural.revision})).records);
    const expected=Array.from({length:235},(_,i)=>({area:`Area ${i%2?'B':'A'}`,equipment:`=EQ-${String(i).padStart(3,'0')}`,line:i+2})).sort((a,b)=>a.area.localeCompare(b.area)||b.equipment.localeCompare(a.equipment));
    expect(all.map(x=>({area:x.area,equipment:x.equipment,line:x.line}))).toEqual(expected);
    for(const field of ["sector","area","equipment","message","type","messageGroup"]){
      const ascending=await ref.explorer.sourceRows("demo-a",{...q,sort:[{field,direction:"asc"}]});
      const descending=await ref.explorer.sourceRows("demo-a",{...q,sort:[{field,direction:"desc"}]});
      const ordered=(rows,sign)=>rows.every((x,i)=>i===0||sign*Buffer.compare(Buffer.from(rows[i-1][field]),Buffer.from(x[field]))<=0);
      expect(ordered(ascending.records,1)).toBe(true);expect(ordered(descending.records,-1)).toBe(true);
    }
    const first=await ref.explorer.messages("demo-a",{});
    expect(first.values).toHaveLength(200);expect(first.nextCursor).toBe(first.values.at(-1));
    const second=await ref.explorer.messages("demo-a",{after:first.nextCursor});
    expect(second.values).toHaveLength(35);expect(second.nextCursor).toBeNull();
    expect(new Set([...first.values,...second.values]).size).toBe(235);
    expect((await runtime.explorer.messages("demo-a",{})).values.some(x=>x.startsWith("Müll, "))).toBe(false);
    await expect(runtime.explorer.sourceRows("demo-a",q)).rejects.toMatchObject({code:"unavailable_reference"});
    await expect(ref.explorer.sourceRows("demo-b",q)).rejects.toThrow();
    const current=await ref.profiles.get("demo-a");await ref.profiles.save("demo-a",current);
    await expect(ref.explorer.sourceRows("demo-a",{...q,page:2,revision:natural.revision})).rejects.toMatchObject({code:"analytics_revision_changed"});
    await selectUser("demo-b");
    await api("post","/analytics/source-rows").send(q).expect(403);
    await api("post","/analytics/messages").send({}).expect(201);
  } finally {await ref.close();}
});

test("Sunday analysis exclusion preserves original files and excludes measures and denominators across analytical reads", async () => {
  const sourceId = "analysis-calendar";
  const ref = new PlatformRuntime(new Pool({ ...configs.runtime, max: 3 }), {
    ...runtimeConfig,
    local: { ...runtimeConfig.local, source: { ...runtimeConfig.local.source, id: sourceId } },
    mappings: new SourceMappings({ ...runtimeConfig.mappings.configuration, sourceId }),
  });
  const header = "Häufigkeit;Dauer;Bereich;Betriebsmittelkennzeichen;Meldetext;Typ;Meldegruppe";
  const bytes = (frequency, message) => Buffer.from("\ufeff" + header + `\r\n${frequency};0 0:01:00;Area A;=007;${message};01;001\r\n`, "utf16le");
  let sundayId;
  try {
    for (const [date, frequency, message] of [["20260704", 6, "Jam"], ["20260705", 999, "Sunday only"], ["20260706", 0, "Jam"], ["20260801", 9, "Jam"], ["20260802", 999, "Jam"], ["20260906", 999, "Sunday only"]]) {
      const result = await ref.submit("demo-a", `Hitliste-${date}.csv`, bytes(frequency, message));
      expect(result.outcome).toBe("succeeded");
      if (date === "20260705") sundayId = result.importId;
    }
    const current = await ref.profiles.get("demo-a");
    await ref.profiles.save("demo-a", { ...current, profile: { ...current.profile, executiveKpis: [
      { id: "jam", label: "Jam", message: "Jam", metric: "frequency", goal: null },
      { id: "duration", label: "Jam minutes", message: "Jam", metric: "duration", goal: 0.5 },
    ] } });
    const july = await ref.reports.query("demo-a", { ...selection, executive: true, dimension: "area" });
    expect(july.excludedWeekdays).toEqual([7]);
    expect(july.totals).toMatchObject({ records: 2, frequency: 6, seconds: 120, minutes: 2 });
    expect(july.dates).toEqual(["2026-07-04", "2026-07-06", "2026-08-01"]);
    expect(july.timeline.map(x => [x.period, x.frequency])).toEqual([["2026-07-04", 6], ["2026-07-06", 0]]);
    expect(july.options.message).toEqual(["Jam"]);
    expect(july.monthlyExecutive).toMatchObject({ importedDays: 2, calendarDays: 31, analysisDays: 27, historicalDays: 3 });
    expect(july.monthlyExecutive.kpis[0]).toMatchObject({ total: 6, average: 3, historicalAverage: 5, reference: 5, status: "better", changePercent: -40 });
    expect(july.monthlyExecutive.kpis[1]).toMatchObject({ total: 2, average: 1, historicalAverage: 1, reference: 0.5, status: "worse" });
    for (const period of ["day", "week", "month"]) {
      const report = await ref.reports.query("demo-a", { ...selection, period });
      expect(report.totals).toEqual(july.totals);
      expect(report.series.reduce((n, x) => n + x.frequency, 0)).toBe(6);
      expect(report.monthly.reduce((n, x) => n + x.frequency, 0)).toBe(6);
    }
    const september = await ref.reports.query("demo-a", { ...selection, executive: true, dimension: "area", from: "2026-09-01", toExclusive: "2026-10-01" });
    expect(september.totals.records).toBe(0);
    expect(september.monthlyExecutive).toMatchObject({ importedDays: 0, analysisDays: 26 });
    expect(september.monthlyExecutive.kpis[0]).toMatchObject({ total: 0, average: null, historicalAverage: 5, status: "unavailable" });
    const availability = await ref.queries.availability("demo-a");
    expect(availability.dates).toEqual(july.dates);
    const legacy = await ref.queries.query("demo-a", { revision: availability.revision, from: "2026-07-01", toExclusive: "2026-08-01" });
    expect(legacy).toMatchObject({ recordCount: 2, reportedFrequency: 6, accumulatedAlarmSeconds: 120 });
    expect(legacy.missingDates).toHaveLength(25);
    expect(legacy.missingDates.every(date => new Date(date + "T00:00:00Z").getUTCDay() !== 0)).toBe(true);
    const options = await ref.queries.options("demo-a", { revision: availability.revision, kind: "message" });
    expect(options.options).toHaveLength(1);
    expect(options.options[0].label).toContain("Jam");
    const rows = await ref.explorer.sourceRows("demo-a", { importId: sundayId, page: 1, sort: [] });
    expect(rows.recordCount).toBe(1);
    expect(rows.records[0]).toMatchObject({ date: "2026-07-05", message: "Sunday only", frequency: 999 });
    expect((await ref.explorer.messages("demo-a", {})).values).toContain("Sunday only");
    const retained = await admin("SELECT original_bytes FROM integrations.import_batches WHERE import_id=$1", [sundayId]);
    expect(retained.rows[0].original_bytes).toEqual(bytes(999, "Sunday only"));
    expect((await admin("SELECT count(*)::integer AS n FROM analytics.fact_hitliste WHERE source_id=$1", [sourceId])).rows[0].n).toBe(6);
    // A skipped date must still have a complete, current relational projection.
    await admin("DELETE FROM analytics.fact_hitliste WHERE import_id=$1", [sundayId]);
    await expect(ref.reports.query("demo-a", selection)).rejects.toMatchObject({ code: "analytics_projection_unavailable" });
  } finally {
    await ref.close();
  }
});

test("nonconsecutive months constrain all report measures before aggregation and pagination", async () => {
  const sourceId = "month-comparison";
  const ref = new PlatformRuntime(new Pool({ ...configs.runtime, max: 3 }), {
    ...runtimeConfig,
    local: { ...runtimeConfig.local, source: { ...runtimeConfig.local.source, id: sourceId } },
    mappings: new SourceMappings({ ...runtimeConfig.mappings.configuration, sourceId }),
  });
  const header = "Häufigkeit;Dauer;Bereich;Betriebsmittelkennzeichen;Meldetext;Typ;Meldegruppe";
  const bytes = (frequency) => Buffer.from("\ufeff" + header + `\r\n${frequency};0 0:01:00;Area A;=007;Jam;01;001\r\n`, "utf16le");
  try {
    for (const [date, frequency] of [["20260501", 5], ["20260601", 900], ["20260701", 7], ["20260705", 999]]) {
      expect((await ref.submit("demo-a", `Hitliste-${date}.csv`, bytes(frequency))).outcome).toBe("succeeded");
    }
    const query = { ...selection, from: "2026-05-01", months: ["2026-05", "2026-07"] };
    const report = await ref.reports.query("demo-a", query);
    expect(report.totals).toMatchObject({ frequency: 12, seconds: 120, records: 2 });
    expect(report.groups.reduce((n, row) => n + row.frequency, 0)).toBe(12);
    expect(report.durationGroups.reduce((n, row) => n + row.seconds, 0)).toBe(120);
    expect(report.monthly.map(row => row.period)).toEqual(["2026-05", "2026-07"]);
    expect(report.timeline.map(row => row.period)).toEqual(["2026-05-01", "2026-07-01"]);
    expect(report.series.reduce((n, row) => n + row.frequency, 0)).toBe(12);
    expect(report.records.map(row => row.date)).toEqual(["2026-05-01", "2026-07-01"]);
    expect(report.executive.find(row => row.dimension === "sector").frequency).toBe(12);
    expect(report.recordCount).toBe(2);
    expect((await ref.reports.query("demo-a", { ...query, page: 2, revision: report.revision })).totals).toEqual(report.totals);
    const filtered = await ref.reports.query("demo-a", { ...query, filters: { message: ["Missing"] } });
    expect(filtered.totals.records).toBe(0);
    const all = await ref.reports.query("demo-a", { ...query, months: undefined });
    expect(all.totals.frequency).toBe(912);
  } finally {
    await ref.close();
  }
});

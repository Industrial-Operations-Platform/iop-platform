const {
  PostgreSqlContainer
} = require("@testcontainers/postgresql");
const {
  Client,
  Pool
} = require("pg");
const {
  randomUUID
} = require("node:crypto");
const {
    provision
  } = require("../dist/provision"),
  {
    migrate
  } = require("../dist/migrate"),
  {
    provisioningConfiguration
  } = require("../dist/configuration"),
  {
    seedOrganization
  } = require("../dist/seed-organization"),
  {
    seedSite
  } = require("../dist/seed-site"),
  {
    seedUser
  } = require("../dist/seed-user"),
  {
    seedMembership
  } = require("../dist/seed-membership");
const {
    PlatformRuntime
  } = require("../../../apps/api/dist/host/runtime"),
  {
    composeAssetDomain
  } = require("../../../apps/api/dist/host/asset-domain-composition"),
  {
    siteRoles
  } = require("../../../apps/api/dist/modules/users-rbac/domain/profiles"),
  {
    SourceMappings
  } = require("../../../apps/api/dist/modules/integrations"),
  {
    emptyEnrichment
  } = require("../../../apps/api/dist/modules/assets/domain/enrichment"),
  {
    PgReportingProfiles
  } = require("../../../apps/api/dist/modules/oip/adapters/postgres/reporting-profiles"),
  {
    hitlisteReportingProfile
  } = require("../../../apps/api/dist/host/adapters/hitliste-reporting-profile"),
  {
    OipReceiver
  } = require("../../../apps/api/dist/modules/oip/adapters/postgres/receiver"),
  {
    createImportWorkflow
  } = require("../../../apps/api/dist/host/adapters/import-gateway"),
  {
    SiteAccessDeniedError
  } = require("../../../apps/api/dist/persistence/site-operation");
let container,
  configs,
  pool,
  runtime,
  composition,
  app,
  imports,
  assets = {},
  seedEnv;
const scope = {
  organizationId: "asset-model-org",
  siteId: "asset-model-site"
};
async function db(role, work) {
  const client = new Client(configs[role]);
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}
const admin = (sql, values) => db("bootstrap", c => c.query(sql, values));
const save = (key, typeId, patch = {}) => ({
  assetId: assets[key].id,
  expectedRevision: 0,
  reason: "Synthetic reusable asset structure.",
  data: {
    ...emptyEnrichment(),
    typeId,
    ...patch
  }
});
async function publish(day) {
  const csv = '"Häufigkeit";"Dauer";"Bereich";"Betriebsmittelkennzeichen";"Meldetext";"Typ";"Meldegruppe"\r\n10;0 0:01:00;Demo area;SOURCE-S1;Jam;01;007\r\n30;0 0:02:00;Demo area;UNKNOWN-SOURCE;Fault;01;007\r\n';
  return imports.submit("admin", "Hitliste-" + day + ".csv", Buffer.from("\ufeff" + csv, "utf16le"));
}
beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:17.6-bookworm").withDatabase("iop_local").withUsername("iop_bootstrap").withPassword("synthetic-bootstrap-password").start();
  seedEnv = {
    IOP_DATABASE_MODE: "local",
    IOP_DATABASE_HOST: container.getHost(),
    IOP_DATABASE_PORT: String(container.getPort()),
    IOP_DATABASE_NAME: "iop_local",
    IOP_POSTGRES_PASSWORD: "synthetic-bootstrap-password",
    IOP_MIGRATOR_PASSWORD: "synthetic-migrator-password",
    IOP_RUNTIME_PASSWORD: "synthetic-runtime-password"
  };
  configs = provisioningConfiguration(seedEnv);
  await provision(configs);
  await migrate(configs.migrator);
  for (const [organizationId, siteId, users] of [[scope.organizationId, scope.siteId, [["admin", "administrator"], ["leader", "team-leader"], ["task", "task-force"], ["tech", "technician"]]], ["other-org", "other-site", [["foreign", "team-leader"]]]]) {
    const seed = {
      ...seedEnv,
      IOP_SEED_ORGANIZATION_ID: organizationId,
      IOP_SEED_ORGANIZATION_NAME: "Fictional asset model organization",
      IOP_SEED_SITE_ID: siteId,
      IOP_SEED_SITE_NAME: "Fictional site",
      IOP_SEED_SITE_TIME_ZONE: "UTC"
    };
    await seedOrganization(seed);
    await seedSite(seed);
    for (const [id, profile] of users) {
      await seedUser({
        ...seed,
        IOP_SEED_USER_ID: id
      });
      await seedMembership({
        ...seed,
        IOP_SEED_USER_ID: id
      });
      await admin("INSERT INTO users_rbac.profiles(organization_id,user_id,site_id,display_name,profile) VALUES($1,$2,$3,$2,$4)", [organizationId, id, siteId, profile]);
      await admin("DELETE FROM users_rbac.site_role_assignments WHERE organization_id=$1 AND site_id=$2 AND user_id=$3", [organizationId, siteId, id]);
      for (const role of siteRoles(profile)) await admin("INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active) VALUES($1,$2,$3,$4,true)", [organizationId, id, siteId, role]);
    }
  }
  pool = new Pool({
    ...configs.runtime,
    max: 5
  });
  const mappings = new SourceMappings({
    ...scope,
    sourceId: "model-source",
    mappingRevision: "synthetic-model-v1",
    sectors: [{
      sectorKey: "demo",
      label: "Demo sector"
    }],
    areas: [{
      sourceArea: "Demo area",
      sectorKey: "demo"
    }]
  });
  runtime = new PlatformRuntime(pool, {
    local: {
      organization: {
        id: scope.organizationId
      },
      site: {
        id: scope.siteId,
        organizationId: scope.organizationId,
        timeZone: "UTC"
      },
      source: {
        id: "model-source",
        siteId: scope.siteId,
        organizationId: scope.organizationId
      }
    },
    users: [{
      id: "admin",
      name: "Administrator"
    }],
    origins: [],
    mappings,
    handover: {
      ...scope,
      locations: [{
        id: "department",
        label: "Demo sector",
        parentId: "",
        role: "department",
        sectorKey: "Demo sector"
      }, {
        id: "area",
        label: "Demo area",
        parentId: "department",
        role: "area",
        sectorKey: ""
      }],
      categories: [{
        id: "problem",
        label: "Problems"
      }],
      externalSystemLabel: "External reference"
    }
  });
  composition = composeAssetDomain(pool, runtime.source);
  app = composition.domain;
  const profiles = new PgReportingProfiles(pool, runtime.source, hitlisteReportingProfile(mappings.configuration));
  imports = createImportWorkflow(runtime.batches, new OipReceiver(runtime.source, async (tx, id) => {
    await profiles.project(tx, id);
    await composition.published(tx, id);
  }), mappings, runtime.source);
  for (const [key, code] of [["conveyor", "DEMO-CONVEYOR"], ["sensor", "DEMO-SENSOR"], ["motor", "DEMO-MOTOR"], ["controller", "DEMO-PLC"], ["second", "DEMO-CONVEYOR-2"]]) assets[key] = await runtime.assets.save("leader", {
    key: randomUUID(),
    id: "",
    expectedRevision: 0,
    note: "",
    content: {
      code,
      name: code,
      type: "Synthetic",
      locationId: "area",
      status: "validated",
      validationNote: "Synthetic fixture review only",
      description: "Fictional structure; no physical survey claim",
      aliases: []
    }
  });
}, 120000);
afterAll(async () => {
  if (pool) await pool.end();
  if (container) await container.stop();
});
test("configurable model, cycle/controller rules and survey revisions are durable and scoped", async () => {
  const context = await app.catalog("leader"),
    types = context.catalog.types;
  types.find(t => t.id === "sensor").fields = [{
    key: "voltage",
    label: "Voltage",
    kind: "number",
    required: false,
    unit: "V"
  }];
  await app.configure("leader", {
    expectedRevision: 0,
    types
  });
  await app.save("admin", save("conveyor", "conveyor"));
  await app.save("leader", save("second", "conveyor"));
  await app.save("task", save("controller", "controller"));
  const sensor = await app.save("task", save("sensor", "sensor", {
    parentId: assets.conveyor.id,
    controllers: [{
      kind: "controlled-by",
      targetId: assets.controller.id,
      channel: "DI-1"
    }],
    manufacturer: "Fictional Maker",
    model: "Model X",
    serial: "00012",
    metadata: {
      voltage: 24
    },
    survey: {
      status: "validated",
      note: "Synthetic checklist validated.",
      evidenceReference: "Fictional checklist"
    }
  }));
  expect(sensor.surveyReviewerId).toBe("task");
  expect((await app.detail("leader", assets.sensor.id)).related).toHaveLength(2);
  await app.save("leader", {
    ...save("conveyor", "conveyor", {
      parentId: assets.second.id
    }),
    expectedRevision: 1
  });
  await expect(app.save("leader", {
    ...save("second", "conveyor", {
      parentId: assets.conveyor.id
    }),
    expectedRevision: 1
  })).rejects.toMatchObject({
    code: "asset_domain_cycle"
  });
  await expect(app.save("leader", {
    ...save("controller", "sensor"),
    expectedRevision: 1
  })).rejects.toMatchObject({
    code: "asset_domain_conflict"
  });
  const concurrent = await Promise.allSettled([app.save("leader", {
    ...save("sensor", "sensor", sensor.data),
    expectedRevision: 1
  }), app.save("task", {
    ...save("sensor", "sensor", sensor.data),
    expectedRevision: 1
  })]);
  expect(concurrent.filter(r => r.status === "fulfilled")).toHaveLength(1);
  expect((await app.history("leader", assets.sensor.id)).revisions).toHaveLength(2);
  const foreign = composeAssetDomain(pool, {
    ...runtime.source,
    organizationId: "other-org",
    siteId: "other-site"
  }).domain;
  await expect(foreign.detail("foreign", assets.sensor.id)).rejects.toMatchObject({
    code: "asset_domain_missing"
  });
  await admin("INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active) VALUES($1,'tech',$2,'assets-reader',true)", [scope.organizationId, scope.siteId]);
  await expect(app.catalog("tech")).rejects.toMatchObject({
    code: "asset_domain_denied"
  });
});
test("large inventories use complete totals and bounded stable/refined pages instead of a fatal catalogue cap", async () => {
  const snapshot = {
    id: "",
    revision: 1,
    authorId: "leader",
    authorName: "leader",
    createdAt: "2026-10-14T12:00:00.000Z",
    updatedAt: "2026-10-14T12:00:00.000Z",
    content: {
      code: "",
      name: "",
      type: "Synthetic",
      locationId: "area",
      status: "unverified",
      validationNote: "",
      description: "Large synthetic directory fixture",
      aliases: []
    }
  };
  await admin(`INSERT INTO assets.records(organization_id,site_id,id,code,status,location_id,revision,snapshot,author_id,created_at,request_key,fingerprint) SELECT $1,$2,'large-'||n,'ZZ-SYNTH-'||lpad(n::text,5,'0'),'unverified','area',1,jsonb_set(jsonb_set(jsonb_set($3::jsonb,'{id}',to_jsonb('large-'||n)),'{content,code}',to_jsonb('ZZ-SYNTH-'||lpad(n::text,5,'0'))),'{content,name}',to_jsonb('ZZ-SYNTH-'||lpad(n::text,5,'0'))),'leader','2026-10-14T12:00:00Z','large-'||n,'synthetic' FROM generate_series(1,1501) n`, [scope.organizationId, scope.siteId, JSON.stringify(snapshot)]);
  expect(await app.catalog("leader")).not.toHaveProperty("assets");
  const first = await app.references("leader", {
    limit: 30
  });
  expect(first.total).toBe(1506);
  expect(first.assets).toHaveLength(30);
  const second = await app.references("leader", {
    limit: 30,
    cursor: first.nextCursor
  });
  expect(second.total).toBe(first.total);
  expect(second.assets.every(a => !first.assets.some(b => b.id === a.id))).toBe(true);
  const refined = await app.references("leader", {
    search: "ZZ-SYNTH-01501"
  });
  expect(refined.total).toBe(1);
  expect(refined.assets[0].id).toBe("large-1501");
});
test("actual publication maps only reviewed identities and preserves RAW/facts while unresolved totals stay explicit", async () => {
  expect((await publish("20260701")).outcome).toBe("succeeded");
  const rawBefore = (await admin("SELECT encode(original_bytes,'hex') AS bytes FROM integrations.import_batches ORDER BY import_id")).rows;
  const factsBefore = (await admin("SELECT import_id,source_record_number,payload,reported_frequency,accumulated_alarm_seconds FROM oip.facts ORDER BY import_id,source_record_number")).rows;
  const request = {
    id: randomUUID(),
    expectedRevision: 0,
    reason: "Review synthetic source association.",
    data: {
      source: {
        sourceId: "model-source",
        namespace: "source-equipment",
        area: "Demo area",
        code: "SOURCE-S1"
      },
      status: "pending",
      candidateIds: [assets.sensor.id, assets.motor.id],
      note: "Two synthetic candidates remain ambiguous."
    }
  };
  await app.saveMapping("leader", request);
  let result = await app.pareto("task", {
    from: "2026-07-01",
    toExclusive: "2026-07-02",
    metric: "frequency"
  });
  expect(result.states.ambiguous).toBe(1);
  expect(result.unresolved.frequency).toBe(40);
  await app.saveMapping("task", {
    ...request,
    expectedRevision: 1,
    data: {
      ...request.data,
      status: "approved",
      candidateIds: [assets.sensor.id],
      note: "Explicit synthetic sensor review."
    }
  });
  result = await app.pareto("leader", {
    from: "2026-07-01",
    toExclusive: "2026-07-02",
    metric: "frequency"
  });
  expect(result.totals.frequency).toBe(40);
  expect(result.groups[0]).toMatchObject({
    assetId: assets.sensor.id,
    frequency: 10,
    cumulativePercent: 25
  });
  expect(result.unresolved.frequency).toBe(30);
  expect(result.states.unmapped).toBe(1);
  expect((await publish("20260702")).outcome).toBe("succeeded");
  expect((await app.pareto("leader", {
    from: "2026-07-01",
    toExclusive: "2026-07-03",
    metric: "frequency"
  })).mapped.frequency).toBe(20);
  expect((await admin("SELECT encode(original_bytes,'hex') AS bytes FROM integrations.import_batches WHERE reporting_date='2026-07-01' ORDER BY import_id")).rows).toEqual(rawBefore);
  expect((await admin("SELECT import_id,source_record_number,payload,reported_frequency,accumulated_alarm_seconds FROM oip.facts WHERE reporting_date='2026-07-01' ORDER BY import_id,source_record_number")).rows).toEqual(factsBefore);
  expect((await admin("SELECT state FROM oip.canonical_asset_link_history WHERE source_record_number=2 ORDER BY mapping_revision")).rows.map(r => r.state)).toContain("ambiguous");
  const missing = await app.pareto("leader", {
    from: "2026-07-01",
    toExclusive: "2026-07-04",
    metric: "frequency"
  });
  expect(missing.missingDates).toEqual(["2026-07-03"]);
  await admin("UPDATE users_rbac.site_role_assignments SET is_active=false WHERE user_id='task' AND role_id='analytics-reader'");
  await expect(app.pareto("task", {
    from: "2026-07-01",
    toExclusive: "2026-07-02",
    metric: "frequency"
  })).rejects.toBeInstanceOf(SiteAccessDeniedError);
  await admin("UPDATE users_rbac.site_role_assignments SET is_active=true WHERE user_id='task' AND role_id='analytics-reader'");
});
test("failed projection-history writes roll back mapping decisions and immutable tables have narrow runtime rights", async () => {
  const existing = (await app.mappingQuery("leader", {})).mappings[0];
  await admin("CREATE FUNCTION oip.synthetic_reject_canonical_history() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Synthetic projection fault'; END $$; CREATE TRIGGER synthetic_reject_canonical_history BEFORE INSERT ON oip.canonical_asset_link_history FOR EACH ROW EXECUTE FUNCTION oip.synthetic_reject_canonical_history()");
  try {
    await expect(app.saveMapping("leader", {
      id: existing.id,
      expectedRevision: existing.revision,
      reason: "Synthetic fault injection",
      data: {
        ...existing.data,
        status: "rejected",
        candidateIds: [],
        note: "Rejected in synthetic test."
      }
    })).rejects.toThrow();
    expect((await app.mappingForSource("leader", existing.data.source)).revision).toBe(existing.revision);
  } finally {
    await admin("DROP TRIGGER synthetic_reject_canonical_history ON oip.canonical_asset_link_history; DROP FUNCTION oip.synthetic_reject_canonical_history()");
  }
  expect((await pool.query("SELECT * FROM assets.enrichments")).rows).toEqual([]);
  const rights = await db("runtime", c => c.query("SELECT has_table_privilege(current_user,'assets.enrichment_revisions','UPDATE') AS model_update,has_table_privilege(current_user,'oip.canonical_asset_link_history','DELETE') AS history_delete"));
  expect(rights.rows[0]).toEqual({
    model_update: false,
    history_delete: false
  });
  const scopeTables = await admin("SELECT relname,relrowsecurity,relforcerowsecurity FROM pg_class JOIN pg_namespace n ON n.oid=relnamespace WHERE relname IN ('model_catalog','model_catalog_revisions','enrichments','enrichment_revisions','controller_links','source_mappings','source_mapping_revisions','canonical_asset_links','canonical_asset_link_history') AND n.nspname IN ('assets','oip')");
  expect(scopeTables.rows).toHaveLength(9);
  expect(scopeTables.rows.every(r => r.relrowsecurity && r.relforcerowsecurity)).toBe(true);
});
test("opt-in synthetic fixture is reusable, scoped and preserves later user review", async () => {
  const {
    seedSyntheticAssetDomain
  } = require("../../../apps/api/dist/host/adapters/synthetic-asset-domain");
  const options = {
      token: randomUUID(),
      sourceId: runtime.source.sourceId,
      locationId: "area"
    },
    before = (await admin("SELECT count(*)::integer AS count FROM oip.facts")).rows[0].count;
  const first = await seedSyntheticAssetDomain(runtime.assets, app, "leader", options),
    repeat = await seedSyntheticAssetDomain(runtime.assets, app, "leader", options);
  expect(first.assets.map(a => a.id)).toEqual(repeat.assets.map(a => a.id));
  expect(first.assets).toHaveLength(4);
  expect(first.mappingState).toBe("ambiguous");
  expect((await admin("SELECT count(*)::integer AS count FROM oip.facts")).rows[0].count).toBe(before);
  const model = (await app.detail("leader", first.assets[0].id)).enrichment;
  await app.save("leader", {
    assetId: model.assetId,
    expectedRevision: model.revision,
    reason: "Operator changed the synthetic model.",
    data: {
      ...model.data,
      manufacturer: "Operator revision"
    }
  });
  await expect(seedSyntheticAssetDomain(runtime.assets, app, "leader", options)).rejects.toThrow(/user edits are preserved/);
});

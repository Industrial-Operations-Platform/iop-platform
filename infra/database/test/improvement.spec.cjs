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
} = require("../dist/provision");
const {
  migrate
} = require("../dist/migrate");
const {
  provisioningConfiguration
} = require("../dist/configuration");
const {
  seedOrganization
} = require("../dist/seed-organization");
const {
  seedSite
} = require("../dist/seed-site");
const {
  seedUser
} = require("../dist/seed-user");
const {
  seedMembership
} = require("../dist/seed-membership");
const {
  SourceMappings
} = require("../../../apps/api/dist/modules/integrations");
const {
  siteRoles
} = require("../../../apps/api/dist/modules/users-rbac/domain/profiles");
const {
  PlatformRuntime
} = require("../../../apps/api/dist/host/runtime");
const {
  composeImprovements
} = require("../../../apps/api/dist/host/improvement-composition");
const {
  improvementComparison
} = require("../../../apps/api/dist/modules/oip/adapters/postgres/improvement-comparison");
const {
  PgReportingProfiles
} = require("../../../apps/api/dist/modules/oip/adapters/postgres/reporting-profiles");
const {
  hitlisteReportingProfile
} = require("../../../apps/api/dist/host/adapters/hitliste-reporting-profile");
const {
  runSiteOperation,
  SiteAccessDeniedError
} = require("../../../apps/api/dist/persistence/site-operation");
const scope = {
  organizationId: "tracking-org",
  siteId: "tracking-site"
};
const locations = [{
  id: "department",
  label: "Preparation",
  parentId: "",
  role: "department",
  sectorKey: "Preparation"
}, {
  id: "area",
  label: "Area A",
  parentId: "department",
  role: "area",
  sectorKey: ""
}];
const selection = {
  before: {
    from: "2026-07-01",
    toExclusive: "2026-07-03"
  },
  after: {
    from: "2026-07-08",
    toExclusive: "2026-07-10"
  },
  scope: "asset",
  filters: {
    sector: "",
    area: "",
    equipment: "",
    message: ""
  }
};
let container, configs, pool, runtime, app, asset, issue, initialVersion;
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
function request(id = randomUUID()) {
  return {
    id,
    expectedRevision: 0,
    reason: "",
    data: {
      title: "Reduce drive alarms",
      hypothesis: "Inspect guide alignment.",
      locationId: "area",
      assetId: asset.id,
      issueId: issue,
      ownerId: "leader",
      dueDate: "2026-10-31",
      status: "planned",
      implementedDate: "",
      target: {
        objective: "Reduce reported frequency by 20% per observed date.",
        metric: "frequency",
        reductionPercent: 20
      },
      result: "",
      blockedReason: "",
      cancellationReason: ""
    }
  };
}
function run(actor, work, target = scope) {
  return runSiteOperation(pool, {
    ...target,
    userId: actor,
    permissions: ["analytics.read"]
  }, work);
}
beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:17.6-bookworm").withDatabase("iop_local").withUsername("iop_bootstrap").withPassword("synthetic-bootstrap-password").start();
  const env = {
    IOP_DATABASE_MODE: "local",
    IOP_DATABASE_HOST: container.getHost(),
    IOP_DATABASE_PORT: String(container.getPort()),
    IOP_DATABASE_NAME: "iop_local",
    IOP_POSTGRES_PASSWORD: "synthetic-bootstrap-password",
    IOP_MIGRATOR_PASSWORD: "synthetic-migrator-password",
    IOP_RUNTIME_PASSWORD: "synthetic-runtime-password"
  };
  configs = provisioningConfiguration(env);
  await provision(configs);
  await migrate(configs.migrator);
  // The root delivery owns the postmigration privilege allowlist. This harness
  // directly verifies narrow runtime/RLS rights without broadening provision().
  for (const [organizationId, siteId, users] of [[scope.organizationId, scope.siteId, [["admin", "administrator"], ["leader", "team-leader"], ["task", "task-force"], ["tech", "technician"]]], ["foreign-org", "foreign-site", [["foreign", "team-leader"]]]]) {
    const seed = {
      ...env,
      IOP_SEED_ORGANIZATION_ID: organizationId,
      IOP_SEED_ORGANIZATION_NAME: "Fictional organization",
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
    sourceId: "tracking-source",
    mappingRevision: "tracking-fixture-v1",
    sectors: [{
      sectorKey: "alpha",
      label: "Preparation"
    }],
    areas: [{
      sourceArea: "Area A",
      sectorKey: "alpha"
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
        id: "tracking-source",
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
      locations,
      categories: [{
        id: "problems",
        label: "Problems"
      }],
      externalSystemLabel: "External reference"
    }
  });
  initialVersion = new PgReportingProfiles(pool, runtime.source, hitlisteReportingProfile(mappings.configuration)).initialVersion;
  app = composeImprovements(pool, runtime.source, locations, initialVersion);
  for (const [day, frequency, seconds] of [["20260701", 10, 60], ["20260702", 10, 60], ["20260708", 6, 30], ["20260709", 6, 30]]) {
    const csv = '"Häufigkeit";"Dauer";"Bereich";"Betriebsmittelkennzeichen";"Meldetext";"Typ";"Meldegruppe"\r\n' + frequency + ';0 0:' + String(Math.floor(seconds / 60)).padStart(2, "0") + ':' + String(seconds % 60).padStart(2, "0") + ';Area A;=EQ-001;Jam;01;007\r\n0;0 0:00:00;Area A;=EQ-IDLE;Idle;01;007\r\n';
    expect((await runtime.imports.submit("admin", "Hitliste-" + day + ".csv", Buffer.from("\ufeff" + csv, "utf16le"))).outcome).toBe("succeeded");
  }
  asset = await runtime.assets.save("leader", {
    key: randomUUID(),
    id: "",
    expectedRevision: 0,
    note: "",
    content: {
      code: "=EQ-001",
      name: "Drive",
      type: "Drive",
      locationId: "area",
      status: "validated",
      validationNote: "Fixture identity",
      description: "Synthetic test asset",
      aliases: [{
        namespace: "analytics",
        sourceId: "tracking-source",
        code: "=EQ-001",
        departmentId: "",
        areaId: "",
        sector: "Preparation",
        area: "Area A"
      }]
    }
  });
  issue = randomUUID();
  const at = new Date().toISOString();
  const entry = {
    id: issue,
    authorId: "leader",
    authorName: "Leader",
    createdAt: at,
    updatedAt: at,
    revision: 1,
    content: {
      date: at.slice(0, 10),
      categoryId: "problems",
      summary: "Drive alarm",
      details: "Synthetic reported issue",
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
      discuss: false
    },
    departmentLabel: "Preparation",
    areaLabel: "Area A",
    categoryLabel: "Problems",
    equipmentReferenceId: "",
    responsibleId: "",
    responsibleName: "",
    issueState: "open",
    highlighted: false,
    highlightedAt: ""
  };
  issue = (await runtime.handover.create("leader", {
    key: randomUUID(),
    issue: true,
    responsibleId: "",
    content: entry.content
  })).id;
}, 120000);
afterAll(async () => {
  if (pool) await pool.end();
  if (container) await container.stop();
});
test("all three profiles create scoped durable actions, and stale updates serialize", async () => {
  for (const actor of ["admin", "leader", "task"]) {
    const input = request();
    const action = await app.save(actor, input);
    expect(action).toMatchObject({
      authorId: actor,
      assetName: asset.content.name,
      issueTitle: "Drive alarm",
      ownerName: "leader",
      revision: 1
    });
    expect((await app.save(actor, input)).revision).toBe(1);
    const edit = {
      ...input,
      expectedRevision: 1,
      reason: "Begin investigation.",
      data: {
        ...input.data,
        status: "in-progress"
      }
    };
    const race = await Promise.allSettled([app.save(actor, edit), app.save(actor, edit)]);
    expect(race.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(race.find(r => r.status === "rejected").reason.code).toBe("improvement_conflict");
    expect((await app.history(actor, input.id)).revisions).toHaveLength(2);
  }
});
test("current profile and grants deny technicians including stray grants, revocation and foreign scope", async () => {
  await admin("INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active) VALUES($1,'tech',$2,'improvement-contributor',true)", [scope.organizationId, scope.siteId]);
  await expect(app.catalog("tech")).rejects.toBeInstanceOf(SiteAccessDeniedError);
  await admin("UPDATE users_rbac.site_role_assignments SET is_active=false WHERE user_id='task' AND role_id='improvement-contributor'");
  await expect(app.query("task", {})).rejects.toBeInstanceOf(SiteAccessDeniedError);
  expect((await app.catalog("leader")).people.some(p => p.id === "task")).toBe(false);
  await admin("UPDATE users_rbac.site_role_assignments SET is_active=true WHERE user_id='task' AND role_id='improvement-contributor'");
  const action = await app.save("leader", request());
  const foreign = composeImprovements(pool, {
    ...runtime.source,
    organizationId: "foreign-org",
    siteId: "foreign-site"
  }, locations, initialVersion);
  await expect(foreign.history("foreign", action.id)).rejects.toMatchObject({
    code: "improvement_missing"
  });
  await expect(foreign.query("leader", {})).rejects.toBeInstanceOf(SiteAccessDeniedError);
});
test("evidence is append-only, corrected explicitly, and failed history writes roll back all changes", async () => {
  const action = await app.save("leader", request());
  const note = {
    id: randomUUID(),
    actionId: action.id,
    expectedRevision: 1,
    kind: "note",
    note: "Guide inspected.",
    externalReference: "Fixture work order",
    supersedesId: ""
  };
  await app.addEvidence("task", note);
  await app.addEvidence("leader", {
    ...note,
    id: randomUUID(),
    expectedRevision: 2,
    note: "Inspection remains pending.",
    supersedesId: note.id
  });
  expect((await app.evidence("admin", action.id)).evidence.find(e => e.id === note.id).note).toBe("Guide inspected.");
  const failedId = randomUUID();
  await admin("CREATE FUNCTION improvement.synthetic_reject_history() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.snapshot->>'change'='evidence-added' THEN RAISE EXCEPTION 'Synthetic failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER synthetic_reject_history BEFORE INSERT ON improvement.revisions FOR EACH ROW EXECUTE FUNCTION improvement.synthetic_reject_history()");
  try {
    await expect(app.addEvidence("leader", {
      ...note,
      id: failedId,
      expectedRevision: 3
    })).rejects.toThrow();
    expect((await app.history("leader", action.id)).action.revision).toBe(3);
    expect((await app.evidence("leader", action.id)).evidence.some(e => e.id === failedId)).toBe(false);
  } finally {
    await admin("DROP TRIGGER synthetic_reject_history ON improvement.revisions; DROP FUNCTION improvement.synthetic_reject_history()");
  }
  expect((await pool.query("SELECT * FROM improvement.actions")).rows).toEqual([]);
  const rights = await db("runtime", c => c.query("SELECT has_table_privilege(current_user,'improvement.revisions','UPDATE') AS history_update,has_table_privilege(current_user,'improvement.evidence','DELETE') AS evidence_delete,has_table_privilege(current_user,'improvement.comparisons','UPDATE') AS comparison_update"));
  expect(rights.rows[0]).toEqual({
    history_update: false,
    evidence_delete: false,
    comparison_update: false
  });
  const rls = await admin("SELECT relname,relrowsecurity,relforcerowsecurity FROM pg_class JOIN pg_namespace n ON n.oid=relnamespace WHERE n.nspname='improvement' AND relkind='r'");
  expect(rls.rows).toHaveLength(4);
  expect(rls.rows.every(r => r.relrowsecurity && r.relforcerowsecurity)).toBe(true);
});
test("OIP compares exact imported aliases, coverage and server-generated immutable snapshots", async () => {
  const action = await app.save("leader", request());
  const compare = {
    actionId: action.id,
    expectedRevision: 1,
    selection
  };
  const result = await app.compare("task", compare);
  expect(result.before).toMatchObject({
    frequency: 20,
    alarmSeconds: 120,
    records: 2,
    missingDates: []
  });
  expect(result.after.frequency).toBe(12);
  expect(result.frequencyPerObservedDate.reductionPercent).toBe(40);
  expect(result.observedTarget).toBe("met");
  expect(result.aliases).toEqual([{
    code: "=EQ-001",
    sector: "Preparation",
    area: "Area A"
  }]);
  const saved = await app.saveComparison("leader", {
    ...compare,
    id: randomUUID(),
    note: "Synthetic source observation."
  });
  expect(saved.saved.comparison.publicationRevision).toBe(result.publicationRevision);
  expect((await app.comparisons("leader", action.id)).comparisons[0].comparison.before.frequency).toBe(20);
  const missing = await app.compare("leader", {
    ...compare,
    expectedRevision: 2,
    selection: {
      ...selection,
      after: {
        from: "2026-07-08",
        toExclusive: "2026-07-11"
      }
    }
  });
  expect(missing.after.missingDates).toEqual(["2026-07-10"]);
  expect(missing.observedTarget).toBe("not-assessable");
  expect(missing.warnings.join(" ")).toMatch(/missing imports are not zero/);
  const zero = await app.compare("leader", {
    ...compare, expectedRevision: 2,
    selection: {...selection, scope: "selection", filters: {sector: "", area: "Area A", equipment: "=EQ-IDLE", message: ""}}
  });
  expect(zero.before.frequency).toBe(0);
  expect(zero.before.records).toBe(2);
  expect(zero.frequencyPerObservedDate.reductionPercent).toBeNull();
  expect(zero.warnings.join(" ")).toMatch(/zero baseline/);
  const empty = await app.compare("leader", {
    ...compare,
    expectedRevision: 2,
    selection: {
      ...selection,
      before: {
        from: "2026-06-01",
        toExclusive: "2026-06-03"
      }
    }
  });
  expect(empty.frequencyPerObservedDate.before).toBeNull();
  await run("leader", async tx => {
    const unmapped = await improvementComparison(tx, runtime.source, selection, {
      id: asset.id,
      aliases: []
    }, initialVersion);
    expect(unmapped.mapped).toBe(false);
    expect(unmapped.before.frequency).toBe(0);
  });
  await admin("UPDATE analytics.fact_hitliste SET profile_version='stale' WHERE organization_id=$1 AND site_id=$2", [scope.organizationId, scope.siteId]);
  await expect(app.compare("leader", {
    ...compare,
    expectedRevision: 2
  })).rejects.toMatchObject({
    code: "analytics_projection_unavailable"
  });
  await admin("UPDATE analytics.fact_hitliste SET profile_version=$3 WHERE organization_id=$1 AND site_id=$2", [scope.organizationId, scope.siteId, initialVersion]);
  await admin("UPDATE users_rbac.site_role_assignments SET is_active=false WHERE user_id='task' AND role_id='analytics-reader'");
  await expect(app.compare("task", {
    ...compare,
    expectedRevision: 2
  })).rejects.toBeInstanceOf(SiteAccessDeniedError);
  await admin("UPDATE users_rbac.site_role_assignments SET is_active=true WHERE user_id='task' AND role_id='analytics-reader'");
});

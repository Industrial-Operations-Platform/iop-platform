const { PostgreSqlContainer } = require("@testcontainers/postgresql");
const { Client, Pool } = require("pg");
const { randomUUID } = require("node:crypto");
const {
  mkdtempSync,
  readdirSync,
  copyFileSync,
  rmSync,
  readFileSync,
  mkdirSync,
} = require("node:fs");
const { join } = require("node:path");
const { tmpdir } = require("node:os");
const { provision } = require("../dist/provision");
const { migrate } = require("../dist/migrate");
const { provisioningConfiguration } = require("../dist/configuration");
const { seedOrganization } = require("../dist/seed-organization");
const { seedSite } = require("../dist/seed-site");
const { seedUser } = require("../dist/seed-user");
const { seedMembership } = require("../dist/seed-membership");
const {
  Handover,
} = require("../../../apps/api/dist/modules/shift-handover/application/handover");
const {
  emptySelection,
} = require("../../../apps/api/dist/modules/shift-handover/domain/handover");
const {
  PgHandover,
} = require("../../../apps/api/dist/modules/shift-handover/adapters/postgres/store");
const {
  sitePeople,
  sitePersonNames,
} = require("../../../apps/api/dist/modules/users-rbac/adapters/postgres/site-people");
const {
  evaluateSiteAccess,
} = require("../../../apps/api/dist/modules/users-rbac");
const {
  runSiteOperation,
} = require("../../../apps/api/dist/persistence/site-operation");
const {
  handoverMaintenanceIssues,
  pendingHandoverMaintenanceIssues,
  resolveHandoverMaintenanceIssues,
} = require("../../../apps/api/dist/modules/shift-handover/adapters/postgres/maintenance-issues");
const {
  handoverEquipmentCatalog,
} = require("../../../apps/api/dist/modules/shift-handover/adapters/postgres/equipment-catalog");
const {
  NodePasswords,
} = require("../../../apps/api/dist/modules/authentication/adapters/node-crypto");
const {
  composeAccess,
} = require("../../../apps/api/dist/host/access-composition");
const {
  handoverCatalog,
} = require("../../../apps/api/dist/host/adapters/handover-catalog");
const scope = { organizationId: "org-a", siteId: "site-a" };
const config = {
  ...scope,
  locations: [
    {
      id: "department",
      label: "Workshop",
      parentId: "",
      role: "department",
      sectorKey: "Workshop",
    },
    {
      id: "area",
      label: "Conveyor",
      parentId: "department",
      role: "area",
      sectorKey: "",
    },
  ],
  categories: [
    "Safety",
    "Information",
    "Successes",
    "People",
    "Performance",
    "Problems",
  ].map((label) => ({ id: label.toLowerCase(), label })),
  externalSystemLabel: "Ultimo",
};
const password = "Synthetic handover password 168";
let container, configs, pool, app, access;
let clockTick = 0;
async function db(role, work) {
  const c = new Client(configs[role]);
  await c.connect();
  try {
    return await work(c);
  } finally {
    await c.end();
  }
}
function service(target = scope, connection = pool, options = {}) {
  const store = new PgHandover(connection, target, {
    allowed: async (tx, actor, permission) =>
      (
        await evaluateSiteAccess(tx, {
          ...target,
          userId: actor,
          permissions: [permission],
        })
      ).allowed,
    people: (tx) => sitePeople(tx, target.organizationId, target.siteId),
    names: (tx, ids) =>
      sitePersonNames(tx, target.organizationId, target.siteId, ids),
    equipment: async () => ({
      codes: options.codes ?? ["0001"],
      nextCursor: "",
    }),
  });
  return new Handover(
    store,
    handoverCatalog(
      {
        ...config,
        ...target,
        ...(options.locations ? { locations: options.locations } : {}),
      },
      target,
      options.timeZone ?? "UTC",
    ),
    randomUUID,
    options.now ??
      (() =>
        new Date(
          Date.parse("2026-09-28T12:00:00.000Z") + clockTick++,
        ).toISOString()),
  );
}
const content = (summary = "Replaced guard") => ({
  date: "2026-09-28",
  categoryId: "problems",
  summary,
  details: "Recorded repair",
  departmentId: "department",
  areaId: "area",
  equipmentCode: "0001",
  equipmentNamespace: "site-equipment",
  condition: "repaired",
  externalReference: "000123",
  challenge: "Guard damaged",
  cause: "Unknown",
  measure: "Replacement",
  dueDate: "2026-10-02",
  feedbackDueDate: "2026-09-30",
  discuss: true,
});
const publish = (summary) =>
  app.create("tech-a", {
    key: randomUUID(),
    content: content(summary),
    issue: true,
    responsibleId: "lead-a",
  });
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
  const directory = mkdtempSync(join(tmpdir(), "iop-168-migrations-"));
  try {
    for (const file of readdirSync(join(__dirname, "../migrations")).filter(
      (f) => f.endsWith(".sql") && f < "20261001000000",
    ))
      copyFileSync(
        join(__dirname, "../migrations", file),
        join(directory, file),
      );
    expect(await migrate(configs.migrator, directory)).toBe(12);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
  const hash = await new NodePasswords().hash(password);
  for (const [org, site, users] of [
    [
      "org-a",
      "site-a",
      [
        ["admin-a", "administrator"],
        ["tech-a", "technician"],
        ["task-a", "task-force"],
        ["lead-a", "team-leader"],
        ["disabled-a", "technician"],
      ],
    ],
    ["org-b", "site-b", [["admin-b", "administrator"]]],
    ["org-a", "site-a2", [["other-site", "technician"]]],
  ]) {
    const seed = {
      ...env,
      IOP_SEED_ORGANIZATION_ID: org,
      IOP_SEED_ORGANIZATION_NAME: org,
      IOP_SEED_SITE_ID: site,
      IOP_SEED_SITE_NAME: site,
      IOP_SEED_SITE_TIME_ZONE: "UTC",
    };
    await seedOrganization(seed);
    await seedSite(seed);
    for (const [id, profile] of users) {
      await seedUser({ ...seed, IOP_SEED_USER_ID: id });
      await seedMembership({ ...seed, IOP_SEED_USER_ID: id });
      await db("bootstrap", async (c) => {
        await c.query(
          "INSERT INTO users_rbac.profiles VALUES($1,$2,$3,$4,$5)",
          [org, id, site, id, profile],
        );
        await c.query(
          "INSERT INTO authentication.credentials(organization_id,user_id,username,password_hash,must_change) VALUES($1,$2,$2,$3,false)",
          [org, id, hash],
        );
        if (profile === "administrator")
          await c.query(
            "INSERT INTO users_rbac.organization_role_assignments VALUES($1,$2,'organization-access-admin',true)",
            [org, id],
          );
        if (profile !== "administrator")
          await c.query(
            "UPDATE users_rbac.site_role_assignments SET is_active=false WHERE user_id=$1 AND role_id='site-operator'",
            [id],
          );
        if (id === "disabled-a")
          await c.query(
            "UPDATE users_rbac.organization_memberships SET is_active=false WHERE user_id=$1",
            [id],
          );
      });
    }
  }
  await db("bootstrap", (c) =>
    c.query(
      "INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active) VALUES('org-a','tech-a','site-a2','analytics-reader',true)",
    ),
  );
  expect(await migrate(configs.migrator)).toBe(10);
  await provision(configs);
  pool = new Pool({ ...configs.runtime, max: 5 });
  app = service();
  access = composeAccess(pool, scope);
}, 90000);
afterAll(async () => {
  if (pool) await pool.end();
  if (container) await container.stop();
});

function maintenanceFixture() {
  const departmentId = "linked-" + randomUUID();
  const areaId = "linked-" + randomUUID();
  const otherAreaId = "linked-" + randomUUID();
  const codes = [
    "=11+11.11.02-B102.1",
    "=11+11.11.02-B102.2",
    "=11+11.11.02-b102.1",
  ];
  const locations = [
    ...config.locations,
    {
      id: departmentId,
      label: "Linked department",
      parentId: "",
      role: "department",
      sectorKey: "",
    },
    {
      id: areaId,
      label: "Cassette zone",
      parentId: departmentId,
      role: "area",
      sectorKey: "",
    },
    {
      id: otherAreaId,
      label: "Other zone",
      parentId: departmentId,
      role: "area",
      sectorKey: "",
    },
  ];
  const handover = service(scope, pool, { codes, locations });
  return {
    handover,
    codes,
    issueScope: {
      locationIds: [areaId],
      equipment: codes.slice(0, 2).map((code) => ({
        namespace: "site-equipment",
        code,
        departmentId,
        areaId,
      })),
    },
    publish: (summary, code = codes[0], selectedArea = areaId, issue = true) =>
      handover.create("tech-a", {
        key: randomUUID(),
        issue,
        responsibleId: issue ? "lead-a" : "",
        content: {
          ...content(summary),
          departmentId,
          areaId: selectedArea,
          equipmentCode: code,
          condition: code ? "blocked" : "",
        },
      }),
    otherAreaId,
  };
}
const maintenanceOperation = (work, actor = "task-a") =>
  runSiteOperation(
    pool,
    { ...scope, userId: actor, permissions: ["maintenance.contribute"] },
    work,
  );

test("Handover publishes exact scoped equipment identities without journal content", async () => {
  const f = maintenanceFixture();
  const original = await f.publish("Private repair narrative");
  await f.publish("Different source case", f.codes[2]);
  await f.publish(
    "Same code in another reporting zone",
    f.codes[0],
    f.otherAreaId,
  );
  const selection = {
    locationIds: f.issueScope.locationIds,
    search: "",
    code: f.codes[0],
  };
  const result = await maintenanceOperation((tx) =>
    handoverEquipmentCatalog(tx, scope, selection),
  );
  expect(result).toEqual([
    {
      namespace: "site-equipment",
      sourceId: "",
      code: f.codes[0],
      sector: "",
      area: "",
      departmentId: original.content.departmentId,
      areaId: original.content.areaId,
    },
  ]);
  const retained = await f.handover.remove("admin-a", original.id, 1);
  expect(retained.deleted).toBe(true);
  expect(
    await maintenanceOperation((tx) =>
      handoverEquipmentCatalog(tx, scope, selection),
    ),
  ).toEqual(result);
  const searched = await maintenanceOperation((tx) =>
    handoverEquipmentCatalog(tx, scope, {
      ...selection,
      search: "b102.1",
      code: "",
    }),
  );
  expect(searched.map((row) => row.code).sort()).toEqual(
    [f.codes[0], f.codes[2]].sort(),
  );
  expect(
    await maintenanceOperation((tx) =>
      handoverEquipmentCatalog(tx, scope, { ...selection, code: f.codes[1] }),
    ),
  ).toEqual([]);
  await expect(
    maintenanceOperation((tx) =>
      handoverEquipmentCatalog(tx, { ...scope, siteId: "site-a2" }, selection),
    ),
  ).rejects.toThrow("Site operation is not permitted.");
  await expect(
    maintenanceOperation((tx) =>
      handoverEquipmentCatalog(tx, scope, {
        ...selection,
        locationIds: [...selection.locationIds, ...selection.locationIds],
      }),
    ),
  ).rejects.toMatchObject({ code: "invalid" });
});

test("maintenance issue projection matches multiple exact identifiers and zone reports before pagination", async () => {
  const f = maintenanceFixture();
  const first = await f.publish("First sensor report");
  const second = await f.publish("Second sensor report", f.codes[1]);
  const zone = await f.publish("Cassette component without a sensor code", "");
  const information = await f.publish(
    "Information on selected sensor",
    f.codes[0],
    undefined,
    false,
  );
  let resolved = await f.publish("Previous repair on selected sensor");
  resolved = await f.handover.change("admin-a", {
    id: resolved.id,
    expectedRevision: 1,
    action: "state",
    state: "resolved",
    note: "Earlier outcome retained",
  });
  const differingCase = await f.publish(
    "Different exact source identifier",
    f.codes[2],
  );
  await f.publish("Same code in another zone", f.codes[0], f.otherAreaId);
  const removed = await f.publish("Removed report");
  await f.handover.remove("admin-a", removed.id, 1);
  const page = await maintenanceOperation((tx) =>
    handoverMaintenanceIssues(tx, scope, { scope: f.issueScope, limit: 2 }),
  );
  expect(page.total).toBe(5);
  expect(page.entries).toHaveLength(2);
  const next = await maintenanceOperation((tx) =>
    handoverMaintenanceIssues(tx, scope, {
      scope: f.issueScope,
      limit: 100,
      cursor: page.nextCursor,
    }),
  );
  expect(next.total).toBe(5);
  expect(next.nextCursor).toBe("");
  expect(
    [...page.entries, ...next.entries].map((entry) => entry.id).sort(),
  ).toEqual([first.id, second.id, zone.id, information.id, resolved.id].sort());
  const pending = await maintenanceOperation((tx) =>
    pendingHandoverMaintenanceIssues(tx, scope, f.issueScope),
  );
  expect(pending.map((entry) => entry.id).sort()).toEqual(
    [first.id, second.id, zone.id].sort(),
  );
  const selected = await maintenanceOperation((tx) =>
    handoverMaintenanceIssues(tx, scope, {
      scope: f.issueScope,
      ids: [first.id, differingCase.id],
      search: "sensor",
      limit: 100,
    }),
  );
  expect(selected.total).toBe(1);
  expect(selected.entries[0]).toMatchObject({
    id: first.id,
    authorName: "tech-a",
    responsibleName: "lead-a",
  });
  const zoneOnly = await maintenanceOperation((tx) =>
    handoverMaintenanceIssues(tx, scope, {
      scope: { ...f.issueScope, equipment: [] },
      limit: 100,
    }),
  );
  expect(zoneOnly.total).toBe(6);
});

test("maintenance completion keeps resolution and owner evidence atomic and respects explicit exclusions", async () => {
  const f = maintenanceFixture();
  const included = await f.publish("Included cassette repair");
  const excluded = await f.publish(
    "Excluded electrical inspection",
    f.codes[1],
  );
  const resolution = {
    maintenanceId: "linked-work-194",
    outcome: "Cassette drive replaced and verified",
    at: "2026-10-05T12:00:00.000Z",
  };
  await expect(
    maintenanceOperation(async (tx) => {
      await pendingHandoverMaintenanceIssues(tx, scope, f.issueScope);
      await resolveHandoverMaintenanceIssues(
        tx,
        scope,
        [{ id: included.id, expectedRevision: 1 }],
        resolution,
      );
      throw new Error("Receiving Maintenance save failed");
    }),
  ).rejects.toThrow("Receiving Maintenance save failed");
  expect(
    (await f.handover.history("task-a", included.id)).revisions,
  ).toHaveLength(1);
  await expect(
    maintenanceOperation((tx) =>
      resolveHandoverMaintenanceIssues(
        tx,
        scope,
        [
          { id: included.id, expectedRevision: 1 },
          { id: excluded.id, expectedRevision: 2 },
        ],
        resolution,
      ),
    ),
  ).rejects.toMatchObject({ code: "conflict" });
  expect(
    (await f.handover.history("task-a", included.id)).entry.issueState,
  ).toBe("open");
  await maintenanceOperation(async (tx) => {
    await pendingHandoverMaintenanceIssues(tx, scope, f.issueScope);
    await resolveHandoverMaintenanceIssues(
      tx,
      scope,
      [{ id: included.id, expectedRevision: 1 }],
      resolution,
    );
  });
  const history = await f.handover.history("task-a", included.id);
  expect(history.entry).toMatchObject({
    issueState: "resolved",
    revision: 2,
    authorId: "tech-a",
    responsibleId: "lead-a",
    content: included.content,
  });
  expect(history.revisions[0]).toMatchObject({
    action: "state",
    actorId: "task-a",
    note: "Maintenance linked-work-194: " + resolution.outcome,
  });
  expect(
    (await f.handover.history("task-a", excluded.id)).entry.issueState,
  ).toBe("open");
  await expect(
    maintenanceOperation((tx) =>
      resolveHandoverMaintenanceIssues(
        tx,
        scope,
        [{ id: included.id, expectedRevision: 2 }],
        resolution,
      ),
    ),
  ).rejects.toMatchObject({ code: "conflict" });
  await expect(
    maintenanceOperation((tx) =>
      handoverMaintenanceIssues(
        tx,
        { organizationId: "org-a", siteId: "site-a2" },
        { scope: f.issueScope },
      ),
    ),
  ).rejects.toThrow("Site operation is not permitted.");
});

test("completion scope lease prevents phantom mutation until commit", async () => {
  const f = maintenanceFixture();
  const initial = await f.publish("Initial report");
  let releaseCompletion, acquired;
  const entered = new Promise((resolve) => {
    acquired = resolve;
  });
  const release = new Promise((resolve) => {
    releaseCompletion = resolve;
  });
  const completion = maintenanceOperation(async (tx) => {
    const pending = await pendingHandoverMaintenanceIssues(
      tx,
      scope,
      f.issueScope,
    );
    expect(pending.map((entry) => entry.id)).toEqual([initial.id]);
    acquired();
    await release;
    return resolveHandoverMaintenanceIssues(
      tx,
      scope,
      [{ id: initial.id, expectedRevision: 1 }],
      {
        maintenanceId: "lease-work",
        outcome: "Repair verified",
        at: "2026-10-05T12:00:00.000Z",
      },
    );
  });
  await entered;
  let published = false;
  const lateReport = f.publish("New report during completion").then((entry) => {
    published = true;
    return entry;
  });
  try {
    const deadline = Date.now() + 5000;
    let blocked = false;
    while (Date.now() < deadline) {
      blocked = await db("bootstrap", async (client) => {
        const result = await client.query(
          "SELECT count(*)::integer AS count FROM pg_stat_activity WHERE usename='iop_runtime' AND wait_event='advisory' AND query LIKE '%iop-handover-maintenance%'",
        );
        return result.rows[0].count > 0;
      });
      if (blocked) break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    expect(blocked).toBe(true);
    expect(published).toBe(false);
  } finally {
    releaseCompletion();
    await completion;
  }
  const late = await lateReport;
  expect(late.issueState).toBe("open");
  const remaining = await maintenanceOperation((tx) =>
    pendingHandoverMaintenanceIssues(tx, scope, f.issueScope),
  );
  expect(remaining.map((entry) => entry.id)).toEqual([late.id]);
});

test("owner maintenance collaboration rechecks current Handover authority", async () => {
  const f = maintenanceFixture();
  const report = await f.publish("Authority recheck report");
  await db("bootstrap", (client) =>
    client.query(
      "UPDATE users_rbac.site_role_assignments SET is_active=false WHERE organization_id=$1 AND site_id=$2 AND user_id='task-a' AND role_id='handover-contributor'",
      [scope.organizationId, scope.siteId],
    ),
  );
  try {
    await expect(
      maintenanceOperation((tx) =>
        handoverMaintenanceIssues(tx, scope, { scope: f.issueScope }),
      ),
    ).rejects.toMatchObject({ code: "denied" });
    await expect(
      maintenanceOperation((tx) =>
        resolveHandoverMaintenanceIssues(
          tx,
          scope,
          [{ id: report.id, expectedRevision: 1 }],
          {
            maintenanceId: "denied-work",
            outcome: "Cannot resolve after revocation",
            at: "2026-10-05T12:00:00.000Z",
          },
        ),
      ),
    ).rejects.toMatchObject({ code: "denied" });
  } finally {
    await db("bootstrap", (client) =>
      client.query(
        "UPDATE users_rbac.site_role_assignments SET is_active=true WHERE organization_id=$1 AND site_id=$2 AND user_id='task-a' AND role_id='handover-contributor'",
        [scope.organizationId, scope.siteId],
      ),
    );
  }
  expect((await f.handover.history("task-a", report.id)).entry.issueState).toBe(
    "open",
  );
});

test("exhaustive completion review reports capacity instead of silently closing a partial issue page", async () => {
  const f = maintenanceFixture();
  const reports = await Promise.all(
    Array.from({ length: 201 }, (_, index) =>
      f.publish("Capacity report " + index),
    ),
  );
  await expect(
    maintenanceOperation((tx) =>
      pendingHandoverMaintenanceIssues(tx, scope, f.issueScope),
    ),
  ).rejects.toMatchObject({ code: "capacity" });
  const page = await maintenanceOperation((tx) =>
    handoverMaintenanceIssues(tx, scope, { scope: f.issueScope, limit: 100 }),
  );
  expect(page.total).toBe(201);
  expect(page.entries).toHaveLength(100);
  expect(page.nextCursor).not.toBe("");
  expect(
    (await f.handover.history("task-a", reports[0].id)).revisions,
  ).toHaveLength(1);
});
test("migration assigns all four profiles, preserves disabled membership and prevents foreign directory reads", async () => {
  for (const id of ["admin-a", "tech-a", "task-a", "lead-a"]) {
    const context = await app.context(id);
    expect(context.canCoordinate).toBe(["admin-a", "lead-a"].includes(id));
    expect(context.people.map((p) => p.id)).not.toContain("other-site");
    expect(context.people.map((p) => p.id)).not.toContain("disabled-a");
  }
  await expect(app.context("disabled-a")).rejects.toThrow();
  await expect(
    service({ organizationId: "org-b", siteId: "site-b" }).context("tech-a"),
  ).rejects.toThrow();
  expect(
    (
      await db("bootstrap", (c) =>
        c.query(
          "SELECT role_id FROM users_rbac.site_role_assignments WHERE user_id='disabled-a' AND role_id LIKE 'handover-%'",
        ),
      )
    ).rows,
  ).toHaveLength(0);
});
test("upgrade revokes existing technician analytical grants at the profile site and retains operational access", async () => {
  for (const id of ["tech-a", "admin-a", "task-a", "lead-a"]) {
    const check = () =>
      runSiteOperation(
        pool,
        { ...scope, userId: id, permissions: ["analytics.read"] },
        async () => true,
      );
    if (id === "tech-a") await expect(check()).rejects.toThrow("not permitted");
    else await expect(check()).resolves.toBe(true);
    await expect(
      runSiteOperation(
        pool,
        {
          ...scope,
          userId: id,
          permissions: ["handover.read", "handover.contribute"],
        },
        async () => true,
      ),
    ).resolves.toBe(true);
  }
  const rows = await db("bootstrap", (c) =>
    c.query(
      "SELECT site_id,is_active FROM users_rbac.site_role_assignments WHERE organization_id='org-a' AND user_id='tech-a' AND role_id='analytics-reader' ORDER BY site_id",
    ),
  );
  expect(rows.rows).toEqual([
    { site_id: "site-a", is_active: false },
    { site_id: "site-a2", is_active: true },
  ]);
  const policies = await db("bootstrap", (c) =>
    c.query(
      "SELECT policyname FROM pg_policies WHERE policyname='technician_access_migration'",
    ),
  );
  expect(policies.rows).toEqual([]);
  expect(await migrate(configs.migrator)).toBe(0);
});
test("durable publication, equipment history, filters, idempotency and concurrent revision conflict", async () => {
  const request = {
    key: randomUUID(),
    content: content(),
    issue: true,
    responsibleId: "lead-a",
  };
  const pair = await Promise.all([
    app.create("tech-a", request),
    app.create("tech-a", request),
  ]);
  expect(pair[0].id).toBe(pair[1].id);
  const e = pair[0];
  const newPool = new Pool({ ...configs.runtime, max: 1 });
  try {
    expect(
      (await service(scope, newPool).history("task-a", e.id)).entry,
    ).toEqual(e);
  } finally {
    await newPool.end();
  }
  await expect(
    app.create("tech-a", { ...request, content: content("Different") }),
  ).rejects.toMatchObject({ code: "handover_conflict" });
  const outcomes = await Promise.allSettled([
    app.change("lead-a", {
      id: e.id,
      expectedRevision: 1,
      action: "state",
      state: "in-progress",
      note: "Started",
    }),
    app.change("tech-a", {
      id: e.id,
      expectedRevision: 1,
      action: "follow-up",
      note: "Additional observation",
    }),
  ]);
  expect(outcomes.filter((x) => x.status === "fulfilled")).toHaveLength(1);
  expect(outcomes.find((x) => x.status === "rejected").reason.code).toBe(
    "handover_conflict",
  );
  const history = await app.history("tech-a", e.id);
  expect(history.revisions).toHaveLength(2);
  expect(history.revisions[1].entry.content.externalReference).toBe("000123");
  const same = await publish("Another repair");
  expect(same.equipmentReferenceId).toBe(e.equipmentReferenceId);
  const list = await app.list("task-a", {
    ...emptySelection,
    equipmentReferenceId: e.equipmentReferenceId,
  });
  expect(list.entries.map((x) => x.id)).toEqual(
    expect.arrayContaining([e.id, same.id]),
  );
  expect(
    (await app.list("task-a", { ...emptySelection, search: "000123" })).total,
  ).toBeGreaterThanOrEqual(2);
  await expect(
    app.create("tech-a", {
      key: randomUUID(),
      content: content(),
      issue: true,
      responsibleId: "other-site",
    }),
  ).rejects.toMatchObject({ code: "handover_denied" });
});
test("RLS, privilege limits, cross-site references and atomic revision rollback", async () => {
  const e = await publish("Rollback verification");
  for (const table of ["entries", "equipment_references", "revisions"])
    expect(
      (await pool.query(`SELECT * FROM shift_handover.${table}`)).rows,
    ).toEqual([]);
  await expect(
    pool.query("DELETE FROM shift_handover.entries"),
  ).rejects.toThrow();
  await expect(
    pool.query("UPDATE shift_handover.revisions SET snapshot=snapshot"),
  ).rejects.toThrow();
  const req = {
    ...scope,
    userId: "tech-a",
    permissions: ["handover.contribute"],
  };
  await expect(
    runSiteOperation(pool, req, async (tx) => {
      await tx.query(
        "UPDATE shift_handover.entries SET revision=99 WHERE organization_id=$1 AND site_id=$2 AND id=$3",
        ["org-a", "site-a", e.id],
      );
      await tx.query(
        "INSERT INTO shift_handover.revisions VALUES('org-b','site-b',$1,99,'tech-a',now(),'{}')",
        [e.id],
      );
    }),
  ).rejects.toThrow();
  expect((await app.history("tech-a", e.id)).entry.revision).toBe(1);
  await expect(
    runSiteOperation(pool, req, (tx) =>
      tx.query(
        "UPDATE shift_handover.entries SET responsible_id=$4 WHERE organization_id=$1 AND site_id=$2 AND id=$3",
        ["org-a", "site-a", e.id, "other-site"],
      ),
    ),
  ).rejects.toThrow();
  const r = await db("bootstrap", (c) =>
    c.query(
      "SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE relnamespace='shift_handover'::regnamespace AND relkind='r'",
    ),
  );
  expect(r.rows).toHaveLength(3);
  expect(r.rows.every((r) => r.relrowsecurity && r.relforcerowsecurity)).toBe(
    true,
  );
  await provision(configs);
});
test("provisioning, demotion and revocation update handover grants without expanding analytics permissions", async () => {
  const created = await access.users.create("admin-a", {
    name: "Temporary lead",
    username: "temporary-lead",
    profile: "team-leader",
  });
  expect((await app.context(created.user.id)).canCoordinate).toBe(true);
  await access.users.change("admin-a", created.user.id, "technician", true);
  expect((await app.context(created.user.id)).canCoordinate).toBe(false);
  await access.users.change("admin-a", created.user.id, "technician", false);
  await expect(app.context(created.user.id)).rejects.toThrow();
});
test("full history pagination, pending carryover and highlight withdrawal retain evidence", async () => {
  for (let i = 0; i < 23; i++) await publish("Paging " + i);
  const first = await app.list("tech-a", {
      ...emptySelection,
      search: "Paging",
    }),
    next = await app.list("tech-a", {
      ...emptySelection,
      search: "Paging",
      cursor: first.nextCursor,
    });
  expect(first.total).toBe(23);
  expect(first.entries).toHaveLength(20);
  expect(next.entries).toHaveLength(3);
  expect(
    new Set([...first.entries, ...next.entries].map((e) => e.id)).size,
  ).toBe(23);
  const e = first.entries[0];
  await expect(
    app.change("tech-a", {
      id: e.id,
      expectedRevision: 1,
      action: "highlight",
      highlighted: true,
      note: "Promote",
    }),
  ).rejects.toMatchObject({ code: "handover_denied" });
  await app.change("lead-a", {
    id: e.id,
    expectedRevision: 1,
    action: "highlight",
    highlighted: true,
    note: "Important update",
  });
  expect(
    (
      await app.list("tech-a", { ...emptySelection, highlights: true })
    ).entries.map((e) => e.id),
  ).toContain(e.id);
  await app.change("lead-a", {
    id: e.id,
    expectedRevision: 2,
    action: "highlight",
    highlighted: false,
    note: "No longer current",
  });
  expect(
    (
      await app.list("tech-a", { ...emptySelection, highlights: true })
    ).entries.map((e) => e.id),
  ).not.toContain(e.id);
  expect((await app.history("tech-a", e.id)).revisions).toHaveLength(3);
  expect(
    (
      await app.list("tech-a", {
        ...emptySelection,
        from: "2026-09-29",
        to: "2026-09-29",
      })
    ).total,
  ).toBe(0);
  expect(
    (await app.list("tech-a", { ...emptySelection, state: "pending" })).total,
  ).toBeGreaterThan(0);
});
test("browser board, dialogs, equipment, matrix, meeting and follow-up work for all profiles", async () => {
  const { PlatformRuntime } = require("../../../apps/api/dist/host/runtime");
  const {
    SourceMappings,
  } = require("../../../apps/api/dist/modules/integrations");
  const {
    createApplication,
  } = require("../../../apps/api/dist/host/application");
  const { createServer, request: proxyRequest } = require("node:http");
  const { chromium, expect: pw } = require("@playwright/test");
  const runtime = new PlatformRuntime(
    new Pool({ ...configs.runtime, max: 5 }),
    {
      passwordAuthentication: true,
      handover: config,
      users: [{ id: "admin-a", name: "Administrator" }],
      origins: [],
      local: {
        organization: { id: "org-a" },
        site: { id: "site-a", organizationId: "org-a", timeZone: "UTC" },
        source: { id: "source-a", organizationId: "org-a", siteId: "site-a" },
      },
      mappings: new SourceMappings({
        organizationId: "org-a",
        siteId: "site-a",
        sourceId: "source-a",
        mappingRevision: "handover-test",
        sectors: [{ sectorKey: "sector-a", label: "Workshop" }],
        areas: [{ sourceArea: "Conveyor", sectorKey: "sector-a" }],
      }),
    },
  );
  let http, server, browser;
  try {
    await runtime.start();
    expect(
      await runtime.handover.equipmentChoices("tech-a", {
        departmentId: "department",
        areaId: "area",
        search: "",
        after: "",
      }),
    ).toEqual({ codes: [], nextCursor: "" });
    const bytes = Buffer.from(
      "\ufeffHäufigkeit;Dauer;Bereich;Betriebsmittelkennzeichen;Meldetext;Typ;Meldegruppe\r\n1;0 0:01:00;Conveyor;BROWSER-01;Synthetic check;01;001\r\n",
      "utf16le",
    );
    expect(
      (await runtime.submit("admin-a", "Hitliste-20260701.csv", bytes)).outcome,
    ).toBe("succeeded");
    http = await createApplication(runtime);
    await http.listen(0, "127.0.0.1");
    const port = http.getHttpServer().address().port;
    server = createServer((req, res) => {
      if (req.url.startsWith("/api/")) {
        const upstream = proxyRequest(
          {
            hostname: "127.0.0.1",
            port,
            path: req.url,
            method: req.method,
            headers: req.headers,
          },
          (r) => {
            res.writeHead(r.statusCode, r.headers);
            r.pipe(res);
          },
        );
        upstream.on("error", () => {
          res.writeHead(502);
          res.end();
        });
        req.pipe(upstream);
        return;
      }
      try {
        const path = new URL(req.url, "http://local").pathname;
        const name = path === "/" ? "index.html" : path.slice(1);
        if (name.includes("..")) throw Error();
        const bytes = readFileSync(
          join(__dirname, "../../../apps/web/dist", name),
        );
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
    const origin = `http://127.0.0.1:${server.address().port}`;
    runtime.config.origins.push(origin);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const button = (name) => page.getByRole("button", { name, exact: true });
    const login = async (id) => {
      await page.goto(origin);
      await page.getByLabel("Username", { exact: true }).fill(id);
      await page.getByLabel("Password", { exact: true }).fill(password);
      await button("Sign in").click();
      await pw(
        page.getByRole("region", {
          name: id === "admin-a" ? "Administration overview" : "Start page",
        }),
      ).toBeVisible();
    };
    const post = (path, data) =>
      page.request.post(origin + "/api/v1/handover/" + path, {
        data,
        headers: { Origin: origin, "X-IOP-Demo": "1" },
      });
    expect((await post("query", emptySelection)).status()).toBe(401);
    const analyticalRequests = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/v1/analytics/"))
        analyticalRequests.push(request.url());
    });
    await login("tech-a");
    await pw(button("Data analysis")).toHaveCount(0);
    await pw(button("Open Data Analysis")).toHaveCount(0);
    await pw(
      page.getByRole("region", { name: "Analytical summary" }),
    ).toHaveCount(0);
    expect(analyticalRequests).toEqual([]);
    const technicianContext = await (
      await page.request.get(origin + "/api/v1/session/context")
    ).json();
    expect(technicianContext.canReadAnalytics).toBe(false);
    expect(technicianContext.canImport).toBe(false);
    expect(
      (
        await page.request.get(origin + "/api/v1/analytics/availability")
      ).status(),
    ).toBe(403);
    expect(
      (
        await page.request.post(origin + "/api/v1/analytics/report", {
          data: {
            from: "2026-09-01",
            toExclusive: "2026-10-01",
            dimension: "sector",
            period: "month",
            metric: "frequency",
            filters: {},
            search: "",
            page: 1,
          },
          headers: { Origin: origin, "X-IOP-Demo": "1" },
        })
      ).status(),
    ).toBe(403);
    await page.screenshot({
      path: "/tmp/iop-171-technician-start.png",
      fullPage: true,
    });
    await pw(button("Administration")).toHaveCount(0);
    await button("Shift Handover").click();
    await button("Journal").click();
    await pw(page.getByLabel("Search", { exact: true })).toHaveCount(0);
    await page.getByLabel("Selected department").selectOption("department");
    await pw(button("Add Safety entry")).toBeVisible();
    mkdirSync("/tmp/iop-169-browser", { recursive: true });
    await page.screenshot({
      path: "/tmp/iop-169-browser/board-desktop.png",
      fullPage: true,
    });
    await button("Add Safety entry").click();
    await pw(
      page.getByRole("dialog", { name: "New handover entry" }),
    ).toBeVisible();
    await pw(page.getByLabel("Date", { exact: true })).toBeDisabled();
    await pw(page.getByLabel("Category", { exact: true })).toHaveValue(
      "safety",
    );
    await pw(
      page.getByLabel("Department / Halle", { exact: true }),
    ).toHaveValue("department");
    await page.keyboard.press("Escape");
    await pw(page.getByRole("dialog")).toHaveCount(0);
    await pw(button("Add Safety entry")).toBeFocused();
    await button("Add Safety entry").click();
    await page
      .getByLabel("Summary", { exact: true })
      .fill("Browser repair report");
    await page
      .getByLabel("Department / Halle", { exact: true })
      .selectOption("department");
    await page
      .getByLabel("Area / Bereich", { exact: true })
      .selectOption("area");
    await page
      .getByLabel("Betriebsmittelkennzeichen", { exact: true })
      .selectOption("BROWSER-01");
    await page
      .getByLabel("Reported condition", { exact: true })
      .selectOption("inspection-needed");
    await page.screenshot({
      path: "/tmp/iop-169-browser/create-desktop.png",
      fullPage: false,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "/tmp/iop-169-browser/create-mobile.png",
      fullPage: false,
    });
    expect(
      await page
        .getByRole("dialog")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.keyboard.press("Tab");
    expect(
      await page
        .getByRole("dialog")
        .evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page
      .getByText("Details, work reference and problem analysis", {
        exact: true,
      })
      .click();
    await page.getByLabel("Ultimo reference", { exact: true }).fill("000987");
    await page
      .getByLabel("Details", { exact: true })
      .fill("Inspect the replaced guard before next use.");
    await page.getByLabel("Track as an open issue", { exact: true }).check();
    await page
      .getByLabel("Responsible person", { exact: true })
      .selectOption("lead-a");
    await button("Publish update").click();
    await pw(
      page.getByRole("heading", { name: "Browser repair report", exact: true }),
    ).toBeVisible();
    const results = await (
      await post("query", {
        ...emptySelection,
        search: "Browser repair report",
      })
    ).json();
    const id = results.entries[0].id;
    const queryEquipment = (data) =>
      post("equipment", {
        departmentId: "department",
        areaId: "area",
        search: "",
        after: "",
        ...data,
      });
    expect((await (await queryEquipment({})).json()).codes).toEqual([
      "BROWSER-01",
    ]);
    expect((await queryEquipment({ areaId: "foreign" })).status()).toBe(400);
    expect((await queryEquipment({ search: "missing" })).status()).toBe(201);
    expect(
      (
        await post("entries", {
          key: randomUUID(),
          content: { ...results.entries[0].content, equipmentCode: "INVENTED" },
          issue: false,
          responsibleId: "",
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await post("entries", {
          key: randomUUID(),
          content: { ...results.entries[0].content, date: "2000-01-01" },
          issue: false,
          responsibleId: "",
        })
      ).status(),
    ).toBe(400);

    expect(
      (
        await post("change", {
          id,
          expectedRevision: 1,
          action: "highlight",
          highlighted: true,
          note: "Forbidden",
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await post("entries", {
          key: randomUUID(),
          content: {
            ...content(),
            date: new Date().toISOString().slice(0, 10),
            equipmentCode: "BROWSER-01",
          },
          issue: true,
          responsibleId: "other-site",
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await post("entries", {
          key: randomUUID(),
          content: content(),
          issue: false,
          responsibleId: "",
          authorId: "admin-a",
        })
      ).status(),
    ).toBe(400);
    await button("Correct entry").click();
    await page
      .getByLabel("Summary", { exact: true })
      .fill("Browser repair corrected");
    await page
      .getByLabel("Reason for correction", { exact: true })
      .fill("Clarify the description");
    await button("Save correction").click();
    await pw(
      page.getByRole("heading", {
        name: "Browser repair corrected",
        exact: true,
      }),
    ).toBeVisible();
    await button("Add follow-up").click();
    await page
      .getByLabel("Update / reason", { exact: true })
      .fill("Follow-up from the technician");
    await button("Save update").click();
    await pw(page.getByText(/Revision 3 · follow-up/)).toBeVisible();
    const artifacts = "/tmp/iop-169-browser";
    mkdirSync(artifacts, { recursive: true });
    await page.screenshot({
      path: join(artifacts, "detail-desktop.png"),
      fullPage: true,
    });
    await button("Equipment reference history").click();
    await pw(
      page.getByRole("button", { name: /Browser repair corrected/ }),
    ).toBeVisible();
    await button("My entries").click();
    await pw(
      page.getByRole("button", { name: /Browser repair corrected/ }),
    ).toBeVisible();
    await button("Department matrix").click();
    await pw(
      page.getByRole("table", { name: "Department handover matrix" }),
    ).toBeVisible();
    await page.reload();
    await button("Shift Handover").click();
    await button("Department matrix").click();
    await button("Search history").click();
    await page
      .getByLabel("Search", { exact: true })
      .fill("Browser repair corrected");
    await button("Search entries").click();
    await pw(
      page.getByRole("button", { name: /Browser repair corrected/ }),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: join(artifacts, "journal-mobile.png"),
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await button("User menu").click();
    await button("Sign out").click();
    await pw(
      page.getByRole("heading", { name: "Sign in to IOP" }),
    ).toBeVisible();
    await login("lead-a");
    await button("Notifications").click();
    const notificationPanel = page.getByRole("dialog", {
      name: "Notifications",
      exact: true,
    });
    await pw(
      notificationPanel.getByText("You're all caught up."),
    ).toBeVisible();
    const notificationContent = {
      ...content("Notification integration entry"),
      date: new Date().toISOString().slice(0, 10),
      categoryId: "people",
      departmentId: "",
      areaId: "",
      equipmentCode: "",
      condition: "",
    };
    await runtime.handover.create("admin-a", {
      key: randomUUID(),
      content: notificationContent,
      issue: false,
      responsibleId: "",
    });
    await runtime.handover.create("lead-a", {
      key: randomUUID(),
      content: {
        ...notificationContent,
        summary: "Own notification publication",
      },
      issue: false,
      responsibleId: "",
    });
    await button("Refresh notifications").click();
    await pw(
      notificationPanel.getByText("Notification integration entry"),
    ).toBeVisible();
    await pw(
      notificationPanel.getByText("Own notification publication"),
    ).toHaveCount(0);
    await pw(page.locator(".iop-notification-count")).toHaveText("1");
    await notificationPanel
      .getByRole("button", { name: /Notification integration entry/ })
      .click();
    await pw(
      page.getByRole("heading", { name: "Notification integration entry" }),
    ).toBeVisible();
    await button("Notifications").click();
    await button("Mark all as read").click();
    await pw(
      notificationPanel.getByText("You're all caught up."),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page
      .getByRole("navigation", { name: "Breadcrumb" })
      .getByRole("button", { name: "Shift Handover", exact: true })
      .click();
    await button("My entries").click();
    await page.getByLabel("Selected department").selectOption("department");
    const dayNote = {
      ...content("Daily overview note"),
      date: new Date().toISOString().slice(0, 10),
      categoryId: "people",
      departmentId: "",
      areaId: "",
      equipmentCode: "",
      condition: "",
    };
    expect(
      (
        await post("entries", {
          key: randomUUID(),
          content: dayNote,
          issue: false,
          responsibleId: "",
        })
      ).status(),
    ).toBe(201);
    await button("Daily overview").click();
    await pw(
      page.getByRole("heading", { name: "Daily overview", exact: true }),
    ).toBeVisible();
    await pw(page.getByLabel("Selected department")).not.toBeVisible();
    await pw(button("Meeting preparation")).toHaveCount(0);
    await pw(button("Browser repair corrected Workshop")).toBeVisible();
    await pw(button("Daily overview note Site-wide information")).toBeVisible();
    await pw(page.getByText(/Earlier and current open issues/)).toHaveCount(0);
    for (const category of config.categories)
      await pw(
        page.getByRole("region", { name: `${category.label} section` }),
      ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: join(artifacts, "daily-mobile.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
      path: join(artifacts, "daily-desktop.png"),
      fullPage: true,
    });
    await page.getByLabel("Overview date").fill("2026-09-28");
    await pw(button("Daily overview note Site-wide information")).toHaveCount(
      0,
    );
    await page.getByRole("button", { name: /More Problems entries/ }).click();
    await pw(button("Paging 0 Workshop")).toBeVisible();
    await button("Department matrix").click();
    await button("Search history").click();
    await page
      .getByLabel("Search", { exact: true })
      .fill("Browser repair corrected");
    await button("Search entries").click();
    await button("Browser repair corrected").click();
    await button("Add follow-up").click();
    await page
      .getByLabel("Update type", { exact: true })
      .selectOption("highlight");
    await page
      .getByLabel("Update / reason", { exact: true })
      .fill("Read before starting the shift");
    await button("Save update").click();
    await pw(page.getByText(/Revision 4 · highlight/)).toBeVisible();
    await button("Start").click();
    await page.getByText("Explore other departments", { exact: true }).click();
    await page.getByLabel("Browse departments").selectOption("department");
    await page
      .getByRole("navigation", { name: "Operational updates" })
      .getByRole("button", { name: /^Shift Handover/ })
      .click();
    await pw(
      page.getByRole("button", { name: /Browser repair corrected/ }).first(),
    ).toBeVisible();
    await page.screenshot({
      path: "/tmp/iop-169-browser/start-mobile.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: /Browser repair corrected/ })
      .first()
      .click();
    await pw(
      page.getByRole("heading", {
        name: "Browser repair corrected",
        exact: true,
      }),
    ).toBeVisible();
    await button("Close issue").click();
    await page
      .getByLabel("Issue state", { exact: true })
      .selectOption("resolved");
    await page
      .getByLabel("Resolution outcome", { exact: true })
      .fill("Checked with the incoming team");
    await button("Save update").click();
    await pw(page.getByText(/Revision 5 · follow-up/)).toBeVisible();
    await button("Add follow-up").click();
    await page
      .getByLabel("Update type", { exact: true })
      .selectOption("highlight");
    await page
      .getByLabel("Update / reason", { exact: true })
      .fill("Team informed");
    await button("Save update").click();
    await pw(page.getByText(/Revision 6 · highlight/)).toBeVisible();
    await button("Start").click();
    await page.getByText("Explore other departments", { exact: true }).click();
    await page.getByLabel("Browse departments").selectOption("department");
    await page
      .getByRole("navigation", { name: "Operational updates" })
      .getByRole("button", { name: /^Shift Handover/ })
      .click();
    await pw(
      page.getByRole("button", { name: /Browser repair corrected/ }),
    ).toHaveCount(0);
    for (const id of ["task-a", "admin-a"]) {
      await button("User menu").click();
      await button("Sign out").click();
      await pw(
        page.getByRole("heading", { name: "Sign in to IOP" }),
      ).toBeVisible();
      await login(id);
      await button("Shift Handover").click();
      await pw(
        page.getByRole("heading", { name: /^Shift Handover/ }).first(),
      ).toBeVisible();
    }
    await button("Meeting preparation").click();
    await pw(
      page.getByRole("heading", { name: "Meeting preparation", exact: true }),
    ).toBeVisible();
    await page.getByLabel("Meeting date", { exact: true }).fill("2026-09-27");
    await pw(page.getByText("No entries for this day.")).toHaveCount(6);
    await pw(button("Paging 22 Workshop")).not.toBeVisible();
    await page.getByText(/Department status ·/).click();
    await pw(button("Paging 22 Workshop")).toBeVisible();
    await page.getByLabel("Meeting date", { exact: true }).fill("2026-09-28");
    await pw(
      page
        .getByLabel("Daily category canvas")
        .getByRole("button", { name: "Paging 22 Workshop", exact: true }),
    ).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
      path: join(artifacts, "meeting-desktop.png"),
      fullPage: true,
    });
    expect(errors).toEqual([]);
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    if (http) await http.close();
    await runtime.close();
  }
}, 120000);

test("own history filters server-side across pages and attention excludes resolved issues", async () => {
  const first = await app.list("tech-a", {
    ...emptySelection,
    mine: true,
    search: "Paging",
  });
  const second = await app.list("tech-a", {
    ...emptySelection,
    mine: true,
    search: "Paging",
    cursor: first.nextCursor,
  });
  expect(first.total).toBe(23);
  expect([...first.entries, ...second.entries]).toHaveLength(23);
  expect(
    (
      await app.list("lead-a", {
        ...emptySelection,
        mine: true,
        search: "Paging",
      })
    ).total,
  ).toBe(0);
  const issue = await app.create("lead-a", {
    key: randomUUID(),
    content: {
      ...content("Attention test"),
      condition: "blocked",
      dueDate: "2000-01-01",
    },
    issue: true,
    responsibleId: "",
  });
  expect(
    (
      await app.list("tech-a", {
        ...emptySelection,
        attention: true,
        search: "Attention test",
      })
    ).total,
  ).toBe(1);
  const closed = await app.change("lead-a", {
    id: issue.id,
    expectedRevision: 1,
    action: "follow-up",
    state: "resolved",
    note: "Completed and checked",
  });
  expect(closed.latestUpdate.note).toBe("Completed and checked");
  expect(
    (
      await app.list("tech-a", {
        ...emptySelection,
        attention: true,
        search: "Attention test",
      })
    ).total,
  ).toBe(0);
  const history = await app.history("tech-a", issue.id);
  expect(history.revisions).toHaveLength(2);
  expect(history.revisions[1].entry.issueState).toBe("open");
});

// M6 uses the same independently provisioned two-organization fixture.
function workforceService(target = scope) {
  const {
    Workforce,
  } = require("../../../apps/api/dist/modules/workforce/application/workforce");
  const {
    PgWorkforce,
  } = require("../../../apps/api/dist/modules/workforce/adapters/postgres/store");
  const {
    IntlSiteClock,
  } = require("../../../apps/api/dist/modules/workforce/adapters/time/site-clock");
  const {
    ManualScheduleDecoder,
  } = require("../../../apps/api/dist/modules/integrations/adapters/schedule/decoder");
  const {
    workforcePeople,
  } = require("../../../apps/api/dist/modules/users-rbac/adapters/postgres/site-people");
  return new Workforce(
    new PgWorkforce(pool, target, {
      allowed: async (tx, actor, permission) =>
        (
          await evaluateSiteAccess(tx, {
            ...target,
            userId: actor,
            permissions: [permission],
          })
        ).allowed,
      people: (tx) => workforcePeople(tx, target.organizationId, target.siteId),
      names: (tx, ids) =>
        sitePersonNames(tx, target.organizationId, target.siteId, ids),
    }),
    new ManualScheduleDecoder(),
    new IntlSiteClock(),
    {
      shifts: [
        {
          id: "early",
          label: "Early",
          start: "05:00",
          end: "14:15",
          days: [1, 2, 3, 4, 5, 6, 0],
        },
      ],
      targets: [{ id: "zone", label: "Zone", phone: "phone" }],
      teams: [],
    },
    "UTC",
    () => new Date().toISOString(),
  );
}
test("M6 grants, import transaction, RLS, phone conflict and retained revisions", async () => {
  const workforce = workforceService();
  await expect(
    workforceService({ organizationId: "org-b", siteId: "site-b" }).board(
      "tech-a",
      "2026-09-30",
      "2026-09-30",
    ),
  ).rejects.toThrow();
  expect(
    (await workforce.board("tech-a", "2026-09-30", "2026-09-30")).canPlan,
  ).toBe(false);
  expect(
    (await workforce.board("lead-a", "2026-09-30", "2026-09-30")).canPlan,
  ).toBe(true);
  const input = {
    format: "csv",
    userId: "",
    text: "userId,date,status,start,end\ntech-a,2026-09-30,work,05:00,14:15\ntask-a,2026-09-30,work,05:00,14:15",
  };
  await expect(workforce.preview("lead-a", input)).rejects.toThrow();
  const preview = await workforce.preview("admin-a", input);
  expect(
    (await workforce.board("tech-a", "2026-09-30", "2026-09-30")).records,
  ).toHaveLength(0);
  expect(await workforce.import("admin-a", input, preview)).toEqual({
    changed: 2,
    unchanged: 0,
  });
  // PostgreSQL JSONB reorders object keys; semantic replay must remain a no-op.
  expect(await workforce.import("admin-a", input, preview)).toEqual({
    changed: 0,
    unchanged: 2,
  });
  expect(
    await workforce.history("admin-a", "schedule", "tech-a_2026-09-30"),
  ).toHaveLength(1);
  const assignment = {
    kind: "assignment",
    id: "m6-assignment",
    expectedRevision: 0,
    deleted: false,
    data: {
      userId: "tech-a",
      date: "2026-09-30",
      shiftId: "early",
      targetId: "zone",
      duty: "zone",
      phone: "zone",
      start: "05:00",
      end: "14:15",
      startsAt: "",
      endsAt: "",
    },
  };
  const other = {
    ...assignment,
    id: "m6-other",
    data: { ...assignment.data, userId: "task-a" },
  };
  const concurrent = await Promise.allSettled([
    workforce.save("lead-a", assignment),
    workforce.save("lead-a", other),
  ]);
  expect(concurrent.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const saved = concurrent.find((r) => r.status === "fulfilled").value;
  await expect(
    workforce.save("tech-a", { ...assignment, id: "denied" }),
  ).rejects.toThrow();
  await workforce.save("admin-a", {
    ...assignment,
    id: saved.id,
    expectedRevision: 1,
    deleted: true,
  });
  expect(
    await workforce.history("tech-a", "assignment", saved.id),
  ).toHaveLength(2);
  await db("runtime", async (c) => {
    expect(
      (await c.query("SELECT * FROM workforce.records")).rows,
    ).toHaveLength(0);
    await expect(c.query("DELETE FROM workforce.records")).rejects.toThrow();
  });
});
test("weekly schedules allow planners, reject readers and retain atomic revision history", async () => {
  const workforce = workforceService();
  const week = {
    userId: "tech-a",
    weekStart: "2026-11-02",
    days: [
      {
        date: "2026-11-02",
        status: "work",
        start: "05:00",
        end: "14:15",
        expectedRevision: 0,
      },
      {
        date: "2026-11-03",
        status: "off",
        start: "",
        end: "",
        expectedRevision: 0,
      },
    ],
  };
  await expect(workforce.saveWeek("tech-a", week)).rejects.toThrow();
  await expect(
    workforceService({ organizationId: "org-b", siteId: "site-b" }).saveWeek(
      "lead-a",
      week,
    ),
  ).rejects.toThrow();
  expect(await workforce.saveWeek("lead-a", week)).toEqual({
    changed: 2,
    unchanged: 0,
  });
  const revised = {
    ...week,
    days: week.days.map((day) => ({ ...day, expectedRevision: 1 })),
  };
  expect(await workforce.saveWeek("lead-a", revised)).toEqual({
    changed: 0,
    unchanged: 2,
  });
  revised.days[0].start = "06:00";
  revised.days[1].expectedRevision = 0;
  await expect(workforce.saveWeek("lead-a", revised)).rejects.toMatchObject({
    code: "workforce_conflict",
  });
  const history = await workforce.history(
    "tech-a",
    "schedule",
    "tech-a_2026-11-02",
  );
  expect(history).toHaveLength(1);
  expect(history[0]).toMatchObject({
    actorId: "lead-a",
    record: { data: { start: "05:00", source: "manual" } },
  });
});
test("matrix column filters combine before counts and cursor pagination, with literal references and exact assignees", async () => {
  const ids = [];
  for (let index = 0; index < 23; index++) {
    const entry = await app.create("admin-a", {
      key: randomUUID(),
      issue: true,
      responsibleId: "lead-a",
      content: {
        ...content(`Column filter ${index}`),
        externalReference: "REF_%_Exact",
        dueDate: "2026-10-15",
        condition: "blocked",
      },
    });
    ids.push(entry.id);
  }
  await app.create("admin-a", {
    key: randomUUID(),
    issue: true,
    responsibleId: "",
    content: {
      ...content("Unassigned column filter"),
      externalReference: "REF other",
      dueDate: "",
      condition: "repaired",
    },
  });
  const selection = {
    ...emptySelection,
    from: "2026-09-28",
    to: "2026-09-28",
    departmentId: "department",
    dueFrom: "2026-10-10",
    dueTo: "2026-10-20",
    responsibleId: "lead-a",
    externalReference: "_%_eXaCt",
    condition: "blocked",
    state: "pending",
  };
  const first = await app.list("tech-a", selection);
  expect(first.total).toBe(23);
  expect(first.entries).toHaveLength(20);
  const second = await app.list("tech-a", {
    ...selection,
    cursor: first.nextCursor,
  });
  expect(second.total).toBe(23);
  expect(second.entries).toHaveLength(3);
  expect(
    new Set([...first.entries, ...second.entries].map((entry) => entry.id)),
  ).toEqual(new Set(ids));
  for (const change of [
    { responsibleId: "task-a" },
    { dueFrom: "2026-10-16" },
    { dueTo: "2026-10-14" },
    { condition: "repaired" },
    { externalReference: "' OR true --" },
    { state: "resolved" },
  ])
    expect((await app.list("tech-a", { ...selection, ...change })).total).toBe(
      0,
    );
  const unassigned = await app.list("tech-a", {
    ...emptySelection,
    responsibleId: "",
    externalReference: "REF other",
  });
  expect(unassigned.total).toBe(1);
  expect(unassigned.entries[0].responsibleId).toBe("");
  expect(
    (
      await app.list("tech-a", {
        ...emptySelection,
        responsibleId: "",
        externalReference: "REF other",
        dueFrom: "2026-01-01",
      })
    ).total,
  ).toBe(0);
});

test("IOP-196 partitions urgent reports, counts resolution revisions and notifies mentioned people on updates", async () => {
  let at = "2026-09-20T12:00:00.000Z";
  const service196 = service(scope, pool, { now: () => at });
  const create = (summary, extra = {}) => service196.create("lead-a", {
    key: randomUUID(), issue: true, responsibleId: "tech-a",
    content: { ...content(`IOP-196 ${summary}`), date: "2026-09-20", dueDate: "2099-01-01", feedbackDueDate: "", ...extra },
  });
  const ordinary = await create("Routine inspection");
  const urgent = await create("Blocked equipment", { condition: "blocked" });
  const selected = { ...emptySelection, departmentId: "department", search: "IOP-196", state: "pending" };
  expect((await service196.list("tech-a", { ...selected, attention: true })).entries.map((e) => e.id)).toEqual([urgent.id]);
  expect((await service196.list("tech-a", { ...selected, excludeAttention: true })).entries.map((e) => e.id)).toEqual([ordinary.id]);
  at = "2026-09-25T12:00:00.000Z";
  const closed = await service196.change("lead-a", { id: ordinary.id, expectedRevision: 1, action: "state", state: "resolved", note: "Inspection complete" });
  at = "2026-10-06T12:00:00.000Z";
  await service196.change("lead-a", { id: closed.id, expectedRevision: closed.revision, action: "state", state: "open", note: "Additional check" });
  const month = { ...emptySelection, search: "IOP-196", resolvedFrom: "2026-09-01", resolvedTo: "2026-09-30", resolvedForMe: true };
  expect((await service196.list("tech-a", month)).total).toBe(1);
  expect((await service196.list("lead-a", month)).total).toBe(0);
  expect((await service196.list("tech-a", { ...month, resolvedFrom: "2026-10-01", resolvedTo: "2026-10-31" })).total).toBe(0);
  const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlVQAAAAASUVORK5CYII=";
  const infoContent = { ...content("IOP-196 Information"), date: "2026-10-06", categoryId: "information", mentionIds: ["tech-a"], images: [{ name: "Inspection.png", dataUrl: png }] };
  await expect(service196.create("tech-a", { key: randomUUID(), issue: false, responsibleId: "", content: infoContent })).rejects.toMatchObject({ code: "handover_denied" });
  const information = await service196.create("lead-a", { key: randomUUID(), issue: false, responsibleId: "", content: infoContent });
  at = "2026-10-06T12:01:00.000Z";
  const corrected = await service196.change("lead-a", { id: information.id, expectedRevision: 1, action: "correct", content: { ...infoContent, summary: "IOP-196 Updated Information" }, note: "Updated meeting information" });
  const notices = await service196.list("tech-a", { ...emptySelection, search: "IOP-196", notificationsAfter: information.createdAt });
  expect(notices.entries).toHaveLength(1);
  expect(notices.entries[0]).toMatchObject({ id: corrected.id, notificationAt: at, content: { images: [{ dataUrl: png }] } });
  expect((await service196.list("lead-a", { ...emptySelection, search: "IOP-196", notificationsAfter: information.createdAt })).total).toBe(0);
  const durable = await service(scope, pool).history("tech-a", information.id);
  expect(durable.revisions).toHaveLength(2);
  expect(durable.revisions[1].entry.content.images[0].dataUrl).toBe(png);
});

test("administrator logical deletion retains author name, journal history and audit; final administrator is protected", async () => {
  const entry = await publish("Retained author after profile removal");
  await expect(access.users.remove("tech-a", "task-a")).rejects.toThrow();
  await expect(access.users.remove("admin-a", "admin-a")).rejects.toMatchObject(
    { code: "last_administrator" },
  );
  await access.users.remove("admin-a", "tech-a");
  expect(
    (await access.users.list("admin-a")).some((u) => u.id === "tech-a"),
  ).toBe(false);
  const history = await app.history("admin-a", entry.id);
  expect(history.entry.authorName).toBe("tech-a");
  expect(history.revisions).toHaveLength(1);
  await expect(app.context("tech-a")).rejects.toThrow();
  await expect(
    app.remove("lead-a", entry.id, entry.revision),
  ).rejects.toMatchObject({ code: "handover_denied" });
  await app.remove("admin-a", entry.id, entry.revision);
  expect(
    (
      await app.list("admin-a", {
        ...emptySelection,
        search: "Retained author after profile removal",
      })
    ).entries,
  ).toHaveLength(0);
  expect((await app.history("admin-a", entry.id)).revisions).toHaveLength(2);
});

test("renames resolve through scoped account IDs in operational reads, including disabled and deleted profiles, while history stays unchanged", async () => {
  const { user } = await access.users.create("admin-a", {
    name: "Original operator",
    username: "rename.operator",
    profile: "technician",
  });
  const entry = await app.create(user.id, {
    key: randomUUID(),
    content: content("Current account identity"),
    issue: true,
    responsibleId: user.id,
  });
  await app.change(user.id, {
    id: entry.id,
    action: "follow-up",
    expectedRevision: 1,
    note: "Original follow-up",
  });
  await app.change("admin-a", {
    id: entry.id,
    action: "highlight",
    expectedRevision: 2,
    highlighted: true,
    note: "Discuss next shift",
  });
  const workforce = workforceService();
  const input = {
    format: "csv",
    userId: "",
    text: `userId,date,status,start,end\n${user.id},2026-12-01,work,05:00,14:15`,
  };
  await workforce.import(
    "admin-a",
    input,
    await workforce.preview("admin-a", input),
  );
  await workforce.save("admin-a", {
    kind: "assignment",
    id: "rename-assignment",
    expectedRevision: 0,
    deleted: false,
    data: {
      userId: user.id,
      date: "2026-12-01",
      shiftId: "early",
      targetId: "zone",
      duty: "zone",
      phone: "zone",
      start: "05:00",
      end: "14:15",
      startsAt: "",
      endsAt: "",
    },
  });
  const originalHistory = (await app.history("admin-a", entry.id)).revisions;
  await access.users.rename("admin-a", user.id, "Current operator");
  const checkCurrent = async () => {
    const current = (
      await app.list("admin-a", {
        ...emptySelection,
        search: "Current account identity",
      })
    ).entries[0];
    expect(current).toMatchObject({
      authorId: user.id,
      authorName: "Current operator",
      responsibleName: "Current operator",
      latestUpdate: { actorName: "Current operator" },
    });
    const history = await app.history("admin-a", entry.id);
    expect(history.entry).toEqual(current);
    expect(history.revisions).toEqual(originalHistory);
    const board = await workforce.board("admin-a", "2026-12-01", "2026-12-01");
    const records = board.records.filter(
      (record) => record.data.userId === user.id,
    );
    expect(records).toHaveLength(2);
    expect(
      records.every((record) => record.personName === "Current operator"),
    ).toBe(true);
    expect(
      (await workforce.history("admin-a", "assignment", "rename-assignment"))[0]
        .record.personName,
    ).toBe("Original operator");
    return board;
  };
  await checkCurrent();
  await access.users.change("admin-a", user.id, "technician", false);
  expect(
    (await checkCurrent()).people.some((person) => person.id === user.id),
  ).toBe(false);
  await access.users.remove("admin-a", user.id);
  expect(
    (await checkCurrent()).people.some((person) => person.id === user.id),
  ).toBe(false);
  await runSiteOperation(
    pool,
    { ...scope, userId: "admin-a", permissions: ["handover.read"] },
    async (tx) => {
      const names = await sitePersonNames(
        tx,
        scope.organizationId,
        scope.siteId,
        [user.id, "other-site", "admin-b"],
      );
      expect([...names]).toEqual([[user.id, "Current operator"]]);
      expect(await sitePersonNames(tx, "org-b", "site-b", ["admin-b"])).toEqual(
        new Map(),
      );
    },
  );
});

test("notification queries exclude self and deleted entries, preserve scope and page backdated publications by creation time", async () => {
  const create = (actor, summary, date = "2026-09-28", target = app) =>
    target.create(actor, {
      key: randomUUID(),
      content: { ...content(`Notification query fixture: ${summary}`), date },
      issue: false,
      responsibleId: "",
    });
  const baseline = await create("lead-a", "Notification baseline");
  const published = [];
  for (let i = 0; i < 22; i++)
    published.push(
      await create(
        "lead-a",
        `Notification ${i}`,
        i % 2 ? "2026-09-01" : "2026-09-27",
      ),
    );
  await create("admin-a", "Notification own publication");
  const removed = await create("lead-a", "Notification removed");
  await app.remove("admin-a", removed.id, removed.revision);
  const other = service({ organizationId: "org-b", siteId: "site-b" });
  await create(
    "admin-b",
    "Notification another organization",
    "2026-09-28",
    other,
  );
  const selection = {
    ...emptySelection,
    notificationsAfter: baseline.createdAt,
    search: "Notification query fixture:",
  };
  const first = await app.list("admin-a", selection);
  expect(first.total).toBe(22);
  expect(first.entries).toHaveLength(20);
  expect(first.entries[0].id).toBe(published[21].id);
  expect(first.entries[0].content.date).toBe("2026-09-01");
  const second = await app.list("admin-a", {
    ...selection,
    cursor: first.nextCursor,
  });
  expect(second.total).toBe(22);
  expect(
    [...first.entries, ...second.entries].map((entry) => entry.id),
  ).toEqual(published.reverse().map((entry) => entry.id));
  expect(second.nextCursor).toBe("");
  expect(
    (
      await app.list("admin-a", {
        ...selection,
        notificationsAfter: first.entries[0].createdAt,
      })
    ).total,
  ).toBe(0);
  expect((await other.list("admin-b", selection)).total).toBe(0);
  await expect(app.list("other-site", selection)).rejects.toThrow(
    "Site operation is not permitted.",
  );
});

test("operational matrix applies configured carry-forward, publication day and resolution before pagination", async () => {
  let instant = "2026-09-27T21:59:59.000Z";
  const matrix = service(scope, pool, {
    timeZone: "Europe/Zurich",
    now: () => instant,
  });
  const create = async (categoryId, label, issue = false) =>
    matrix.create("admin-a", {
      key: randomUUID(),
      content: {
        ...content(`Matrix policy fixture: ${label}`),
        categoryId,
        date: "2026-09-01",
      },
      issue,
      responsibleId: "",
    });
  const expected = [];
  for (let i = 0; i < 22; i++) {
    const entry = await create(
      i % 2 ? "problems" : "performance",
      `ongoing ${i}`,
      true,
    );
    if (i === 0)
      await matrix.change("admin-a", {
        id: entry.id,
        expectedRevision: 1,
        action: "state",
        state: "in-progress",
        note: "Work started",
      });
    expected.push(entry.id);
  }
  const closed = await create("problems", "closed", true);
  await matrix.change("admin-a", {
    id: closed.id,
    expectedRevision: 1,
    action: "state",
    state: "resolved",
    note: "Work completed",
  });
  await create("performance", "not an issue");
  for (const category of ["safety", "information", "successes", "people"])
    await create(category, `old ${category}`, true);
  // UTC still says the previous day, but publication is on today's site-local date.
  instant = "2026-09-27T22:00:00.000Z";
  for (const category of ["safety", "information", "successes", "people"])
    expected.push((await create(category, `today ${category}`)).id);
  const closedToday = await create("safety", "closed today", true);
  await matrix.change("admin-a", {
    id: closedToday.id,
    expectedRevision: 1,
    action: "state",
    state: "resolved",
    note: "Completed today",
  });
  instant = "2026-09-28T10:00:00.000Z";
  const selection = {
    ...emptySelection,
    departmentMatrix: true,
    search: "Matrix policy fixture:",
    departmentId: "department",
  };
  const first = await matrix.list("admin-a", selection);
  expect(first.total).toBe(26);
  expect(first.entries).toHaveLength(20);
  const second = await matrix.list("admin-a", {
    ...selection,
    cursor: first.nextCursor,
  });
  expect(second.total).toBe(26);
  expect(second.entries).toHaveLength(6);
  expect(second.nextCursor).toBe("");
  expect([...first.entries, ...second.entries].map((e) => e.id).sort()).toEqual(
    expected.sort(),
  );
  expect(
    (await matrix.list("admin-a", { ...selection, categoryId: "information" }))
      .total,
  ).toBe(1);
  expect(
    (
      await matrix.list("admin-a", {
        ...selection,
        departmentMatrix: false,
        categoryId: "information",
      })
    ).total,
  ).toBe(2);
  expect(
    (await matrix.list("admin-a", { ...selection, state: "resolved" })).total,
  ).toBe(0);
  expect(
    (
      await matrix.list("admin-a", {
        ...selection,
        departmentMatrix: false,
        state: "resolved",
      })
    ).total,
  ).toBe(2);
  expect(
    (await matrix.list("admin-a", { ...selection, departmentId: "unknown" }))
      .total,
  ).toBe(0);
  instant = "2026-09-28T22:00:00.000Z";
  expect((await matrix.list("admin-a", selection)).total).toBe(22);
  await expect(matrix.list("other-site", selection)).rejects.toThrow(
    "Site operation is not permitted.",
  );
});

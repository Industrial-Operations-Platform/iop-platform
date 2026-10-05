const { PostgreSqlContainer } = require("@testcontainers/postgresql");
const { Client, Pool } = require("pg");
const { randomUUID } = require("node:crypto");
const { mkdtempSync, readdirSync, copyFileSync, rmSync } = require("node:fs");
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
  Maintenance,
} = require("../../../apps/api/dist/modules/maintenance/application/maintenance");
const {
  PgMaintenance,
} = require("../../../apps/api/dist/modules/maintenance/adapters/postgres/store");
const {
  maintenanceTimeline,
} = require("../../../apps/api/dist/modules/maintenance/adapters/postgres/asset-history");
const {
  Assets,
} = require("../../../apps/api/dist/modules/assets/application/assets");
const {
  PgAssets,
  assetReference,
  assetReferences,
} = require("../../../apps/api/dist/modules/assets/adapters/postgres/store");
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
  composeAccess,
} = require("../../../apps/api/dist/host/access-composition");
const {
  handoverMaintenanceIssues,
  pendingHandoverMaintenanceIssues,
  resolveHandoverMaintenanceIssues,
} = require("../../../apps/api/dist/modules/shift-handover/adapters/postgres/maintenance-issues");
const scope = { organizationId: "org-a", siteId: "site-a" };
const locations = [
  {
    id: "department",
    label: "Workshop",
    parentId: "",
    role: "department",
    sectorKey: "",
  },
  {
    id: "area",
    label: "Drive line",
    parentId: "department",
    role: "area",
    sectorKey: "",
  },
];
const priorities = [
  { id: "normal", label: "Normal", rank: 1 },
  { id: "urgent", label: "Urgent", rank: 2 },
];
let container, configs, pool, app, asset, access;
let tick = 0;
const now = () =>
  new Date(Date.parse("2026-10-05T12:00:00.000Z") + tick++).toISOString();
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
function service(target = scope, connection = pool, clock = now) {
  return new Maintenance(
    new PgMaintenance(connection, target, {
      allowed: (tx, actor, permission) =>
        allowed(tx, target, actor, permission),
      people: (tx) => sitePeople(tx, target.organizationId, target.siteId),
      names: (tx, ids) =>
        sitePersonNames(tx, target.organizationId, target.siteId, ids),
      teams: async () => [{ id: "team", label: "Mechanical team" }],
      assets: (tx) => assetReferences(tx, target),
      asset: (tx, id) => assetReference(tx, target, id),
      related: (tx, issueScope, selection) =>
        handoverMaintenanceIssues(tx, target, {
          scope: issueScope,
          ...selection,
        }),
      pending: (tx, issueScope) =>
        pendingHandoverMaintenanceIssues(tx, target, issueScope),
      resolve: (tx, resolutions, evidence) =>
        resolveHandoverMaintenanceIssues(tx, target, resolutions, evidence),
    }),
    locations,
    priorities,
    clock,
  );
}
function assetService(target = scope) {
  return new Assets(
    new PgAssets(pool, target, {
      allowed: (tx, actor, permission) =>
        allowed(tx, target, actor, permission),
      names: (tx, ids) =>
        sitePersonNames(tx, target.organizationId, target.siteId, ids),
      sources: [],
    }),
    locations,
    "UTC",
    randomUUID,
    now,
  );
}
function request(title = "Inspect drive", id = randomUUID()) {
  return {
    id,
    expectedRevision: 0,
    reason: "",
    data: {
      title,
      details: "Recorded inspection",
      locationId: "area",
      assetId: asset?.id ?? "",
      priorityId: "normal",
      assigneeId: "tech-a",
      teamId: "team",
      status: "open",
      dueDate: "2026-10-07",
      outcome: "",
      blockedReason: "",
      externalReference: "00123",
    },
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
  const directory = mkdtempSync(
    join(tmpdir(), "iop-194-maintenance-migrations-"),
  );
  try {
    for (const file of readdirSync(join(__dirname, "../migrations")).filter(
      (file) => file.endsWith(".sql") && file < "20261005010000",
    ))
      copyFileSync(
        join(__dirname, "../migrations", file),
        join(directory, file),
      );
    await migrate(configs.migrator, directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
  for (const [organizationId, siteId, users] of [
    [
      "org-a",
      "site-a",
      [
        ["admin-a", "administrator"],
        ["tech-a", "technician"],
        ["task-a", "task-force"],
        ["lead-a", "team-leader"],
        ["disabled-a", "technician"],
        ["revoked-a", "technician"],
        ["asset-revoked-a", "task-force"],
      ],
    ],
    ["org-a", "site-a2", [["other-site", "technician"]]],
    [
      "org-b",
      "site-b",
      [
        ["admin-b", "administrator"],
        ["lead-b", "team-leader"],
      ],
    ],
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
          "INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active) VALUES($1,$2,$3,'handover-contributor',true)",
          [organizationId, id, siteId],
        );
        if (["administrator", "team-leader"].includes(profile))
          await client.query(
            "INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active) VALUES($1,$2,$3,'handover-coordinator',true)",
            [organizationId, id, siteId],
          );
        if (profile === "administrator")
          await client.query(
            "INSERT INTO users_rbac.organization_role_assignments VALUES($1,$2,'organization-access-admin',true)",
            [organizationId, id],
          );
        if (id === "disabled-a")
          await client.query(
            "UPDATE users_rbac.organization_memberships SET is_active=false WHERE organization_id=$1 AND user_id=$2",
            [organizationId, id],
          );
        if (id === "revoked-a")
          await client.query(
            "UPDATE users_rbac.site_role_assignments SET is_active=false WHERE organization_id=$1 AND user_id=$2",
            [organizationId, id],
          );
      });
    }
  }
  const operational = mkdtempSync(
    join(tmpdir(), "iop-194-operational-migrations-"),
  );
  try {
    for (const file of readdirSync(join(__dirname, "../migrations")).filter(
      (file) => file.endsWith(".sql") && file < "20261005040000",
    ))
      copyFileSync(
        join(__dirname, "../migrations", file),
        join(operational, file),
      );
    await migrate(configs.migrator, operational);
  } finally {
    rmSync(operational, { recursive: true, force: true });
  }
  await db("bootstrap", async (client) => {
    await client.query(
      "UPDATE users_rbac.site_role_assignments SET is_active=false WHERE user_id='asset-revoked-a' AND role_id='assets-reader'",
    );
    await client.query(
      "INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active) VALUES('org-a','asset-revoked-a','site-a','assets-administrator',false)",
    );
    const legacy = {
      id: "legacy_completion",
      revision: 3,
      data: {
        ...request().data,
        title: "Legacy completion migration",
        status: "done",
        outcome: "Original repair",
      },
      authorId: "lead-a",
      authorName: "Leader",
      createdAt: "2026-08-31T12:00:00.000Z",
      updatedAt: "2026-10-05T12:00:00.000Z",
      locationLabel: "Drive line",
      assetName: "",
      priorityLabel: "Normal",
      assigneeName: "Technician",
      teamLabel: "Mechanical",
    };
    await client.query(
      "INSERT INTO maintenance.records(organization_id,site_id,id,revision,status,priority_id,location_id,assignee_id,team_id,author_id,updated_at,snapshot) VALUES('org-a','site-a',$1,3,'done','normal','area','tech-a','team','lead-a',$2,$3)",
      [legacy.id, legacy.updatedAt, JSON.stringify(legacy)],
    );
    for (const [revision, at, action, status] of [
      [1, legacy.createdAt, "created", "open"],
      [2, "2026-09-01T12:00:00.000Z", "status-changed", "done"],
      [3, legacy.updatedAt, "updated", "done"],
    ])
      await client.query(
        "INSERT INTO maintenance.revisions(organization_id,site_id,id,revision,actor_id,at,snapshot) VALUES('org-a','site-a',$1,$2,'lead-a',$3,$4)",
        [
          legacy.id,
          revision,
          at,
          JSON.stringify({
            record: { ...legacy, revision, data: { ...legacy.data, status } },
            actorId: "lead-a",
            actorName: "Leader",
            at,
            action,
            reason: "Legacy evidence",
          }),
        ],
      );
  });
  await migrate(configs.migrator);
  await provision(configs);
  pool = new Pool({ ...configs.runtime, max: 5 });
  app = service();
  access = composeAccess(pool, scope);
  asset = await assetService().save("lead-a", {
    key: "fixture-asset",
    id: "",
    expectedRevision: 0,
    note: "",
    content: {
      code: "DRIVE-001",
      name: "Drive",
      type: "Motor",
      locationId: "area",
      status: "validated",
      validationNote: "Synthetic registration verified",
      description: "",
      aliases: [],
    },
  });
}, 90000);
afterAll(async () => {
  if (pool) await pool.end();
  if (container) await container.stop();
});
test("safe migration grants operational profiles, preserves disabled/revoked access and exact directories", async () => {
  for (const actor of ["admin-a", "tech-a", "task-a", "lead-a"]) {
    const catalog = await app.catalog(actor);
    expect(catalog.canContribute).toBe(true);
    expect(catalog.canCoordinate).toBe(actor === "lead-a");
    expect(catalog.canAdminister).toBe(actor === "admin-a");
    expect(catalog.people.map((p) => p.id)).not.toContain("other-site");
    expect(catalog.people.map((p) => p.id)).not.toContain("disabled-a");
  }
  for (const actor of ["disabled-a", "revoked-a"])
    await expect(app.catalog(actor)).rejects.toThrow("not permitted");
  await expect(
    service({ organizationId: "org-b", siteId: "site-b" }).catalog("tech-a"),
  ).rejects.toThrow("not permitted");
  expect(
    (
      await db("bootstrap", (client) =>
        client.query(
          "SELECT role_id FROM users_rbac.site_role_assignments WHERE user_id IN ('disabled-a','revoked-a') AND role_id LIKE 'maintenance-%'",
        ),
      )
    ).rows,
  ).toEqual([]);
  expect(await migrate(configs.migrator)).toBe(0);
  await provision(configs);
});
test("Asset access is limited to Team Leader/Task Force and migration preserves explicit revocation", async () => {
  for (const actor of ["admin-a", "tech-a", "asset-revoked-a"])
    await expect(assetService().context(actor)).rejects.toThrow(
      "not permitted",
    );
  for (const actor of ["lead-a", "task-a"])
    expect((await assetService().context(actor)).canManage).toBe(true);
  expect(
    (
      await db("bootstrap", (client) =>
        client.query(
          "SELECT role_id,is_active FROM users_rbac.site_role_assignments WHERE user_id='asset-revoked-a' AND role_id LIKE 'assets-%' ORDER BY role_id",
        ),
      )
    ).rows,
  ).toEqual([
    { role_id: "assets-administrator", is_active: false },
    { role_id: "assets-reader", is_active: false },
  ]);
  expect((await app.catalog("admin-a")).canCoordinate).toBe(false);
  expect(
    (await app.history("tech-a", "legacy_completion")).record.completedAt,
  ).toBe("2026-09-01T12:00:00.000Z");
  expect(
    (await app.query("task-a", { search: "Legacy completion migration" }))
      .total,
  ).toBe(0);
  expect(
    (
      await app.query("task-a", {
        search: "Legacy completion migration",
        history: true,
      })
    ).total,
  ).toBe(1);
});
test("concurrent creation retries are idempotent, stale changes conflict, restart retains snapshots", async () => {
  const input = request("Concurrent inspection");
  const created = await Promise.all([
    app.save("lead-a", input),
    app.save("lead-a", input),
  ]);
  expect(created[0].id).toBe(created[1].id);
  expect((await app.history("task-a", input.id)).revisions).toHaveLength(1);
  await expect(
    app.save("tech-a", {
      ...input,
      data: { ...input.data, title: "Different retry" },
    }),
  ).rejects.toMatchObject({ code: "maintenance_conflict" });
  const changes = await Promise.allSettled([
    app.save("tech-a", {
      ...input,
      expectedRevision: 1,
      reason: "Worker started",
      data: { ...input.data, status: "in-progress" },
    }),
    app.save("lead-a", {
      ...input,
      expectedRevision: 1,
      reason: "Part unavailable",
      data: {
        ...input.data,
        status: "blocked",
        blockedReason: "Awaiting replacement",
      },
    }),
  ]);
  expect(
    changes.filter((result) => result.status === "fulfilled"),
  ).toHaveLength(1);
  expect(
    changes.find((result) => result.status === "rejected").reason.code,
  ).toBe("maintenance_conflict");
  const restart = new Pool({ ...configs.runtime, max: 1 });
  try {
    expect(
      (await service(scope, restart).history("task-a", input.id)).record
        .revision,
    ).toBe(2);
  } finally {
    await restart.end();
  }
});
test("filters apply before exact totals and stable cursor pages; configured ancestors include areas", async () => {
  for (let index = 0; index < 27; index++)
    await app.save(
      "lead-a",
      request(
        `Paging fixture ${index}`,
        `paging_${String(index).padStart(2, "0")}`,
      ),
    );
  const selection = {
    search: "Paging fixture",
    locationId: "department",
    assetId: asset?.id ?? "",
    assigneeId: "tech-a",
    teamId: "team",
    priorityId: "normal",
    dueFrom: "2026-10-07",
    dueTo: "2026-10-07",
    limit: 10,
  };
  const records = [];
  let cursor = "";
  do {
    const page = await app.query("task-a", { ...selection, cursor });
    expect(page.total).toBe(27);
    expect(page.statusCounts.open).toBe(27);
    records.push(...page.records);
    cursor = page.nextCursor;
  } while (cursor);
  expect(records).toHaveLength(27);
  expect(new Set(records.map((record) => record.id)).size).toBe(27);
  expect(
    (await app.query("task-a", { ...selection, assigneeId: "other-site" }))
      .total,
  ).toBe(0);
  await expect(
    app.query("task-a", { ...selection, cursor: "invalid" }),
  ).rejects.toMatchObject({ code: "invalid_maintenance" });
  const completed = records[0];
  await app.save("lead-a", {
    id: completed.id,
    expectedRevision: 1,
    reason: "Inspection completed",
    data: { ...completed.data, status: "done", outcome: "Checked and tested" },
  });
  const page = await app.query("task-a", { ...selection, status: "done" });
  expect(page.total).toBe(1);
  expect(page.statusCounts.open).toBe(26);
  expect(page.statusCounts.done).toBe(1);
});
test("ownership, protected assignment, outcomes and configured priorities are enforced", async () => {
  const input = request("Ownership fixture");
  await app.save("lead-a", input);
  await expect(
    app.save("task-a", {
      ...input,
      expectedRevision: 1,
      reason: "Unrelated correction",
    }),
  ).rejects.toMatchObject({ code: "maintenance_denied" });
  await expect(
    app.save("tech-a", {
      ...input,
      expectedRevision: 1,
      reason: "Protected reassignment",
      data: { ...input.data, assigneeId: "task-a" },
    }),
  ).rejects.toMatchObject({ code: "maintenance_denied" });
  expect(() =>
    app.save("lead-a", {
      ...input,
      expectedRevision: 1,
      reason: "Invalid completion",
      data: { ...input.data, status: "done" },
    }),
  ).toThrow("invalid_maintenance");
  await app.save("lead-a", {
    ...input,
    expectedRevision: 1,
    reason: "Inspection completed",
    data: { ...input.data, status: "done", outcome: "Drive inspected" },
  });
  await expect(
    app.configure("lead-a", { expectedRevision: 0, priorities }),
  ).rejects.toThrow("not permitted");
  const config = await app.configure("admin-a", {
    expectedRevision: 0,
    priorities: [...priorities, { id: "low", label: "Low", rank: 0 }],
  });
  expect(config.revision).toBe(1);
  await expect(
    app.configure("admin-a", {
      expectedRevision: 1,
      priorities: [priorities[1]],
    }),
  ).rejects.toMatchObject({ code: "maintenance_conflict" });
  expect(
    (await app.history("tech-a", input.id)).revisions[0].record.data.outcome,
  ).toBe("Drive inspected");
});
test("RLS and narrow grants deny unscoped/delete/revision mutations; composite references reject foreign site", async () => {
  const record = await app.save("lead-a", request("Scoped FK fixture"));
  for (const table of [
    "records",
    "revisions",
    "settings",
    "settings_revisions",
  ])
    expect(
      (await pool.query(`SELECT * FROM maintenance.${table}`)).rows,
    ).toEqual([]);
  await expect(pool.query("DELETE FROM maintenance.records")).rejects.toThrow();
  await expect(
    pool.query("UPDATE maintenance.revisions SET snapshot=snapshot"),
  ).rejects.toThrow();
  const context = {
    ...scope,
    userId: "tech-a",
    permissions: ["maintenance.contribute"],
  };
  await expect(
    runSiteOperation(pool, context, (tx) =>
      tx.query(
        "UPDATE maintenance.records SET assignee_id='other-site' WHERE organization_id=$1 AND site_id=$2 AND id=$3",
        [scope.organizationId, scope.siteId, record.id],
      ),
    ),
  ).rejects.toThrow();
  const other = await assetService({
    organizationId: "org-b",
    siteId: "site-b",
  }).save("lead-b", {
    key: "foreign-asset",
    id: "",
    expectedRevision: 0,
    note: "",
    content: {
      code: "OTHER-001",
      name: "Other drive",
      type: "",
      locationId: "area",
      status: "unverified",
      validationNote: "",
      description: "",
      aliases: [],
    },
  });
  await expect(
    app.save("lead-a", {
      ...request("Foreign asset"),
      data: { ...record.data, assetId: other.id },
    }),
  ).rejects.toMatchObject({ code: "invalid_maintenance" });
  await expect(
    runSiteOperation(pool, context, (tx) =>
      tx.query(
        "UPDATE maintenance.records SET asset_id=$4 WHERE organization_id=$1 AND site_id=$2 AND id=$3",
        [scope.organizationId, scope.siteId, record.id, other.id],
      ),
    ),
  ).rejects.toThrow();
  const security = await db("bootstrap", (client) =>
    client.query(
      "SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE relnamespace='maintenance'::regnamespace AND relkind='r'",
    ),
  );
  expect(security.rows).toHaveLength(4);
  expect(
    security.rows.every((row) => row.relrowsecurity && row.relforcerowsecurity),
  ).toBe(true);
});
test("failed revision insertion rolls back its current projection in the actual adapter", async () => {
  const input = request("Atomic append fixture");
  await app.save("lead-a", input);
  await db("bootstrap", (client) =>
    client.query(
      "INSERT INTO maintenance.revisions(organization_id,site_id,id,revision,asset_id,actor_id,at,snapshot) SELECT organization_id,site_id,id,2,asset_id,actor_id,at,snapshot FROM maintenance.revisions WHERE id=$1 AND revision=1",
      [input.id],
    ),
  );
  await expect(
    app.save("tech-a", {
      ...input,
      expectedRevision: 1,
      reason: "Append collision",
      data: { ...input.data, title: "Must roll back" },
    }),
  ).rejects.toThrow();
  expect((await app.history("tech-a", input.id)).record).toMatchObject({
    revision: 1,
    data: { title: "Atomic append fixture" },
  });
  await db("bootstrap", (client) =>
    client.query(
      "DELETE FROM maintenance.revisions WHERE id=$1 AND revision=2",
      [input.id],
    ),
  );
});
test("asset history exposes exact source revisions, inclusive local days and whole matching totals", async () => {
  const context = {
    ...scope,
    userId: "tech-a",
    permissions: ["maintenance.read"],
  };
  const selection = {
    from: "2026-10-05",
    to: "2026-10-05",
    cursor: null,
    limit: 10,
    timeZone: "Europe/Zurich",
  };
  const page = await runSiteOperation(pool, context, (tx) =>
    maintenanceTimeline(tx, scope, asset.id, selection),
  );
  expect(page.total).toBeGreaterThan(27);
  expect(page.records).toHaveLength(10);
  expect(
    page.records.every(
      (record) =>
        record.kind === "maintenance" &&
        record.date === "2026-10-05" &&
        record.recordedAt.endsWith("Z"),
    ),
  ).toBe(true);
  const last = page.records.at(-1);
  const next = await runSiteOperation(pool, context, (tx) =>
    maintenanceTimeline(tx, scope, asset.id, { ...selection, cursor: last }),
  );
  expect(next.total).toBe(page.total);
  expect(
    new Set([...page.records, ...next.records].map((record) => record.id)).size,
  ).toBe(20);
});
test("profile creation, demotion, rename and revocation retain history without stale authorization", async () => {
  const created = await access.users.create("admin-a", {
    name: "Original worker",
    username: "maintenance.worker",
    profile: "team-leader",
  });
  expect((await app.catalog(created.user.id)).canCoordinate).toBe(true);
  const input = {
    ...request("Retained account fixture"),
    data: { ...request().data, assigneeId: created.user.id },
  };
  await app.save(created.user.id, input);
  await access.users.rename("admin-a", created.user.id, "Current worker");
  const renamed = await app.history("admin-a", input.id);
  expect(renamed.record.authorName).toBe("Current worker");
  expect(renamed.revisions[0].record.authorName).toBe("Original worker");
  await access.users.change("admin-a", created.user.id, "technician", true);
  expect((await app.catalog(created.user.id)).canCoordinate).toBe(false);
  await access.users.change("admin-a", created.user.id, "technician", false);
  await expect(app.catalog(created.user.id)).rejects.toThrow("not permitted");
  expect((await app.history("admin-a", input.id)).record.authorName).toBe(
    "Current worker",
  );
});
test("direct timeline calls enforce source permission and exact transaction scope", async () => {
  const query = {
    from: "2026-10-05",
    to: "2026-10-05",
    cursor: null,
    limit: 10,
    timeZone: "UTC",
  };
  const context = { ...scope, userId: "task-a", permissions: ["assets.read"] };
  await expect(
    runSiteOperation(pool, context, (tx) =>
      maintenanceTimeline(
        tx,
        { organizationId: "org-b", siteId: "site-b" },
        asset.id,
        query,
      ),
    ),
  ).rejects.toThrow("not permitted");
  await db("bootstrap", (client) =>
    client.query(
      "UPDATE users_rbac.site_role_assignments SET is_active=false WHERE user_id='task-a' AND role_id='maintenance-contributor'",
    ),
  );
  try {
    await expect(
      runSiteOperation(pool, context, (tx) =>
        maintenanceTimeline(tx, scope, asset.id, query),
      ),
    ).rejects.toThrow("not permitted");
  } finally {
    await db("bootstrap", (client) =>
      client.query(
        "UPDATE users_rbac.site_role_assignments SET is_active=true WHERE user_id='task-a' AND role_id='maintenance-contributor'",
      ),
    );
  }
});

test("closed-work weeks use completion time, preserve unfinished work, and support explicit history", async () => {
  const old = service(scope, pool, () => "2026-09-01T12:00:00.000Z");
  for (const status of ["open", "in-progress", "blocked"]) {
    const input = request("Completion window " + status, "window_" + status);
    const created = await old.save("lead-a", input);
    if (status !== "open")
      await old.save("tech-a", {
        id: created.id,
        expectedRevision: 1,
        reason: "Old unfinished work",
        data: {
          ...created.data,
          status,
          blockedReason: status === "blocked" ? "Awaiting parts" : "",
        },
      });
  }
  const input = request("Completion window old done", "window_old_done");
  const created = await old.save("lead-a", input);
  const completed = await old.save("tech-a", {
    id: created.id,
    expectedRevision: 1,
    reason: "Earlier repair",
    data: { ...created.data, status: "done", outcome: "Cassette repaired" },
  });
  const edited = await app.save("tech-a", {
    id: completed.id,
    expectedRevision: 2,
    reason: "Later documentary correction",
    data: {
      ...completed.data,
      details: "Correction preserves real completion day",
    },
  });
  expect(edited.completedAt).toBe("2026-09-01T12:00:00.000Z");
  for (const [id, at] of [
    ["window_current_done", "2026-10-11T12:00:00.000Z"],
    ["window_future_done", "2026-10-12T12:00:00.000Z"],
  ]) {
    const clock = service(scope, pool, () => at);
    const made = await clock.save(
      "lead-a",
      request("Completion window " + id, id),
    );
    await clock.save("tech-a", {
      id: made.id,
      expectedRevision: 1,
      reason: "Completed repair",
      data: { ...made.data, status: "done", outcome: "Tested" },
    });
  }
  const current = await app.query("task-a", { search: "Completion window" });
  expect(current.total).toBe(4);
  expect(current.statusCounts).toEqual({
    open: 1,
    "in-progress": 1,
    blocked: 1,
    done: 1,
  });
  expect(
    (await app.query("task-a", { search: "Completion window", history: true }))
      .total,
  ).toBe(6);
  const previous = await app.query("task-a", {
    search: "Completion window",
    doneFrom: "2026-09-01",
    doneTo: "2026-09-30",
  });
  expect(previous.total).toBe(4);
  expect(
    previous.records.find((record) => record.id === "window_old_done")
      .completedAt,
  ).toBe(completed.completedAt);
});

test("assignment feeds enforce current actor, retain work independently of the checkpoint, and ignore ordinary edits", async () => {
  const input = request("Assignment feed fixture", "assignment_feed");
  const created = await app.save("lead-a", input);
  const initial = await app.assignments("tech-a", {});
  const event = initial.events.find((event) => event.recordId === created.id);
  expect(event.revision).toBe(1);
  await app.save("tech-a", {
    id: created.id,
    expectedRevision: 1,
    reason: "Started repair",
    data: { ...created.data, status: "in-progress" },
  });
  const updated = await app.assignments("tech-a", {});
  expect(updated.events.find((next) => next.recordId === created.id)).toEqual(
    event,
  );
  const checked = await app.assignments("tech-a", {
    after: "2026-10-06T00:00:00.000Z",
  });
  expect(
    checked.events.find((next) => next.recordId === created.id),
  ).toBeUndefined();
  expect(checked.records.some((record) => record.id === created.id)).toBe(true);
  const reassigned = await app.save("lead-a", {
    id: created.id,
    expectedRevision: 2,
    reason: "Reassigned specialist",
    data: { ...created.data, assigneeId: "task-a" },
  });
  expect(
    (await app.assignments("tech-a", {})).records.some(
      (record) => record.id === created.id,
    ),
  ).toBe(false);
  expect(
    (await app.assignments("task-a", {})).events.find(
      (next) => next.recordId === created.id,
    ).revision,
  ).toBe(reassigned.revision);
});

test("Maintenance asset timelines match exact multiple equipment aliases without duplicate revisions", async () => {
  const target = {
    namespace: "site-equipment",
    code: "=11+11.11.02-B102.1",
    departmentId: "department",
    areaId: "area",
  };
  const input = request("Multi-code timeline fixture", "multi_code_timeline");
  await app.save("lead-a", {
    ...input,
    data: {
      ...input.data,
      equipment: [target, { ...target, code: "=11+11.11.02-B102.2" }],
    },
  });
  const query = {
    from: "2026-10-05",
    to: "2026-10-05",
    cursor: null,
    limit: 100,
    timeZone: "UTC",
  };
  const read = (aliases) =>
    runSiteOperation(
      pool,
      { ...scope, userId: "tech-a", permissions: ["maintenance.read"] },
      (tx) => maintenanceTimeline(tx, scope, "unlinked-asset", query, aliases),
    );
  const matches = await read([
    target,
    { ...target, code: "=11+11.11.02-B102.2" },
  ]);
  expect(
    matches.records.filter((record) => record.sourceRecordId === input.id),
  ).toHaveLength(1);
  expect((await read([{ ...target, code: "=11+11.11.02-b102.1" }])).total).toBe(
    0,
  );
  expect((await read([{ ...target, areaId: "" }])).total).toBe(0);
});

function journalService(codes) {
  const {
    Handover,
  } = require("../../../apps/api/dist/modules/shift-handover/application/handover");
  const {
    PgHandover,
  } = require("../../../apps/api/dist/modules/shift-handover/adapters/postgres/store");
  return new Handover(
    new PgHandover(pool, scope, {
      allowed: (tx, actor, permission) => allowed(tx, scope, actor, permission),
      people: (tx) => sitePeople(tx, scope.organizationId, scope.siteId),
      names: (tx, ids) =>
        sitePersonNames(tx, scope.organizationId, scope.siteId, ids),
      equipment: async () => ({ codes, nextCursor: "" }),
    }),
    {
      locations,
      timeZone: "UTC",
      categories: [{ id: "problems", label: "Problems" }],
      externalSystemLabel: "External reference",
    },
    randomUUID,
    now,
  );
}
async function journalIssue(journal, code, summary) {
  return journal.create("task-a", {
    key: randomUUID(),
    issue: true,
    responsibleId: "task-a",
    content: {
      date: "2026-10-05",
      categoryId: "problems",
      summary,
      details:
        "Cassette mechanism stopped; selected sensor reports the affected zone",
      departmentId: "department",
      areaId: "area",
      equipmentCode: code,
      equipmentNamespace: "site-equipment",
      condition: "blocked",
      externalReference: "00123",
      challenge: "",
      cause: "",
      measure: "",
      dueDate: "",
      feedbackDueDate: "",
      discuss: true,
    },
  });
}
function scopedWork(id, equipment, linkedEntries) {
  return {
    ...request("Integrated repair " + id, id),
    data: {
      ...request().data,
      assetId: "",
      category: "corrective",
      repairTarget: "Cassette directional mechanism",
      equipment: equipment.map((code) => ({
        namespace: "site-equipment",
        code,
        departmentId: "department",
        areaId: "area",
      })),
      linkedEntries,
    },
  };
}
test("real Maintenance completion resolves only reviewed included Handover issues and attributes both histories to the assigned worker", async () => {
  const codes = [
    "=11+11.11.02-B102.1",
    "=11+11.11.02-B102.2",
    "=11+11.11.02-B103.1",
  ];
  const journal = journalService(codes);
  const included = await journalIssue(
    journal,
    codes[0],
    "Included sensor indicates failed cassette",
  );
  const excluded = await journalIssue(
    journal,
    codes[1],
    "Excluded motor needs another repair",
  );
  const unrelated = await journalIssue(
    journal,
    codes[2],
    "Unrelated conveyor fault",
  );
  const input = scopedWork("integrated_completion", codes.slice(0, 2), [
    {
      id: included.id,
      expectedRevision: 1,
      disposition: "include",
      reason: "",
    },
    {
      id: excluded.id,
      expectedRevision: 1,
      disposition: "exclude",
      reason: "Motor repair is outside the cassette replacement",
    },
  ]);
  const created = await app.save("lead-a", input);
  const related = await app.related("tech-a", {
    locationId: "area",
    equipment: input.data.equipment,
  });
  expect(related.entries.map((entry) => entry.id).sort()).toEqual(
    [included.id, excluded.id].sort(),
  );
  await expect(
    journal.change("tech-a", {
      id: included.id,
      expectedRevision: 1,
      action: "state",
      state: "resolved",
      note: "No global state authority",
    }),
  ).rejects.toMatchObject({ code: "handover_denied" });
  const completed = await app.save("tech-a", {
    id: created.id,
    expectedRevision: 1,
    reason: "Cassette replaced",
    data: {
      ...created.data,
      status: "done",
      outcome: "Cassette replaced and direction change tested",
    },
  });
  expect(completed.data.status).toBe("done");
  const source = await journal.history("tech-a", included.id);
  expect(source.entry.issueState).toBe("resolved");
  expect(source.revisions[0]).toMatchObject({
    actorId: "tech-a",
    action: "state",
  });
  expect(source.revisions[0].note).toContain(created.id);
  expect((await journal.history("tech-a", excluded.id)).entry).toMatchObject({
    issueState: "open",
    revision: 1,
  });
  expect((await journal.history("tech-a", unrelated.id)).entry).toMatchObject({
    issueState: "open",
    revision: 1,
  });
  expect((await app.history("task-a", created.id)).revisions[0]).toMatchObject({
    actorId: "tech-a",
    action: "status-changed",
  });
});
test("a stale reviewed Handover revision blocks real completion without changing either owner", async () => {
  const code = "=11+11.11.02-B104.1";
  const journal = journalService([code]);
  const issue = await journalIssue(journal, code, "Stale review fixture");
  const input = scopedWork(
    "integrated_stale",
    [code],
    [{ id: issue.id, expectedRevision: 1, disposition: "include", reason: "" }],
  );
  const work = await app.save("lead-a", input);
  await journal.change("task-a", {
    id: issue.id,
    expectedRevision: 1,
    action: "follow-up",
    note: "New fault evidence after scope review",
  });
  await expect(
    app.save("tech-a", {
      id: work.id,
      expectedRevision: 1,
      reason: "Stale completion",
      data: { ...work.data, status: "done", outcome: "Repair tested" },
    }),
  ).rejects.toMatchObject({ code: "maintenance_conflict" });
  expect((await app.history("tech-a", work.id)).record).toMatchObject({
    revision: 1,
    data: { status: "open" },
  });
  expect((await journal.history("tech-a", issue.id)).entry).toMatchObject({
    revision: 2,
    issueState: "open",
  });
});
test("a failed Maintenance append after owner resolution rolls back both actual PostgreSQL modules", async () => {
  const code = "=11+11.11.02-B105.1";
  const journal = journalService([code]);
  const issue = await journalIssue(journal, code, "Rollback repair fixture");
  const input = scopedWork(
    "integrated_rollback",
    [code],
    [{ id: issue.id, expectedRevision: 1, disposition: "include", reason: "" }],
  );
  const work = await app.save("lead-a", input);
  const broken = new Maintenance(
    {
      run: (actor, permission, callback) =>
        service(scope).store.run(actor, permission, (tx) => {
          tx.save = async () => {
            throw new Error(
              "Synthetic own revision failure after delegated resolution",
            );
          };
          return callback(tx);
        }),
    },
    locations,
    priorities,
    now,
  );
  await expect(
    broken.save("tech-a", {
      id: work.id,
      expectedRevision: 1,
      reason: "Completion must be atomic",
      data: { ...work.data, status: "done", outcome: "Cassette tested" },
    }),
  ).rejects.toThrow("Synthetic own revision failure");
  expect((await app.history("tech-a", work.id)).record).toMatchObject({
    revision: 1,
    data: { status: "open" },
  });
  expect((await journal.history("tech-a", issue.id)).entry).toMatchObject({
    revision: 1,
    issueState: "open",
  });
  expect((await journal.history("tech-a", issue.id)).revisions).toHaveLength(1);
});

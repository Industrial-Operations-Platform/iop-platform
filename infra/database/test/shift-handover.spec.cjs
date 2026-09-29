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
} = require("../../../apps/api/dist/modules/users-rbac/adapters/postgres/site-people");
const {
  evaluateSiteAccess,
} = require("../../../apps/api/dist/modules/users-rbac");
const {
  runSiteOperation,
} = require("../../../apps/api/dist/persistence/site-operation");
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
function service(target = scope, connection = pool) {
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
    equipment: async () => ({ codes: ["0001"], nextCursor: "" }),
  });
  return new Handover(
    store,
    handoverCatalog({ ...config, ...target }, target, "UTC"),
    randomUUID,
    () =>
      new Date(
        Date.parse("2026-09-28T12:00:00.000Z") + clockTick++,
      ).toISOString(),
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
  expect(await migrate(configs.migrator)).toBe(2);
  await provision(configs);
  pool = new Pool({ ...configs.runtime, max: 5 });
  app = service();
  access = composeAccess(pool, scope);
}, 90000);
afterAll(async () => {
  if (pool) await pool.end();
  if (container) await container.stop();
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
      await pw(page.getByRole("region", { name: "Start page" })).toBeVisible();
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
    await pw(button("Browser repair corrected")).toBeVisible();
    await button("My entries").click();
    await pw(button("Browser repair corrected")).toBeVisible();
    await button("Department matrix").click();
    await pw(
      page.getByRole("table", { name: "Department handover matrix" }),
    ).toBeVisible();
    await page.reload();
    await button("Shift Handover").click();
    await button("Search history").click();
    await page
      .getByLabel("Search", { exact: true })
      .fill("Browser repair corrected");
    await button("Search entries").click();
    await pw(button("Browser repair corrected")).toBeVisible();
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
    await button("Sign out").click();
    await login("lead-a");
    await button("Shift Handover").click();
    await page.getByLabel("Selected department").selectOption("department");
    await button("My entries").click();
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
    await pw(page.getByLabel("Selected department")).toHaveCount(0);
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
    await button("Journal").click();
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
    await pw(button("Browser repair corrected").first()).toBeVisible();
    await page.screenshot({
      path: "/tmp/iop-169-browser/start-mobile.png",
      fullPage: true,
    });
    await button("Browser repair corrected").first().click();
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
    await pw(button("Browser repair corrected")).toHaveCount(0);
    for (const id of ["task-a", "admin-a"]) {
      await button("Sign out").click();
      await login(id);
      await button("Shift Handover").click();
      await pw(
        page.getByRole("heading", { name: "Shift Handover", exact: true }),
      ).toBeVisible();
    }
    await button("Meeting preparation").click();
    await pw(
      page.getByRole("heading", { name: "Meeting preparation", exact: true }),
    ).toBeVisible();
    await page.getByLabel("Meeting date", { exact: true }).fill("2026-09-27");
    await pw(page.getByText("No entries for this day.")).toHaveCount(6);
    await pw(button("Paging 22 Workshop")).not.toBeVisible();
    await page.getByText(/Earlier and current open issues/).click();
    await pw(button("Paging 22 Workshop")).toBeVisible();
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

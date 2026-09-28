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
      sectorKey: "sector-a",
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
  });
  return new Handover(
    store,
    handoverCatalog({ ...config, ...target }, target, "UTC"),
    randomUUID,
    () => new Date().toISOString(),
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
      (f) => f.endsWith(".sql") && !f.includes("shift-handover"),
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
  expect(await migrate(configs.migrator)).toBe(1);
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
test("browser journal, matrix, meeting, correction and highlights work for all profiles without analytical imports", async () => {
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
    await login("tech-a");
    await pw(button("Administration")).toHaveCount(0);
    await button("Shift Handover").click();
    await button("New entry").click();
    await page
      .getByLabel("Summary", { exact: true })
      .fill("Browser repair report");
    await page
      .getByLabel("Department / Halle", { exact: true })
      .selectOption("department");
    await page
      .getByLabel("Area / Bereich", { exact: true })
      .selectOption("area");
    await page.getByLabel("Equipment code", { exact: true }).fill("BROWSER-01");
    await page
      .getByLabel("Reported condition", { exact: true })
      .selectOption("inspection-needed");
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
          content: content(),
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
    await page
      .getByLabel("Note / reason", { exact: true })
      .fill("Follow-up from the technician");
    await button("Save update").click();
    await pw(page.getByText(/Revision 3 · follow-up/)).toBeVisible();
    const artifacts = "/tmp/iop-168-browser";
    mkdirSync(artifacts, { recursive: true });
    await page.screenshot({
      path: join(artifacts, "detail-desktop.png"),
      fullPage: true,
    });
    await button("Equipment reference history").click();
    await pw(button("Browser repair corrected")).toBeVisible();
    await button("Department matrix").click();
    await pw(
      page.getByRole("table", { name: "Department handover matrix" }),
    ).toBeVisible();
    await page.reload();
    await button("Shift Handover").click();
    await page
      .getByLabel("Search", { exact: true })
      .fill("Browser repair corrected");
    await button("Apply filters").click();
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
    await page
      .getByLabel("Search", { exact: true })
      .fill("Browser repair corrected");
    await button("Apply filters").click();
    await button("Browser repair corrected").click();
    await page
      .getByLabel("Update type", { exact: true })
      .selectOption("highlight");
    await page
      .getByLabel("Note / reason", { exact: true })
      .fill("Read before starting the shift");
    await button("Save update").click();
    await pw(page.getByText(/Revision 4 · highlight/)).toBeVisible();
    await button("Start").click();
    await pw(button("Browser repair corrected")).toBeVisible();
    await button("Browser repair corrected").click();
    await pw(
      page.getByRole("heading", {
        name: "Browser repair corrected",
        exact: true,
      }),
    ).toBeVisible();
    await page.getByLabel("Update type", { exact: true }).selectOption("state");
    await page
      .getByLabel("Issue state", { exact: true })
      .selectOption("resolved");
    await page
      .getByLabel("Resolution outcome", { exact: true })
      .fill("Checked with the incoming team");
    await button("Save update").click();
    await pw(page.getByText(/Revision 5 · state/)).toBeVisible();
    await page
      .getByLabel("Update type", { exact: true })
      .selectOption("highlight");
    await page
      .getByLabel("Note / reason", { exact: true })
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
      page.getByRole("heading", {
        name: "Open issues across dates",
        exact: true,
      }),
    ).toBeVisible();
    await page.getByLabel("From", { exact: true }).fill("2026-09-29");
    await page.getByLabel("Through", { exact: true }).fill("2026-09-29");
    await button("Apply filters").click();
    await pw(page.getByText("0 matching entries · Showing 0", {exact:true})).toBeVisible();
    await pw(button("Paging 22")).toBeVisible();
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

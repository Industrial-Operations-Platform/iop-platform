const { PostgreSqlContainer } = require("@testcontainers/postgresql");
const { Client, Pool } = require("pg");
const { provision } = require("../dist/provision");
const { migrate } = require("../dist/migrate");
const { provisioningConfiguration } = require("../dist/configuration");
const { seedOrganization } = require("../dist/seed-organization");
const { seedSite } = require("../dist/seed-site");
const { seedUser } = require("../dist/seed-user");
const { seedMembership } = require("../dist/seed-membership");
const {
  composeAccess,
} = require("../../../apps/api/dist/host/access-composition");
const {
  NodePasswords,
} = require("../../../apps/api/dist/modules/authentication/adapters/node-crypto");
const {
  runSiteOperation,
} = require("../../../apps/api/dist/persistence/site-operation");
let container, configs, pool, access, other;
const initial = "Synthetic initial password 165";
const chosen = "Synthetic chosen password 165";
async function clientWork(role, work) {
  const client = new Client(configs[role]);
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}
async function login(application, username, password = chosen) {
  return application.authentication.login({ username, password });
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
  expect(await migrate(configs.migrator)).toBe(17);
  await provision(configs);
  const hash = await new NodePasswords().hash(initial);
  for (const suffix of ["a", "b"]) {
    const org = "org-" + suffix,
      site = "site-" + suffix,
      user = "admin-" + suffix;
    const seed = {
      ...env,
      IOP_SEED_ORGANIZATION_ID: org,
      IOP_SEED_ORGANIZATION_NAME: "Synthetic organization",
      IOP_SEED_SITE_ID: site,
      IOP_SEED_SITE_NAME: "Synthetic site",
      IOP_SEED_SITE_TIME_ZONE: "UTC",
      IOP_SEED_USER_ID: user,
    };
    await seedOrganization(seed);
    await seedSite(seed);
    await seedUser(seed);
    await seedMembership(seed);
    await clientWork("migrator", async (c) => {
      await c.query("BEGIN");
      await c.query(
        "SELECT set_config('iop.access_organization_id',$1,true),set_config('iop.access_site_id',$2,true),set_config('iop.access_write','1',true)",
        [org, site],
      );
      await c.query(
        "INSERT INTO users_rbac.profiles(organization_id,user_id,site_id,display_name,profile) VALUES($1,$2,$3,'Administrator','administrator')",
        [org, user, site],
      );
      await c.query(
        "INSERT INTO authentication.credentials(organization_id,user_id,username,password_hash) VALUES($1,$2,'admin',$3)",
        [org, user, hash],
      );
      await c.query(
        "INSERT INTO users_rbac.organization_role_assignments(organization_id,user_id,role_id,is_active) VALUES($1,$2,'organization-access-admin',true)",
        [org, user],
      );
      await c.query("COMMIT");
    });
  }
  pool = new Pool({ ...configs.runtime, max: 5 });
  access = composeAccess(pool, { organizationId: "org-a", siteId: "site-a" });
  other = composeAccess(pool, { organizationId: "org-b", siteId: "site-b" });
}, 90000);
afterAll(async () => {
  if (pool) await pool.end();
  if (container) await container.stop();
});

test("mandatory password change, current-secret check, session revocation and stable identity", async () => {
  const token = await login(access, "admin", initial);
  await expect(access.authentication.principal(token)).rejects.toMatchObject({
    code: "password_change_required",
  });
  expect(await access.authentication.principal(token, true)).toEqual({
    userId: "admin-a",
    mustChangePassword: true,
  });
  await expect(
    access.authentication.changePassword(token, "wrong", chosen),
  ).rejects.toMatchObject({ code: "invalid_credentials" });
  await expect(
    access.authentication.changePassword(token, initial, initial),
  ).rejects.toMatchObject({ code: "invalid_password" });
  await access.authentication.changePassword(token, initial, chosen);
  await expect(
    access.authentication.principal(token, true),
  ).rejects.toMatchObject({ code: "session_required" });
  const current = await login(access, "admin");
  expect(await access.authentication.principal(current)).toEqual({
    userId: "admin-a",
    mustChangePassword: false,
  });
  await expect(other.authentication.principal(current)).rejects.toMatchObject({
    code: "session_required",
  });
  await access.authentication.logout(current);
  await expect(access.authentication.principal(current)).rejects.toMatchObject({
    code: "session_required",
  });
});

test("browser login, first password change, profiles, logout and direct HTTP denials", async () => {
  const { PlatformRuntime } = require("../../../apps/api/dist/host/runtime");
  const {
    SourceMappings,
  } = require("../../../apps/api/dist/modules/integrations");
  const {
    createApplication,
  } = require("../../../apps/api/dist/host/application");
  const { createServer, request: proxyRequest } = require("node:http");
  const { readFileSync, mkdirSync } = require("node:fs");
  const { join } = require("node:path");
  const { chromium, expect: pw } = require("@playwright/test");
  const runtime = new PlatformRuntime(
    new Pool({ ...configs.runtime, max: 5 }),
    {
      passwordAuthentication: true,
      users: [{ id: "admin-a", name: "Administrator" }],
      origins: [],
      local: {
        organization: { id: "org-a" },
        site: { id: "site-a", organizationId: "org-a", timeZone: "UTC" },
        source: { id: "source-a", siteId: "site-a", organizationId: "org-a" },
      },
      mappings: new SourceMappings({
        organizationId: "org-a",
        siteId: "site-a",
        sourceId: "source-a",
        mappingRevision: "access-v1",
        sectors: [{ sectorKey: "sector-a", label: "Sector A" }],
        areas: [{ sourceArea: "Area A", sectorKey: "sector-a" }],
      }),
    },
  );
  let app, server, browser;
  try {
    await runtime.start();
    app = await createApplication(runtime);
    await app.listen(0, "127.0.0.1");
    const port = app.getHttpServer().address().port;
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
          (response) => {
            res.writeHead(response.statusCode, response.headers);
            response.pipe(res);
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
        if (name.includes("..")) throw new Error();
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
      viewport: { width: 1440, height: 900 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const button = (name) => page.getByRole("button", { name, exact: true });
    const post = (path, data) =>
      page.request.post(origin + "/api/v1" + path, {
        data,
        headers: { Origin: origin, "X-IOP-Demo": "1" },
      });
    await page.goto(origin);
    await pw(
      page.getByRole("heading", { name: "Sign in to IOP" }),
    ).toBeVisible();
    await pw(page.getByLabel("Demo user")).toHaveCount(0);
    expect((await post("/demo/user", { userId: "admin-a" })).status()).toBe(
      403,
    );
    expect((await page.request.get(origin + "/api/v1/users")).status()).toBe(
      401,
    );
    expect(
      (
        await page.request.post(origin + "/api/v1/auth/login", {
          data: { username: "admin", password: chosen },
          headers: { Origin: "http://untrusted.invalid", "X-IOP-Demo": "1" },
        })
      ).status(),
    ).toBe(403);
    await page.getByLabel("Username", { exact: true }).fill("admin");
    await page.getByLabel("Password", { exact: true }).fill(chosen);
    await button("Sign in").click();
    await button("Administration").click();
    await button("Users & profiles").click();
    await pw(
      page.getByRole("heading", { name: "Users & profiles" }),
    ).toBeVisible();
    const choices = await page
      .getByLabel("Profile", { exact: true })
      .locator("option")
      .allTextContents();
    expect(choices).toEqual([
      "Administrator",
      "Technician",
      "Task Force",
      "Team Leader",
    ]);
    await page.getByLabel("Name", { exact: true }).fill("Browser colleague");
    await page
      .getByLabel("Username", { exact: true })
      .fill("browser-colleague");
    await page
      .getByLabel("Profile", { exact: true })
      .selectOption("team-leader");
    await button("Create user").click();
    const credential = page
      .getByRole("region", { name: "Initial credentials" })
      .locator("code");
    await pw(credential).toBeVisible();
    const secret = await credential.textContent();
    await button("Dismiss initial password").click();
    const artifacts = "/tmp/iop-165-access-browser";
    mkdirSync(artifacts, { recursive: true });
    await page.screenshot({
      path: join(artifacts, "profiles-desktop.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 375, height: 850 });
    await pw(
      page.getByRole("heading", { name: "Users & profiles" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: join(artifacts, "profiles-mobile.png"),
      fullPage: true,
    });
    await button("Sign out").click();
    await pw(
      page.getByRole("heading", { name: "Sign in to IOP" }),
    ).toBeVisible();
    await page
      .getByLabel("Username", { exact: true })
      .fill("browser-colleague");
    await page.getByLabel("Password", { exact: true }).fill(secret);
    await button("Sign in").click();
    await pw(
      page.getByRole("heading", { name: "Choose your own password" }),
    ).toBeVisible();
    expect((await page.request.get(origin + "/api/v1/users")).status()).toBe(
      403,
    );
    await page
      .getByLabel("Current initial password", { exact: true })
      .fill(secret);
    await page.getByLabel("New password", { exact: true }).fill(chosen);
    await page.getByLabel("Confirm new password", { exact: true }).fill(chosen);
    await button("Change password").click();
    await pw(
      page.getByRole("heading", { name: "Sign in to IOP" }),
    ).toBeVisible();
    await page
      .getByLabel("Username", { exact: true })
      .fill("browser-colleague");
    await page.getByLabel("Password", { exact: true }).fill(chosen);
    await button("Sign in").click();
    await pw(page.getByRole("region", { name: "Start page" })).toBeVisible();
    await pw(button("Users & profiles")).toHaveCount(0);
    await pw(button("Administration")).toHaveCount(0);
    expect((await page.request.get(origin + "/api/v1/users")).status()).toBe(
      403,
    );
    expect(
      (
        await post("/users", {
          name: "Escalation",
          username: "escalation",
          profile: "administrator",
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await page.request.post(origin + "/api/v1/imports", {
          data: Buffer.from("denied"),
          headers: {
            Origin: origin,
            "X-IOP-Demo": "1",
            "Content-Type": "application/octet-stream",
            "X-CSV-Filename": "Hitliste-20260701.csv",
          },
        })
      ).status(),
    ).toBe(403);
    await button("Sign out").click();
    expect((await page.request.get(origin + "/api/v1/users")).status()).toBe(
      401,
    );
    expect(errors).toEqual([]);
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    if (app) await app.close();
    await runtime.close();
  }
});

test("scoped name editing preserves identity, session, permissions and an audit trail", async () => {
  const created = await access.users.create("admin-a", {
    name: "Before",
    username: "rename-tech",
    profile: "technician",
  });
  const id = created.user.id;
  const token = await login(access, "rename-tech", created.initialPassword);
  await access.authentication.changePassword(
    token,
    created.initialPassword,
    chosen,
  );
  const session = await login(access, "rename-tech");
  await access.users.rename(id, id, "  After  ");
  expect(await access.users.self(id)).toMatchObject({
    id,
    name: "After",
    profile: "technician",
    username: "rename-tech",
  });
  expect(await access.authentication.principal(session)).toMatchObject({
    userId: id,
  });
  await expect(
    access.users.rename(id, "admin-a", "Forbidden"),
  ).rejects.toMatchObject({ code: "access_denied" });
  await expect(
    other.users.rename("admin-b", id, "Foreign"),
  ).rejects.toMatchObject({ code: "access_denied" });
  await expect(
    other.users.rename(id, id, "Foreign self"),
  ).rejects.toMatchObject({ code: "access_denied" });
  await access.users.rename("admin-a", id, "Administrator edit");
  await clientWork("migrator", async (c) => {
    await c.query("BEGIN");
    await c.query(
      "SELECT set_config('iop.access_organization_id','org-a',true)",
    );
    const result = await c.query(
      "SELECT actor_id,detail FROM users_rbac.access_audit WHERE subject_id=$1 AND action='user.name_changed' ORDER BY recorded_at",
      [id],
    );
    expect(result.rows).toEqual([
      { actor_id: id, detail: { before: "Before", after: "After" } },
      {
        actor_id: "admin-a",
        detail: { before: "After", after: "Administrator edit" },
      },
    ]);
    await c.query("COMMIT");
  });
  await access.users.change("admin-a", id, "technician", false);
  await expect(
    access.users.rename(id, id, "Disabled edit"),
  ).rejects.toMatchObject({ code: "access_denied" });
  await access.users.remove("admin-a", id);
  await expect(
    access.users.rename("admin-a", id, "Deleted edit"),
  ).rejects.toMatchObject({ code: "access_denied" });
});

test("changing and restoring Technician never reinstates analytical grants", async () => {
  const administrators = (await access.users.list("admin-a")).filter(
    (user) => user.profile === "administrator" && user.active,
  );
  const administrator = administrators[0]?.id ?? "admin-a";
  const created = await access.users.create(administrator, {
    name: "Profile transition",
    username: "profile-transition",
    profile: "task-force",
  });
  const request = {
    userId: created.user.id,
    organizationId: "org-a",
    siteId: "site-a",
    permissions: ["analytics.read"],
  };
  await expect(runSiteOperation(pool, request, async () => true)).resolves.toBe(
    true,
  );
  await access.users.change(administrator, created.user.id, "technician", true);
  await expect(
    runSiteOperation(pool, request, async () => true),
  ).rejects.toThrow("not permitted");
  await access.users.change(
    administrator,
    created.user.id,
    "technician",
    false,
  );
  await access.users.change(administrator, created.user.id, "technician", true);
  await expect(
    runSiteOperation(pool, request, async () => true),
  ).rejects.toThrow("not permitted");
  await expect(
    runSiteOperation(
      pool,
      { ...request, permissions: ["handover.read"] },
      async () => true,
    ),
  ).resolves.toBe(true);
  await access.users.change(
    administrator,
    created.user.id,
    "team-leader",
    true,
  );
  await expect(runSiteOperation(pool, request, async () => true)).resolves.toBe(
    true,
  );
});

test.each(["technician", "task-force", "team-leader"])(
  "%s receives its configured analytical access and cannot import or administer",
  async (profile) => {
    const created = await access.users.create("admin-a", {
      name: profile,
      username: profile,
      profile,
    });
    const first = await login(access, profile, created.initialPassword);
    await access.authentication.changePassword(
      first,
      created.initialPassword,
      chosen,
    );
    const session = await login(access, profile);
    expect((await access.authentication.principal(session)).userId).toBe(
      created.user.id,
    );
    const request = {
      userId: created.user.id,
      organizationId: "org-a",
      siteId: "site-a",
      permissions: ["analytics.read"],
    };
    if (profile === "technician") {
      await expect(
        runSiteOperation(pool, request, async () => true),
      ).rejects.toThrow("not permitted");
    } else {
      await expect(
        runSiteOperation(pool, request, async () => true),
      ).resolves.toBe(true);
    }
    await expect(
      runSiteOperation(
        pool,
        { ...request, permissions: ["handover.read", "handover.contribute"] },
        async () => true,
      ),
    ).resolves.toBe(true);
    await expect(
      runSiteOperation(
        pool,
        { ...request, permissions: ["imports.submit"] },
        async () => true,
      ),
    ).rejects.toThrow("not permitted");
    await expect(access.users.list(created.user.id)).rejects.toMatchObject({
      code: "access_denied",
    });
    await expect(
      access.users.create(created.user.id, {
        name: "Escalation",
        username: "escalation",
        profile: "administrator",
      }),
    ).rejects.toMatchObject({ code: "access_denied" });
    await expect(
      runSiteOperation(
        pool,
        { ...request, organizationId: "org-b", siteId: "site-b" },
        async () => true,
      ),
    ).rejects.toThrow();
    await access.users.change("admin-a", created.user.id, profile, false);
    await expect(
      access.authentication.principal(session),
    ).rejects.toMatchObject({ code: "session_required" });
    await access.users.change("admin-a", created.user.id, profile, true);
    await expect(
      runSiteOperation(
        pool,
        { ...request, permissions: ["imports.submit"] },
        async () => true,
      ),
    ).rejects.toThrow();
  },
);

test("foreign authority, targets, username conflicts and last-administrator changes are rejected atomically", async () => {
  const users = await access.users.list("admin-a");
  await expect(
    access.users.create("admin-a", {
      name: "Duplicate",
      username: "admin",
      profile: "administrator",
    }),
  ).rejects.toMatchObject({ code: "user_conflict" });
  expect(await access.users.list("admin-a")).toHaveLength(users.length);
  await expect(
    access.users.change("admin-a", "admin-b", "technician", false),
  ).rejects.toMatchObject({ code: "access_denied" });
  await expect(other.users.list("admin-a")).rejects.toMatchObject({
    code: "access_denied",
  });
  await expect(
    access.users.change("admin-a", "admin-a", "technician", true),
  ).rejects.toMatchObject({ code: "last_administrator" });
  const second = await access.users.create("admin-a", {
    name: "Second administrator",
    username: "second-admin",
    profile: "administrator",
  });
  await expect(
    runSiteOperation(
      pool,
      {
        userId: second.user.id,
        organizationId: "org-a",
        siteId: "site-a",
        permissions: ["imports.submit", "imports.review"],
      },
      async () => true,
    ),
  ).resolves.toBe(true);
  const races = await Promise.allSettled([
    access.users.change("admin-a", "admin-a", "technician", true),
    access.users.change(second.user.id, second.user.id, "technician", true),
  ]);
  expect(races.filter((value) => value.status === "fulfilled")).toHaveLength(1);
  const remaining = (
    await clientWork("bootstrap", (c) =>
      c.query(
        "SELECT user_id FROM users_rbac.profiles WHERE organization_id='org-a' AND profile='administrator'",
      ),
    )
  ).rows[0].user_id;
  expect(
    (await access.users.list(remaining)).filter(
      (user) => user.active && user.profile === "administrator",
    ),
  ).toHaveLength(1);
});

test("runtime tables enforce forced RLS, pooled scope disappears and provision reruns stay narrow", async () => {
  for (const table of [
    "authentication.credentials",
    "authentication.sessions",
    "users_rbac.profiles",
    "users_rbac.access_audit",
  ]) {
    expect((await pool.query(`SELECT * FROM ${table}`)).rows).toEqual([]);
  }
  await expect(
    pool.query(
      "UPDATE users_rbac.organization_memberships SET is_active=false RETURNING user_id",
    ),
  ).resolves.toMatchObject({ rowCount: 0 });
  const flags = await clientWork("bootstrap", (c) =>
    c.query(
      "SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid='authentication.credentials'::regclass",
    ),
  );
  expect(flags.rows[0]).toEqual({
    relrowsecurity: true,
    relforcerowsecurity: true,
  });
  await provision(configs);
});

test("failed attempts commit throttling and expired sessions cannot resolve", async () => {
  for (let i = 0; i < 5; i++)
    await expect(login(other, "admin", "wrong")).rejects.toMatchObject({
      code: "invalid_credentials",
    });
  await expect(login(other, "admin", initial)).rejects.toMatchObject({
    code: "invalid_credentials",
  });
  await clientWork("bootstrap", (c) =>
    c.query(
      "UPDATE authentication.credentials SET blocked_until=0,failures=0 WHERE organization_id='org-b'",
    ),
  );
  const token = await login(other, "admin", initial);
  await clientWork("bootstrap", (c) =>
    c.query(
      "UPDATE authentication.sessions SET expires_at=0 WHERE organization_id='org-b'",
    ),
  );
  await expect(
    other.authentication.principal(token, true),
  ).rejects.toMatchObject({ code: "session_required" });
});

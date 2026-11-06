import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { IncomingMessage } from "node:http";
import request from "supertest";
import { readLocalIdentityConfiguration, PlatformRuntime } from "../src/host/runtime";
import { remoteOrigin, sessionCookie } from "../src/host/remote-transport";
import { configureStaticWeb } from "../src/host/static-web";
import { createApplication } from "../src/host/application";

let directory: string;
beforeEach(() => { directory = mkdtempSync(join(tmpdir(), "iop-railway-test-")); });
afterEach(() => rmSync(directory, { recursive: true, force: true }));
function fixture() {
  const write = (name: string, value: unknown) => { const file = join(directory, name); writeFileSync(file, JSON.stringify(value)); return file; };
  return {
    IOP_EXECUTION_MODE: "railway", IOP_DATABASE_MODE: "railway", IOP_AUTHENTICATION: "password",
    NODE_ENV: "production", IOP_TRANSPORT: "container", HOST: "0.0.0.0",
    IOP_DATABASE_HOST: "database.railway.internal", IOP_DATABASE_NAME: "iop_local",
    IOP_CONFIG_FILE: write("scope.json", { organization: { id: "org" }, site: { id: "site", organizationId: "org", timeZone: "UTC" }, source: { id: "source", organizationId: "org", siteId: "site" } }),
    IOP_LOCAL_IDENTITY_FILE: write("users.json", { users: [{ id: "admin", name: "Admin" }], origins: ["https://example.up.railway.app"] }),
    IOP_MAPPING_CONFIG_FILE: write("mappings.json", { organizationId: "org", siteId: "site", sourceId: "source", mappingRevision: "test", sectors: [], areas: [] }),
  };
}
test("remote activation requires password mode, a private Railway database and an exact HTTPS origin", () => {
  const env = fixture();
  expect(readLocalIdentityConfiguration(env)).toMatchObject({ remote: true, passwordAuthentication: true });
  for (const patch of [{ IOP_AUTHENTICATION: undefined }, { NODE_ENV: "development" }, { IOP_DATABASE_HOST: "external.example" }, { IOP_DATABASE_MODE: "local" }, { HOST: "127.0.0.1" }]) {
    expect(() => readLocalIdentityConfiguration({ ...env, ...patch })).toThrow();
  }
  const credentialOrigin = "https://" + "user:" + "password@" + "example.com";
  for (const origin of ["http://example.com", "https://example.com/", credentialOrigin, "https://example.com:8443", "https://127.0.0.1", "https://database.railway.internal"]) expect(() => remoteOrigin(origin)).toThrow();
});
test("remote requests reject unconfigured hosts, HTTP, cross-origin writes and missing CSRF headers", () => {
  const protect = PlatformRuntime.prototype.protect;
  const runtime = { lease: {}, config: { remote: true, origins: ["https://example.up.railway.app"] } };
  const base = { host: "example.up.railway.app", "x-forwarded-proto": "https", origin: "https://example.up.railway.app", "x-iop-demo": "1" };
  const req = (headers: Record<string, string | undefined>, method = "POST") => ({ headers, method }) as IncomingMessage;
  expect(() => protect.call(runtime as never, req(base), 3000)).not.toThrow();
  for (const patch of [{ host: "127.0.0.1:3000" }, { "x-forwarded-proto": "http" }, { "x-forwarded-proto": "https,http" }, { origin: "https://other.example" }, { "x-iop-demo": undefined }, { "sec-fetch-site": "cross-site" }]) expect(() => protect.call(runtime as never, req({ ...base, ...patch }), 3000)).toThrow();
  expect(() => protect.call(runtime as never, req({ host: base.host, "x-forwarded-proto": "https" }, "GET"), 3000)).not.toThrow();
});
test("remote session creation and clearing use Secure; the loopback exception is explicit", () => {
  expect(sessionCookie("opaque", true)).toContain("; Secure");
  expect(sessionCookie("", true, 0)).toContain("Max-Age=0; Secure");
  expect(sessionCookie("opaque", false)).not.toContain("Secure");
  expect(sessionCookie("opaque", true)).toContain("HttpOnly; SameSite=Strict");
});
test("the combined service serves public assets without exposing dotfiles or changing API errors", async () => {
  writeFileSync(join(directory, "index.html"), "<!doctype html><title>IOP</title>");
  writeFileSync(join(directory, ".env"), "private-secret");
  const app = await createApplication();
  configureStaticWeb(app, directory);
  await app.init();
  try {
    await request(app.getHttpServer()).get("/").expect(200).expect("Cache-Control", "no-cache").expect("X-Frame-Options", "DENY");
    const denied = await request(app.getHttpServer()).get("/.env");
    expect(denied.status).toBeGreaterThanOrEqual(400);
    expect(denied.text).not.toContain("private-secret");
    await request(app.getHttpServer()).get("/health").expect(200);
    await request(app.getHttpServer()).get("/api/v1/unknown").expect(404).expect("Content-Type", /problem\+json/);
  } finally { await app.close(); }
});

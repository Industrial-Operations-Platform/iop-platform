import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { IncomingMessage } from "node:http";
import {
  readDemoConfiguration,
  LocalDemoPrincipals,
} from "../src/demo/runtime";
let directory: string;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "iop-demo-config-"));
});
afterEach(() => rmSync(directory, { recursive: true, force: true }));
const req = (cookie?: string) => ({ headers: { cookie } }) as IncomingMessage;
test("no fallback activation and no production/nonlocal activation", () => {
  expect(readDemoConfiguration({})).toBeNull();
  for (const env of [
    { IOP_EXECUTION_MODE: "anything" },
    { IOP_EXECUTION_MODE: "local-demo", NODE_ENV: "production" },
    { IOP_EXECUTION_MODE: "local-demo", HOST: "0.0.0.0" },
    { IOP_EXECUTION_MODE: "local-demo", IOP_TRANSPORT: "container" },
  ])
    expect(() => readDemoConfiguration(env)).toThrow();
});
test("strict configured allowlist, scope and origin agreement", () => {
  const local = {
    organization: { id: "org" },
    site: { id: "site", organizationId: "org", timeZone: "UTC" },
    source: { id: "source", organizationId: "org", siteId: "site" },
  };
  const files = {
    local: join(directory, "local.json"),
    users: join(directory, "users.json"),
    mappings: join(directory, "mappings.json"),
  };
  writeFileSync(files.local, JSON.stringify(local));
  writeFileSync(
    files.users,
    JSON.stringify({
      users: [{ id: "user", name: "User" }],
      origins: ["http://127.0.0.1:5173"],
    }),
  );
  writeFileSync(
    files.mappings,
    JSON.stringify({
      organizationId: "org",
      siteId: "site",
      sourceId: "source",
      mappingRevision: "v1",
      sectors: [],
      areas: [],
    }),
  );
  const env = {
    IOP_EXECUTION_MODE: "local-demo",
    IOP_DATABASE_MODE: "local",
    IOP_DATABASE_HOST: "127.0.0.1",
    IOP_DATABASE_NAME: "iop_local",
    IOP_CONFIG_FILE: files.local,
    IOP_DEMO_CONFIG_FILE: files.users,
    IOP_MAPPING_CONFIG_FILE: files.mappings,
  };
  expect(readDemoConfiguration(env)?.users[0].id).toBe("user");
  writeFileSync(
    files.users,
    JSON.stringify({
      users: [{ id: "user", name: "User" }],
      origins: ["https://evil.example"],
    }),
  );
  expect(() => readDemoConfiguration(env)).toThrow();
});
test("opaque sessions allow only configured principals and invalidate previous selections", () => {
  const p = new LocalDemoPrincipals([
    { id: "a", name: "A" },
    { id: "b", name: "B" },
  ]);
  expect(() => p.resolve(req())).toThrow();
  expect(() => p.switch(req(), "foreign")).toThrow();
  const first = p.switch(req(), "a");
  expect(p.resolve(req(`iop_demo=${first}`))).toBe("a");
  const second = p.switch(req(`iop_demo=${first}`), "b");
  expect(() => p.resolve(req(`iop_demo=${first}`))).toThrow();
  expect(p.resolve(req(`iop_demo=${second}`))).toBe("b");
  expect(() =>
    p.resolve(req(`iop_demo=${second}; iop_demo=${first}`)),
  ).toThrow();
});

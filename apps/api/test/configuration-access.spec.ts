import type { Pool } from "pg";
import { PgAssets } from "../src/modules/assets/adapters/postgres/store";
import { PgAssetDomain } from "../src/modules/assets/adapters/postgres/enrichment";
import { PgConnections } from "../src/modules/integrations/adapters/postgres/connections";
import { PgWorkforce } from "../src/modules/workforce/adapters/postgres/store";
import { PgMaintenance } from "../src/modules/maintenance/adapters/postgres/store";
import { PgReportingProfiles } from "../src/modules/oip/adapters/postgres/reporting-profiles";
import { ImportBatches } from "../src/modules/integrations/adapters/postgres/import-batches";
import { sitePersonProfile } from "../src/modules/users-rbac/adapters/postgres/site-people";
import { evaluateSiteAccess } from "../src/modules/users-rbac";
import { runSiteOperation, type SiteTransaction } from "../src/persistence/site-operation";

jest.mock("../src/persistence/site-operation", () => ({
  ...jest.requireActual("../src/persistence/site-operation"), runSiteOperation: jest.fn(),
}));
jest.mock("../src/modules/users-rbac/adapters/postgres/site-people", () => ({ sitePersonProfile: jest.fn() }));
jest.mock("../src/modules/users-rbac", () => ({ evaluateSiteAccess: jest.fn() }));

const scope = { organizationId: "org", siteId: "site" };
const pool = {} as Pool;
const tx = { context: { ...scope, userId: "actor" }, query: jest.fn(async () => ({ rows: [] })) } as unknown as SiteTransaction;
const allowed = jest.fn(async () => true);
const directory = {
  allowed, names: async () => new Map<string, string>(), people: async () => [],
  teams: async () => [], assets: async () => [], asset: async () => null,
};
const assets = () => new PgAssets(pool, scope, { ...directory, sources: [] });
const models = () => new PgAssetDomain(pool, scope, {
  materialize: async () => {}, candidates: async () => ({ candidates: [], nextCursor: "" }),
  pareto: jest.fn(),
});
const workforce = () => new PgWorkforce(pool, scope, directory);
const maintenance = () => new PgMaintenance(pool, scope, directory);
const connections = () => new PgConnections(pool, scope, {
  allowed, profile: (transaction, actor) => sitePersonProfile(transaction, scope.organizationId, scope.siteId, actor),
});

beforeEach(() => {
  jest.clearAllMocks();
  (runSiteOperation as jest.Mock).mockImplementation(async (_pool, _request, work) => work(tx));
  (sitePersonProfile as jest.Mock).mockResolvedValue("administrator");
  (evaluateSiteAccess as jest.Mock).mockResolvedValue({ allowed: true });
  allowed.mockResolvedValue(true);
});

test.each(["team-leader", "task-force", "technician", ""])(
  "current %s profile cannot configure despite obsolete grants", async (profile) => {
    (sitePersonProfile as jest.Mock).mockResolvedValue(profile);
    const work = jest.fn(async () => true);
    await expect(assets().run("actor", "assets.manage", work)).rejects.toThrow();
    await expect(models().run("actor", "assets.manage", work)).rejects.toThrow();
    await expect(workforce().run("actor", "workforce.administer", work)).rejects.toThrow();
    await expect(maintenance().run("actor", "maintenance.administer", work)).rejects.toThrow();
    await expect(connections().run("actor", false, work)).rejects.toThrow();
    await expect(connections().run("actor", true, work)).rejects.toThrow();
    expect(work).not.toHaveBeenCalled();
  },
);

test.each(["team-leader", "task-force"])(
  "%s retains authorized work reads while standalone Assets and model reads stay denied", async (profile) => {
    (sitePersonProfile as jest.Mock).mockResolvedValue(profile);
    await expect(assets().run("actor", "assets.read", async work => work.canManage)).rejects.toThrow();
    await expect(models().run("actor", "assets.read", async work => work.canManage)).rejects.toThrow();
    await expect(workforce().run("actor", "workforce.read", async work => work.canAdminister)).resolves.toBe(false);
    await expect(maintenance().run("actor", "maintenance.read", async work => work.canAdminister)).resolves.toBe(false);
    await expect(maintenance().run("actor", "maintenance.contribute", async work => work.canContribute)).resolves.toBe(true);
  },
);

test("Administrator still needs current module grants", async () => {
  const work = jest.fn(async () => true);
  allowed.mockResolvedValue(false);
  (evaluateSiteAccess as jest.Mock).mockResolvedValue({ allowed: false });
  await expect(assets().run("actor", "assets.manage", work)).rejects.toThrow();
  await expect(models().run("actor", "assets.manage", work)).rejects.toThrow();
  await expect(workforce().run("actor", "workforce.administer", work)).rejects.toThrow();
  await expect(maintenance().run("actor", "maintenance.administer", work)).rejects.toThrow();
  await expect(connections().run("actor", false, work)).rejects.toThrow();
  expect(work).not.toHaveBeenCalled();
});

test("Administrator with current grants can configure each owning module", async () => {
  await expect(assets().run("actor", "assets.manage", async work => work.canManage)).resolves.toBe(true);
  await expect(models().run("actor", "assets.manage", async work => work.canManage)).resolves.toBe(true);
  await expect(workforce().run("actor", "workforce.administer", async work => work.canAdminister)).resolves.toBe(true);
  await expect(maintenance().run("actor", "maintenance.administer", async work => work.canAdminister)).resolves.toBe(true);
  await expect(connections().run("actor", true, async () => true)).resolves.toBe(true);
});

test("a stale source-operator grant cannot save reporting configuration", async () => {
  (sitePersonProfile as jest.Mock).mockResolvedValue("team-leader");
  const repository = new PgReportingProfiles(pool, { ...scope, sourceId: "source", siteTimeZone: "UTC", adapterRevision: "a", profileRevision: "p", mappingRevision: "m" }, {
    normalization: { trim: true, unicodeNfc: true, collapseWhitespace: false },
    unclassifiedLabel: "Unclassified", aliases: [], areaSectors: [],
  });
  await expect(repository.save("actor", repository.initialVersion, repository.initial)).rejects.toThrow();
  expect(tx.query).not.toHaveBeenCalledWith(expect.stringContaining("INSERT INTO oip.reporting_profiles"), expect.anything());
});

test("password-mode imports reject obsolete operator grants while trusted native callers retain their grant contract", async () => {
  (sitePersonProfile as jest.Mock).mockResolvedValue("team-leader");
  const source = { ...scope, sourceId: "source", siteTimeZone: "UTC", adapterRevision: "a", profileRevision: "p", mappingRevision: "m" };
  const password = new ImportBatches(pool, source, undefined, true);
  await expect(password.history("actor")).rejects.toThrow();
  await expect(password.review("actor", "00000000-0000-4000-8000-000000000000")).rejects.toThrow();
  await expect(password.receive("actor", "Hitliste-20261020.csv", Buffer.from("synthetic"))).rejects.toThrow();
  expect(tx.query).not.toHaveBeenCalledWith(expect.stringContaining("INSERT INTO integrations.import_batches"), expect.anything());
  await expect(new ImportBatches(pool, source).history("native-operator")).resolves.toEqual([]);
});
